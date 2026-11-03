-- DMRJ Scheduling: feriados e fechamentos em datas específicas.
-- professional_id NULL = feriado/fechamento para toda a empresa.
-- professional_id preenchido = indisponibilidade somente daquele profissional.

create table if not exists public.schedule_holidays (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  professional_id uuid,
  holiday_date date not null,
  name text not null,
  created_at timestamptz not null default now(),
  constraint schedule_holidays_name_not_blank check (length(trim(name)) > 0),
  constraint schedule_holidays_professional_same_org
    foreign key (organization_id, professional_id)
    references public.professionals (organization_id, id) on delete cascade
);

create index if not exists schedule_holidays_org_date_idx
  on public.schedule_holidays (organization_id, holiday_date);

create index if not exists schedule_holidays_professional_date_idx
  on public.schedule_holidays (organization_id, professional_id, holiday_date);

alter table public.schedule_holidays enable row level security;

revoke all on table public.schedule_holidays from anon, authenticated;
grant select, insert, update, delete on table public.schedule_holidays to authenticated;

drop policy if exists "Organization members manage schedule holidays" on public.schedule_holidays;
create policy "Organization members manage schedule holidays"
  on public.schedule_holidays for all to authenticated
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = schedule_holidays.organization_id
        and m.user_id = (select auth.uid())
        and m.status = 'active'
    )
  )
  with check (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = schedule_holidays.organization_id
        and m.user_id = (select auth.uid())
        and m.status = 'active'
    )
  );
