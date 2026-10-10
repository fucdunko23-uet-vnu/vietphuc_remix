// Extract existing artwork verbatim: same SVG pixels, much smaller page DOM.
const fs=require('node:fs');
const file='ai-studio-app/public/index.html',folder='ai-studio-app/public/collection-art';
fs.mkdirSync(folder,{recursive:true});
let count=0;
const html=fs.readFileSync(file,'utf8').replace(/<svg\b[^>]*class="outfit-scene"[\s\S]*?<\/svg>/g,svg=>{
  const index=count++;
  fs.writeFileSync(`${folder}/original-${index}.svg`,svg);
  const title=svg.match(/<title[^>]*>([^<]*)<\/title>/)?.[1]||'Minh họa bản phối Việt phục';
  return `<img class="outfit-scene" data-original-art="${index}" src="/collection-art/original-${index}.svg" width="480" height="560" alt="${title.replaceAll('"','&quot;')}" loading="lazy" decoding="async" style="display:block;width:100%;height:auto;overflow:hidden">`;
});
fs.writeFileSync(file,html);
console.log('Extracted '+count+' original SVGs without modifying their artwork.');
