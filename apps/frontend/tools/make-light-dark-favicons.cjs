const Jimp = require('jimp');
const fs = require('fs');
(async ()=>{
  try{
    const src = 'dist/logo.png';
    if(!fs.existsSync(src)) throw new Error('source not found: '+src);
    const img = await Jimp.read(src);
    const make = async (size,path,isLight)=>{
      const clone = img.clone();
      clone.resize(size,size,Jimp.RESIZE_BILINEAR);
      clone.greyscale();
      clone.scan(0,0,clone.bitmap.width,clone.bitmap.height,function(x,y,idx){
        const r=this.bitmap.data[idx+0];
        // r = 0..255
        let alpha;
        if(isLight){
          // want white silhouette (for dark backgrounds): white pixels opaque, background transparent
          alpha = r<200?255:0; // darker shapes become opaque (white)
          this.bitmap.data[idx+0]=255; this.bitmap.data[idx+1]=255; this.bitmap.data[idx+2]=255;
        } else {
          // want black silhouette (for light backgrounds): dark pixels opaque
          alpha = r>128?0:255;
          this.bitmap.data[idx+0]=0; this.bitmap.data[idx+1]=0; this.bitmap.data[idx+2]=0;
        }
        this.bitmap.data[idx+3]=alpha;
      });
      await clone.writeAsync(path);
    };
    await make(32,'public/favicon-dark-32.png',false);
    await make(16,'public/favicon-dark-16.png',false);
    await make(32,'public/favicon-light-32.png',true);
    await make(16,'public/favicon-light-16.png',true);
    console.log('LIGHT_DARK_PNG_OK');
  } catch(err){
    console.error('ERR',err && err.stack?err.stack:err);
    process.exit(1);
  }
})();
