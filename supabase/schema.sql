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

alter table public.profiles enable row level security;
alter table public.budget_entries enable row level security;
alter table public.ecommerce_ideas enable row level security;
alter table public.agent_cycle_events enable row level security;

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
