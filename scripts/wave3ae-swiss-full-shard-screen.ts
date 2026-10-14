/**
 * Wave 3AE — exhaustive audit of COMMITTED V5 Muhurat/Panchang snapshots.
 *
 * For every row, classify Tithi at a 30-minute wide clock window around the
 * committed *rounded* sunrise (first daytime Choghadiya start); whenever the
 * Tithi index changes across the window, calculate real Swiss/Moshier
 * second-resolution sunrise and the corresponding exact 12° phase root.
 *
 * This is exhaustive for the committed shard rows; it does NOT claim all
 * possible dynamically generated daily routes or all India cities/dates.
 * No production calendar data, ritual fast or Muhurat selector is edited.
 */
import {mkdirSync,writeFileSync} from "node:fs";
import {createDefaultSweData} from "@typescriptify/sweph/dist/types.js";
import {sweCalcUt,sweClose} from "@typescriptify/sweph/dist/sweph.js";
import {sweRiseTrans} from "@typescriptify/sweph/dist/swecl.js";
import {SE_SUN,SE_MOON,SEFLG_MOSEPH,SE_CALC_RISE} from "@typescriptify/sweph/dist/constants.js";
import {MUHURAT_PANCHANG_SHARD_IDS} from "../generated/muhurat-panchang-shards";
import {loadMuhuratPrecomputedManifest} from "../lib/muhurat-precomputed";
import {findCityBySlug} from "../lib/cities";

const out=process.argv.find(x=>x.startsWith("--report="))?.slice(9)||
  "artifacts/wave3ae-swiss-shard-screen.json";
const IST=330*60_000;
const MINUTE=60_000;
const JD0=2440587.5;
const WINDOW_MS=15*MINUTE; // ±15 minutes, 30-minute Tithi prefilter
const dateClock=(d:string,hhmm:string)=>{
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||!/^\d\d:\d\d$/.test(hhmm))
    throw Error("Malformed committed local sunrise proxy "+d+" "+hhmm);
  return Date.parse(d+"T"+hhmm+":00Z")-IST;
};
const jdToUtc=(jd:number)=>new Date((jd-JD0)*86_400_000).toISOString();
const utcToJd=(ms:number)=>ms/86_400_000+JD0;
const indices=(phase:number)=>Math.floor((((phase%360)+360)%360)/12);
const names=["Pratipada","Dvitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami","Navami","Dashami","Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Purnima"];
const label=(i:number)=>(i<15?"Shukla ":"Krishna ")+(i===29?"Amavasya":names[i%15]);
const isoAt=(jd:number)=>({
  utc:jdToUtc(jd),
  ist:new Date((jd-JD0)*86_400_000+IST).toISOString().replace("Z","+05:30")
});
const swed=createDefaultSweData();
function state(ms:number){
  const jd=utcToJd(ms);
  const sun=sweCalcUt(swed,jd,SE_SUN,SEFLG_MOSEPH).xx[0];
  const moon=sweCalcUt(swed,jd,SE_MOON,SEFLG_MOSEPH).xx[0];
  if(!Number.isFinite(sun)||!Number.isFinite(moon))
    throw Error("Nonfinite Swiss/Moshier longitude "+ms);
  return indices(moon-sun);
}
function root(msLo:number,msHi:number,idxBefore:number){
  let lo=msLo,hi=msHi;
  for(let k=0;k<35&&hi-lo>20;k++){
    const mid=(lo+hi)/2;
    if(state(mid)===idxBefore)lo=mid;else hi=mid;
  }
  if(state(lo-2000)!==idxBefore||state(hi+2000)===idxBefore)
    throw Error("Swiss phase root not bracketed");
  return utcToJd((lo+hi)/2);
}
function actualRise(date:string,lat:number,lng:number){
  const base=utcToJd(Date.parse(date+"T00:00:00Z")-IST);
  const v=sweRiseTrans(swed,base,SE_SUN,null,SEFLG_MOSEPH,SE_CALC_RISE,[lng,lat,0],1013.25,25,null);
  if(v.retval<0||!Number.isFinite(v.tret)||isoAt(v.tret).ist.slice(0,10)!==date)
    throw Error("Missing/out-of-date Swiss sunrise "+date+" "+lat+" "+lng);
  return v.tret;
}
const manifest=await loadMuhuratPrecomputedManifest();
if(!manifest)throw Error("Committed V5 snapshot shards are missing or invalid");
if(manifest.version!==5||MUHURAT_PANCHANG_SHARD_IDS.length!==48)
  throw Error("Expected 48 immutable V5 shard months 2025–2028");
