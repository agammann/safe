import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';
const root=path.resolve('dist/client');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff':'font/woff','.woff2':'font/woff2','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
 res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}/`;
const browser=await chromium.launch(process.env.SAFE_BROWSER_PATH?{executablePath:process.env.SAFE_BROWSER_PATH}:{});
const errors=[],passed=[];
const fixture='ip=203.0.113.10\nvisit_scheme=https\ntls=TLSv1.3\nsni=plaintext\nhttp=http/2\n';
async function pageFor(mode='success'){
 const context=await browser.newContext({acceptDownloads:true});
 let count=0;
 await context.route('https://www.cloudflare.com/cdn-cgi/trace?**',async route=>{
  count++;
  if(mode==='cancel')await new Promise(r=>setTimeout(r,1000));
  await route.fulfill({body:mode==='failure'?'<html>Unavailable</html>':fixture,headers:{'access-control-allow-origin':'*'}}).catch(()=>{});
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
 return{context,page,count:()=>count};
}
const run=async(page,label)=>{
 const newCheck=page.getByRole('button',{name:'New check',exact:true});
 if(await newCheck.count())await newCheck.click();
 await page.getByLabel('Label this check').fill(label);
 await page.getByRole('button',{name:'Check my WiFi',exact:true}).click();
 await page.locator('.report-summary').waitFor();
};
const nav=async(page,label)=>{
 if(await page.getByRole('button',{name:'Open navigation',exact:true}).isVisible())await page.getByRole('button',{name:'Open navigation',exact:true}).click();
 await page.locator('nav .side-link').filter({hasText:label}).click();
 await page.getByRole('heading',{name:label,exact:true}).waitFor();
};
try{
 const iconContext=await browser.newContext();
 const iconPage=await iconContext.newPage();const iconErrors=[],missingAssets=[];
 iconPage.on('console',message=>{if(message.type()==='error')iconErrors.push(message.text());});
 iconPage.on('response',response=>{if(response.url().startsWith(url)&&response.status()>=400)missingAssets.push({path:new URL(response.url()).pathname,status:response.status()});});
 await iconPage.goto(url);
 const icon=iconPage.locator('link[rel="icon"]');
 assert.equal(await icon.getAttribute('type'),'image/svg+xml');assert.equal(await icon.getAttribute('href'),'/favicon.svg');
 const decoded=await iconPage.evaluate(()=>new Promise((resolve,reject)=>{
  const image=new Image();image.onload=()=>resolve({width:image.naturalWidth,height:image.naturalHeight});image.onerror=()=>reject(Error('Favicon failed to decode'));image.src=document.querySelector('link[rel="icon"]').href;
 }));
 assert.deepEqual(decoded,{width:64,height:64});assert.deepEqual(iconErrors,[]);assert.deepEqual(missingAssets,[]);
 passed.push('Explicit built favicon loads and decodes with no console errors or missing same-origin assets');await iconContext.close();
 const normal=await pageFor();
 await run(normal.page,'Fictional before');await run(normal.page,'Fictional after');
 assert.equal(normal.count(),6);await nav(normal.page,'Compare checks');
 assert.match(await normal.page.locator('.finding-list').innerText(),/same public IP/);
 await normal.page.reload();assert.match(await normal.page.locator('.finding-list').innerText(),/IP comparison is unavailable/);
 await nav(normal.page,'Your checks');await normal.page.getByRole('button',{name:'View report',exact:true}).first().click();
 const pending=normal.page.waitForEvent('download');await normal.page.getByRole('button',{name:'Export report',exact:true}).click();
 const download=await pending;const exported=fs.readFileSync(await download.path(),'utf8');
 assert(!exported.includes('203.0.113.10'));assert(!/"ip"\s*:/.test(exported));assert.equal(JSON.parse(exported).version,'1.0.1');
 passed.push('Two controlled UI checks, same-session comparison, reload and real JSON download without addresses');
 for(const raw of ['{bad','x'.repeat(100001)]){
  const bad=await pageFor();await bad.page.evaluate(v=>localStorage.setItem('safe.checks.v1',v),raw);await bad.page.reload();
  await run(bad.page,'Fictional recovery');assert.equal(await bad.page.evaluate(()=>localStorage.getItem('safe.checks.v1')),raw);
  assert.match(await bad.page.getByRole('status').innerText(),/left unchanged/);await nav(bad.page,'Privacy & data');
  await bad.page.getByRole('button',{name:'Reset saved data',exact:true}).click();assert.equal(await bad.page.evaluate(()=>localStorage.getItem('safe.checks.v1')),'[]');
  await bad.page.getByRole('button',{name:'New check',exact:true}).click();await run(bad.page,'Fictional after reset');
  assert.equal(await bad.page.evaluate(()=>JSON.parse(localStorage.getItem('safe.checks.v1')).length),1);await bad.context.close();
 }
 passed.push('Corrupt and oversize saved bytes preserved until explicit reset, then saving recovers');
 const cancel=await pageFor('cancel');await cancel.page.getByRole('button',{name:'Check my WiFi',exact:true}).click();
 await cancel.page.getByRole('button',{name:'Cancel',exact:true}).click();await cancel.page.getByRole('status').filter({hasText:'Check cancelled'}).waitFor();
 assert.equal(await cancel.page.evaluate(()=>localStorage.getItem('safe.checks.v1')),null);await cancel.context.close();
 passed.push('Cancellation leaves no saved report');
 const failed=await pageFor('failure');await run(failed.page,'Fictional failure');assert.match(await failed.page.locator('.report-summary').innerText(),/couldn’t complete/);
 assert.match(await failed.page.locator('.stats-grid').innerText(),/Unavailable/);await failed.context.close();passed.push('Malformed endpoint responses stay inconclusive');
 for(const width of [1440,390,320]){
  await normal.page.setViewportSize({width,height:900});await nav(normal.page,'Your checks');
  assert(await normal.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 await normal.page.setViewportSize({width:390,height:844});await normal.page.getByRole('button',{name:'Open navigation',exact:true}).focus();await normal.page.keyboard.press('Enter');
 assert(await normal.page.getByRole('link',{name:'Privacy & data',exact:true}).isVisible());await normal.page.keyboard.press('Escape');
 assert(!(await normal.page.getByRole('link',{name:'Privacy & data',exact:true}).isVisible()));
 passed.push('1440/390/320 layouts and keyboard navigation');await normal.context.close();
 assert.deepEqual(errors,[]);console.log(JSON.stringify({mode:'Controlled fictional responses only; no actual network or VPN measurements',browser:browser.version(),passed,errors,status:'PASS'},null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
