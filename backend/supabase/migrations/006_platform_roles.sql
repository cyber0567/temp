-- Platform role hierarchy: rep (sales rep) < admin (business owner) < super_admin (platform owner)
-- Rep: Access Rep Portal, own metrics, AI Call Assistant
-- Admin: All Rep + view all agents, compliance rules, violation alerts, daily goals
-- Super Admin: All Admin + all businesses, platform analytics, system config
create type public.platform_role as enum ('rep', 'admin', 'super_admin');

alter table public.profiles
  add column if not exists platform_role public.platform_role not null default 'rep';
