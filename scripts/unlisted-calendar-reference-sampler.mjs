/**
 * Wave 3AL: expand factual coverage without adding URLs to the public sitemap.
 * Selection is deterministic and stratified by MONTH vs VRAT and city.
 * It is an evidence sample, not a claim of exhaustive independent certification.
 */
import {createHash} from "node:crypto";
const DAILY=/^\/panchang\/([^/]+)\/(\d{4}-\d{2}-\d{2})$/;
const KEY_DATES=new Set([
  "delhi|2026-06-30",
  "kanpur|2026-11-21",
  "patna|2027-01-31"
]);
const hash=s=>createHash("sha256").update(s).digest("hex");
const compare=(a,b)=>a.localeCompare(b);
export function chooseUnlistedDailyReferences(refs,limit=192){
  if(!Number.isInteger(limit)||limit<1||limit>512)throw Error("Invalid unlisted audit sample limit");
  const unique=new Map();
  for(const ref of refs){
    const date=String(ref.date??"");
    const city=String(ref.city??"");
    const path="/panchang/"+city+"/"+date;
    if(!DAILY.test(path))continue;
    const type=ref.type==="vrat"?"vrat":ref.type==="month"?"month":null;
    if(!type)continue;
    const id=city+"|"+date;
    const value=unique.get(id)??{city,date,path,types:new Set()};
    value.types.add(type);
    unique.set(id,value);
  }
  const candidates=[...unique.values()].map(row=>({
    path:row.path,city:row.city,date:row.date,types:[...row.types].sort(),
    score:hash(row.path),critical:KEY_DATES.has(row.city+"|"+row.date)
  }));
  const output=[],seen=new Set();
  const add=row=>{if(!row||seen.has(row.path)||output.length>=limit)return;output.push(row);seen.add(row.path);};
  for(const row of candidates.filter(x=>x.critical).sort((a,b)=>compare(a.path,b.path)))add(row);
  // Capture geographic diversity before filling the remaining slots. Sampling
  // only by URL hash can silently miss a less common city or a Vrat family.
  const byCity=new Map();
  for(const row of candidates){
    const list=byCity.get(row.city)??[];list.push(row);byCity.set(row.city,list);
  }
  for(const [,list] of [...byCity.entries()].sort(([a],[b])=>compare(a,b))){
    list.sort((a,b)=>compare(a.score,b.score));
    add(list[0]);
  }
  const ordered=candidates.sort((a,b)=>compare(a.score,b.score));
  for(const type of ["vrat","month"]){
    const subtype=ordered.filter(row=>row.types.includes(type));
    for(const row of subtype.slice(0,Math.min(Math.floor(limit/4),subtype.length)))add(row);
  }
  for(const row of ordered)add(row);
  return {sourceReferences:refs.length,uniqueTargets:unique.size,
    selected:output.map(({score,critical,...row})=>({...row,critical})),
    sampleMethod:"deterministic-sha256-city-stratified-vrat-month",
    completeCoverage:output.length===unique.size};
}
