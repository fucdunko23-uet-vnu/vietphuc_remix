const fs=require('node:fs');
const {renderCollectionIllustration}=require('./src/collection-illustrations.cjs');
const presets=require('./ai-studio-app/public/presets.json');
const file='ai-studio-app/public/index.html';
const assetDir='ai-studio-app/public/collection-art';
fs.mkdirSync(assetDir,{recursive:true});
let html=fs.readFileSync(file,'utf8');
let updated=0;
html=html.replace(/<article class="collection-card"[\s\S]*?<\/article>/g,card=>{
  const preset=card.match(/data-preset="(\d+)"/);
  if(!preset||Number(preset[1])<6)return card;
  const index=Number(preset[1]);
  if(!presets[index])throw new Error('Missing preset '+index);
  updated++;
  const svg=renderCollectionIllustration(index,presets[index]);
  fs.writeFileSync(`${assetDir}/heritage-${index}.svg`,svg);
  const label=`Minh họa ${index===17?'Áo tấc':presets[index]['Loại trang phục']} · ${presets[index]['Bối cảnh']}`;
  return card.replace(/<svg\b[\s\S]*?<\/svg>|<img\b[^>]*data-collection-art[^>]*>/,`<img data-collection-art="${index}" src="/collection-art/heritage-${index}.svg" width="480" height="560" alt="${label}" loading="lazy" decoding="async">`);
});
// Old repeated imports had accumulated prefixes, breaking title/gradient references.
let scope=0;
html=html.replace(/<svg\b[^>]*class="outfit-scene"[\s\S]*?<\/svg>/g,svg=>{
  svg=svg.replace(/(?:site-art-\d+-|collection-scope-\d+-)+/g,'');
  const prefix='collection-scope-'+scope+++'-';
  const ids=[...svg.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  for(const id of ids){
    svg=svg.replaceAll(`id="${id}"`,`id="${prefix+id}"`).replaceAll(`url(#${id})`,`url(#${prefix+id})`).replaceAll(`aria-labelledby="${id}"`,`aria-labelledby="${prefix+id}"`).replaceAll(`href="#${id}"`,`href="#${prefix+id}"`);
  }
  return svg;
});
if(updated!==12)throw new Error('Expected 12 new cards, got '+updated);
fs.writeFileSync(file,html);
console.log('Redrew 12 collection cards as lazy-loaded SVG assets; repaired original SVG titles/gradients.');
