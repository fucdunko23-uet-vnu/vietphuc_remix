const fs=require('node:fs');
const file='ai-studio-app/public/index.html';
let html=fs.readFileSync(file,'utf8');let index=0;
html=html.replace(/<svg[\s\S]*?<\/svg>/g,svg=>{const prefix='site-art-'+(++index)+'-';const ids=[...svg.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);for(const id of ids){svg=svg.replaceAll('id="'+id+'"','id="'+prefix+id+'"').replaceAll('#'+id+')','#'+prefix+id+')').replaceAll('href="#'+id+'"','href="#'+prefix+id+'"');}return svg;});
fs.writeFileSync(file,html);
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);const duplicates=ids.filter((x,i)=>ids.indexOf(x)!==i);if(duplicates.length)throw new Error('Duplicate ids: '+duplicates.join(','));console.log('All document and SVG IDs are unique.');
