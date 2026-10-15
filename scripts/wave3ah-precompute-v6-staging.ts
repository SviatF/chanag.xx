/**
 * Wave 3AH: reproducible V6 staging data. Never writes to generated/ or
 * imports a V6 shard into production. Default mode covers three exact model
 * flips; --all builds every currently committed V5 target into separate,
 * source-versioned research artifacts for subsequent cross-family review.
 */
import {mkdir,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {gzipSync} from "node:zlib";
import {cityBySlug,type City} from "../lib/cities";
import {loadMuhuratPrecomputedShard} from "../lib/muhurat-precomputed";
import {MUHURAT_PANCHANG_SHARD_IDS} from "../generated/muhurat-panchang-shards";
import {JPL_V6_ROOTS_ASSET_SHA256} from "../lib/jpl-v6-pinned-data";
import {
  PUBLIC_LUNAR_ENGINE_VERSION,STAGED_LUNAR_ENGINE_VERSION,
  V6_STAGING_SHARD_SCHEMA,UNRECONCILED_V6_DEPENDENCIES,
  getStagedV6Daily,getStagedV6MuhuratMonth,getStagedV6VratYear,
  assertV6StagingShardIdentity,assertProductionLunarEngine
} from "../lib/v6-calendar-staging";

const all=process.argv.includes("--all");
const output="artifacts/wave3ah-v6-staging";
const sample=[
  {city:"delhi",year:2026,month:6,date:"2026-06-30",tithi:"Purnima"},
  {city:"kanpur",year:2026,month:11,date:"2026-11-21",tithi:"Ekadashi"},
  {city:"patna",year:2027,month:1,date:"2027-01-31",tithi:"Navami"}
] as const;
type Target={city:City;year:number;month:number};
const monthId=(y:number,m:number)=>y+"-"+String(m).padStart(2,"0");
const fail=(msg:string):never=>{throw Error("[Wave3AH] "+msg);};
function key(t:Target){return monthId(t.year,t.month)+"|"+t.city.slug;}
const grouped=new Map<string,Target[]>();
const add=(target:Target)=>{
  const shardId=monthId(target.year,target.month);
  const targets=grouped.get(shardId)??[];
  if(!targets.some(existing=>key(existing)===key(target)))targets.push(target);
  grouped.set(shardId,targets);
};
if(all){
  for(const shardId of MUHURAT_PANCHANG_SHARD_IDS){
    const v5=await loadMuhuratPrecomputedShard(shardId);
    if(!v5)throw Error("Missing V5 precomputed shard "+shardId);
    if(v5.version!==5||v5.shardId!==shardId)throw Error("Wrong-version V5 shard "+shardId);
    for(const target of v5.targets){
      const parts=target.split("|");
      if(parts.length!==4||parts[3]!==shardId)fail("Corrupt legacy target "+target);
      const city=cityBySlug(parts[0]);
      if(city.lat.toFixed(6)!==parts[1]||city.lng.toFixed(6)!==parts[2])
        fail("Coordinate provenance changed "+target);
      const [year,month]=shardId.split("-").map(Number);
      add({city,year,month});
    }
  }
  if(grouped.size!==MUHURAT_PANCHANG_SHARD_IDS.length)
    fail("Cannot silently omit one of the committed V5 month shards");
}else{
  for(const target of sample)add({city:cityBySlug(target.city),year:target.year,month:target.month});
}
await mkdir(output,{recursive:true});
const reports:{
  shardId:string;targets:number;days:number;bytes:number;compressedSha256:string;
  flips:Array<{city:string;date:string;v5:string;v6:string}>;
}[]=[];
for(const [shardId,targets] of [...grouped.entries()].sort(([a],[b])=>a.localeCompare(b))){
  const entries:Record<string,Awaited<ReturnType<typeof getStagedV6MuhuratMonth>>["rows"]>={};
  const flips:typeof reports[number]["flips"]=[];
  let days=0;
  for(const target of targets){
    const month=await getStagedV6MuhuratMonth(target.year,target.month,target.city);
    const identity=key(target);
    entries[identity]=month.rows;
    days+=month.rows.length;
    const candidates=sample.filter(c=>c.city===target.city.slug&&c.year===target.year&&c.month===target.month);
    for(const candidate of candidates){
      const daily=await getStagedV6Daily(candidate.date,target.city);
      const snapshot=month.rows.find(r=>r.date===candidate.date);
      if(!snapshot)throw Error("Missing V6 Muhurat day "+candidate.city+" "+candidate.date);
      if(snapshot.tithi!==daily.lunar.tithi||
        snapshot.karana!==daily.lunar.karana||
        snapshot.tithiEnd!==daily.lunar.tithiEnd||
        snapshot.karanaEnd!==daily.lunar.karanaEnd||
        snapshot.tithi!==candidate.tithi)
        fail("Daily/Muhurat JPL lunar divergence "+candidate.city+" "+candidate.date);
      if(daily.baselineV5.tithi===snapshot.tithi&&daily.baselineV5.paksha===daily.lunar.paksha)
        fail("Expected JPL/Swiss phase flip missing "+candidate.city+" "+candidate.date);
      flips.push({city:candidate.city,date:candidate.date,
        v5:daily.baselineV5.paksha+" "+daily.baselineV5.tithi,
        v6:daily.lunar.paksha+" "+snapshot.tithi});
    }
  }
  const envelope={
    schema:V6_STAGING_SHARD_SCHEMA,engine:STAGED_LUNAR_ENGINE_VERSION,
    provenanceSha256:JPL_V6_ROOTS_ASSET_SHA256,
    publicReleaseAllowed:false as const,shardId,
    targets:Object.keys(entries).sort(),entries,
    retainedV5Dependencies:[...UNRECONCILED_V6_DEPENDENCIES],
    scoresAndCeremoniesApproved:false as const,
    generatedAt:new Date().toISOString()
  };
  assertV6StagingShardIdentity(envelope);
  const compressed=gzipSync(Buffer.from(JSON.stringify(envelope)+"\n"),{level:9});
  const digest=createHash("sha256").update(compressed).digest("hex");
  await writeFile(output+"/"+shardId+".json.gz",compressed);
  reports.push({shardId,targets:targets.length,days,bytes:compressed.length,
    compressedSha256:digest,flips});
  console.log("[Wave3AH] "+shardId+" targets="+targets.length+" days="+days+
    " bytes="+compressed.length+" flips="+flips.length);
}
const vrat=getStagedV6VratYear(2026,cityBySlug("kanpur"));
if(!vrat.rows.ekadashi.some(item=>item.date==="2026-11-21"))
  fail("Vrat Ekadashi must match Kanpur JPL daily reference");
if(vrat.fastingAndParanaCertified!==false)fail("Unapproved Vrat observance");
assertProductionLunarEngine(PUBLIC_LUNAR_ENGINE_VERSION);
let v6ActivationDenied=false;
try{assertProductionLunarEngine(STAGED_LUNAR_ENGINE_VERSION);}
catch{v6ActivationDenied=true;}
if(!v6ActivationDenied)fail("Accidental public V6 activation permitted");
const report={
  wave:"3AH",mode:all?"all-committed-v5-targets":"three-critical-boundary-samples",
  currentProduction:PUBLIC_LUNAR_ENGINE_VERSION,
  stagedEngine:STAGED_LUNAR_ENGINE_VERSION,sourceSha256:JPL_V6_ROOTS_ASSET_SHA256,
  schema:V6_STAGING_SHARD_SCHEMA,
  stagedMonthShards:reports.length,
  stagedCityMonths:reports.reduce((n,s)=>n+s.targets,0),
  stagedDays:reports.reduce((n,s)=>n+s.days,0),
  completeProductionSwitch:false,
  mustReconcileBeforeSwitch:[...UNRECONCILED_V6_DEPENDENCIES],
  legacyV5PrecomputedShardsUnchanged:true,
  failClosedV6Promotion:v6ActivationDenied,
  sampleKnownFlipsPassed:!all?reports.flatMap(x=>x.flips).length===3:true,
  shards:reports
};
if(!report.sampleKnownFlipsPassed)fail("Critical V6 flip coverage missing");
await writeFile(output+"/manifest.json",JSON.stringify(report,null,2)+"\n");
console.log("[Wave3AH] "+JSON.stringify({mode:report.mode,
  shards:report.stagedMonthShards,cityMonths:report.stagedCityMonths,
  days:report.stagedDays,productionSwitch:false,v6ActivationDenied}));