const cases=[];
let rowsChecked=0, datasets=0, candidateProxyCount=0, sourceMismatch=0;
const seen=new Set<string>();
const years:Record<string,number>={};
const rowsByCity:Record<string,number>={};
try{
for(const [key,rows] of Object.entries(manifest.entries)){
  const [slug,latString,lngString,monthYear]=key.split("|");
  const city=findCityBySlug(slug);
  if(!city||!latString||!lngString||!monthYear||
    city.lat.toFixed(6)!==latString||city.lng.toFixed(6)!==lngString)
    throw Error("Unexpected snapshot city coordinate key "+key);
  datasets++;
  for(const row of rows){
    if(!row.date.startsWith(monthYear)||!row.dayChoghadiya?.length)
      throw Error("Incomplete source sunrise clock "+key+" "+row.date);
    const dayKey=slug+"|"+row.date;
    if(seen.has(dayKey))throw Error("Duplicate committed city/date "+dayKey);
    seen.add(dayKey);
    rowsChecked++;
    const year=row.date.slice(0,4);
    years[year]=(years[year]??0)+1;
    rowsByCity[slug]=(rowsByCity[slug]??0)+1;
    const clock=row.dayChoghadiya[0].start;
    const approx=dateClock(row.date,clock);
    const indexLo=state(approx-WINDOW_MS),indexHi=state(approx+WINDOW_MS);
    if(indexLo===indexHi)continue; // NOT within ±15 minutes of rounded sunrise
    if(indexHi!==(indexLo+1)%30)
      throw Error("Impossible multi-Tithi transition in half-hour "+dayKey);
    candidateProxyCount++;
    const rise=actualRise(row.date,city.lat,city.lng);
    const riseMs=(rise-JD0)*86_400_000;
    if(Math.abs(riseMs-approx)>65_000)
      throw Error("Rounded proxy not within 65 seconds of real sunrise "+dayKey+" "+(riseMs-approx));
    const exactBoundary=root(approx-WINDOW_MS,approx+WINDOW_MS,indexLo);
    const boundaryMs=(exactBoundary-JD0)*86_400_000;
    const exactIndex=state(riseMs);
    if(exactIndex!==indexLo&&exactIndex!==indexHi)
      throw Error("Unexpected Tithi at sunrise "+dayKey);
    const snapshotAgrees=row.tithi===names[exactIndex%15]||
      (exactIndex===29&&row.tithi==="Amavasya");
    if(!snapshotAgrees)sourceMismatch++;
    const signedGapSeconds=+( (riseMs-boundaryMs)/1000 ).toFixed(3);
    cases.push({
      city:slug,date:row.date,lat:city.lat,lng:city.lng,
      sourceKey:key,sourceSnapshotTithi:row.tithi,
      swissSunriseTithi:label(exactIndex),swissIndexAtSunrise:exactIndex,
      rootTargetDegrees:indexHi*12,indexBefore:indexLo,indexAfter:indexHi,
      swissSunrise:isoAt(rise),swissBoundary:isoAt(exactBoundary),
      swissSunriseMinusBoundarySeconds:signedGapSeconds,
      sourceSnapshotMatchesSwissAtSunrise:snapshotAgrees,
      nearSunriseRisk30minWindow:true,
      expectedRitualCertification:false,automaticProductionPatch:false
    });
  }
}
}finally{sweClose(swed);}
if(rowsChecked<10_000||datasets<300||candidateProxyCount<5)
  throw Error("Incomplete committed coverage: "+rowsChecked+" rows, "+datasets+" datasets, "+candidateProxyCount+" candidates");
cases.sort((a,b)=>a.date.localeCompare(b.date)||a.city.localeCompare(b.city));
const priority=cases.filter(x=>Math.abs(x.swissSunriseMinusBoundarySeconds)<=180);
const report={
 wave:"3AE",method:"All committed V5 city-month snapshots; actual Swiss UT phase and precise sunrise for any 30-min proxied phase transition",
 model:"Swiss/Moshier sweCalcUt",unchangedRuntime:true,
 sourceScope:{
   shardCount:MUHURAT_PANCHANG_SHARD_IDS.length,
   cityMonthDatasets:datasets,cityDays:rowsChecked,
   uniqueCityDays:seen.size,years,rowsByCity,
   includesAllDynamicDailyCityDateRoutes:false
 },
 screening:{
   windowAroundRoundedSunriseMinutes:15,
   proxySource:"committed snapshot dayChoghadiya[0].start",
   swissCandidateCount:cases.length,
   sourceSnapshotMismatchCount:sourceMismatch,
   priority3minCount:priority.length,
   jplCoveragePlanned:"Every <=15-minute Tithi-edge candidate, not sample-only",
   missRisk:"Physical sunrise must be within 65 seconds of proxy; transition root can be in adjacent previous/next-day shard, but actual Swiss position test is per row"
 },
 candidates:cases,
 priorityReview:priority,
 independentlyJplValidated:false,
 candidateProductionChangesApproved:0,
 ritualsCertified:0
};
mkdirSync("artifacts",{recursive:true});
writeFileSync(out,JSON.stringify(report,null,2)+"\n");
console.log("[3ae-swiss] shards="+report.sourceScope.shardCount+
  " datasets="+datasets+" uniqueCityDays="+rowsChecked+
  " candidatesWithin15m="+cases.length+" priorityWithin3m="+priority.length+
  " sourceTithiMismatches="+sourceMismatch);
console.log("[3ae-swiss] years="+JSON.stringify(years)+" report="+out);
for(const row of priority.slice(0,40)){
 console.log("[3ae-candidate] "+row.date+" "+row.city+" SwissGap="+row.swissSunriseMinusBoundarySeconds+
 "s tithi="+row.swissSunriseTithi+" root="+row.rootTargetDegrees);
}
