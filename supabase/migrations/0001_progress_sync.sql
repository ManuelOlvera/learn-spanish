-- ADR 004: optional cross-device progress sync.
--
-- Security model: the pairing code is a capability key. Direct table access is
-- denied to everyone via RLS; the only way in is through two SECURITY DEFINER
-- RPCs that REQUIRE the code as an argument. A caller who does not know a code
-- cannot enumerate, read, or write any row — so the public anon key is safe to
-- ship in the client. Codes carry ~100 bits of entropy (see domain/sync.ts).

create table if not exists public.progress (
  code       text primary key,
  snapshot   jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.progress enable row level security;
-- No policies => RLS denies all direct table access. Access is via the RPCs
-- below only. Revoke the implicit grants the anon/authenticated roles get.
revoke all on public.progress from anon, authenticated;

-- Read one row by its capability code. Returns null when the row is absent.
create or replace function public.get_progress(p_code text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select snapshot from public.progress where code = p_code;
$$;

-- Upsert one row by its capability code.
create or replace function public.put_progress(p_code text, p_snapshot jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.progress (code, snapshot, updated_at)
  values (p_code, p_snapshot, now())
  on conflict (code)
  do update set snapshot = excluded.snapshot, updated_at = now();
$$;

-- The anon (public) role may only call the two capability RPCs.
revoke all on function public.get_progress(text) from public;
revoke all on function public.put_progress(text, jsonb) from public;
grant execute on function public.get_progress(text) to anon;
grant execute on function public.put_progress(text, jsonb) to anon;
