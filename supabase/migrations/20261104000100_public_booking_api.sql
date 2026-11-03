-- DMRJ Scheduling: camada pública e segura de reservas.
-- O navegador público nunca recebe acesso direto às tabelas privadas.
-- Todas as consultas e gravações públicas passam por funções SECURITY DEFINER
-- que validam empresa, serviço, profissional, expediente e disponibilidade.

alter table public.organizations
  add column if not exists timezone_name text not null default 'America/Sao_Paulo';

create or replace function public.get_public_booking_data(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_org public.organizations%rowtype;
  v_services jsonb;
  v_professionals jsonb;
begin
  select * into v_org
  from public.organizations
  where slug = lower(btrim(p_slug))
    and status = 'active'
  limit 1;

  if not found then
    raise exception 'Empresa não encontrada ou indisponível.';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'description', s.description,
        'duration_minutes', s.duration_minutes,
        'price', s.price
      ) order by s.name
    ),
    '[]'::jsonb
  )
  into v_services
  from public.services s
  where s.organization_id = v_org.id
    and s.active = true;

  select coalesce(
    jsonb_agg(
      jsonb_build_object('id', p.id, 'name', p.name)
      order by p.name
    ),
    '[]'::jsonb
  )
  into v_professionals
  from public.professionals p
  where p.organization_id = v_org.id
    and p.active = true;

  return jsonb_build_object(
    'business', jsonb_build_object('name', v_org.name, 'slug', v_org.slug),
    'timezone', v_org.timezone_name,
    'services', v_services,
    'professionals', v_professionals
  );
end;
$$;

