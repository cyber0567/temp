-- Email verification codes for signup (6-digit code, one per email)
create table if not exists public.email_verification_codes (
  email text primary key,
  code text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

alter table public.email_verification_codes enable row level security;

create policy "Service can manage email_verification_codes"
  on public.email_verification_codes for all
  using (true)
  with check (true);
