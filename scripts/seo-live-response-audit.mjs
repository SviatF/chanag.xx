/**
 * Read-only production metadata check. A spoofed Googlebot user-agent does not
 * authenticate as Google; use GSC URL Inspection to verify Google's crawl.
 */
const BASE="https://panchvani.com";
const paths=[
  "/festivals/dussehra/2026/hyderabad",
  "/festivals/shardiya-navratri/2026/hyderabad",
  "/festivals/shardiya-navratri/2026/kolkata",
  "/muhurat/vehicle-purchase/2026/10/pune",
  "/calendar/ahmedabad/2026/10",
];
const agents={
  browser:"Mozilla/5.0 (compatible; PanchvaniSEOAudit/1.0)",
  googlebot:"Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
};
function attr(tag,name){return new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`,"i").exec(tag)?.[1]??null;}
function metadata(html){
  const links=[...html.matchAll(/<link\b[^>]*>/gi)].map(x=>x[0]);
  const metas=[...html.matchAll(/<meta\b[^>]*>/gi)].map(x=>x[0]);
  const canonical=links.find(tag=>(attr(tag,"rel")??"").toLowerCase().split(/\s+/).includes("canonical"));
  const robots=metas.filter(tag=>["robots","googlebot"].includes((attr(tag,"name")??"").toLowerCase())).map(tag=>attr(tag,"content")??"");
  return {canonical:canonical?attr(canonical,"href"):null,robots};
}
const results=[];
for(const path of paths){
  const url=BASE+path;
  for(const [agent,userAgent] of Object.entries(agents)){
    try{
      const response=await fetch(url,{headers:{"user-agent":userAgent,accept:"text/html"}});
      const html=await response.text();
      const m=metadata(html);
      const canonical=m.canonical?new URL(m.canonical,url).href:null;
      const xRobots=response.headers.get("x-robots-tag")??"";
      const worker=response.headers.get("x-panchvani-worker");
      const workerVersion=response.headers.get("x-panchvani-worker-version");
      const errors=[];
      if(response.status!==200)errors.push(`HTTP ${response.status}`);
      if(canonical!==url)errors.push(`canonical mismatch: ${canonical??"missing"}`);
      if([...m.robots,xRobots].some(s=>/\bnoindex\b/i.test(s)))errors.push("noindex");
      if(path==="/festivals/dussehra/2026/hyderabad"){
        if(html.includes("moonrise arrives late relative to sunset"))errors.push("stale Moonrise chronology from a pre-fix deployment");
        if(!html.includes("moonrise occurs in local daylight"))errors.push("new Moonrise chronology not present");
        if(html.includes("Tithi changes first in afternoon"))errors.push("stale Tithi daylight classification");
      }
      if(path==="/muhurat/vehicle-purchase/2026/10/pune"&&/\bby 0 points?\b/i.test(html)){
        errors.push("stale Muhurat zero-point lead");
      }
      results.push({path,agent,status:response.status,canonical,robots:m.robots,xRobots,worker,workerVersion,cache:response.headers.get("x-panchvani-edge-cache"),errors});
    }catch(error){results.push({path,agent,errors:[String(error)]});}
  }
}
for(const result of results)console.log(JSON.stringify(result));
const failures=results.filter(row=>row.errors.length);
if(failures.length){console.error(`${failures.length} live SEO metadata checks failed`);process.exitCode=1;}
else console.log("All sampled HTML metadata checks passed. Verify Google-selected canonical separately in GSC.");
