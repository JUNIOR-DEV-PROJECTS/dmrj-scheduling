-- DMRJ Scheduling: expediente, jornada dos profissionais e bloqueios.
-- Execute esta migration no SQL Editor do Supabase antes de usar a tela de horários.
-- Cada intervalo é uma linha; isso permite manhã/tarde e pausas sem campos especiais.

create table if not exists public.business_hours (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  opens_at time not null,
  closes_at time not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint business_hours_valid_interval check (closes_at > opens_at),
  constraint business_hours_org_id_unique unique (organization_id, id)
);

create index if not exists business_hours_org_weekday_idx
  on public.business_hours (organization_id, weekday, opens_at);

create table if not exists public.professional_hours (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  professional_id uuid not null,
  weekday smallint not null check (weekday between 0 and 6),
  starts_at time not null,
  ends_at time not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint professional_hours_valid_interval check (ends_at > starts_at),
  constraint professional_hours_org_id_unique unique (organization_id, id),
  constraint professional_hours_professional_same_org
    foreign key (organization_id, professional_id)
    references public.professionals (organization_id, id) on delete cascade
);

create index if not exists professional_hours_lookup_idx
  on public.professional_hours (organization_id, professional_id, weekday, starts_at);

create table if not exists public.schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  professional_id uuid,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint schedule_blocks_valid_interval check (ends_at > starts_at),
  constraint schedule_blocks_professional_same_org
    foreign key (organization_id, professional_id)
    references public.professionals (organization_id, id) on delete cascade
);

create index if not exists schedule_blocks_lookup_idx
  on public.schedule_blocks (organization_id, starts_at, ends_at);
create index if not exists schedule_blocks_professional_lookup_idx
  on public.schedule_blocks (organization_id, professional_id, starts_at, ends_at);

alter table public.business_hours enable row level security;
alter table public.professional_hours enable row level security;
alter table public.schedule_blocks enable row level security;

revoke all on table public.business_hours from anon, authenticated;
revoke all on table public.professional_hours from anon, authenticated;
revoke all on table public.schedule_blocks from anon, authenticated;

grant select, insert, update, delete on table public.business_hours to authenticated;
grant select, insert, update, delete on table public.professional_hours to authenticated;
grant select, insert, update, delete on table public.schedule_blocks to authenticated;

drop policy if exists "Organization members manage business hours" on public.business_hours;
create policy "Organization members manage business hours"
  on public.business_hours for all to authenticated
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = business_hours.organization_id
        and m.user_id = (select auth.uid())
        and m.status = 'active'
    )
  )
  with check (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = business_hours.organization_id
        and m.user_id = (select auth.uid())
        and m.status = 'active'
    )
  );

drop policy if exists "Organization members manage professional hours" on public.professional_hours;
create policy "Organization members manage professional hours"
  on public.professional_hours for all to authenticated
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = professional_hours.organization_id
        and m.user_id = (select auth.uid())
        and m.status = 'active'
    )
  )
  with check (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = professional_hours.organization_id
        and m.user_id = (select auth.uid())
        and m.status = 'active'
    )
  );

drop policy if exists "Organization members manage schedule blocks" on public.schedule_blocks;
create policy "Organization members manage schedule blocks"
  on public.schedule_blocks for all to authenticated
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = schedule_blocks.organization_id
        and m.user_id = (select auth.uid())
        and m.status = 'active'
    )
  )
  with check (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = schedule_blocks.organization_id
        and m.user_id = (select auth.uid())
        and m.status = 'active'
    )
  );
