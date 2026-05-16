create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role text not null default 'founder',
  monthly_income numeric(12, 2) not null default 0,
  savings_goal numeric(12, 2) not null default 500,
  risk_preference text not null default 'balanced' check (risk_preference in ('careful', 'balanced', 'bold')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.budget_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  category text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  entry_type text not null check (entry_type in ('income', 'expense', 'saving')),
  occurred_on date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.ecommerce_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_name text not null,
  audience text not null,
  demand_score integer not null default 50 check (demand_score between 0 and 100),
  estimated_margin numeric(5, 2) not null default 0 check (estimated_margin >= 0),
  status text not null default 'research' check (status in ('research', 'testing', 'launched', 'paused')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_cycle_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('budget_signal', 'commerce_signal', 'cycle_update')),
  title text not null,
  description text,
  impact_amount numeric(12, 2),
  created_at timestamptz not null default now()
);

create table if not exists public.email_verification_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.bank_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  account_name text not null,
  status text not null default 'pending' check (status in ('pending', 'connected', 'error', 'disabled')),
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.bank_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid references public.bank_connections(id) on delete set null,
  provider_transaction_id text,
  description text not null,
  category text not null,
  amount numeric(12, 2) not null,
  transaction_type text not null check (transaction_type in ('income', 'expense')),
  occurred_on date not null,
  created_at timestamptz not null default now()
);

alter table public.bank_transactions
add column if not exists provider_transaction_id text;

