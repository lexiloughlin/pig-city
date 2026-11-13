// Tests the real app:// protocol, preload bridge, SQLite file and migration backup.
const {app}=require('electron');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'pigcity-desktop-tracking-'));
app.setPath('userData',profile);
const original=JSON.stringify({schema:4,coins:123,hay:12,water:12,veg:6,time:0,breedT:20,born:0,best:1,prod:{},goalsDone:[],stats:{},buildings:[{type:'hutch',x:1,y:1,t:0}],pigs:[{id:1,name:'Test Pig',skin:{base:'#c98a5a',ear:'#e0a08a'},x:280,y:210,tx:280,ty:210,wait:1,face:1,food:85,water:85,joy:80,health:100,age:999,petCd:0,poopT:6,coinT:3,hop:0}],poops:[]});
fs.mkdirSync(path.join(profile,'Saves'),{recursive:true});fs.writeFileSync(path.join(profile,'Saves/town.json'),original);
const errors=[],timeout=setTimeout(()=>{console.error('Desktop tracking test timed out');app.exit(1)},30000);
app.on('web-contents-created',(_,wc)=>{
 wc.on('console-message',(e,...args)=>{const msg=e.message||args.join(' ');if(/Uncaught|tracking initialization|draw failed/.test(msg))errors.push(msg);});
 wc.once('did-finish-load',async()=>{try{
  await wc.loadURL('app://pig-city/index.html?debug=1');

  const before=await wc.executeJavaScript(`(async()=>{const p=__pc,t=pigTown.tracking;if(!t)throw Error('No desktop recorder');p.selectPig(1);document.getElementById('petBtn').click();p.save();await t.flush();const x=await t.exportData();return {town:x.town_id,pig:p.G.pigs[0].trackingId,care:x.events.filter(e=>e.kind==='care').length,snapshots:x.events.filter(e=>e.kind==='pig_snapshot').length};})()`);
  const loaded=new Promise(r=>wc.once('did-finish-load',r));wc.reload();await loaded;
  const after=await wc.executeJavaScript(`(async()=>{const p=__pc,t=pigTown.tracking;await t.flush();const x=await t.exportData();return {town:x.town_id,pig:p.G.pigs[0].trackingId,care:x.events.filter(e=>e.kind==='care').length,snapshots:x.events.filter(e=>e.kind==='pig_snapshot').length};})()`);
  assert.deepEqual(after,before);assert.equal(before.care,1);assert.equal(before.snapshots,1);
  assert.equal(fs.readFileSync(path.join(profile,'Saves/town.before-tracking.json'),'utf8'),original);
  assert.equal(fs.readFileSync(path.join(profile,'Saves/pigcity-before-simulation.json'),'utf8'),original);
  assert.equal(await wc.executeJavaScript(`pigDesktop.writeSave('{')`),false);
  assert.equal(await wc.executeJavaScript(`pigDesktop.backupSave('../invalid','{}')`),false);
  assert.equal(await wc.executeJavaScript(`pigDesktop.backupSave('pigcity-manual-backup',JSON.stringify(__pc.G))`),true);
  assert.ok((await wc.executeJavaScript(`pigDesktop.recoverySaves()`)).length>=2);
  const saved=JSON.parse(fs.readFileSync(path.join(profile,'Saves/town.json'),'utf8'));
  assert.equal(saved.schema,require('../assets/js/simulation').SCHEMA); assert.ok(saved.coins>=123);assert.equal(saved.pigs[0].id,1);assert.equal(saved.pigs[0].name,'Test Pig');
  const {DatabaseSync}=require('node:sqlite');const db=new DatabaseSync(path.join(profile,'Gameplay/gameplay.sqlite'),{readOnly:true});
  assert.equal(db.prepare("SELECT count(*) n FROM events WHERE kind='care'").get().n,1);assert.equal(db.prepare('pragma integrity_check').get().integrity_check,'ok');db.close();
  const imported = new Promise(r=>wc.once('did-finish-load',r));
  await wc.executeJavaScript(`const recovered=JSON.stringify({...__pc.G,townName:'Quota recovery'});Storage.prototype.setItem=function(){throw Error('simulated quota')};__pc.useTown(recovered)`);
  await imported;
  assert.equal(await wc.executeJavaScript(`__pc.G.townName`),'Quota recovery');
  assert.equal(JSON.parse(fs.readFileSync(path.join(profile,'Saves/town.json'),'utf8')).townName,'Quota recovery');
  assert.deepEqual(errors,[]);clearTimeout(timeout);console.log('PASS desktop: original save backup, unchanged gameplay IDs/resources, stable tracking IDs, actual SQLite persistence, preload access, daily deduplication integrity check; schema migration, acknowledged/rejected writes and durable manual recovery copies');app.exit(0);
 }catch(e){clearTimeout(timeout);console.error(e);app.exit(1);}});
});
require(path.resolve(__dirname,'../electron/main.js'));
