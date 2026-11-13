const {app,BrowserWindow,session}=require('electron');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'pig-city-vacation-')));app.on('window-all-closed',()=>{});
app.whenReady().then(async()=>{let code=0;try{
 session.defaultSession.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*']},(_,cb)=>cb({cancel:true}));
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{backgroundThrottling:false}}),errors=[];
 w.webContents.on('console-message',(e,...a)=>{const m=e.message||a.join(' ');if(/Uncaught|draw failed|update failed|init failed/.test(m))errors.push(m);});
 await w.loadFile(path.resolve(process.argv[2]||path.join(__dirname,'../index.html')),{query:{debug:'1',paused:'1'}});
 const run=s=>w.webContents.executeJavaScript(s);
 const result=await run(`(()=>{
  const p=__pc,check=(ok,msg)=>{if(!ok)throw Error(msg)},site=p.planVacationIsland();check(site,'No island site');
  const before=JSON.stringify(p.G);try{p.buildVacationIsland(site);throw Error('Insufficient funds accepted');}catch(e){check(/need/.test(e.message),'Wrong insufficient-funds error');}check(JSON.stringify(p.G)===before,'Failed build changed town');
  const blocked={...site,x:0};check(!p.vacationSiteOK(blocked),'Mainland accepted');
  p.G.islands.city.push({...site,id:-1,name:'Existing island'});check(!p.vacationSiteOK(site),'Existing island overwritten');check(p.planVacationIsland(),'No alternative site around an existing island');p.G.islands.city.pop();
  const oldHomes=JSON.stringify(p.G.buildings),oldCity=JSON.stringify(p.G.city),pigs=p.G.pigs.length;
  p.G.coins=100000;const cost=p.vacationCost(site),island=p.buildVacationIsland(site,'Wheek Vegas');
  check(p.G.coins===100000-cost,'Wrong island charge');check(JSON.stringify(p.G.buildings)===oldHomes,'Home town changed');check(JSON.stringify(p.G.city.slice(0,JSON.parse(oldCity).length))===oldCity,'Existing city buildings changed');
  check(p.G.pigs.length===pigs,'Resort guests became residents');check(JSON.parse(localStorage.getItem('pigcity-manual-backup')).islands.city.length===0,'Pre-build backup missing');
  const h=p.hoods('city').find(h=>h.island===island.id);check(h.preset==='vacation','Resort schedule missing');check(p.districtProfile(h).kind==='vacation','Resort schedule overridden');
  p.goIsland('city',island);p.renderHoods();check([...document.querySelectorAll('.vtab.isle')].some(t=>t.textContent.includes('Wheek Vegas')),'No island tab');
  const g=p.walk('city',h);for(const k of ['stay','swim','music','dance','play'])check(g.spots.some(s=>s.k===k),'No reachable '+k+' activity');
  const types=VacationIsland.types;let rendered=0;const cv=document.createElement('canvas');cv.width=600;cv.height=500;const c=cv.getContext('2d');
  for(const type of types)for(const lvl of [1,2,3])for(const clock of [0,140]){p.G.clock=clock;c.clearRect(0,0,600,500);p.isoBuilding(c,{type,lvl,x:0,y:0},{x:300,y:330});rendered++;}
  for(let rot=0;rot<4;rot++){const L=p.presetLayout('vacation',rot),used=new Set();for(const it of L.items){const n=p.sz(it.type);for(let x=it.x;x<it.x+n;x++)for(let y=it.y;y<it.y+n;y++){const k=x+','+y;check(x>=0&&y>=0&&x<L.w&&y<L.h&&!used.has(k),'Rotated resort layout collision');used.add(k);}}}
  const hotel=p.G.city.find(b=>b.did===h.id&&b.type==='resorthotel'),parking=p.parkSpot(hotel,0);
  check(parking.x>=island.x*p.T&&parking.x<(island.x+14)*p.T,'Employee parks on mainland');
  check(p.roadRoute('city',{x:20,y:220},parking),'No drivable route across bridge');
  const first=p.G.pigs[0],casino=p.G.city.find(b=>b.did===h.id&&b.type==='casino');p.hire(first,casino,true);check(first.leaveH===14&&first.backH===23.9,'Casino shift not set');const office=p.G.city.find(b=>b.type==='office');p.hire(first,office,true);check(!first.resortShift&&first.leaveH<9,'Resort shift leaked into office job');
  // Staff every venue with temporary debug pigs to test customer revenue and wages.
  for(const b of p.G.city.filter(b=>b.did===h.id&&['resorthotel','casino','resortpool','showstage'].includes(b.type))){const base=JSON.parse(JSON.stringify(p.G.pigs[0]));base.id=1000+p.G.pigs.length;base.name='Resort Staff '+base.id;delete base.trackingId;base.loc='city';base.trip=null;base.job={map:'city',x:b.x,y:b.y,slot:0};base.x=(b.x+1)*p.T;base.y=(b.y+2)*p.T+7;base.tx=base.x;base.ty=base.y;base.leaveH=1;base.backH=23.9;base.workT=0;p.G.pigs.push(base);}
  p.G.hay=p.G.water=p.G.veg=10000;p.G.clock=140;let activity=false;
  for(let i=0;i<1500;i++){p.tick(1/30);for(const a of p.crowds.get(h.id)||[])if(['music','dance','play','stay'].includes(a.act)||['music','dance','play','stay'].includes(a.goAct))activity=true;}
  check(activity,'No vacation activities selected');check(p.G.city.some(b=>b.did===h.id&&(b.cust||0)>0),'Staffed venues earned no customer revenue');check(p.G.stats.jobPay>0,'Resort employees earned no wages');
  const snapshot=JSON.stringify(p.G);try{p.buildVacationIsland(site);throw Error('Duplicate accepted');}catch(e){check(/already exists/.test(e.message),'Wrong duplicate error');}check(JSON.stringify(p.G)===snapshot,'Duplicate build changed town');
  p.save();p.draw();return {id:island.id,cost,buildings:p.G.city.filter(b=>b.did===h.id).length,rendered,schema:p.G.schema,visitors:(p.crowds.get(h.id)||[]).length,revenue:p.G.city.filter(b=>b.did===h.id).reduce((s,b)=>s+(b.rev||0),0)};
 })()`);
 const done=new Promise(r=>w.webContents.once('did-finish-load',r));w.reload();await done;
 assert.equal(await run(`__pc.G.islands.city.find(i=>i.id===${result.id}).name`),'Wheek Vegas');assert.equal(await run(`__pc.G.schema`),6);
 assert.equal(await run(`__pc.G.city.filter(b=>b.did===__pc.hoods('city').find(h=>h.island===${result.id}).id).length`),result.buildings);
 // The build button visits the existing destination instead of buying a second island.
 await run(`document.getElementById('tutorial').hidden=true;document.getElementById('vacationBtn').click();__pc.renderHoods();__pc.draw()`);
 assert.equal(await run(`__pc.G.islands.city.filter(i=>i.kind==='vacation').length`),1);
 if(process.argv[3]){fs.mkdirSync(process.argv[3],{recursive:true});await run(`document.getElementById('pauseBtn').click();__pc.G.clock=40;__pc.tick(1/30,600);__pc.draw()`);await new Promise(r=>setTimeout(r,150));fs.writeFileSync(path.join(process.argv[3],'wheek-vegas-day.png'),(await w.webContents.capturePage()).toPNG());await run(`__pc.G.clock=145;__pc.tick(1/30,300);__pc.draw()`);await new Promise(r=>setTimeout(r,150));fs.writeFileSync(path.join(process.argv[3],'wheek-vegas-night.png'),(await w.webContents.capturePage()).toPNG());}
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:'Atomic island creation/cost, backup, unchanged existing town, bridge/employee routes, reachable activities, staffed revenue/wages, all rotations/art levels, duplicate prevention and reload',...result,errors},null,2));w.destroy();
}catch(e){console.error(e);code=1;}finally{app.exit(code);}});
