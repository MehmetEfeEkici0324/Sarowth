create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role text not null default 'founder',
  monthly_income numeric(12, 2) not null default 0,
  savings_goal numeric(12, 2) not null default 0,
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
  topic text,
  summary text,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles
alter column savings_goal set default 0;

alter table public.finance_news_items
add column if not exists topic text;

create table if not exists public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_watch_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  intent text not null default 'product_watch' check (intent in ('product_watch', 'news_watch', 'investment_watch')),
  status text not null default 'active' check (status in ('active', 'paused')),
  last_checked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.product_supplier_links (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  title text not null,
  url text not null,
  source text not null,
  price_text text,
  score integer not null default 50 check (score between 0 and 100),
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

alter table public.profiles enable row level security;
alter table public.budget_entries enable row level security;
alter table public.ecommerce_ideas enable row level security;
alter table public.agent_cycle_events enable row level security;
alter table public.email_verification_codes enable row level security;
alter table public.market_product_signals enable row level security;
alter table public.finance_news_items enable row level security;
alter table public.assistant_messages enable row level security;
alter table public.agent_watch_topics enable row level security;
alter table public.product_supplier_links enable row level security;
alter table public.agent_runs enable row level security;

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
drop policy if exists "Users can read own assistant messages" on public.assistant_messages;
drop policy if exists "Users can insert own assistant messages" on public.assistant_messages;
drop policy if exists "Users can read own watch topics" on public.agent_watch_topics;
drop policy if exists "Users can insert own watch topics" on public.agent_watch_topics;
drop policy if exists "Users can update own watch topics" on public.agent_watch_topics;
drop policy if exists "Users can delete own watch topics" on public.agent_watch_topics;
drop policy if exists "Anyone can read supplier links" on public.product_supplier_links;
drop policy if exists "Anyone can read market signals" on public.market_product_signals;
drop policy if exists "Anyone can read finance news" on public.finance_news_items;

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

create policy "Users can read own assistant messages"
on public.assistant_messages for select
using (auth.uid() = user_id);

create policy "Users can insert own assistant messages"
on public.assistant_messages for insert
with check (auth.uid() = user_id);

create policy "Users can read own watch topics"
on public.agent_watch_topics for select
using (auth.uid() = user_id);

create policy "Users can insert own watch topics"
on public.agent_watch_topics for insert
with check (auth.uid() = user_id);

create policy "Users can update own watch topics"
on public.agent_watch_topics for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own watch topics"
on public.agent_watch_topics for delete
using (auth.uid() = user_id);

create policy "Anyone can read supplier links"
on public.product_supplier_links for select
using (true);

create policy "Anyone can read market signals"
on public.market_product_signals for select
using (true);

create policy "Anyone can read finance news"
on public.finance_news_items for select
using (true);

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
create index if not exists market_product_signals_score_idx on public.market_product_signals(score desc, created_at desc);
create unique index if not exists market_product_signals_product_key on public.market_product_signals(product_name);
create unique index if not exists finance_news_items_url_key on public.finance_news_items(url);
create index if not exists finance_news_items_published_idx on public.finance_news_items(published_at desc nulls last, created_at desc);
create index if not exists finance_news_items_topic_created_idx on public.finance_news_items(topic, created_at desc);
create index if not exists assistant_messages_user_created_idx on public.assistant_messages(user_id, created_at desc);
create unique index if not exists agent_watch_topics_user_topic_key on public.agent_watch_topics(user_id, lower(topic), intent);
create index if not exists agent_watch_topics_active_idx on public.agent_watch_topics(status, last_checked_at nulls first, created_at desc);
create unique index if not exists product_supplier_links_url_key on public.product_supplier_links(url);
create index if not exists product_supplier_links_product_score_idx on public.product_supplier_links(product_name, score desc, created_at desc);
create index if not exists agent_runs_agent_started_idx on public.agent_runs(agent_name, started_at desc);
