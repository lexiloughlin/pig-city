// Exercise the real game in an isolated profile with network requests blocked.
const {app,BrowserWindow,session}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'pig-city-districts-')));
app.on('window-all-closed',()=>{});
app.whenReady().then(async()=>{let code=0;try{
 session.defaultSession.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*']},(_,cb)=>cb({cancel:true}));
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{backgroundThrottling:false}}),errors=[];
 w.webContents.on('console-message',(e,...a)=>{const m=e.message||a.join(' ');if(/Uncaught|draw failed|update failed|init failed/.test(m))errors.push(m);});
 await w.loadFile(path.resolve(process.argv[2]||path.join(__dirname,'../index.html')),{query:{debug:'1',paused:'1'}});
 const run=s=>w.webContents.executeJavaScript(s);
 const result=await run(`(()=>{
 const p=__pc,check=(ok,msg)=>{if(!ok)throw Error(msg)};
 const themeNames=Object.keys(DistrictIdentity.themes),hashes={},cv=document.createElement('canvas');cv.width=400;cv.height=320;const c=cv.getContext('2d');
 let rendered=0;
 for(const theme of themeNames){for(const type of ['office','townhouse','cafe','toys','market','salon','roller','hutch'])for(const lvl of [1,2,3])for(const clock of [0,110]){
  p.G.clock=clock;c.clearRect(0,0,400,320);const b={type,lvl,x:0,y:0,districtStyle:theme};p.isoBuilding(c,b,{x:200,y:230});rendered++;
  if(type==='cafe'&&lvl===1&&clock===0)hashes[theme]=cv.toDataURL();
 }}
 check(new Set(Object.values(hashes)).size===4,'Shared café has indistinguishable architecture');
 p.G.coins=1000000;p.G.clock=0;p.growCity('city');p.setView('city');
 const characters=new Set(p.hoods('city').map(p.characterOf));for(const t of themeNames)check(characters.has(t),'Missing generated district '+t);
 const styles={};for(const h of p.hoods('city')){const t=p.characterOf(h);if(t)styles[t]=(styles[t]||0)+1;}
 for(const t of themeNames){const h=p.hoods('city').find(h=>p.characterOf(h)===t),g=p.walk('city',h);check(g.spots.length,'No reachable spots in '+t);if(t==='entertainment')check(g.spots.some(s=>['music','dance'].includes(s.k)),'No evening music spots');}
 for(let rotation=0;rotation<4;rotation++){const L=p.presetLayout('popcorn',rotation),taken=new Set();
 for(const it of L.items){const n=p.sz(it.type);for(let x=it.x;x<it.x+n;x++)for(let y=it.y;y<it.y+n;y++){const key=x+','+y;check(x>=0&&y>=0&&x<L.w&&y<L.h,'Preset item outside bounds');check(!taken.has(key),'Preset overlap '+key);taken.add(key);}}}
 const h=p.hoods('city').find(h=>p.characterOf(h)==='shopping'),before=JSON.stringify(p.G.city);
 p.renderHoods();const select=document.querySelector('.hood[data-id="'+h.id+'"] .hoodcharacter');check(!!select,'Area selector missing');
 select.value='entertainment';select.dispatchEvent(new Event('change',{bubbles:true}));
 check(p.characterOf(h)==='entertainment','Character selection did not apply');check(JSON.stringify(p.G.city)===before,'Area selection rewrote buildings');
 const member=p.G.city.find(b=>b.did===h.id);check(p.buildingCharacter(member)==='entertainment','Sprite character did not invalidate');
 check(p.actWeight('music',22,false,'entertainment')>p.actWeight('music',9,false,'entertainment'),'Music schedule not active');
 check(p.busyness('shopping',13,true)>p.busyness('shopping',7,true),'Shops not daytime');
 // Manually drawn areas gain reachable activities without mutating their saved spots.
 const manual={...h,id:999999,preset:undefined,character:'residential',spots:[]};
 check(p.activitySpots('city',manual).length>0,'Manual area has no activities');check(manual.spots.length===0,'Derived spots mutated town data');
 const quarter=p.hoods('city').find(h=>h.preset==='gen_entertainment'),center=p.iso((quarter.x+quarter.w/2)*p.T,(quarter.y+quarter.h/2)*p.T);
 p.cams.city.x=center.x;p.cams.city.y=center.y;p.G.clock=130;let musicSeen=false;
 for(let i=0;i<900;i++){p.tick(1/30);for(const a of p.crowds.get(quarter.id)||[])if(['music','dance'].includes(a.act)||['music','dance'].includes(a.goAct))musicSeen=true;}
 check(musicSeen,'Evening entertainment never selected music or dancing');
 for(const h of p.hoods('city'))for(const a of p.crowds.get(h.id)||[])check(Number.isFinite(a.x)&&Number.isFinite(a.y),'Invalid crowd position');
 p.pause();p.save();p.draw();return {rendered,styles,buildings:p.G.city.length,changedHood:h.id,character:h.character,schema:p.G.schema};
 })()`);
 const done=new Promise(r=>w.webContents.once('did-finish-load',r));w.reload();await done;
 assert.equal(await run(`__pc.hoods('city').find(h=>h.id===${result.changedHood}).character`),'entertainment');
 assert.equal(await run(`__pc.G.city.length`),result.buildings);assert.equal(await run(`__pc.G.schema`),result.schema);
 if(process.argv[3]){fs.mkdirSync(process.argv[3],{recursive:true});await run(`document.getElementById('tutorial').hidden=true;__pc.setView('city');const h=__pc.hoods('city').find(h=>h.preset==='gen_entertainment');const p=__pc.iso((h.x+h.w/2)*__pc.T,(h.y+h.h/2)*__pc.T);__pc.cams.city.x=p.x;__pc.cams.city.y=p.y;__pc.cams.city.z=1.3;__pc.pause(false);__pc.renderHoods();__pc.draw()`);await new Promise(r=>setTimeout(r,200));fs.writeFileSync(path.join(process.argv[3],'pig-city-districts.png'),(await w.webContents.capturePage()).toPNG());}
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:'Architecture variants, generated identities, reachable music, preset geometry, manual areas, UI change without rebuilding, crowd simulation and save/reload',...result,errors},null,2));w.destroy();
}catch(e){console.error(e);code=1;}finally{app.exit(code);}});
