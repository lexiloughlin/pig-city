'use strict';
const CLOUD_ORIGIN='https://mrbmybiwxayhhneixdgc.supabase.co';
function allowCloudURL(value){
  try{const url=new URL(value);return url.origin===CLOUD_ORIGIN&&!url.username&&!url.password&&/^\/(auth|rest)\/v1\//.test(url.pathname);}
  catch(e){return false;}
}
module.exports={CLOUD_ORIGIN,allowCloudURL};
