// A small, player-facing way to inspect and export the recorded history.
(function(){
  const T=window.pigTown,tracker=T&&T.tracking;if(!tracker)return;
  const button=document.getElementById('gameplayBtn'),status=document.getElementById('gameplayStatus'),input=document.getElementById('gameplayImport');
  async function render(){
    try{const s=await tracker.status();status.textContent=s.mode==='read-only'?'Tracking paused for this newer save.':s.error?'Tracking needs attention: '+s.error:s.mode==='cloud'?`${s.events} records saved on this device · ${s.pending} waiting to sync`:`${s.events} records saved on this device · works offline`;}
    catch(e){status.textContent='Tracking needs attention: '+e.message;}
  }
  button.addEventListener('click',async()=>{
    try{
      const s=await tracker.status();
      if(!await T.askYes(`${s.events} gameplay records are saved on this device. Export the complete history for analysis or transfer to another device? Your town save stays separate.`, 'Export data'))return;
      const data=await tracker.exportData(),text=JSON.stringify(data,null,2),name='Pig City gameplay '+new Date().toISOString().slice(0,10)+'.json';
      if(window.pigDesktop&&window.pigDesktop.exportGameplay){const result=await window.pigDesktop.exportGameplay(name,text);if(result.error)throw Error(result.error);}
      else{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'application/json'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000);}
    }catch(e){await T.tellBox('Could not export gameplay data: '+e.message);}
  });
  document.getElementById('gameplayImportBtn').addEventListener('click',()=>{input.value='';input.click();});
  input.addEventListener('change',async()=>{
    const file=input.files&&input.files[0];if(!file)return;
    try{if(file.size>100*1024*1024)throw Error('That file is too large.');const data=JSON.parse(await file.text());
      if(!await T.askYes('Add this gameplay history to the current town? Previously imported records will be skipped.', 'Import data'))return;
      await tracker.importData(data);await tracker.sync();await render();T.toast('Gameplay history imported. Existing records were kept.');
    }catch(e){await T.tellBox('Could not import gameplay data: '+e.message);}
  });
  setInterval(()=>{tracker.sync();render();},15000);
  addEventListener('online',()=>tracker.sync());
  render();
})();
