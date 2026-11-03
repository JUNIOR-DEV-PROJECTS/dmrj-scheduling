-- DMRJ Scheduling: links individuais e privados para consulta de agendamentos.
-- O cliente pode apenas visualizar os dados do próprio agendamento pelo token.

alter table public.appointments
  add column if not exists public_token uuid default gen_random_uuid();

update public.appointments
set public_token = gen_random_uuid()
where public_token is null;

alter table public.appointments
  alter column public_token set default gen_random_uuid(),
  alter column public_token set not null;

create unique index if not exists appointments_public_token_uidx
  on public.appointments (public_token);

-- Desativa a API antiga de reserva pública.
drop function if exists public.create_public_booking(text, uuid, uuid, date, time, text, text, text);
drop function if exists public.get_public_available_slots(text, uuid, uuid, date);
drop function if exists public.get_public_booking_data(text);

create or replace function public.get_public_appointment(p_token uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'business_name', o.name,
    'client_name', c.name,
    'service_name', s.name,
    'professional_name', p.name,
    'starts_at', a.starts_at,
    'ends_at', a.ends_at,
    'status', a.status
  )
  into v_result
  from public.appointments a
  join public.organizations o
    on o.id = a.organization_id
  join public.clients c
    on c.id = a.client_id
   and c.organization_id = a.organization_id
  join public.services s
    on s.id = a.service_id
   and s.organization_id = a.organization_id
  join public.professionals p
    on p.id = a.professional_id
   and p.organization_id = a.organization_id
  where a.public_token = p_token
  limit 1;

  if v_result is null then
    raise exception 'Este link não foi encontrado ou não está mais disponível.';
  end if;

  return v_result;
end;
$$;

revoke all on function public.get_public_appointment(uuid) from public;
grant execute on function public.get_public_appointment(uuid) to anon, authenticated;
