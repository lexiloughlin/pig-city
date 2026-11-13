// Run with: npx electron scripts/benchmark-city.cjs [path/to/debug-enabled/index.html]
// A disposable profile and blocked network keep real saves and accounts untouched.
const {app,BrowserWindow,session}=require('electron');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'pig-city-test-'));
app.setPath('userData',profile);app.on('window-all-closed',()=>{});
app.whenReady().then(async()=>{
 try {
  session.defaultSession.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*']},(d,cb)=>cb({cancel:true}));
  const w=new BrowserWindow({show:false,width:1280,height:900,webPreferences:{backgroundThrottling:false}});
  const errors=[];w.webContents.on('console-message',(e,...args)=>{const msg=e.message||args.join(' ');if(/Uncaught|draw failed|update failed/.test(msg))errors.push(msg);});
  await w.loadFile(path.resolve(process.argv[2]||path.join(__dirname,'../index.html')),{query:{debug:'1'}});
  const result=await w.webContents.executeJavaScript(`(async()=>{
   await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
   const p=__pc;p.G.coins=1000000;p.growCity('city');p.setView('city');const samples=[];
   for(const z of [.5,2.4]){p.cams.city.z=z;for(let i=0;i<10;i++)p.draw();const a=performance.now();for(let i=0;i<100;i++)p.draw();const drawMs=(performance.now()-a)/100;const b=performance.now();p.tick(.016,300);samples.push({zoom:z,drawMs,tickMs:(performance.now()-b)/300,buildings:p.G.city.length});}
   p.startStreet();p.streetTick(.016);if(document.getElementById('zStreet').getAttribute('aria-pressed')!=='true')throw Error('Street view failed');p.draw();p.stopStreet();
   p.setBuilder(true);p.draw();p.setBuilder(false);
   for(const [label,fn] of [['interior',()=>{p.goInside(p.G.buildings.find(b=>b.type==='hutch'));p.draw();}],['home',()=>{p.setView('home');p.draw();}],['park',()=>{p.setView('park');p.draw();}],['dash',()=>p.setView('dash')]]){try{fn();}catch(e){throw Error(label+': '+e.stack);}}p.setView('home');
   p.save();const saved=JSON.parse(localStorage.getItem('pigcity-v1'));if(saved.schema!==p.G.schema)throw Error('Save schema mismatch');return {samples,schema:saved.schema,pigs:saved.pigs.length};
  })()`);
  const loaded=new Promise(r=>w.webContents.once('did-finish-load',r));w.reload();await loaded;
  const reload=await w.webContents.executeJavaScript(`({buildings:__pc.G.city.length,schema:__pc.G.schema,pigs:__pc.G.pigs.length})`);
  if(reload.buildings!==result.samples[0].buildings||reload.schema!==result.schema||reload.pigs!==result.pigs)throw Error('Save reload mismatch');
  if(errors.length)throw Error(errors.join('\n'));
  console.log(JSON.stringify({result,reload,errors},null,2));w.destroy();
 }catch(e){console.error(e);process.exitCode=1;}
 finally{app.exit(process.exitCode || 0);}
});
