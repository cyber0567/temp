-- Add provider column if it doesn't exist (for existing profiles table)
alter table public.profiles
  add column if not exists provider text;
