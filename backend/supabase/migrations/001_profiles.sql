-- Profiles table: stores user info synced from auth
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  provider text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Backend uses service_role key and bypasses RLS to upsert profiles on signup/login.

-- Optional: auth events table for audit (login/signup events)
create table if not exists public.auth_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  event_type text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

alter table public.auth_events enable row level security;

create policy "Service can insert auth_events"
  on public.auth_events for insert
  with check (true);

create policy "Users can read own auth_events"
  on public.auth_events for select
  using (auth.uid() = user_id);
