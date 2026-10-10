const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, 'ai-studio-app');
const read = name => fs.readFileSync(path.join(__dirname, 'src', name), 'utf8');
const moduleSource = `// Generated from the verified n8n styling rules; no secrets or photos.\nfunction prepareSelections($input){\n${read('prepare.js')}\n}\nasync function preparePhoto($input){\nfunction prepareSelections(){return baseSelections($input);}\n${read('tryon-prepare.js')}\n}\nconst baseSelections=prepareSelections;\n${read('illustrations.js')}\nmodule.exports={prepareSelections,preparePhoto,renderOutfitScene};\n`;
fs.writeFileSync(path.join(root, 'styling.cjs'), moduleSource);
console.log('AI Studio app styling module built.');
