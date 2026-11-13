(function(root){
  'use strict';
  // Desktop email links can be verified inside the app without opening arbitrary URLs.
  function verificationInput(email,input,projectURL){
    const value=input.trim();
    if(/^\d{6,8}$/.test(value))return {email,token:value,type:'email'};
    let url;try{url=new URL(value);}catch(e){throw Error('Paste the sign-in link or code from your email.');}
    if(url.origin!==projectURL||url.pathname!=='/auth/v1/verify'||url.username||url.password)throw Error('Use the original Pig City sign-in link from your email. Copy it without opening it.');
    const token=url.searchParams.get('token_hash')||url.searchParams.get('token');
    const type=url.searchParams.get('type');
    if(!token||!['email','magiclink','signup'].includes(type))throw Error('That is not a Pig City email sign-in link.');
    return {token_hash:token,type};
  }
  const api={verificationInput};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PigCloudAuth=api;
})(typeof window!=='undefined'?window:globalThis);
