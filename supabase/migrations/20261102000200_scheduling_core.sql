-- DMRJ Scheduling: base real de clientes, profissionais, serviços e agendamentos.
-- Execute esta migration no SQL Editor do Supabase antes de conectar as telas.
-- Todas as tabelas são isoladas por organização via Row Level Security.

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 160),
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clients_org_id_unique unique (organization_id, id)
);

create index if not exists clients_org_name_idx
  on public.clients (organization_id, name);

create table if not exists public.professionals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 160),
  email text,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint professionals_org_id_unique unique (organization_id, id)
);

create index if not exists professionals_org_active_idx
  on public.professionals (organization_id, active, name);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 160),
  description text,
  duration_minutes integer not null default 30 check (duration_minutes between 5 and 1440),
  price numeric(12,2) not null default 0 check (price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_org_id_unique unique (organization_id, id)
);

create index if not exists services_org_active_idx
  on public.services (organization_id, active, name);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null,
  professional_id uuid not null,
  service_id uuid not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_time_valid check (ends_at > starts_at),
  constraint appointments_client_same_org
    foreign key (organization_id, client_id)
    references public.clients (organization_id, id) on delete restrict,
  constraint appointments_professional_same_org
    foreign key (organization_id, professional_id)
    references public.professionals (organization_id, id) on delete restrict,
  constraint appointments_service_same_org
    foreign key (organization_id, service_id)
    references public.services (organization_id, id) on delete restrict
);

create index if not exists appointments_org_starts_idx
  on public.appointments (organization_id, starts_at);
create index if not exists appointments_professional_starts_idx
  on public.appointments (organization_id, professional_id, starts_at);
create index if not exists appointments_client_starts_idx
  on public.appointments (organization_id, client_id, starts_at);

alter table public.clients enable row level security;
alter table public.professionals enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;

revoke all on table public.clients from anon, authenticated;
revoke all on table public.professionals from anon, authenticated;
revoke all on table public.services from anon, authenticated;
revoke all on table public.appointments from anon, authenticated;

grant select, insert, update, delete on table public.clients to authenticated;
grant select, insert, update, delete on table public.professionals to authenticated;
grant select, insert, update, delete on table public.services to authenticated;
grant select, insert, update, delete on table public.appointments to authenticated;

drop policy if exists "Organization members manage clients" on public.clients;
create policy "Organization members manage clients"
  on public.clients for all to authenticated
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = clients.organization_id
        and m.user_id = (select auth.uid())
        and m.status = 'active'
    )
  )
  with check (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = clients.organization_id
        and m.user_id = (select auth.uid())
        and m.status = 'active'
    )
  );

drop policy if exists "Organization members manage professionals" on public.professionals;
create policy "Organization members manage professionals"
  on public.professionals for all to authenticated
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = professionals.organization_id
        and m.user_id = (select auth.uid())
        and m.status = 'active'
    )
  )
  with check (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = professionals.organization_id
        and m.user_id = (select auth.uid())
        and m.status = 'active'
    )
  );

drop policy if exists "Organization members manage services" on public.services;
create policy "Organization members manage services"
  on public.services for all to authenticated
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = services.organization_id
        and m.user_id = (select auth.uid())
        and m.status = 'active'
    )
  )
  with check (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = services.organization_id
        and m.user_id = (select auth.uid())
        and m.status = 'active'
    )
  );

drop policy if exists "Organization members manage appointments" on public.appointments;
create policy "Organization members manage appointments"
  on public.appointments for all to authenticated
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = appointments.organization_id
        and m.user_id = (select auth.uid())
        and m.status = 'active'
    )
  )
  with check (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = appointments.organization_id
        and m.user_id = (select auth.uid())
        and m.status = 'active'
    )
  );
