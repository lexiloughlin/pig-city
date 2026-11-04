-- Pig City cloud saves (v1)
-- Tables, row-level security and save functions for the schema in docs/erd.dbml.
-- Run with the Supabase CLI (`supabase db push`) or paste into the Supabase SQL editor.

-- ---------- types ----------
create type public.save_reason as enum ('autosave', 'restore', 'import', 'upload');

-- ---------- tables ----------
-- One row per signed-in player, created automatically on sign-up (see handle_new_user below).
-- Deleting the auth user deletes the player, their towns and all saved versions.
create table public.players (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name varchar(40),
  created_at timestamptz not null default now(),
  deleted_at timestamptz -- set when the player asks to delete their account; removed within 30 days
);

-- The current copy of each town. `state` is the whole game state G.
create table public.towns (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  name varchar(40) not null default 'Pig City',
  state jsonb not null,
  version int not null default 1,        -- goes up by 1 on every cloud save
  schema_version int not null default 1, -- save format version, for upgrading old saves
  pig_count int not null default 0,
  building_count int not null default 0,
  coins int not null default 0,
  device varchar(10) check (device in ('web', 'mac')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint towns_state_size check (pg_column_size(state) <= 50 * 1024 * 1024) -- same cap as the Mac save file
);
create index towns_player_updated on public.towns (player_id, updated_at desc);

-- Save history for Restore: the last 20 versions per town plus one per day for 30 days.
create table public.town_versions (
  id bigint generated always as identity primary key,
  town_id uuid not null references public.towns (id) on delete cascade,
  version int not null,
  state jsonb not null,
  reason public.save_reason not null default 'autosave',
  saved_at timestamptz not null default now(),
  unique (town_id, version)
);
create index town_versions_town_saved on public.town_versions (town_id, saved_at desc);

-- ---------- row-level security: players only ever see their own rows ----------
alter table public.players enable row level security;
alter table public.towns enable row level security;
alter table public.town_versions enable row level security;

create policy "players: read own" on public.players for select using (id = auth.uid());
create policy "players: update own" on public.players for update using (id = auth.uid()) with check (id = auth.uid());

create policy "towns: read own" on public.towns for select using (player_id = auth.uid());
create policy "towns: create own" on public.towns for insert with check (player_id = auth.uid());
create policy "towns: update own" on public.towns for update using (player_id = auth.uid()) with check (player_id = auth.uid());
create policy "towns: delete own" on public.towns for delete using (player_id = auth.uid());

create policy "versions: read own" on public.town_versions for select
  using (exists (select 1 from public.towns t where t.id = town_id and t.player_id = auth.uid()));
create policy "versions: create own" on public.town_versions for insert
  with check (exists (select 1 from public.towns t where t.id = town_id and t.player_id = auth.uid()));
create policy "versions: delete own" on public.town_versions for delete
  using (exists (select 1 from public.towns t where t.id = town_id and t.player_id = auth.uid()));

-- ---------- triggers ----------
-- Make a players row when someone signs up.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.players (id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Up to 10 towns per player.
create function public.check_town_limit() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (select count(*) from public.towns where player_id = new.player_id) >= 10 then
    raise exception 'town_limit: a player can keep up to 10 towns';
  end if;
  return new;
end $$;
create trigger towns_limit before insert on public.towns
  for each row execute function public.check_town_limit();

-- Put a new town's first copy into its history, so it can be restored too.
create function public.record_first_version() returns trigger
language plpgsql set search_path = '' as $$
begin
  insert into public.town_versions (town_id, version, state) values (new.id, new.version, new.state);
  return new;
end $$;
create trigger towns_first_version after insert on public.towns
  for each row execute function public.record_first_version();

-- ---------- functions the game calls ----------
-- Save a town. The game sends the version it last loaded or saved; if another device has
-- saved since then, nothing is written and the error starts with 'conflict' so the game can
-- show the keep-which prompt. Returns the new version number.
create function public.save_town(
  p_town_id uuid,
  p_expected_version int,
  p_state jsonb,
  p_name varchar default null,
  p_pig_count int default 0,
  p_building_count int default 0,
  p_coins int default 0,
  p_device varchar default 'web',
  p_reason public.save_reason default 'autosave'
) returns int
language plpgsql security invoker set search_path = '' as $$
declare
  v_new int;
begin
  update public.towns set
    state = p_state,
    name = coalesce(p_name, name),
    version = version + 1,
    pig_count = p_pig_count,
    building_count = p_building_count,
    coins = p_coins,
    device = p_device,
    updated_at = now()
  where id = p_town_id and version = p_expected_version
  returning version into v_new;

  if v_new is null then
    if exists (select 1 from public.towns where id = p_town_id) then
      raise exception 'conflict: town % was saved by another device', p_town_id;
    end if;
    raise exception 'not_found: town % does not exist', p_town_id;
  end if;

  insert into public.town_versions (town_id, version, state, reason)
  values (p_town_id, v_new, p_state, p_reason);

  -- keep the last 20 versions, plus the newest version of each day for the last 30 days
  delete from public.town_versions v
  where v.town_id = p_town_id
    and v.id not in (
      select id from public.town_versions
      where town_id = p_town_id order by version desc limit 20
    )
    and v.id not in (
      select distinct on (saved_at::date) id from public.town_versions
      where town_id = p_town_id and saved_at > now() - interval '30 days'
      order by saved_at::date, saved_at desc
    );

  return v_new;
end $$;

-- Restore a town to an earlier version. This is saved as a new version, so the restore
-- itself can be undone. Returns the new version number.
create function public.restore_town(p_town_id uuid, p_version int)
returns int
language plpgsql security invoker set search_path = '' as $$
declare
  v_state jsonb;
  v_current int;
begin
  select state into v_state from public.town_versions
  where town_id = p_town_id and version = p_version;
  if v_state is null then
    raise exception 'not_found: town % has no version %', p_town_id, p_version;
  end if;

  select version into v_current from public.towns where id = p_town_id;
  return public.save_town(
    p_town_id, v_current, v_state, null,
    coalesce(jsonb_array_length(v_state -> 'pigs'), 0),
    coalesce(jsonb_array_length(v_state -> 'buildings'), 0),
    coalesce((v_state ->> 'coins')::numeric::int, 0),
    null, 'restore'
  );
end $$;
