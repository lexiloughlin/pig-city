(function(root) {
  'use strict';
  const JOURNAL = 'pigcity-gameplay-event/';
  const uuid = () => root.crypto.randomUUID();
  const stable = e => /^(snapshot|register)\//.test(e.id);
  class Recorder {
    constructor({store, storage=root.localStorage, getState, isReadOnly=()=>false, onStatus=()=>{}}) {
      this.store=store;this.storage=storage;this.getState=getState;this.isReadOnly=isReadOnly;this.onStatus=onStatus;
      this.pending=new Map();this.tail=Promise.resolve();this.knownPigs=new Map();this.knownBuildings=new Map();this.lastDay=null;this.town=null;this.cloud=null;this.syncing=false;this.error='';
      // Each event has its own journal key: two tabs never overwrite a shared queue.
      for(let i=0;i<storage.length;i++) {
        const key=storage.key(i);if(!key || !key.startsWith(JOURNAL))continue;
        try{const e=JSON.parse(storage.getItem(key));validate(e);this.pending.set(e.id,e);}catch(e){this.error='A gameplay journal entry could not be read. Export your data before clearing storage.';}
      }
      this.flush().catch(e=>this.fail(e));
    }
    fail(e){this.error=e.message||String(e);this.onStatus(this.error);}
    ensure(G) {
      if(this.isReadOnly())return null;
      if(!G.tracking || !UUID.test(G.tracking.town_id||''))G.tracking={version:1,town_id:uuid()};
      return G.tracking.town_id;
    }
    emit(kind,entity_id,data,id=null) {
      if(this.isReadOnly())return null;
      const G=this.getState(),town_id=this.ensure(G);
      const event={id:id||uuid(),town_id,kind,entity_id:entity_id||null,game_day:gameDay(G),game_time:G.time||0,occurred_at:new Date().toISOString(),data};
      validate(event);
      if(this.pending.has(event.id))return event.id;
      this.pending.set(event.id,event);
      try{this.storage.setItem(JOURNAL+event.id,JSON.stringify(event));}catch(e){this.fail(new Error('Gameplay journal is full or unavailable. Keep the game open and export your data.'));}
      if(!this.timer)this.timer=setTimeout(()=>{this.timer=null;this.flush().catch(e=>this.fail(e));},100);
      return event.id;
    }
    record(kind,pig,data={},building=null) {
      const G=this.getState();if(!this.ensure(G))return;
      if(pig&&!pig.trackingId)pig.trackingId=uuid();if(building&&!building.trackingId)building.trackingId=uuid();
      return this.emit(kind,pig?pig.trackingId:null,{...data,...(building?{building_id:building.trackingId,workplace_type:building.type}:{} )});
    }
    checkpoint() {
      if(this.isReadOnly())return;
      const G=this.getState(),town=this.ensure(G),day=gameDay(G);
      for(const p of G.pigs||[])if(!p.trackingId)p.trackingId=uuid();
      for(const [,list]of buildingLists(G))for(const b of list)if(!b.trackingId)b.trackingId=uuid();
      const ctx=entityContext(G);
      const initial=this.town!==town;
      if(initial){this.knownPigs.clear();this.knownBuildings.clear();this.lastDay=null;this.town=town;}
      const pigs=new Map(),buildings=new Map();
      for(const p of G.pigs||[]) {
        const state=pigState(p,G,ctx),prior=this.knownPigs.get(p.trackingId);
        const signature=JSON.stringify([state.name,state.job,state.health_status,state.home]);
        if(!prior)this.emit(initial?'pig_registered':'pig_created',p.trackingId,{state},`register/${town}/pig/${p.trackingId}`);
        else if(prior.signature!==signature)this.emit('pig_changed',p.trackingId,{state});
        if(initial)this.emit('pig_observed',p.trackingId,{state});
        pigs.set(p.trackingId,{signature,state});
      }
      for(const [id,prior]of this.knownPigs)if(!pigs.has(id))this.emit('pig_departed',id,{state:prior.state});
      for(const [map,list]of buildingLists(G))for(const b of list) {
        const state={id:b.trackingId,type:b.type,map,x:b.x,y:b.y,level:b.lvl||1},signature=JSON.stringify(state),prior=this.knownBuildings.get(b.trackingId);
        if(!prior)this.emit(initial?'building_registered':'building_built',b.trackingId,{state},`register/${town}/building/${b.trackingId}`);
        else if(prior!==signature)this.emit('building_changed',b.trackingId,{state});
        buildings.set(b.trackingId,signature);
      }
      for(const id of this.knownBuildings.keys())if(!buildings.has(id))this.emit('building_removed',id,{});
      this.knownPigs=pigs;this.knownBuildings=buildings;
      if(this.lastDay!==day) {
        for(const p of G.pigs||[])this.emit('pig_snapshot',p.trackingId,{state:pigState(p,G,ctx)},`snapshot/${town}/${day}/pig/${p.trackingId}`);
        this.emit('town_snapshot',null,{population:pigs.size,buildings:buildings.size,coins:G.coins??0,hay:G.hay??0,water:G.water??0,vegetables:G.veg??0},`snapshot/${town}/${day}/town`);
        this.lastDay=day;
      }
    }
    flush() {
      const run=async()=>{
        while(this.pending.size) {
          const batch=[...this.pending.values()].slice(0,200);
          await this.store.put(batch);
          for(const e of batch){this.storage.removeItem(JOURNAL+e.id);this.pending.delete(e.id);}
        }
      };
      const next=this.tail.then(run,run);this.tail=next.catch(()=>{});return next;
    }
    connect(provider){this.cloud=provider;}
    async sync() {
      if(this.syncing||this.isReadOnly()||!this.cloud)return;
      const context=this.cloud();if(!context||!context.userId||!context.canSync)return;
      this.syncing=true;
      try {
        await this.flush();const town=this.ensure(this.getState());
        if(!await this.store.claim(town,context.userId))throw Error('This town’s tracking data belongs to a different signed-in account. Export it before switching accounts.');
        for(let n=0;n<20;n++) {
          const now=this.cloud();if(!now || now.userId!==context.userId || !now.canSync)break;
          const rows=await this.store.rows(town,context.userId,200);if(!rows.length)break;
          const batch=rows.map(root.GameplayStore.strip);
          const {data,error}=await context.client.rpc('ingest_gameplay',{p_town_id:town,p_events:batch,p_player_id:context.userId});
          if(error)throw error;
          const accepted=new Set(data && data.accepted);
          if(accepted.size!==batch.length || batch.some(e=>!accepted.has(e.id)))throw Error('Cloud did not acknowledge the complete gameplay batch. It will be retried.');
          await this.store.ack(batch.map(e=>e.id),context.userId);
        }
        this.error='';this.onStatus('');
      }catch(e){this.fail(e);}finally{this.syncing=false;}
    }
    async prepareCloudState(G, cloudTownId) {
      // Two devices importing the same pre-tracking cloud save must assign identical IDs.
      const town=G.tracking&&UUID.test(G.tracking.town_id||'')?G.tracking.town_id:cloudTownId;
      if(!UUID.test(town))throw Error('Invalid cloud town identity');
      G.tracking={...(G.tracking||{}),version:1,town_id:town};
      async function identity(key){const bytes=new Uint8Array(await root.crypto.subtle.digest('SHA-256',new TextEncoder().encode(key)));bytes[6]=(bytes[6]&15)|128;bytes[8]=(bytes[8]&63)|128;const h=[...bytes.slice(0,16)].map(n=>n.toString(16).padStart(2,'0')).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);}
      for(const p of G.pigs||[])if(!p.trackingId)p.trackingId=await identity(town+'/pig/'+p.id);
      for(const [map,list]of buildingLists(G))for(let i=0;i<list.length;i++){const b=list[i];if(!b.trackingId)b.trackingId=await identity(town+'/building/'+map+'/'+b.x+','+b.y+'/'+b.type+'/'+i);}
      return G;
    }
    async exportData() {
      this.checkpoint();await this.flush();const town=this.ensure(this.getState());
      const rows=await this.store.rows(town);
      return {format:'pigcity-gameplay',version:1,town_id:town,exported_at:new Date().toISOString(),events:rows.map(root.GameplayStore.strip)};
    }
    async importData(file) {
      if(this.isReadOnly())throw Error('Update Pig City before importing tracking data.');
      if(!file || file.format!=='pigcity-gameplay'||file.version!==1||!Array.isArray(file.events))throw Error('Not a Pig City gameplay export');
      const town=this.ensure(this.getState());if(file.town_id!==town)throw Error('Load the matching town save before importing its tracking history.');
      for(const e of file.events){validate(e);if(e.town_id!==town)throw Error('Tracking export contains a different town');}
      for(let i=0;i<file.events.length;i+=200)await this.store.put(file.events.slice(i,i+200));
      return file.events.length;
    }
    async status(){await this.flush();const G=this.getState();if(this.isReadOnly())return {events:0,pending:0,mode:'read-only'};
      const town=this.ensure(G),rows=await this.store.rows(town),c=this.cloud&&this.cloud();
      return {events:rows.length,pending:c&&c.userId?rows.filter(e=>e.synced_to!==c.userId).length:rows.length,mode:c&&c.userId?'cloud':'local',error:this.error};
    }
  }
  function buildingLists(G){return [['home',G.buildings||[]],['city',G.city||[]],['park',G.park&&G.park.rides||[]]];}
  // DAY is 240 simulation seconds in this game; the clock, not wall time, defines a game day.
  function gameDay(G){return Math.floor((G.clock||0)/240)+1;}
  function entityContext(G){
    const jobs=new Map(),homes=new Map();
    for(const [map,list]of buildingLists(G))for(const b of list)jobs.set(map+':'+b.x+','+b.y,{building_id:b.trackingId,type:b.type,map});
    const huts=(G.buildings||[]).filter(b=>b.type==='hutch');let h=0,n=0;
    for(const p of G.pigs||[]){while(huts[h]&&n>=[4,6,8][(huts[h].lvl||1)-1]){h++;n=0;}if(huts[h]){homes.set(p.trackingId,huts[h].trackingId);n++;}}
    return {jobs,homes};
  }
  function pigState(p,G,ctx){
    const job=p.job&&ctx.jobs.get((p.job.map||'home')+':'+p.job.x+','+p.job.y);
    return {id:p.trackingId,game_id:p.id,name:p.name,age_game_seconds:p.age??null,happiness:p.joy??null,health:p.health??null,health_status:p.state==='admitted'?'hospitalized':!Number.isFinite(p.health)?'unknown':p.health<60?'unwell':'healthy',food:p.food??null,water:p.water??null,trait:p.trait??null,favorite_snack:p.fav??null,job:job||null,home:ctx.homes.get(p.trackingId)||null,location:p.loc||'home'};
  }
  const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  function validate(e){
    if(!e||typeof e.id!=='string'||e.id.length>240||!UUID.test(e.town_id||'')||typeof e.kind!=='string'||!e.kind.length||e.kind.length>60||!Number.isInteger(e.game_day)||e.game_day<1||e.game_day>2147483647||!Number.isFinite(e.game_time)||e.game_time<0||e.game_time>=1e15||typeof e.occurred_at!=='string'||!Number.isFinite(Date.parse(e.occurred_at))||!e.data||typeof e.data!=='object'||Array.isArray(e.data)||new TextEncoder().encode(JSON.stringify(e)).length>90000)throw Error('Invalid gameplay event');
    if(e.entity_id!==null && !UUID.test(e.entity_id||''))throw Error('Invalid gameplay entity ID');
    let expected=null;
    if(e.kind==='town_snapshot')expected=`snapshot/${e.town_id}/${e.game_day}/town`;
    if(e.kind==='pig_snapshot')expected=`snapshot/${e.town_id}/${e.game_day}/pig/${e.entity_id}`;
    if(['pig_created','pig_registered'].includes(e.kind))expected=`register/${e.town_id}/pig/${e.entity_id}`;
    if(['building_built','building_registered'].includes(e.kind))expected=`register/${e.town_id}/building/${e.entity_id}`;
    if(expected ? e.id!==expected || (e.kind!=='town_snapshot'&&!e.entity_id) : !UUID.test(e.id))throw Error('Invalid stable gameplay identity');
  }
  function canonical(value){if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';return JSON.stringify(value);}
  const api={Recorder,validate,canonical,stable,gameDay};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GameplayTracking=api;
})(typeof window!=='undefined'?window:globalThis);
