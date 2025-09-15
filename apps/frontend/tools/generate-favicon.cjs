const fs = require('fs');
(async ()=>{
  try {
    let pngToIco;
    try { pngToIco = require('png-to-ico'); } catch (e) { pngToIco = null; }
    if (!pngToIco) throw new Error('png-to-ico not found');
    const fn = (typeof pngToIco === 'function') ? pngToIco : (pngToIco.default || pngToIco.pngToIco);
    if (!fn) throw new Error('png-to-ico function not found in module');
    const buf = await fn('public/favicon-32.png');
    fs.writeFileSync('public/favicon.ico', buf);
    console.log('OK');
  } catch (err) {
    console.error('ERR', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