create or replace function public.get_public_available_slots(
  p_slug text,
  p_service_id uuid,
  p_professional_id uuid,
  p_date date
)
returns table(slot_time text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_org public.organizations%rowtype;
  v_duration integer;
  v_weekday integer;
begin
  select * into v_org
  from public.organizations
  where slug = lower(btrim(p_slug))
    and status = 'active'
  limit 1;

  if not found then
    raise exception 'Empresa não encontrada ou indisponível.';
  end if;

  select s.duration_minutes into v_duration
  from public.services s
  where s.id = p_service_id
    and s.organization_id = v_org.id
    and s.active = true;

  if v_duration is null then
    raise exception 'Serviço indisponível.';
  end if;

  perform 1
  from public.professionals p
  where p.id = p_professional_id
    and p.organization_id = v_org.id
    and p.active = true;

  if not found then
    raise exception 'Profissional indisponível.';
  end if;

  if p_date < (pg_catalog.now() at time zone v_org.timezone_name)::date then
    return;
  end if;

  v_weekday := extract(dow from p_date)::integer;

  if exists (
    select 1
    from public.schedule_holidays h
    where h.organization_id = v_org.id
      and h.holiday_date = p_date
      and (h.professional_id is null or h.professional_id = p_professional_id)
  ) then
    return;
  end if;

  return query
  select to_char(g.slot_start, 'HH24:MI')
  from (
    select
      pg_catalog.make_time(n.minute_of_day / 60, n.minute_of_day % 60, 0) as slot_time,
      (p_date + pg_catalog.make_time(n.minute_of_day / 60, n.minute_of_day % 60, 0))
        at time zone v_org.timezone_name as slot_start,
      ((p_date + pg_catalog.make_time(n.minute_of_day / 60, n.minute_of_day % 60, 0))
        at time zone v_org.timezone_name)
        + pg_catalog.make_interval(mins => v_duration) as slot_end
    from pg_catalog.generate_series(0, 1425, 15) as n(minute_of_day)
  ) g
  where exists (
    select 1
    from public.business_hours bh
    where bh.organization_id = v_org.id
      and bh.weekday = v_weekday
      and bh.active = true
      and g.slot_time >= bh.opens_at
      and g.slot_time + pg_catalog.make_interval(mins => v_duration) <= bh.closes_at
  )
  and exists (
    select 1
    from public.professional_hours ph
    where ph.organization_id = v_org.id
      and ph.professional_id = p_professional_id
      and ph.weekday = v_weekday
      and ph.active = true
      and g.slot_time >= ph.starts_at
      and g.slot_time + pg_catalog.make_interval(mins => v_duration) <= ph.ends_at
  )
  and g.slot_start > pg_catalog.now()
  and not exists (
    select 1
    from public.schedule_blocks b
    where b.organization_id = v_org.id
      and (b.professional_id is null or b.professional_id = p_professional_id)
      and b.starts_at < g.slot_end
      and b.ends_at > g.slot_start
  )
  and not exists (
    select 1
    from public.appointments a
    where a.organization_id = v_org.id
      and a.professional_id = p_professional_id
      and a.status <> 'cancelled'
      and a.starts_at < g.slot_end
      and a.ends_at > g.slot_start
  )
  order by g.slot_start;
end;
$$;

create or replace function public.create_public_booking(
  p_slug text,
  p_service_id uuid,
  p_professional_id uuid,
  p_date date,
  p_time time,
  p_name text,
  p_phone text,
  p_email text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org public.organizations%rowtype;
  v_duration integer;
  v_client_id uuid;
  v_start timestamptz;
  v_end timestamptz;
  v_appointment_id uuid;
begin
  if char_length(btrim(coalesce(p_name, ''))) not between 2 and 160 then
    raise exception 'Informe seu nome completo.';
  end if;
  if char_length(btrim(coalesce(p_phone, ''))) not between 8 and 30 then
    raise exception 'Informe um telefone válido com DDD.';
  end if;
  if char_length(btrim(coalesce(p_email, ''))) > 254
     or coalesce(p_email, '') !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+[.][A-Z]{2,}$' then
    raise exception 'Informe um e-mail válido.';
  end if;

  select * into v_org
  from public.organizations
  where slug = lower(btrim(p_slug))
    and status = 'active'
  limit 1;

  if not found then
    raise exception 'Empresa não encontrada ou indisponível.';
  end if;

  select s.duration_minutes into v_duration
  from public.services s
  where s.id = p_service_id
    and s.organization_id = v_org.id
    and s.active = true;

  if v_duration is null then
    raise exception 'Serviço indisponível.';
  end if;

  v_start := (p_date + p_time) at time zone v_org.timezone_name;
  v_end := v_start + pg_catalog.make_interval(mins => v_duration);

  if not exists (
    select 1
    from public.get_public_available_slots(p_slug, p_service_id, p_professional_id, p_date) available
    where available.slot_time = to_char(p_time, 'HH24:MI')
  ) then
    raise exception 'Este horário acabou de ficar indisponível. Escolha outro horário.';
  end if;

  insert into public.clients (organization_id, name, phone, email)
  values (v_org.id, btrim(p_name), btrim(p_phone), lower(btrim(p_email)))
  returning id into v_client_id;

  insert into public.appointments (
    organization_id, client_id, professional_id, service_id,
    starts_at, ends_at, status, notes
  )
  values (
    v_org.id, v_client_id, p_professional_id, p_service_id,
    v_start, v_end, 'pending', 'Reserva solicitada pela página pública.'
  )
  returning id into v_appointment_id;

  return jsonb_build_object(
    'appointment_id', v_appointment_id,
    'status', 'pending',
    'message', 'Solicitação de agendamento enviada com sucesso.'
  );
exception
  when exclusion_violation then
    raise exception 'Este horário acabou de ser reservado. Escolha outro horário.';
end;
$$;

revoke all on function public.get_public_booking_data(text) from public;
revoke all on function public.get_public_available_slots(text, uuid, uuid, date) from public;
revoke all on function public.create_public_booking(text, uuid, uuid, date, time, text, text, text) from public;

grant execute on function public.get_public_booking_data(text) to anon, authenticated;
grant execute on function public.get_public_available_slots(text, uuid, uuid, date) to anon, authenticated;
grant execute on function public.create_public_booking(text, uuid, uuid, date, time, text, text, text) to anon, authenticated;
