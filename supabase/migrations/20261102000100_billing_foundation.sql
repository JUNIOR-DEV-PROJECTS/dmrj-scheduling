-- DMRJ Scheduling: catálogo de planos e base neutra de assinaturas.
-- Não integra gateway, não cria cobranças e não armazena dados de cartão.
-- O provedor será conectado somente depois da validação da conta e dos recebimentos.

create table if not exists public.billing_plans (
  id uuid primary key default gen_random_uuid(),
  plan_code text not null check (plan_code in ('starter', 'pro', 'business')),
  billing_interval text not null check (billing_interval in ('month', 'year')),
  display_name text not null,
  amount_minor integer not null check (amount_minor > 0),
  currency char(3) not null default 'USD' check (currency = 'USD'),
  trial_days integer not null default 7 check (trial_days between 0 and 30),
  limits jsonb not null default '{}'::jsonb,
  features jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_plans_code_interval_unique unique (plan_code, billing_interval)
);

insert into public.billing_plans
  (plan_code, billing_interval, display_name, amount_minor, currency, trial_days, limits, features, display_order)
values
  ('starter', 'month', 'Starter', 990, 'USD', 7,
   '{"locations":1,"staff":3}'::jsonb,
   '{"calendar_day_week_month":true,"bookings":true,"services":true,"clients":true,"basic_summary":true}'::jsonb, 1),
  ('starter', 'year', 'Starter', 9900, 'USD', 7,
   '{"locations":1,"staff":3}'::jsonb,
   '{"calendar_day_week_month":true,"bookings":true,"services":true,"clients":true,"basic_summary":true}'::jsonb, 1),
  ('pro', 'month', 'Pro', 1990, 'USD', 7,
   '{"locations":3,"staff":15}'::jsonb,
   '{"calendar_day_week_month":true,"bookings":true,"services":true,"clients":true,"reports":true,"exports":true,"advanced_filters":true}'::jsonb, 2),
  ('pro', 'year', 'Pro', 19900, 'USD', 7,
   '{"locations":3,"staff":15}'::jsonb,
   '{"calendar_day_week_month":true,"bookings":true,"services":true,"clients":true,"reports":true,"exports":true,"advanced_filters":true}'::jsonb, 2),
  ('business', 'month', 'Business', 3990, 'USD', 7,
   '{"locations":10,"staff":100}'::jsonb,
   '{"calendar_day_week_month":true,"bookings":true,"services":true,"clients":true,"reports":true,"exports":true,"advanced_filters":true,"priority_support":true}'::jsonb, 3),
  ('business', 'year', 'Business', 39900, 'USD', 7,
   '{"locations":10,"staff":100}'::jsonb,
   '{"calendar_day_week_month":true,"bookings":true,"services":true,"clients":true,"reports":true,"exports":true,"advanced_filters":true,"priority_support":true}'::jsonb, 3)
on conflict (plan_code, billing_interval) do update set
  display_name = excluded.display_name,
  amount_minor = excluded.amount_minor,
  currency = excluded.currency,
  trial_days = excluded.trial_days,
  limits = excluded.limits,
  features = excluded.features,
  display_order = excluded.display_order,
  updated_at = now();

create table if not exists public.organization_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  plan_id uuid not null references public.billing_plans(id) on delete restrict,
  plan_code text not null check (plan_code in ('starter', 'pro', 'business')),
  plan_name text not null,
  billing_interval text not null check (billing_interval in ('month', 'year')),
  amount_minor integer not null check (amount_minor > 0),
  currency char(3) not null default 'USD' check (currency = 'USD'),
  status text not null check (status in ('trialing', 'active', 'past_due', 'paused', 'canceled', 'expired', 'incomplete')),
  provider text check (provider is null or provider in ('paddle', 'stripe', 'manual')),
  provider_customer_id text,
  provider_subscription_id text,
  trial_starts_at timestamptz,
  trial_ends_at timestamptz,
  current_period_starts_at timestamptz,
  current_period_ends_at timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_trial_dates_valid check (
    trial_ends_at is null or trial_starts_at is null or trial_ends_at > trial_starts_at
  ),
  constraint subscription_period_dates_valid check (
    current_period_ends_at is null or current_period_starts_at is null or current_period_ends_at > current_period_starts_at
  )
);

create unique index if not exists organization_subscriptions_provider_id_unique
  on public.organization_subscriptions(provider, provider_subscription_id)
  where provider is not null and provider_subscription_id is not null;

create index if not exists organization_subscriptions_org_status_idx
  on public.organization_subscriptions(organization_id, status, created_at desc);

create table if not exists public.billing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('paddle', 'stripe')),
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_error text,
  constraint billing_webhook_provider_event_unique unique (provider, provider_event_id)
);

create index if not exists billing_webhook_events_unprocessed_idx
  on public.billing_webhook_events(received_at)
  where processed_at is null;

alter table public.billing_plans enable row level security;
alter table public.organization_subscriptions enable row level security;
alter table public.billing_webhook_events enable row level security;

revoke all on table public.billing_plans from anon, authenticated;
revoke all on table public.organization_subscriptions from anon, authenticated;
revoke all on table public.billing_webhook_events from anon, authenticated;

grant select on table public.billing_plans to anon, authenticated;
grant select on table public.organization_subscriptions to authenticated;

drop policy if exists "Anyone can read active billing plans" on public.billing_plans;
create policy "Anyone can read active billing plans"
  on public.billing_plans
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Members can read their organization subscriptions" on public.organization_subscriptions;
create policy "Members can read their organization subscriptions"
  on public.organization_subscriptions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.organization_members member
      where member.organization_id = organization_subscriptions.organization_id
        and member.user_id = (select auth.uid())
        and member.status = 'active'
    )
  );

-- Assinaturas e eventos só poderão ser alterados por backend confiável
-- após validar a assinatura criptográfica dos webhooks do provedor.
-- Não conceder acesso direto de escrita ao navegador.
