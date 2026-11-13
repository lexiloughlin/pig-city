// Run with: npx electron scripts/test-building-rendering.cjs [path/to/debug-enabled/index.html]
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
   const p=__pc, oldCity=p.G.city, failures=[]; let checked=0;
   p.setView('city');p.cams.city.z=1;
   for(const [type,def] of Object.entries(p.B)) {
    if(def.park||def.district)continue;
    for(const lvl of [1,2,3]) {
     const b={type,lvl,x:9,y:6,t:0,map:'city'};p.G.city=[b];const pos=p.iso(9*p.T,6*p.T);p.cams.city.x=pos.x;p.cams.city.y=pos.y;
     try{p.draw();p.select(b);checked++;}catch(e){failures.push({type,lvl,error:e.message});}
    }
   }
   p.G.city=oldCity;p.setView('home');
   const home=p.G.buildings.find(b=>b.type==='hutch');
   for(const lvl of [1,2,3]){home.lvl=lvl;try{p.goInside(home);p.tick(.016,20);p.draw();p.setView('home');checked++;}catch(e){failures.push({type:'home-interior',lvl,error:e.message});}}
   if(failures.length)throw Error(JSON.stringify(failures));return {checked};
  })()`);
  if(errors.length)throw Error(errors.join('\n'));
  console.log(JSON.stringify({result,errors},null,2));w.destroy();
 }catch(e){console.error(e);process.exitCode=1;}
 finally{app.exit(process.exitCode || 0);}
});
