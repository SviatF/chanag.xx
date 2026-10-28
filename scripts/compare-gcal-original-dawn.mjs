/**
 * Research-only real GCal v. Swiss precise sunrise/Arunodaya seconds.
 * No source GCal time enters an independent fast/date/subtype selector.
 * Usage: node scripts/compare-gcal-original-dawn.mjs RAW_GCAL_TRACE SHARDS_DIR OUT
 */
import {readFileSync,readdirSync,writeFileSync,mkdirSync} from "node:fs";
import {join,dirname} from "node:path";

const requireResearch=(x,msg)=>{if(!x)throw Error("GCal original dawn provenance: "+msg)};
const clockSeconds=(xml,type)=>{
 if(typeof xml!=="string"||!xml.startsWith("<"+type+" "))return null;
 const m=xml.match(/\btime="(\d{2}):(\d{2}):(\d{2})"/);
 if(!m)return null;
 const v=(+m[1])*3600+(+m[2])*60+(+m[3]);
 return v>=0&&v<86400?v:null;
};
const localSeconds=(ms)=>{
 if(!Number.isFinite(ms))return null;
 const shifted=ms+330*60000;
 return ((shifted/1000)%86400+86400)%86400;
};
const deltaSeconds=(indMs,gcalSeconds)=>{
 const ind=localSeconds(indMs);
 return ind===null||gcalSeconds===null?null:((ind-gcalSeconds+129600)%86400)-43200;
};
const key=(city,year,date)=>city+"/"+year+"/"+date;
export function compareDawn(raw,shards){
 requireResearch(raw.status==="RAW_GCAL_DAWN_TRACE_COMPLETE_RESEARCH_ONLY"&&
  raw.independentlyCertified===false&&raw.publicRitualApproval===false&&
  raw.originalExeGitBlob==="1d20f6e0caf29b6293157d258d02287e4edf0481",
  "wrong pinned original GCal source");
 requireResearch(raw.matchedComparisonCases===172&&raw.uniqueCityYears===100&&
  raw.observedDayXmlRows===raw.dailySourceEvidence?.length,
  "incomplete original mismatch source trace baseline");
 const iDays=new Map(),allEvents=new Map(),seenYears=new Set(),seenShards=new Set();
 for(const shard of shards){
  requireResearch(shard.status==="FULL_SHARD_RESEARCH_COMPARISON_ONLY"&&
   shard.publicRitualApproval===false&&shard.independentlyCertified===false&&
   !shard.failures?.length&&!seenShards.has(shard.shard)&&shard.shards===16,
   "bad independent research shard "+shard.shard);
  seenShards.add(shard.shard);
  for(const cy of shard.results){
   const cyKey=cy.city+"/"+cy.year;
   requireResearch(!seenYears.has(cyKey),"duplicate research city year "+cyKey);
   seenYears.add(cyKey);
   for(const r of cy.rows){
    const eventKey=key(cy.city,cy.year,r.date);
    requireResearch(!allEvents.has(eventKey),"duplicate event "+eventKey);
    allEvents.set(eventKey,r);
    for(const d of r.researchDawnSequence??[]){
     const dKey=key(cy.city,cy.year,d.date);
     if(iDays.has(dKey)){
      const prior=iDays.get(dKey);
      requireResearch(Math.abs(prior.independentSunriseUtcMs-d.independentSunriseUtcMs)<20 &&
       Math.abs(prior.independentArunodayaUtcMs-d.independentArunodayaUtcMs)<20,
       "conflicting independent repeated dawn "+dKey);
     }else iDays.set(dKey,d);
    }
   }
  }
 }
 requireResearch(seenShards.size===16&&seenYears.size===908,"independent 454-city/908-year coverage not complete");
 const relevant=new Set();
 for(const r of raw.matchedCases){
  const k=key(r.city,r.year,r.date);
  requireResearch(!relevant.has(k),"duplicate target original source event "+k);
  relevant.add(k);
  requireResearch(allEvents.has(k)&&iDays.has(k),
   "original mismatch not present in independently computed research "+k);
 }
 requireResearch(relevant.size===172,"original 172 mismatch event keys lost");
 const pairs=[],missing=[];
 for(const original of raw.dailySourceEvidence){
  const k=key(original.city,original.year,original.date),ind=iDays.get(k);
  if(!ind){missing.push(k);continue}
  const gRise=clockSeconds(original.sunriseXml,"sunrise"),gDawn=clockSeconds(original.arunodayaXml,"arunodaya");
  requireResearch(gRise!==null&&gDawn!==null,"missing original sunrise/arunodaya clock "+k);
  const rise=deltaSeconds(ind.independentSunriseUtcMs,gRise);
  const dawn=deltaSeconds(ind.independentArunodayaUtcMs,gDawn);
  requireResearch(rise!==null&&dawn!==null&&Number.isFinite(rise)&&Number.isFinite(dawn),
   "missing numerical independent sunrise "+k);
  const origTithi=original.sunriseXml?.match(/<tithi [^>]*\bindex="(\d+)"/)?.[1]??null;
  const origNakshatra=original.sunriseXml?.match(/<naksatra [^>]*\bname="([^"]+)"/)?.[1]??null;
  const nearestBoundary=ind.closestSunriseBoundarySeconds??null;
  pairs.push({city:original.city,year:original.year,date:original.date,
   originalSunriseXml:original.sunriseXml,
   originalArunodayaXml:original.arunodayaXml,
   originalTithiIndex:origTithi===null?null:+origTithi,
   originalNakshatraName:origNakshatra,
   independentTithiIndex:ind.sunriseIndex,independentArunodayaTithiIndex:ind.arunodayaIndex,
   sunriseDeltaSeconds:+rise.toFixed(3),arunodayaDeltaSeconds:+dawn.toFixed(3),
   independentTithiNearBoundarySeconds:nearestBoundary,
   nearBoundary:ind.nearBoundary===true,
   independentTithiPlusFive:ind.tithiSunriseSensitivity?.plusFive??null,
   independentTithiMinusFive:ind.tithiSunriseSensitivity?.minusFive??null});
 }
 requireResearch(pairs.length>=172,"too few original GCal v. independent matched dawn times");
 const summary=metric=>{
  const x=pairs.map(p=>Math.abs(p[metric])).sort((a,b)=>a-b);
  const count=lim=>x.filter(n=>n<=lim).length;
  return {count:x.length,min:x[0],median:x[Math.floor(x.length/2)],
   p95:x[Math.floor(.95*(x.length-1))],max:x.at(-1),
   withinThirtySeconds:count(30),withinOneMinute:count(60),
   withinTwoMinutes:count(120),withinFiveMinutes:count(300),
   overFiveMinutes:x.length-count(300)};
 };
 return {status:"Genuine original GCal vs independent Swiss dawn discrepancy RESEARCH ONLY",
  originalExeGitBlob:raw.originalExeGitBlob,
  coverage:{rawTargetEventKeys:relevant.size,rawCityYears:raw.uniqueCityYears,
   rawDays:raw.dailySourceEvidence.length,matchedDayClocks:pairs.length,
   sourceDaysWithoutIndependentTrace:missing.length,independentCityYears:seenYears.size},
  summary:{sunrise:summary("sunriseDeltaSeconds"),arunodaya:summary("arunodayaDeltaSeconds")},
  independentlyCertified:false,publicRitualApproval:false,
  matchedDawnClockComparisons:pairs,notComparedSourceDays:missing,
  warning:"Dawn disagreements measure conventions / astronomy. Do not modify fasting or ritual labels to match GCal without scientifically reviewing each boundary."};
}
if(process.argv[1]?.endsWith("compare-gcal-original-dawn.mjs")){
 const [trace,shardDir,out]=process.argv.slice(2);
 requireResearch(trace&&shardDir&&out,"usage: compare-gcal-original-dawn.mjs TRACE SHARD_DIR OUTPUT");
 const raw=JSON.parse(readFileSync(trace,"utf8"));
 const fs=readdirSync(shardDir).filter(x=>/^shard-\d{2}\.json$/.test(x)).sort();
 requireResearch(fs.length===16,"need all 16 original independent research shards");
 const shards=fs.map(f=>JSON.parse(readFileSync(join(shardDir,f),"utf8")));
 const report=compareDawn(raw,shards);
 mkdirSync(dirname(out),{recursive:true});writeFileSync(out,JSON.stringify(report,null,2)+"\n");
 console.log("[gcal-original-dawn]",JSON.stringify({coverage:report.coverage,summary:report.summary}));
}
