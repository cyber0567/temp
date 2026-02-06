-- RingCentral OAuth tokens per user (for telephony/contact center integration)
create table if not exists public.ringcentral_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index idx_ringcentral_tokens_user on public.ringcentral_tokens(user_id);

alter table public.ringcentral_tokens enable row level security;
create policy "Service can manage ringcentral_tokens"
  on public.ringcentral_tokens for all using (true) with check (true);
