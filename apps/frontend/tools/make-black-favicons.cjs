const Jimp = require('jimp');
const fs = require('fs');
(async ()=>{
  try{
    const src = 'dist/logo.png';
    if(!fs.existsSync(src)) throw new Error('source not found: '+src);
    const img = await Jimp.read(src);
    // Resize to 32 and 16 and convert to black silhouette using luminance -> threshold
    const make = async (size,path)=>{
      const clone = img.clone();
      clone.resize(size,size,Jimp.RESIZE_BILINEAR);
      // Convert to grayscale then invert to make shapes black on transparent background
      clone.greyscale();
      // Threshold to create a solid shape
      clone.scan(0,0,clone.bitmap.width,clone.bitmap.height,function(x,y,idx){
        const r=this.bitmap.data[idx+0];
        // r is grayscale now
        const v = r>128?255:0; // bright -> white, dark -> black
        // we want black silhouette on transparent: set alpha based on brightness
        this.bitmap.data[idx+0]=0; this.bitmap.data[idx+1]=0; this.bitmap.data[idx+2]=0;
        // set alpha: white areas -> alpha 0, black areas -> alpha 255
        this.bitmap.data[idx+3]= (v===0)?255:0;
      });
      await clone.writeAsync(path);
    };
    await make(32,'public/favicon-32.png');
    await make(16,'public/favicon-16.png');
    console.log('BLACK_PNG_OK');
  } catch(err){
    console.error('ERR',err && err.stack?err.stack:err);
    process.exit(1);
  }
})();