create table if not exists public.market_product_signals (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  signal text not null,
  score integer not null default 50 check (score between 0 and 100),
  source_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.finance_news_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source text not null,
  url text not null,
  summary text,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null,
  status text not null default 'running' check (status in ('running', 'success', 'error')),
  input_summary text,
  output_summary text,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.commerce_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  account_name text not null,
  status text not null default 'pending' check (status in ('pending', 'connected', 'error', 'disabled')),
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.commerce_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.commerce_accounts(id) on delete set null,
  provider_product_id text,
  product_name text not null,
  units_sold integer not null default 0 check (units_sold >= 0),
  revenue numeric(12, 2) not null default 0,
  estimated_margin numeric(5, 2) not null default 0 check (estimated_margin >= 0),
  trend text not null default 'stable' check (trend in ('rising', 'stable', 'falling')),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.commerce_metrics_daily (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.commerce_accounts(id) on delete set null,
  provider text not null,
  revenue numeric(12, 2) not null default 0,
  cost numeric(12, 2) not null default 0,
  ad_spend numeric(12, 2) not null default 0,
  net_profit numeric(12, 2) not null default 0,
  metric_day date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.budget_entries enable row level security;
alter table public.ecommerce_ideas enable row level security;
alter table public.agent_cycle_events enable row level security;
alter table public.email_verification_codes enable row level security;
alter table public.bank_connections enable row level security;
alter table public.bank_transactions enable row level security;
alter table public.market_product_signals enable row level security;
alter table public.finance_news_items enable row level security;
alter table public.assistant_messages enable row level security;
alter table public.agent_runs enable row level security;
alter table public.commerce_accounts enable row level security;
alter table public.commerce_products enable row level security;
alter table public.commerce_metrics_daily enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can read own budget entries" on public.budget_entries;
drop policy if exists "Users can insert own budget entries" on public.budget_entries;
drop policy if exists "Users can update own budget entries" on public.budget_entries;
drop policy if exists "Users can delete own budget entries" on public.budget_entries;
drop policy if exists "Users can read own ecommerce ideas" on public.ecommerce_ideas;
drop policy if exists "Users can insert own ecommerce ideas" on public.ecommerce_ideas;
drop policy if exists "Users can update own ecommerce ideas" on public.ecommerce_ideas;
drop policy if exists "Users can delete own ecommerce ideas" on public.ecommerce_ideas;
drop policy if exists "Users can read own cycle events" on public.agent_cycle_events;
drop policy if exists "Users can insert own cycle events" on public.agent_cycle_events;
drop policy if exists "Users can read own bank connections" on public.bank_connections;
drop policy if exists "Users can read own bank transactions" on public.bank_transactions;
drop policy if exists "Users can read own assistant messages" on public.assistant_messages;
drop policy if exists "Users can insert own assistant messages" on public.assistant_messages;
drop policy if exists "Anyone can read market signals" on public.market_product_signals;
drop policy if exists "Anyone can read finance news" on public.finance_news_items;
drop policy if exists "Users can read own commerce accounts" on public.commerce_accounts;
drop policy if exists "Users can read own commerce products" on public.commerce_products;
drop policy if exists "Users can read own commerce metrics" on public.commerce_metrics_daily;

create policy "Users can read own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can read own budget entries"
on public.budget_entries for select
using (auth.uid() = user_id);

create policy "Users can insert own budget entries"
on public.budget_entries for insert
with check (auth.uid() = user_id);

create policy "Users can update own budget entries"
on public.budget_entries for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own budget entries"
on public.budget_entries for delete
using (auth.uid() = user_id);

create policy "Users can read own ecommerce ideas"
on public.ecommerce_ideas for select
using (auth.uid() = user_id);

create policy "Users can insert own ecommerce ideas"
on public.ecommerce_ideas for insert
with check (auth.uid() = user_id);

create policy "Users can update own ecommerce ideas"
on public.ecommerce_ideas for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own ecommerce ideas"
on public.ecommerce_ideas for delete
using (auth.uid() = user_id);

create policy "Users can read own cycle events"
on public.agent_cycle_events for select
using (auth.uid() = user_id);

create policy "Users can insert own cycle events"
on public.agent_cycle_events for insert
with check (auth.uid() = user_id);

create policy "Users can read own bank connections"
on public.bank_connections for select
using (auth.uid() = user_id);

create policy "Users can read own bank transactions"
on public.bank_transactions for select
using (auth.uid() = user_id);

create policy "Users can read own assistant messages"
on public.assistant_messages for select
using (auth.uid() = user_id);

create policy "Users can insert own assistant messages"
on public.assistant_messages for insert
with check (auth.uid() = user_id);

create policy "Anyone can read market signals"
on public.market_product_signals for select
using (true);

create policy "Anyone can read finance news"
on public.finance_news_items for select
using (true);

create policy "Users can read own commerce accounts"
on public.commerce_accounts for select
using (auth.uid() = user_id);

create policy "Users can read own commerce products"
on public.commerce_products for select
using (auth.uid() = user_id);

create policy "Users can read own commerce metrics"
on public.commerce_metrics_daily for select
using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists ecommerce_ideas_set_updated_at on public.ecommerce_ideas;
create trigger ecommerce_ideas_set_updated_at
before update on public.ecommerce_ideas
for each row execute function public.set_updated_at();

create index if not exists budget_entries_user_date_idx on public.budget_entries(user_id, occurred_on desc);
create index if not exists ecommerce_ideas_user_status_idx on public.ecommerce_ideas(user_id, status);
create index if not exists agent_cycle_events_user_created_idx on public.agent_cycle_events(user_id, created_at desc);
create index if not exists email_verification_codes_email_idx on public.email_verification_codes(email, created_at desc);
create index if not exists email_verification_codes_user_idx on public.email_verification_codes(user_id, created_at desc);
create index if not exists bank_connections_user_idx on public.bank_connections(user_id, status);
create index if not exists bank_transactions_user_date_idx on public.bank_transactions(user_id, occurred_on desc);
create unique index if not exists bank_transactions_provider_key on public.bank_transactions(user_id, provider_transaction_id) where provider_transaction_id is not null;
create index if not exists market_product_signals_score_idx on public.market_product_signals(score desc, created_at desc);
create unique index if not exists market_product_signals_product_key on public.market_product_signals(product_name);
create unique index if not exists finance_news_items_url_key on public.finance_news_items(url);
create index if not exists finance_news_items_published_idx on public.finance_news_items(published_at desc nulls last, created_at desc);
create index if not exists assistant_messages_user_created_idx on public.assistant_messages(user_id, created_at desc);
create index if not exists agent_runs_agent_started_idx on public.agent_runs(agent_name, started_at desc);
create index if not exists commerce_accounts_user_idx on public.commerce_accounts(user_id, provider, status);
create unique index if not exists commerce_products_provider_key on public.commerce_products(user_id, provider_product_id) where provider_product_id is not null;
create index if not exists commerce_products_user_trend_idx on public.commerce_products(user_id, trend, updated_at desc);
create unique index if not exists commerce_metrics_daily_key on public.commerce_metrics_daily(user_id, provider, metric_day);
