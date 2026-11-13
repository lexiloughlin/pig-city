'use strict';
const assert=require('node:assert/strict'),{create}=require('../assets/js/theme-music');
const memory=new Map(),storage={getItem:k=>memory.has(k)?memory.get(k):null,setItem:(k,v)=>memory.set(k,v)};
function audio(){return {paused:true,currentTime:17,plays:0,pauses:0,play(){this.plays++;this.paused=false;return Promise.resolve();},pause(){this.pauses++;this.paused=true;}};}
(async()=>{
 let muted=false,hidden=false;const a=audio(),m=create({audio:a,storage,isMuted:()=>muted,isHidden:()=>hidden});
 await m.sync();assert.equal(a.plays,0);assert.equal(a.loop,true);assert.equal(a.volume,.25);assert.equal(a.playbackRate,1);
 await m.activate();assert(!a.paused);await m.activate();assert.equal(a.plays,1,'Duplicate playback');
 muted=true;await m.sync();assert(a.paused);muted=false;await m.sync();assert(!a.paused);assert.equal(a.currentTime,17,'Music restarted on mute');
 hidden=true;await m.sync();assert(a.paused);hidden=false;await m.sync();assert(!a.paused);
 await m.suspend();assert(a.paused);await m.activate();assert(a.paused);await m.resume();assert(!a.paused);
 await m.setVolume(0);assert(a.paused);await m.setVolume(.4);assert(!a.paused);assert.equal(a.volume,.4);
 await m.setEnabled(false);assert(a.paused);const b=audio(),again=create({audio:b,storage});assert.equal(again.enabled,false);assert.equal(again.volume,.4);await again.activate();assert.equal(b.plays,0);
 const unavailable=audio();unavailable.play=function(){return Promise.reject(Object.assign(Error('Browser gesture required'),{name:'NotAllowedError'}));};const denied=create({audio:unavailable});assert.equal(await denied.activate(),false);assert.equal(denied.error,null);
 unavailable.play=audio().play;await denied.activate();assert(!unavailable.paused,'Autoplay block not recoverable');
 let finish;const slow=audio();slow.play=function(){this.plays++;return new Promise(r=>{finish=()=>{this.paused=false;r();};});};const race=create({audio:slow});const promise=race.activate();race.setEnabled(false);finish();await promise;assert(slow.paused,'Pending play ignored mute');assert.equal(slow.plays,1);
 const full=create({audio:audio(),storage:{getItem(){throw Error('denied');},setItem(){throw Error('quota');}}});await full.activate();await full.setVolume(.3);assert(full.playing);await full.setVolume(NaN);assert.equal(full.volume,.3);await full.setVolume(2);assert.equal(full.volume,1);
 m.dispose();await m.activate();assert(a.paused);
 console.log('PASS: gesture-only startup, one player, loop/normal speed, global/music mute, volume persistence/clamping, tab pause/resume, page lifecycle, autoplay rejection, pending-play mute race, unavailable storage and disposal');
})().catch(e=>{console.error(e);process.exitCode=1;});
