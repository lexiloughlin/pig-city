/* Fixed resort blueprint and deterministic siting. All coordinates are tile coordinates. */
(function(root){
 'use strict';
 const types=['resorthotel','casino','resortpool','showstage','palm','resortsign'];
 const preset={name:'Wheek Vegas',ic:'🌴',map:'city',zone:'com',character:'entertainment',kind:'vacation',islandOnly:true,crowd:18,w:14,h:14,
  inspo:'a neon resort strip, poolside afternoons and Las Vegas show nights',
  blurb:'two resort hotels, two casino arcades, a pool, a show stage, restaurants and a palm-lined promenade',
  roads:[[0,7,14,1]],paths:[[0,3,14,1],[0,6,14,1],[0,8,14,1],[6,0,1,7],[4,9,6,5]],xwalks:[[6,7]],
  items:[['resortsign',0,4],['resorthotel',1,1],['resorthotel',10,1],['casino',1,4],['casino',10,4],
   ['salon',4,5],['cafe',9,5],['resortpool',1,9],['showstage',10,9],['sushi',4,9],['diner',8,9],['fountain',6,10],
   ['table',5,11],['table',8,11],['coffeecart',7,13],['bench',4,12],['bench',9,12],
   ['palm',0,2],['palm',4,1],['palm',8,1],['palm',13,2],['palm',0,5],['palm',13,5],['palm',0,9],['palm',0,12],['palm',3,12],['palm',10,13],['palm',13,9],['palm',13,12],
   ['streetlamp',5,5],['streetlamp',8,5],['lantern',3,9],['lantern',9,10],['lantern',5,13],['flowers',2,12],['planter',8,13]],
  spots:[['stay',2,3.25],['stay',11,3.25],['play',2,6.2],['play',11,6.2],['coffee',9.5,6.2],['shop',4.5,6.2],
   ['swim',2,8.65],['sunbathe',3.5,10.5],['eat',4.5,8.6],['eat',8.5,8.6],['music',9.5,9.5],['dance',9.5,10.5],
   ['photo',6.5,11.5],['stroll',5.5,12.5],['sit',4.5,12.5],['coffee',7.5,12.5]],
  conns:[['W',7,'road'],['E',7,'road'],['W',6,'path'],['E',6,'path'],['W',8,'path'],['E',8,'path']]};
 function candidates(cols,rows,world,roadAt){
  const sites=[];
  // The blueprint's west entrance rotates with the land. Every bridge is exactly two tiles.
  for(let y=0;y<rows;y++)if(roadAt(cols-1,y))sites.push({x:cols+2,y:y-7,w:14,h:14,rot:0,bridge:[[cols,y],[cols+1,y]]});
  for(let x=0;x<cols;x++)if(roadAt(x,rows-1))sites.push({x:x-6,y:rows+2,w:14,h:14,rot:1,bridge:[[x,rows],[x,rows+1]]});
  for(let x=0;x<cols;x++)if(roadAt(x,0))sites.push({x:x-7,y:-16,w:14,h:14,rot:3,bridge:[[x,-2],[x,-1]]});
  for(let y=0;y<rows;y++)if(roadAt(0,y))sites.push({x:-16,y:y-6,w:14,h:14,rot:2,bridge:[[-2,y],[-1,y]]});
  return sites.filter(s=>s.x>=world.x0&&s.y>=world.y0&&s.x+s.w<=world.x1&&s.y+s.h<=world.y1);
 }
 const api={types,preset,candidates};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VacationIsland=api;
})(typeof globalThis!=='undefined'?globalThis:this);
