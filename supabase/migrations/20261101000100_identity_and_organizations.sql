-- DMRJ Scheduling: identidade, empresas e isolamento inicial.
-- Execute esta migration no SQL Editor do projeto Supabase.
-- Não cria administradores globais nem permite que usuários se promovam.

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'suspended', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'staff')),
  status text not null default 'active' check (status in ('invited', 'active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_members_org_user_unique unique (organization_id, user_id)
);

create index if not exists organization_members_user_idx
  on public.organization_members(user_id, status);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

revoke all on table public.organizations from anon, authenticated;
revoke all on table public.organization_members from anon, authenticated;
grant select on table public.organizations to authenticated;
grant select on table public.organization_members to authenticated;

drop policy if exists "Members can read their organizations" on public.organizations;
create policy "Members can read their organizations"
  on public.organizations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.organization_members member
      where member.organization_id = organizations.id
        and member.user_id = (select auth.uid())
        and member.status = 'active'
    )
  );

drop policy if exists "Users can read their own memberships" on public.organization_members;
create policy "Users can read their own memberships"
  on public.organization_members
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- O cadastro público só cria empresa quando a conta é criada pelo fluxo de empresa.
-- A função é SECURITY DEFINER para criar o vínculo inicial sem liberar INSERT ao navegador.
create or replace function public.handle_new_business_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  business_name text;
  business_slug text;
  new_organization_id uuid;
begin
  if coalesce(new.raw_user_meta_data ->> 'signup_kind', '') <> 'business' then
    return new;
  end if;

  business_name := btrim(coalesce(new.raw_user_meta_data ->> 'business_name', ''));

  if char_length(business_name) < 2 or char_length(business_name) > 120 then
    raise exception 'Nome de empresa inválido';
  end if;

  business_slug := lower(regexp_replace(business_name, '[^a-zA-Z0-9]+', '-', 'g'));
  business_slug := trim(both '-' from business_slug);
  if business_slug = '' then
    business_slug := 'empresa';
  end if;
  business_slug := left(business_slug, 40) || '-' || left(new.id::text, 8);

  insert into public.organizations (name, slug)
  values (business_name, business_slug)
  returning id into new_organization_id;

  insert into public.organization_members (organization_id, user_id, role, status)
  values (new_organization_id, new.id, 'owner', 'active');

  return new;
end;
$$;

revoke all on function public.handle_new_business_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_business on auth.users;
create trigger on_auth_user_created_business
  after insert on auth.users
  for each row execute function public.handle_new_business_user();

-- O administrador da plataforma será provisionado separadamente, por operação controlada.
-- Nunca usar user_metadata editável pelo próprio usuário para conceder acesso global.
