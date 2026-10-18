-- Bloom Terminal, persist task progress
-- -------------------------------------
-- Store which social tasks a user finished (so they don't reappear on
-- refresh / sign-in) and the links they submitted for the quote / comment
-- tasks. The agent/worker already persists in the `workers` table; wallet +
-- referrals persist in profiles/referrals.
--
-- Run once in the Supabase SQL editor. RLS already lets a user update their
-- own profile row, so no new policy is needed.

alter table public.profiles
  add column if not exists completed_tasks text[] not null default '{}';

alter table public.profiles
  add column if not exists task_links jsonb not null default '{}'::jsonb;
