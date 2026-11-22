import path from 'node:path';import fs from 'node:fs';import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';
const here=path.dirname(fileURLToPath(import.meta.url));
const [propsPath,mode,...rest]=process.argv.slice(2);
const inputProps=JSON.parse(fs.readFileSync(propsPath,'utf8'));
const browserExecutable=process.env.CHROME_BIN;
const serveUrl=await bundle({entryPoint:path.join(here,'src/index.ts'),publicDir:path.join(here,'public')});
const composition=await selectComposition({serveUrl,id:'Dune',inputProps,browserExecutable});
if(mode==='stills'){const dir=rest[0];for(const s of rest.slice(1)){await renderStill({composition,serveUrl,output:`${dir}/s${s}.png`,frame:Math.round(Number(s)*30),inputProps,browserExecutable,scale:0.5});console.log('still',s);}}
else{await renderMedia({composition,serveUrl,codec:'h264',outputLocation:rest[0],inputProps,browserExecutable,concurrency:2,crf:18,onProgress:({progress})=>{const p=Math.round(progress*100);if(p%10===0)process.stdout.write(`\r${p}%`)}});console.log('\ndone')}
