-- Bloom Terminal, whitelist application
-- -------------------------------------
-- A fully public application page (/whitelist), no sign-in. The applicant
-- enters their X handle and wallet, then submits the two engagement links
-- (quote + comment-and-tag). One row per X handle; re-submitting updates it.
--
-- SETUP (once, in the Supabase SQL editor): run this whole file.
--
-- Access is only through submit_whitelist() (granted to anon). The table has
-- RLS on with no select policy, so the browser can write an application but
-- can never read anyone's list, only the service role / SQL editor can.

create table if not exists public.whitelist (
  id           bigint generated always as identity primary key,
  x_username   text not null,
  wallet_address text,
  quote_link   text not null,
  comment_link text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- one application per X handle (case-insensitive)
create unique index if not exists whitelist_handle_idx on public.whitelist (lower(x_username));

alter table public.whitelist enable row level security;
-- no policies: reach this only through submit_whitelist() below.

-- Submit (or update) an application. Public: granted to anon. Validates the
-- handle, wallet and both links server-side. Re-submitting with the same X
-- handle overwrites that handle's row.
create or replace function public.submit_whitelist(
  p_handle  text,
  p_wallet  text,
  p_quote   text,
  p_comment text
)
returns jsonb language plpgsql security definer set search_path = public volatile as $$
declare
  h  text := lower(btrim(regexp_replace(coalesce(p_handle, ''), '^@+', '')));
  w  text := lower(btrim(coalesce(p_wallet, '')));
  q  text := btrim(coalesce(p_quote, ''));
  c  text := btrim(coalesce(p_comment, ''));
  re text := '^https?://(x\.com|twitter\.com)/[^/]+/status/[0-9]+';
begin
  if length(h) = 0 then
    return jsonb_build_object('ok', false, 'error', 'Enter your X username.');
  end if;
  if w !~ '^0x[0-9a-f]{40}$' then
    return jsonb_build_object('ok', false, 'error', 'Enter a valid wallet address (0x + 40 hex).');
  end if;
  if q !~* re then
    return jsonb_build_object('ok', false, 'error', 'Your quote link must be a valid X post URL.');
  end if;
  if c !~* re then
    return jsonb_build_object('ok', false, 'error', 'Your comment link must be a valid X post URL.');
  end if;

  insert into public.whitelist (x_username, wallet_address, quote_link, comment_link)
  values (h, w, q, c)
  on conflict (lower(x_username)) do update
    set wallet_address = excluded.wallet_address,
        quote_link     = excluded.quote_link,
        comment_link   = excluded.comment_link,
        updated_at     = now();

  return jsonb_build_object('ok', true);
end $$;

grant execute on function public.submit_whitelist(text, text, text, text) to anon, authenticated;

-- ----------------------------------------------------------------------
-- Admin: pull every application, run in the SQL editor whenever you want it.
--
--   select x_username, wallet_address, quote_link, comment_link, created_at
--   from public.whitelist
--   order by created_at desc;
--
--   -- how many applied:
--   select count(*) from public.whitelist;
