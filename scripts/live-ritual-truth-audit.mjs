/**
 * Read-only external semantic audit. Run against deployed HTML (NOT localhost).
 * Can detect stale route output even when the current GitHub/Cloudflare build succeeds.
 * HTML cache-busting is intentionally not used: we must test the user-facing URL.
 */
import {mkdirSync,writeFileSync} from "node:fs";
const BASE=(process.argv.find(s=>s.startsWith("--base-url="))?.slice(11)||"https://panchvani.com").replace(/\/$/,"");
const strict=process.argv.includes("--strict");
const months=[["08","August"],["09","September"],["10","October"]];
const requests=[];
for(const year of [2025,2026,2027])for(const [month,name] of months){
  for(const path of [`/muhurat/wedding/${year}/${month}`,`/muhurat/wedding/${year}/${month}/mumbai`])
    requests.push({path,year,month,name,city:"Mumbai"});
}
for(const [slug,city] of [
  ["pune","Pune"],["nagpur","Nagpur"],["thane","Thane"],
  ["pimpri-chinchwad","Pimpri-Chinchwad"],["nashik","Nashik"],
  ["kalyan-dombivli","Kalyan-Dombivli"],["vasai-virar","Vasai-Virar"],
  ["aurangabad","Aurangabad"],["navi-mumbai","Navi Mumbai"],["solapur","Solapur"],
])requests.push({path:`/muhurat/wedding/2026/10/${slug}`,year:2026,month:"10",name:"October",city});
const results=[];
for(const {path,year,month,name,city} of requests){
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
      const title=`No traditional Marathi wedding Muhurat dates in ${city} in ${name} ${year}`;
      if(response.status!==200)row.errors.push(`HTTP ${response.status}`);
      if(!html.includes(title))row.errors.push(`missing reviewed ${name} 2026 zero-date headline`);
      if(!html.includes("Traditional Marathi marriage dates"))row.errors.push("missing convention-scoped 0-date statement");
      if(!html.includes("Chaturmas"))row.errors.push("missing Chaturmas reason");
      if(!html.includes("Marriage observances differ by community and tradition"))row.errors.push("missing community caveat");
      if(/\b(\d+)\s+dates survive the lunar screen/i.test(html))row.errors.push("stale candidate-date content still published");
      if(/(?:100\/100|Why 2026-10-12 gets)/i.test(html))row.errors.push("stale or fictitious ceremony score still visible");
      if(!html.includes(`Wedding Muhurat in ${city}`))row.errors.push("unexpected city-specific body");
      if(year!==2026&&!html.includes("Exact Chaturmas boundary instants are not independently established"))row.errors.push("invented or missing date uncertainty");
      row.verified=row.errors.length===0;
    }catch(e){row.errors.push("fetch failed: "+String(e));}
    results.push(row);
    console.log("[live-ritual-truth] "+JSON.stringify(row));
}
const output="artifacts/live-ritual-truth-report.json";
mkdirSync("artifacts",{recursive:true});
writeFileSync(output,JSON.stringify({createdAt:new Date().toISOString(),base:BASE,verified:results.filter(x=>x.verified).length,checked:results.length,results,limitations:["A cached response may differ by edge PoP and time; run from multiple regions and compare request headers.","This verifies ONLY these 28 source-reviewed community-calendar URLs, not all PANCHVANI astrology content."]},null,2));
console.log("[live-ritual-truth] "+results.filter(x=>x.verified).length+"/"+results.length+" passed; report="+output);
if(strict&&results.some(x=>!x.verified))process.exitCode=1;
