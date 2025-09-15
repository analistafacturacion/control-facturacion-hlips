const fs = require('fs');
const Jimp = require('jimp');
async function writeSVG(path, color){
  const svg = `<?xml version="1.0" encoding="utf-8"?>\n<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>\n  <rect width='64' height='64' fill='transparent'/>\n  <polygon points='32,8 56,52 8,52' fill='${color}' />\n</svg>`;
  fs.writeFileSync(path, svg);
}

function pointInTriangle(px,py, ax,ay, bx,by, cx,cy){
  const v0x = cx-ax, v0y = cy-ay;
  const v1x = bx-ax, v1y = by-ay;
  const v2x = px-ax, v2y = py-ay;
  const dot00 = v0x*v0x + v0y*v0y;
  const dot01 = v0x*v1x + v0y*v1y;
  const dot02 = v0x*v2x + v0y*v2y;
  const dot11 = v1x*v1x + v1y*v1y;
  const dot12 = v1x*v2x + v1y*v2y;
  const invDenom = 1/ (dot00 * dot11 - dot01 * dot01);
  const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
  const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
  return (u >= 0) && (v >= 0) && (u + v < 1);
}

async function makePNG(size, path, color){
  const image = await new Jimp(size, size, 0x00000000);
  // triangle coordinates in pixel space (centered)
  const ax = size/2, ay = size*0.125;
  const bx = size*0.875, by = size*0.85;
  const cx = size*0.125, cy = size*0.85;
  const hexColor = (color === 'white')? 0xFFFFFFFF : 0x000000FF;
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      if(pointInTriangle(x+0.5,y+0.5,ax,ay,bx,by,cx,cy)){
        image.setPixelColor(hexColor, x, y);
      }
    }
  }
  await image.writeAsync(path);
}

async function createAll(){
  try{
    // SVGs
    await writeSVG('public/favicon-triangle-dark.svg','#000000');
    await writeSVG('public/favicon-triangle-light.svg','#FFFFFF');
    // PNGs
    await makePNG(32,'public/favicon-triangle-dark-32.png','black');
    await makePNG(16,'public/favicon-triangle-dark-16.png','black');
    await makePNG(32,'public/favicon-triangle-light-32.png','white');
    await makePNG(16,'public/favicon-triangle-light-16.png','white');
    // ICOs via png-to-ico
    let pngToIco;
    try { pngToIco = require('png-to-ico'); } catch(e){ pngToIco = null }
    if(!pngToIco) {
      console.log('png-to-ico not installed, skipping ICO generation');
      return;
    }
    const fn = (typeof pngToIco === 'function')? pngToIco : (pngToIco.default || pngToIco.pngToIco);
    if(!fn){ console.log('png-to-ico function not found, skipping ICO'); return; }
    const darkBuf = await fn(['public/favicon-triangle-dark-32.png','public/favicon-triangle-dark-16.png']);
    fs.writeFileSync('public/favicon-triangle-dark.ico', darkBuf);
    const lightBuf = await fn(['public/favicon-triangle-light-32.png','public/favicon-triangle-light-16.png']);
    fs.writeFileSync('public/favicon-triangle-light.ico', lightBuf);
    console.log('TRIANGLE_FAVICONS_OK');
  }catch(err){
    console.error(err && err.stack? err.stack : err);
    process.exit(1);
  }
}

createAll();
