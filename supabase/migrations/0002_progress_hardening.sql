-- Hardening for the ADR 004 sync RPCs (docs/fable-review/security.md #1, #2, #5).
--
-- The anon key is public by design, so the WRITE path is the exposed surface:
-- before this migration, put_progress accepted any string as a code and any
-- size of jsonb — unbounded row creation and storage-filling payloads.
--
--  * put_progress now rejects codes that don't match the client's pairing-code
--    format and snapshots over 64 KB (a real family snapshot is a few KB).
--  * delete_progress (new) lets a family remove its cloud row — the same
--    capability model: knowing the code is the only authorization.
--  * All SECURITY DEFINER functions pin search_path to public, pg_temp.
--  * A weekly retention sweep deletes rows untouched for 12 months (orphaned
--    rows — lost code + lost devices — otherwise live forever).
--
-- The code format is 4 dash-joined groups of 5 Crockford-base32 symbols
-- (no I, L, O, U) — see packages/core/src/domain/sync.ts. Clients always send
-- the normalized form, so rejecting everything else costs no legitimate call.

create or replace function public.get_progress(p_code text)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select snapshot from public.progress where code = p_code;
$$;

-- Recreated (not replaced) because the language changes to plpgsql for the
-- validation branches. Grants are re-established below.
drop function if exists public.put_progress(text, jsonb);
create function public.put_progress(p_code text, p_snapshot jsonb)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_code !~ '^[0-9A-HJ-KM-NP-TV-Z]{5}(-[0-9A-HJ-KM-NP-TV-Z]{5}){3}$' then
    raise exception 'invalid pairing code';
  end if;
  if pg_column_size(p_snapshot) > 64 * 1024 then
    raise exception 'snapshot too large';
  end if;
  insert into public.progress (code, snapshot, updated_at)
  values (p_code, p_snapshot, now())
  on conflict (code)
  do update set snapshot = excluded.snapshot, updated_at = now();
end;
$$;

-- Remove one row by its capability code; a no-op when it never existed.
create function public.delete_progress(p_code text)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  delete from public.progress where code = p_code;
$$;

-- The anon (public) role may only call the three capability RPCs.
revoke all on function public.get_progress(text) from public;
revoke all on function public.put_progress(text, jsonb) from public;
revoke all on function public.delete_progress(text) from public;
grant execute on function public.get_progress(text) to anon;
grant execute on function public.put_progress(text, jsonb) to anon;
grant execute on function public.delete_progress(text) to anon;

-- Retention: rows nobody has pushed to in 12 months are abandoned (the code
-- lives on paired devices; an active family pushes on every game complete).
-- pg_cron ships on hosted Supabase; if this block ever fails locally, run the
-- DELETE by hand instead — see docs/runbooks.md.
do $do$
begin
  create extension if not exists pg_cron;
  perform cron.schedule(
    'progress-retention',
    '0 3 * * 1',
    'delete from public.progress where updated_at < now() - interval ''12 months'''
  );
exception when others then
  raise notice 'pg_cron unavailable (%); schedule the retention delete manually — see docs/runbooks.md', sqlerrm;
end
$do$;
