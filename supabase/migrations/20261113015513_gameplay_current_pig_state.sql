-- Observations preserve current pig state after reloading or restoring a save; departure stays visible.
create or replace view public.gameplay_latest_pigs with(security_invoker=true) as
 select distinct on(player_id,town_id,entity_id) player_id,town_id,entity_id as pig_id,kind,game_day,game_time,occurred_at,data->'state' as state,
   kind<>'pig_departed' as active
 from public.gameplay_events where kind in('pig_registered','pig_created','pig_changed','pig_snapshot','pig_observed','pig_departed')
 order by player_id,town_id,entity_id,occurred_at desc,game_time desc,event_id desc;
revoke all on public.gameplay_latest_pigs from anon;
grant select on public.gameplay_latest_pigs to authenticated;
