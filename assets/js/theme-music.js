/* One looping, real-time theme track. Preferences are device settings, never town-save fields. */
(function(root){
 'use strict';
 function create({audio,storage,isMuted=()=>false,isHidden=()=>false}){
  function read(key,fallback){try{const value=storage&&storage.getItem(key);return value===null||value===undefined?fallback:value;}catch(e){return fallback;}}
  function write(key,value){try{if(storage)storage.setItem(key,value);}catch(e){/* music still works when device storage is full */}}
  let enabled=read('pigcity-music-muted','0')!=='1',volume=Number(read('pigcity-music-volume','0.25'));
  if(!Number.isFinite(volume))volume=.25;volume=Math.max(0,Math.min(1,volume));
  let activated=false,pending=null,revision=0,error=null,disposed=false,suspended=false;
  audio.loop=true;audio.preload='metadata';audio.volume=volume;audio.playbackRate=1;
  function wanted(){return !disposed&&!suspended&&activated&&enabled&&!isMuted()&&!isHidden()&&volume>0;}
  function run(){
   if(!wanted()){audio.pause();return Promise.resolve(false);}
   if(pending)return pending;
   if(!audio.paused)return Promise.resolve(true);
   const started=revision;
   try{
    pending=Promise.resolve(audio.play()).then(()=>{error=null;if(!wanted())audio.pause();return !audio.paused;})
     .catch(e=>{if(!['NotAllowedError','AbortError'].includes(e.name))error=e.message||'Music could not play';return false;})
     .finally(()=>{pending=null;if(revision!==started&&wanted()&&audio.paused)run();});
    return pending;
   }catch(e){error=e.message||'Music could not play';return Promise.resolve(false);}
  }
  const api={
   activate(){activated=true;return api.sync();},
   sync(){revision++;return run();},
   setEnabled(value){enabled=!!value;write('pigcity-music-muted',enabled?'0':'1');return api.sync();},
   setVolume(value){value=Number(value);if(!Number.isFinite(value))return;volume=Math.max(0,Math.min(1,value));audio.volume=volume;write('pigcity-music-volume',String(volume));return api.sync();},
   suspend(){suspended=true;return api.sync();},
   resume(){suspended=false;return api.sync();},
   dispose(){disposed=true;revision++;audio.pause();},
   get enabled(){return enabled;},get volume(){return volume;},get error(){return error;},
   get playing(){return !audio.paused;},get audio(){return audio;}
  };
  return api;
 }
 const api={create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PigThemeMusic=api;
})(typeof globalThis!=='undefined'?globalThis:this);
