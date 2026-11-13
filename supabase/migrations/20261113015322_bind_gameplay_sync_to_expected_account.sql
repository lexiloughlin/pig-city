create function public.ingest_gameplay(p_town_id uuid,p_events jsonb,p_player_id uuid) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare v_user uuid:=auth.uid(); e jsonb; expected_id text;
begin
  if v_user is null then raise exception 'Sign in before syncing gameplay'; end if;
  if p_player_id is distinct from v_user then raise exception 'Account changed during gameplay sync'; end if;
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
revoke all on function public.ingest_gameplay(uuid,jsonb,uuid) from public,anon;
grant execute on function public.ingest_gameplay(uuid,jsonb,uuid) to authenticated;


revoke all on function public.ingest_gameplay(uuid,jsonb) from public,anon,authenticated;
