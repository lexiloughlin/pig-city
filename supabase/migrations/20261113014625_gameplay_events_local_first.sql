-- Additive local-first telemetry. Existing towns, player_games, pigs and saves are preserved.
create table public.gameplay_towns (
  player_id uuid not null references auth.users(id) on delete cascade,
  town_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (player_id,town_id)
);
create table public.gameplay_events (
  player_id uuid not null,
  event_id text not null check(length(event_id) between 1 and 240),
  town_id uuid not null,
  kind text not null check(length(kind) between 1 and 60),
  entity_id text,
  game_day integer not null check(game_day>=1),
  game_time double precision not null check(game_time>=0 and game_time<1e15),
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  data jsonb not null check(jsonb_typeof(data)='object'),
  payload jsonb not null check(pg_column_size(payload)<=100000),
  primary key(player_id,event_id),
  foreign key(player_id,town_id) references public.gameplay_towns(player_id,town_id) on delete cascade
);
create index gameplay_events_town_day on public.gameplay_events(player_id,town_id,game_day);
create index gameplay_events_entity on public.gameplay_events(player_id,town_id,entity_id,game_time desc);
alter table public.gameplay_towns enable row level security;
alter table public.gameplay_events enable row level security;
create policy "gameplay towns read own" on public.gameplay_towns for select to authenticated using(player_id=(select auth.uid()));
create policy "gameplay towns insert own" on public.gameplay_towns for insert to authenticated with check(player_id=(select auth.uid()));
create policy "gameplay events read own" on public.gameplay_events for select to authenticated using(player_id=(select auth.uid()));
create policy "gameplay events insert own" on public.gameplay_events for insert to authenticated with check(player_id=(select auth.uid()));
revoke all on public.gameplay_towns,public.gameplay_events from anon,authenticated;
grant select,insert on public.gameplay_towns,public.gameplay_events to authenticated;

create function public.ingest_gameplay(p_town_id uuid,p_events jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare v_user uuid:=auth.uid(); e jsonb; expected_id text;
begin
  if v_user is null then raise exception 'Sign in before syncing gameplay'; end if;
  if jsonb_typeof(p_events)<>'array' or jsonb_array_length(p_events) not between 1 and 200 then raise exception 'Invalid gameplay batch'; end if;
  insert into public.gameplay_towns(player_id,town_id) values(v_user,p_town_id) on conflict do nothing;
  for e in select value from jsonb_array_elements(p_events) loop
    if (e->>'town_id')::uuid is distinct from p_town_id or jsonb_typeof(e->'id') is distinct from 'string' or jsonb_typeof(e->'data') is distinct from 'object' or jsonb_typeof(e->'kind') is distinct from 'string' then raise exception 'Invalid gameplay event'; end if;
    if e->>'kind' in ('pig_snapshot','pig_registered','pig_created','building_registered','building_built') and coalesce(e->>'entity_id','')='' then raise exception 'Missing gameplay entity'; end if;
    expected_id:=null;
    if e->>'kind'='pig_snapshot' then expected_id:='snapshot/'||p_town_id||'/'||(e->>'game_day')||'/pig/'||(e->>'entity_id');
    elsif e->>'kind'='town_snapshot' then expected_id:='snapshot/'||p_town_id||'/'||(e->>'game_day')||'/town';
    elsif e->>'kind' in ('pig_registered','pig_created') then expected_id:='register/'||p_town_id||'/pig/'||(e->>'entity_id');
    elsif e->>'kind' in ('building_registered','building_built') then expected_id:='register/'||p_town_id||'/building/'||(e->>'entity_id');
    end if;
    if expected_id is not null then
      if e->>'id'<>expected_id then raise exception 'Invalid stable event identity'; end if;
    elsif (e->>'id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise exception 'Invalid event identity';
    end if;
    insert into public.gameplay_events(player_id,event_id,town_id,kind,entity_id,game_day,game_time,occurred_at,data,payload)
      values(v_user,e->>'id',p_town_id,e->>'kind',e->>'entity_id',(e->>'game_day')::int,(e->>'game_time')::double precision,(e->>'occurred_at')::timestamptz,e->'data',e)
      on conflict(player_id,event_id) do nothing;
    -- Random action IDs are immutable. Stable registration/daily snapshot keys are first-write-wins.
    if expected_id is null and exists(select 1 from public.gameplay_events where player_id=v_user and event_id=e->>'id' and payload<>e) then raise exception 'Gameplay event ID collision'; end if;
  end loop;
  return jsonb_build_object('accepted',(select jsonb_agg(value->>'id') from jsonb_array_elements(p_events)));
end $$;
revoke all on function public.ingest_gameplay(uuid,jsonb) from public,anon;
grant execute on function public.ingest_gameplay(uuid,jsonb) to authenticated;

create view public.gameplay_daily with(security_invoker=true) as
 select player_id,town_id,game_day,
   count(*) filter(where kind='care') as care_actions,
   count(*) filter(where kind='birth') as births,
   coalesce(sum((data->>'amount')::numeric) filter(where kind='wage_paid'),0) as wages,
   coalesce(sum((data->>'amount')::numeric) filter(where kind='customer_payment'),0) as shop_revenue
 from public.gameplay_events group by player_id,town_id,game_day;
create view public.gameplay_pig_snapshots with(security_invoker=true) as
 select player_id,town_id,entity_id as pig_id,game_day,game_time,occurred_at,data->'state' as state
 from public.gameplay_events where kind='pig_snapshot';
create view public.gameplay_latest_pigs with(security_invoker=true) as
 select distinct on(player_id,town_id,entity_id) player_id,town_id,entity_id as pig_id,kind,game_day,game_time,occurred_at,data->'state' as state
 from public.gameplay_events where kind in('pig_registered','pig_created','pig_changed','pig_snapshot')
 order by player_id,town_id,entity_id,game_time desc,occurred_at desc,event_id desc;
revoke all on public.gameplay_daily,public.gameplay_pig_snapshots,public.gameplay_latest_pigs from anon;
grant select on public.gameplay_daily,public.gameplay_pig_snapshots,public.gameplay_latest_pigs to authenticated;
comment on table public.gameplay_events is 'Append-only gameplay history. Action IDs deduplicate retries; stable daily snapshot keys are first-write-wins. No player save data is deleted or rewritten.';
-- The legacy summary is retained, but must honor the caller's row-level security.
alter view public.pig_summary set(security_invoker=true);
