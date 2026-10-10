// Verify the exact staged tree without printing credentials or file contents.
const fs=require('node:fs'),cp=require('node:child_process'),assert=require('node:assert/strict');
const git=(...args)=>cp.execFileSync('git',args,{maxBuffer:30*1024*1024});
const paths=git('ls-files','-z').toString('utf8').split('\0').filter(Boolean);
const configPath='D:/n8n/flow-automation/worker-config.json';
const secrets=[];
if(fs.existsSync(configPath))secrets.push(JSON.parse(fs.readFileSync(configPath,'utf8')).workerToken);
const key=require('../local-google-key.cjs').loadLocalGoogleKey();if(key)secrets.push(key);
const findings=[];let total=0,max=0,textCount=0;
for(const path of paths){
 const data=git('show',':'+path);total+=data.length;max=Math.max(max,data.length);
 if(data.length>50*1024*1024)findings.push({path,reason:'Large file'});
 if(data.includes(0))continue;
 textCount++;
 const text=data.toString('utf8');
 if(secrets.filter(Boolean).some(s=>text.includes(s)))findings.push({path,reason:'Known local credential'});
 for(const [reason,re]of [
  ['Google API key',/AIza[0-9A-Za-z_-]{30,}/g],
  ['GitHub token',/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})/g],
  ['Private key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ['Google OAuth credential',/\bya29\.[A-Za-z0-9_-]{30,}/g],
  ['Literal worker secret',/\b(?:workerToken|FLOW_WORKER_TOKEN)["']?\s*[:=]\s*["']([A-Za-z0-9_-]{32,})["']/g]
 ]){
  for(const match of text.matchAll(re)){
   if(match[1]&&/REPLACE_|THAY_|EXAMPLE/i.test(match[1]))continue;
   findings.push({path,line:text.slice(0,match.index).split('\n').length,reason});
  }
 }
}
const mustIgnore=['.env','ai-studio-app/.env','worker-config.json','worker-config.production.json','client_secret_google.json','flow-browser/Default/Cookies','output/try-on.png','test-assets/flow-tryon-1.png','node_modules/pkg/index.js','.venv/pyvenv.cfg'];
for(const p of mustIgnore){try{git('check-ignore','--quiet',p);}catch{findings.push({path:p,reason:'Expected ignore missing'});}}
for(const p of ['README.md','.gitignore','.gitattributes','worker-config.example.json','ai-studio-app/.env.example','ai-studio-app/public/music.js','ai-studio-app/public/audio/thu-do.mp3','test-assets/flow-fictional-person.jpg'])assert(paths.includes(p),'Required source missing: '+p);
const readme=git('show',':README.md').toString('utf8');
for(const m of readme.matchAll(/\]\(([^)]+)\)/g))if(!/^https?:/.test(m[1]))assert(fs.existsSync(m[1]),'Broken README link: '+m[1]);
console.log(JSON.stringify({files:paths.length,textFiles:textCount,totalMiB:Math.round(total/1024/1024*100)/100,largestMiB:Math.round(max/1024/1024*100)/100,findings},null,2));
if(findings.length)process.exitCode=1;
