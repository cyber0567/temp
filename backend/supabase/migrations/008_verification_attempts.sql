-- Track failed verification attempts (max 5 before code is invalidated)
alter table public.email_verification_codes
  add column if not exists attempts int not null default 0;
