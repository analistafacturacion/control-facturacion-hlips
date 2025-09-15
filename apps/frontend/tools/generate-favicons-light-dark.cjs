const fs = require('fs');
(async ()=>{
  try{
    let pngToIco;
    try { pngToIco = require('png-to-ico'); } catch(e){ pngToIco = null }
    if(!pngToIco) throw new Error('png-to-ico not installed');
    const fn = (typeof pngToIco === 'function') ? pngToIco : (pngToIco.default || pngToIco.pngToIco);
    if(!fn) throw new Error('png-to-ico function not found in module');
    // create dark ico
    const darkBuf = await fn(['public/favicon-dark-32.png','public/favicon-dark-16.png']);
    fs.writeFileSync('public/favicon-dark.ico',darkBuf);
    // create light ico
    const lightBuf = await fn(['public/favicon-light-32.png','public/favicon-light-16.png']);
    fs.writeFileSync('public/favicon-light.ico',lightBuf);
    console.log('FAVICON_LIGHT_DARK_OK');
  }catch(err){
    console.error('ERR',err && err.stack?err.stack:err);
    process.exit(1);
  }
})();
