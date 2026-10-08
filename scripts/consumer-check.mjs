import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const directory=resolve(process.argv.slice(2).find(value=>value!=='--')||'consumer-output/fresh');
const source=execFileSync(process.env.SAFE_PYTHON||'python',['scripts/unpack-release.py',directory],{encoding:'utf8',windowsHide:true}).trim();
const pnpmPath=process.env.SAFE_PNPM||process.env.npm_execpath;
if(!pnpmPath)throw Error('Run this check using pnpm test:consumer.');
const pnpm=(args)=>execFileSync(process.execPath,[pnpmPath,...args],{cwd:source,stdio:'inherit',windowsHide:true});
pnpm(['install','--frozen-lockfile']);pnpm(['build']);pnpm(['test']);pnpm(['test:browser']);
console.log('Fresh source consumer installed, built, passed storage/diagnostic/Worker tests and controlled browser recovery.');
