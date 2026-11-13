// Use the actual app:// file server and preload with an isolated, silent Mac app profile.
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'pig-city-music-desktop-')));
const timeout=setTimeout(()=>{console.error('Desktop music test timed out');app.exit(1);},20000);
app.on('web-contents-created',(_,wc)=>{
 wc.setAudioMuted(true);
 wc.once('did-finish-load',async()=>{try{
  await wc.loadURL('app://pig-city/index.html?debug=1&paused=1');
  console.log('Loaded desktop game');
  const metadata=await wc.executeJavaScript(`(async()=>{const a=__pc.themeMusic.audio;if(a.error)throw Error('Initial audio error '+a.error.code+' '+a.error.message);if(a.readyState<1)await new Promise((resolve,reject)=>{a.addEventListener('loadedmetadata',resolve,{once:true});a.addEventListener('error',()=>reject(Error('Audio error '+a.error?.code+' '+a.error?.message)),{once:true});setTimeout(()=>reject(Error('Metadata wait timed out, state '+a.networkState)),8000);});return {duration:a.duration,paused:a.paused,src:a.currentSrc};})()`);
  assert(metadata.src.startsWith('app://pig-city/assets/audio/'));assert(metadata.duration>70&&metadata.duration<73);assert(metadata.paused);
  wc.sendInputEvent({type:'mouseDown',x:90,y:130,button:'left',clickCount:1});wc.sendInputEvent({type:'mouseUp',x:90,y:130,button:'left',clickCount:1});
  await new Promise(r=>setTimeout(r,1000));
  assert.equal(await wc.executeJavaScript(`__pc.themeMusic.audio.paused`),false);assert(await wc.executeJavaScript(`__pc.themeMusic.audio.currentTime>0`));
  await wc.executeJavaScript(`document.getElementById('soundBtn').click()`);assert(await wc.executeJavaScript(`__pc.themeMusic.audio.paused`));
  clearTimeout(timeout);console.log('PASS Mac app:// audio loading, AAC decoding, gesture playback and master mute');app.exit(0);
 }catch(e){clearTimeout(timeout);console.error(e);app.exit(1);}});
});
require(path.resolve(__dirname,'../electron/main.js'));
