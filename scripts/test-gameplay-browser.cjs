const {app,BrowserWindow,session}=require('electron');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'pigcity-tracking-test-')));
app.on('window-all-closed',()=>{});
app.whenReady().then(async()=>{let code=0;try{
 session.defaultSession.webRequest.onBeforeRequest({urls:['https://*/*','http://*/*']},(_,cb)=>cb({cancel:true}));
 const w=new BrowserWindow({show:false,width:1280,height:900,webPreferences:{backgroundThrottling:false}});
 const errors=[];w.webContents.on('console-message',(e,...a)=>{const m=e.message||a.join(' ');if(/Uncaught|tracking initialization|draw failed/.test(m))errors.push(m);});
 await w.loadFile(path.resolve(process.argv[2]||path.join(__dirname,'../index.html')),{query:{debug:'1'}});
 const before=await w.webContents.executeJavaScript(`(async()=>{
  const p=__pc,t=pigTown.tracking,check=(ok,msg)=>{if(!ok)throw Error(msg)};
  check(!!t,'Recorder failed to start');
  const legacy={pigs:[{id:1,name:'Same'}],buildings:[{type:'hutch',x:1,y:1}]};
  const one=await t.prepareCloudState(JSON.parse(JSON.stringify(legacy)),'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),two=await t.prepareCloudState(JSON.parse(JSON.stringify(legacy)),'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  check(JSON.stringify(one)===JSON.stringify(two),'Legacy cloud migration assigned different entity IDs across devices');await t.flush();let x=await t.exportData();const town=x.town_id,pig=p.G.pigs[0],building=p.G.buildings[0];
  check(pig.trackingId&&building.trackingId,'Missing stable entity IDs');
  p.selectPig(pig.id);document.getElementById('petBtn').click();
  document.getElementById('treatBtn').click();await t.flush();x=await t.exportData();
  check(x.events.some(e=>e.kind==='care'&&e.data.action==='pet'),'Pet action not recorded');
  check(x.events.some(e=>e.kind==='care'&&e.data.action==='treat'),'Treat action not recorded');
  const count=x.events.length;await t.importData(x);await t.importData(x);check((await t.exportData()).events.length===count,'Duplicate import created records');
  const daily=x.events.filter(e=>e.kind==='town_snapshot').length;t.checkpoint();t.checkpoint();await t.flush();check((await t.exportData()).events.filter(e=>e.kind==='town_snapshot').length===daily,'Duplicate daily snapshots');
  const oldCoins=p.G.coins,oldPigId=pig.trackingId,oldBuildingId=building.trackingId;
  // Persist a wage with amount zero: zero is data, not a missing-value default.
  t.record('wage_paid',pig,{amount:0},building);p.save();await t.flush();
  const cloud=new Map();let attempts=0,dropAck=true;
  t.connect(()=>({userId:'user-a',canSync:true,client:{rpc:async(_,args)=>{attempts++;for(const e of args.p_events)cloud.set(e.id,e);if(dropAck){dropAck=false;return {error:{message:'Simulated lost acknowledgment'}};}return {data:{accepted:args.p_events.map(e=>e.id)}};}}}));
  await t.sync();check((await t.status()).pending>0,'Failed sync removed pending records');
  await t.sync();const synced=await t.exportData();check((await t.status()).pending===0,'Retry failed to clear pending records');check(cloud.size===synced.events.length,'Retry duplicated cloud events');
  t.record('care',pig,{action:'test-offline'});await t.flush();let otherWrites=0;
  t.connect(()=>({userId:'user-b',canSync:true,client:{rpc:async()=>{otherWrites++;return {data:{accepted:[]}}}}}));await t.sync();check(otherWrites===0,'Another account received queued data');
  // Simulate abrupt termination after the durable journal write, before the DB commit.
  const journalEvent={id:crypto.randomUUID(),town_id:town,kind:'journal_recovery_test',entity_id:null,game_day:1,game_time:0,occurred_at:new Date().toISOString(),data:{}};
  localStorage.setItem('pigcity-gameplay-event/'+journalEvent.id,JSON.stringify(journalEvent));
  const baselineEvents=(await t.exportData()).events;return {town,pig:oldPigId,building:oldBuildingId,coins:oldCoins,snapshots:baselineEvents.filter(e=>e.kind==='town_snapshot').length,events:baselineEvents.length,journalId:journalEvent.id,attempts};
 })()`);
 const loaded=new Promise(r=>w.webContents.once('did-finish-load',r));w.reload();await loaded;
 const after=await w.webContents.executeJavaScript(`(async()=>{const p=__pc,t=pigTown.tracking;await t.flush();const x=await t.exportData();return {town:x.town_id,pig:p.G.pigs[0].trackingId,building:p.G.buildings[0].trackingId,coins:p.G.coins,snapshots:x.events.filter(e=>e.kind==='town_snapshot').length,journalRecovered:x.events.some(e=>e.id===${JSON.stringify(before.journalId)}),events:x.events.length};})()`);
 for(const key of ['town','pig','building','snapshots'])if(before[key]!==after[key])throw Error('Reload changed '+key);
 if(!after.journalRecovered)throw Error('Crash journal was not recovered');
 if(errors.length)throw Error(errors.join('\n'));
 console.log(JSON.stringify({before,after,errors,passed:'offline gameplay hooks, retry after lost acknowledgment, IDB persistence, snapshot/import deduplication, account isolation, journal crash recovery'},null,2));w.destroy();
}catch(e){console.error(e);code=1;}finally{app.exit(code);}});
