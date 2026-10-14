-- Bloom Terminal, referral linking RPC
-- ------------------------------------
-- One trusted call that attributes a referral from a typed code (the
-- inviter's handle). SECURITY DEFINER so it can: (1) make sure the CURRENT
-- user has a profiles row even if the signup trigger didn't fire (this is
-- what caused the referrals_referred_user_id_fkey error), and (2) set the
-- direction from auth.uid() so it can never be reversed, the person who
-- enters the code is always the referred, the code owner is the referrer.
--
-- Run once in the Supabase SQL editor.

create or replace function public.link_referral(code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me        uuid := auth.uid();
  ref_clean text := regexp_replace(btrim(coalesce(code, '')), '^@', '');
  ref_id    uuid;
begin
  if me is null then
    return jsonb_build_object('ok', false, 'error', 'Sign in first.');
  end if;
  if ref_clean = '' then
    return jsonb_build_object('ok', false, 'error', 'Enter a code.');
  end if;

  -- Make sure MY profile exists (covers accounts whose signup trigger missed).
  insert into public.profiles (id, x_user_id, x_username, x_profile_image)
  select u.id,
         coalesce(u.raw_user_meta_data->>'provider_id', u.raw_user_meta_data->>'sub'),
         coalesce(u.raw_user_meta_data->>'user_name',
                  u.raw_user_meta_data->>'preferred_username',
                  u.raw_user_meta_data->>'screen_name'),
         coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')
  from auth.users u
  where u.id = me
  on conflict (id) do nothing;

  -- Resolve the inviter from the code (their handle).
  select id into ref_id
  from public.profiles
  where lower(x_username) = lower(ref_clean)
  limit 1;

  if ref_id is null then
    return jsonb_build_object('ok', false, 'error', 'No terminal uses that code.');
  end if;
  if ref_id = me then
    return jsonb_build_object('ok', false, 'error', 'You cannot use your own code.');
  end if;
  if exists (select 1 from public.referrals where referred_user_id = me) then
    return jsonb_build_object('ok', false, 'error', 'You are already linked to an inviter.');
  end if;

  insert into public.referrals (referrer_id, referred_user_id, status)
  values (ref_id, me, 'connected');

  return jsonb_build_object('ok', true, 'inviter', ref_clean);
exception when others then
  return jsonb_build_object('ok', false, 'error', SQLERRM);
end $$;

grant execute on function public.link_referral(text) to authenticated;
