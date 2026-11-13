const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function load(file,globals={}){const c=vm.createContext({console,Date,Math,navigator:{onLine:true,userAgent:'test'},document:{readyState:'loading',addEventListener(){}},window:{},...globals});vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js',file),'utf8'),c);return c;}
const tests=[];const test=(name,fn)=>tests.push([name,fn]);
test('Pig-need boosts depend on game time, not frame rate',()=>{
 const c=load('game-systems.js'),g=vm.runInContext('GameSystems',c);
 const run=fps=>{const p={food:90,water:90,room:{},lastRoomTime:1,needs:{hunger:10,energy:10,happiness:10,social:10}};for(let i=0;i<fps;i++)g.updatePigNeeds(p,1/fps);return p.needs};
 const a=run(30),b=run(60);for(const key of Object.keys(a))assert.ok(Math.abs(a[key]-b[key])<1e-8,`${key}: ${a[key]} vs ${b[key]}`);
 const p={food:90,water:90,room:{},lastRoomTime:1,needs:{hunger:10,energy:10,happiness:10,social:10}};g.updatePigNeeds(p,0);assert.equal(p.needs.hunger,10);
});
(async()=>{let failures=0;for(const [name,fn]of tests){try{await fn();console.log('PASS',name)}catch(e){failures++;console.error('FAIL',name,e.message)}}process.exitCode=failures?1:0;})();
