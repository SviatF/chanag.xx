/**
 * Read-only external semantic audit. Run against deployed HTML (NOT localhost).
 * Can detect stale route output even when the current GitHub/Cloudflare build succeeds.
 * HTML cache-busting is intentionally not used: we must test the user-facing URL.
 */
import {mkdirSync,writeFileSync} from "node:fs";
const BASE=(process.argv.find(s=>s.startsWith("--base-url="))?.slice(11)||"https://panchvani.com").replace(/\/$/,"");
const strict=process.argv.includes("--strict");
const months=[["08","August"],["09","September"],["10","October"]];
const results=[];
for(const [month,name] of months){
  for(const path of [`/muhurat/wedding/2026/${month}`,`/muhurat/wedding/2026/${month}/mumbai`]){
    let row={path,status:0,verified:false,errors:[],worker:null,workerVersion:null,edge:null,vinext:null,cacheControl:null};
    try{
      const url=BASE+path;
      const response=await fetch(url,{headers:{"accept":"text/html","cache-control":"no-cache","pragma":"no-cache","user-agent":"Panchvani-Ritual-Truth-Audit/1.0"},redirect:"follow",signal:AbortSignal.timeout(15000)});
      const html=await response.text();
      row.status=response.status;
      row.worker=response.headers.get("x-panchvani-worker");
      row.workerVersion=response.headers.get("x-panchvani-worker-version");
      row.edge=response.headers.get("x-panchvani-edge-cache");
      row.vinext=response.headers.get("x-vinext-cache");
      row.cacheControl=response.headers.get("cache-control");
      const title=`No traditional Marathi wedding Muhurat dates in Mumbai in ${name} 2026`;
      if(response.status!==200)row.errors.push(`HTTP ${response.status}`);
      if(!html.includes(title))row.errors.push(`missing reviewed ${name} 2026 zero-date headline`);
      if(!html.includes("Traditional Marathi marriage dates"))row.errors.push("missing convention-scoped 0-date statement");
      if(!html.includes("Chaturmas"))row.errors.push("missing Chaturmas reason");
      if(!html.includes("Marriage observances differ by community and tradition"))row.errors.push("missing community caveat");
      if(/\b(\d+)\s+dates survive the lunar screen/i.test(html))row.errors.push("stale candidate-date content still published");
      if(/(?:100\/100|Why 2026-10-12 gets)/i.test(html))row.errors.push("stale or fictitious ceremony score still visible");
      if(/\/mumbai$/.test(path)&&!html.includes(`Wedding Muhurat in Mumbai`))row.errors.push("unexpected city-specific body");
      row.verified=row.errors.length===0;
    }catch(e){row.errors.push("fetch failed: "+String(e));}
    results.push(row);
    console.log("[live-ritual-truth] "+JSON.stringify(row));
  }
}
const output="artifacts/live-ritual-truth-report.json";
mkdirSync("artifacts",{recursive:true});
writeFileSync(output,JSON.stringify({createdAt:new Date().toISOString(),base:BASE,verified:results.filter(x=>x.verified).length,checked:results.length,results,limitations:["A cached response may differ by edge PoP and time; run from multiple regions and compare request headers.","This verifies ONLY these six known marriage-closure pages, not all PANCHVANI astrology content."]},null,2));
console.log("[live-ritual-truth] "+results.filter(x=>x.verified).length+"/"+results.length+" passed; report="+output);
if(strict&&results.some(x=>!x.verified))process.exitCode=1;
