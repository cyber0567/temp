-- Custom auth: users table (replaces Supabase Auth for email/password)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  created_at timestamptz default now()
);

-- Allow profiles to store both custom user ids and OAuth ids (e.g. google-xxx)
-- Drop policies that depend on profiles.id before altering column type
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
-- Drop FK to auth.users so we can use our own user ids
alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles alter column id type text using id::text;

-- RLS: service role bypasses; add policies if using anon key for profiles
alter table public.users enable row level security;

create policy "Service can manage users"
  on public.users for all
  using (true)
  with check (true);
