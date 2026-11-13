/* Area character is optional save data; all defaults are derived without rewriting towns. */
(function(root) {
  'use strict';
  const themes = {
    downtown: {name:'Downtown', icon:'🏙️', color:'#54788d', paving:['#d9e1e5','#cbd6dc'], accent:'#c3a45c',
      architecture:'Stone bases, glass offices and brass cornices', rhythm:'Commuter mornings · lunch plazas · quieter weekends', activity:{work:2.4,wait:1.6,coffee:1.5,shop:.7,play:.35,music:.3,dance:.2}},
    residential: {name:'Residential streets', icon:'🏡', color:'#789669', paving:['#ede8d9','#e2e7d6'], accent:'#74956c',
      architecture:'Pitched roofs, porches, flower boxes and garden paths', rhythm:'School mornings · afternoon play · evening strolls', activity:{work:.15,wait:1.1,coffee:.7,shop:.45,play:1.8,stroll:2,sit:1.5,music:.4,dance:.3}},
    shopping: {name:'Shopping district', icon:'🛍️', color:'#ba7357', paving:['#edd7c4','#e2c5b1'], accent:'#b66a4e',
      architecture:'Brick shopfronts, striped awnings and display windows', rhythm:'Late-morning shopping · busy weekend markets', activity:{work:.3,shop:2.8,coffee:1.5,eat:1.4,photo:1.2,play:.7,music:.5,dance:.3}},
    entertainment: {name:'Entertainment quarter', icon:'🎭', color:'#95649b', paving:['#dfd2e5','#cabbd9'], accent:'#ddaf65',
      architecture:'Art Deco fronts, illuminated marquees and festival lights', rhythm:'Afternoon games · evening music · late-night dancing', activity:{work:.15,shop:.8,coffee:1,eat:1.5,play:1.8,photo:1.5,music:3,dance:2.8,stroll:1.2}}
  };
  function identify(hood, preset) {
    if (!hood) return null;
    if (Object.hasOwn(themes, hood.character)) return hood.character;
    if (preset && preset.character === 'entertainment') return 'entertainment';
    return ({down:'downtown',res:'residential',com:'shopping'})[hood.zone] || null;
  }
  function busy(kind, hour, weekend) {
    if (kind === 'residential') return hour < 6 || hour >= 22 ? .04 : hour < 9 ? .65 : hour < 15 ? (weekend ? .8 : .3) : hour < 20.5 ? 1 : .45;
    if (kind === 'shopping') return hour < 9 || hour >= 21 ? .04 : hour < 11 ? .5 : hour < 18 ? (weekend ? 1.2 : .85) : .6;
    if (kind === 'entertainment') return hour < 2 ? .65 : hour < 10 ? .03 : hour < 15 ? .3 : hour < 18 ? .65 : (weekend ? 1.2 : 1);
    return null;
  }
  function weight(character, activity, hour) {
    const theme=themes[character]; if (!theme) return 1;
    let value=theme.activity[activity] ?? 1;
    if (character==='entertainment' && ['music','dance','play','eat','photo'].includes(activity) && (hour>=18 || hour<2)) value*=1.7;
    if (character==='residential' && activity==='stroll' && hour>=17 && hour<21) value*=1.5;
    return value;
  }
  function facade(character, building) {
    if (!themes[character]) return false;
    if (building.type==='townhouse') return character==='residential';
    if (character==='downtown' && ['office','finoffice'].includes(building.type)) return true;
    return ['cafe','salon','toys','store','clothes','furniture','sushi','market'].includes(building.type);
  }
  const api={themes,identify,busy,weight,facade};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DistrictIdentity=api;
})(typeof globalThis!=='undefined'?globalThis:this);
