'use strict';
const assert=require('node:assert/strict');
const {preset,types,candidates}=require('../assets/js/vacation-island');
const sizes={resorthotel:2,casino:2,resortpool:2,showstage:2};
const occupied=new Set();for(const [type,x,y] of preset.items){assert(types.includes(type)||['salon','cafe','sushi','diner','fountain','table','coffeecart','bench','streetlamp','lantern','flowers','planter'].includes(type));for(let a=0;a<(sizes[type]||1);a++)for(let b=0;b<(sizes[type]||1);b++){const k=(x+a)+','+(y+b);assert(x+a<14&&y+b<14&&x>=0&&y>=0);assert(!occupied.has(k),'Blueprint overlap '+k);occupied.add(k);}}
const world={x0:-16,y0:-16,x1:56,y1:46};
const sites=candidates(40,30,world,(x,y)=>[5,6].includes(y)||[16,17].includes(x));
assert.equal(new Set(sites.map(s=>s.rot)).size,4);
for(const s of sites){assert.equal(s.bridge.length,2);assert.equal(Math.abs(s.bridge[0][0]-s.bridge[1][0])+Math.abs(s.bridge[0][1]-s.bridge[1][1]),1);assert(s.x>=world.x0&&s.y>=world.y0&&s.x+s.w<=world.x1&&s.y+s.h<=world.y1);}
assert.equal(candidates(40,30,world,()=>false).length,0);
assert(preset.spots.some(s=>s[0]==='swim'));assert(preset.spots.some(s=>s[0]==='stay'));assert(preset.spots.some(s=>s[0]==='music'));
console.log('PASS resort blueprint has no overlapping buildings, all four island orientations fit world bounds, bridge geometry and daytime/evening activities');
