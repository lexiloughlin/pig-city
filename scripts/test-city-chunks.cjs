const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const html = fs.readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8');
new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
const source = html.slice(html.indexOf('  const cityChunks ='), html.indexOf('  function camHome(v)'));
const context = vm.createContext({T:40,HW:32,HH:16,cityChunkRevision:0,roadVer:0,view:'city',sz:b=>b==='big'?4:1,htOf:b=>b.height||100,iso:(x,y)=>({x:(x-y)*.8,y:(x+y)*.4}),viewRect:()=>({x0:-200,x1:200,y0:-200,y1:200})});
vm.runInContext(source, context);
context.list = Array.from({length:10000},(_,i)=>({x:i%100-50,y:Math.floor(i/100)-50,type:i%7?'small':'big',height:i%13?100:800}));
vm.runInContext(`
for (let i=0;i<200;i++) {
 const R={x0:(i%20-10)*150,y0:(Math.floor(i/20)-5)*180};R.x1=R.x0+500;R.y1=R.y0+400;
 const candidates=new Set(chunkBuildings(list,R));
 for(const b of list){const n=sz(b.type),o=iso(b.x*T,b.y*T);if(o.x+n*HW+40>R.x0&&o.x-n*HW-40<R.x1&&o.y+2*n*HH+30>R.y0&&o.y-htOf(b)-120<R.y1&&!candidates.has(b))throw Error('Missed visible building');}
}
const R={x0:-200,x1:200,y0:-200,y1:200};
list[0].x=0;list[0].y=0;cityChunkRevision++;if(!chunkBuildings(list,R).includes(list[0]))throw Error('Move invalidation');
list.push({x:0,y:0,type:'small'});if(!chunkBuildings(list,R).includes(list.at(-1)))throw Error('Add invalidation');
let h={x:1000,y:1000,w:6,h:6},sum=0;
for(let i=0;i<100;i++)sum+=districtStep('city',h,.01);
view='home';sum+=districtStep('home',h,.01); // still distant
view='city';h.x=0;h.y=0;sum+=districtStep('city',h,.01);
if(Math.abs(sum-1.02)>1e-9)throw Error('Lost accumulated game time');
`, context);
console.log('PASS: parse, 200 viewport comparisons over 10,000 buildings, tall/negative/chunk boundaries, move/add invalidation, distant time accumulation and reactivation');
