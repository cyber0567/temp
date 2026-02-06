-- Organizations
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Roles: admin, member, viewer
create type public.org_role as enum ('admin', 'member', 'viewer');

-- Organization members (user_id links to profiles.id or users.id as text)
create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id text not null,
  role public.org_role not null default 'member',
  created_at timestamptz default now(),
  unique(org_id, user_id)
);

create index idx_org_members_user on public.organization_members(user_id);
create index idx_org_members_org on public.organization_members(org_id);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

create policy "Service can manage organizations"
  on public.organizations for all using (true) with check (true);
create policy "Service can manage organization_members"
  on public.organization_members for all using (true) with check (true);
