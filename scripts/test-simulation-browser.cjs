// Disposable profile; never reads/writes the player's browser storage or Mac save.
const {app, BrowserWindow, session} = require('electron');
const SCHEMA=require('../assets/js/simulation').SCHEMA;
const fs=require('node:fs'), path=require('node:path'), os=require('node:os'), assert=require('node:assert/strict');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'pigcity-simulation-')));
app.on('window-all-closed',()=>{});
app.whenReady().then(async()=>{let code=0;try {
  session.defaultSession.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*']},(_,cb)=>cb({cancel:true}));
  const w=new BrowserWindow({show:false,webPreferences:{backgroundThrottling:false}}), errors=[];
  w.webContents.on('console-message',(e,...args)=>{const m=e.message||args.join(' ');if(/Uncaught|draw failed|update failed|init failed/.test(m))errors.push(m);});
  await w.loadFile(path.resolve(process.argv[2]||path.join(__dirname,'../index.html')),{query:{debug:'1',paused:'1'}});
  const run=code=>w.webContents.executeJavaScript(code);
  const reload=async()=>{const done=new Promise(r=>w.webContents.once('did-finish-load',r)); w.reload();await done;await run(`__pc.pause()`);};
  let town=await run(`JSON.stringify(__pc.G)`);
  if (process.argv[3]) {
    const legacy = fs.readFileSync(process.argv[3], 'utf8');
    const parsed = require('../assets/js/simulation').decode(legacy);
    await run(`__pc.lockSave();localStorage.clear();localStorage.setItem('pigcity-v1',${JSON.stringify(legacy)});`);
    await reload();
    assert.equal(await run(`__pc.G.pigs.length`),parsed.pigs.length);
    assert.equal(await run(`__pc.G.buildings.length`),parsed.buildings.length);
    await run(`__pc.save()`);await reload();
    assert.equal(await run(`__pc.G.pigs.length`),parsed.pigs.length);
    console.log('PASS: supplied legacy export migration and reload ('+parsed.pigs.length+' pigs, '+parsed.buildings.length+' buildings)');
  }
  // Seed versions from the actual full game format, retaining routines and identities.
  for (const schema of [1,2,3,4,5,6]) {
    await run(`__pc.lockSave();localStorage.clear();var old=JSON.parse(${JSON.stringify(town)});old.schema=${schema};old.clock=123;localStorage.setItem('pigcity-v1',JSON.stringify(old));localStorage.setItem('pigcity-seen','1');`);
    await reload();
    const result=await run(`({schema:__pc.G.schema, clock:__pc.G.clock, backup:localStorage.getItem('pigcity-before-simulation'), problem:__pc.saveProblem})`);
    assert.equal(result.schema,SCHEMA); assert(Math.abs(result.clock-123)<1); assert.equal(result.problem,'');
    if(schema<SCHEMA) assert.equal(JSON.parse(result.backup).schema,schema);
    await run(`__pc.save()`); await reload(); assert.equal(await run(`__pc.G.schema`),SCHEMA);
  }
  // Rolling recovery must survive corrupt JSON and valid JSON with an invalid shape.
  for(const broken of ['{','{"pigs":[],"buildings":null}']) {
    await run(`__pc.lockSave();localStorage.clear();localStorage.setItem('pigcity-backup',${JSON.stringify(town)});localStorage.setItem('pigcity-v1',${JSON.stringify(broken)});`);
    await reload();assert.equal(await run(`__pc.G.pigs.length`),JSON.parse(town).pigs.length);
    assert.equal(await run(`JSON.parse(localStorage.getItem('pigcity-backup')).pigs.length`),JSON.parse(town).pigs.length);
  }
  await run(`__pc.lockSave();localStorage.clear();var f=JSON.parse(${JSON.stringify(town)});f.schema=99;localStorage.setItem('pigcity-v1',JSON.stringify(f));`);
  await reload();await run(`__pc.save()`);assert.equal(await run(`JSON.parse(localStorage.getItem('pigcity-v1')).schema`),99);
  await run(`__pc.lockSave();localStorage.clear();localStorage.setItem('pigcity-v1','{');`);await reload();
  await run(`__pc.save()`);assert.equal(await run(`localStorage.getItem('pigcity-v1')`),'{');
  await run(`__pc.lockSave();localStorage.clear();localStorage.setItem('pigcity-v1',${JSON.stringify(town)});`);await reload();
  const pending=await run(`__pc.simulation.advance(.1,1,false,()=>{});__pc.save();__pc.simulation.tasks.get('production').pending`);
  await reload();assert(Math.abs(await run(`__pc.simulation.tasks.get('production').pending`)-pending)<1e-8);
  await run(`[...document.querySelectorAll('button')].find(b=>b.textContent==='💾 Backup').click()`);
  assert.equal(await run(`JSON.parse(localStorage.getItem('pigcity-manual-backup')).schema`),SCHEMA);
  const backup = await run(`localStorage.getItem('pigcity-manual-backup')`);
  const loaded = new Promise(r=>w.webContents.once('did-finish-load',r));
  await run(`__pc.G.coins=123456;__pc.useTown(${JSON.stringify(backup)})`);await loaded;
  assert.equal(await run(`__pc.G.coins`),JSON.parse(backup).coins);
  assert.equal(await run(`JSON.parse(localStorage.getItem('pigcity-manual-backup')).coins`),123456);
  await run(`Storage.prototype.setItem=function(){throw Error('test quota full')};__pc.save()`);
  assert.match(await run(`__pc.saveProblem`),/Save needs attention/);
  await reload(); await run(`__pc.pause();__pc.G.coins=654321`);
  await new Promise(r=>setTimeout(r,5500));
  assert.equal(await run(`JSON.parse(localStorage.getItem('pigcity-v1')).coins`),654321);
  assert.deepEqual(errors,[]);
  console.log('PASS: full-game versions 1–6/reloads, pre-migration backup, malformed-primary recovery, future-version protection, failed-load write lock, scheduler residual reload, manual backup, quota error, real-time autosave');
  w.destroy();
}catch(e){console.error(e);code=1;}finally{app.exit(code);}});
