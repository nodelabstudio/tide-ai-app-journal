-- Tide — initial schema.
--
-- Tables:
--   entries           one journal entry per row, owned by auth.uid()
--   ai_call_counters  per-user, per-UTC-day counter for the 40/day AI cap
--
-- RLS is on. Policies scope every read/write to the row owner.

-- ─────────────────────────────────────────────────────────────────────
-- entries
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  content     text not null check (char_length(content) > 0 and char_length(content) <= 20000),
  mood        smallint check (mood between 1 and 5),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists entries_user_created_idx
  on public.entries (user_id, created_at desc);

alter table public.entries enable row level security;

create policy "entries: owner can select"
  on public.entries for select
  using (auth.uid() = user_id);

create policy "entries: owner can insert"
  on public.entries for insert
  with check (auth.uid() = user_id);

create policy "entries: owner can update"
  on public.entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "entries: owner can delete"
  on public.entries for delete
  using (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists entries_touch_updated_at on public.entries;
create trigger entries_touch_updated_at
  before update on public.entries
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────────────
-- ai_call_counters
--
-- One row per (user, UTC date). Incremented atomically by the
-- bump_ai_call_counter() function before each AI request. The 40-call
-- daily cap is enforced inside the function — even a VPN-hopping user
-- still hits the same row, so IP-level limits are not load-bearing.
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.ai_call_counters (
  user_id  uuid not null references auth.users(id) on delete cascade,
  day      date not null default (now() at time zone 'utc')::date,
  count    integer not null default 0,
  primary key (user_id, day)
);

alter table public.ai_call_counters enable row level security;

create policy "counters: owner can read own"
  on public.ai_call_counters for select
  using (auth.uid() = user_id);

-- Writes happen through the security-definer function below, so no
-- direct insert/update policy is granted to authenticated users.

-- Atomic increment with cap enforcement.
-- Returns the new count if the call is allowed, or NULL if the user is
-- already at or above the cap for the day.
create or replace function public.bump_ai_call_counter(
  p_user_id uuid,
  p_cap     integer default 40
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date := (now() at time zone 'utc')::date;
  v_new integer;
begin
  insert into public.ai_call_counters (user_id, day, count)
  values (p_user_id, v_day, 1)
  on conflict (user_id, day) do update
    set count = public.ai_call_counters.count + 1
    where public.ai_call_counters.count < p_cap
  returning count into v_new;

  return v_new; -- NULL when the conflict update skipped due to the cap.
end;
$$;

revoke all on function public.bump_ai_call_counter(uuid, integer) from public;
grant execute on function public.bump_ai_call_counter(uuid, integer) to authenticated, service_role;
