/**
 * Wave 3AS: independently reproducible coordinate-parity input.
 * Every observed physical UTC instant is shared with native Swiss Ephemeris.
 * Separates tropical Sun/Moon longitude drift from the Lahiri transformation
 * drift; does NOT change the public calendar, does NOT claim JPL-only Lahiri.
 */
import {readFileSync,writeFileSync} from "node:fs";
import {createDefaultSweData} from "@typescriptify/sweph/dist/types.js";
import {sweCalcUt,sweClose,sweSetSidMode} from "@typescriptify/sweph/dist/sweph.js";
import {sweDeltatEx} from "@typescriptify/sweph/dist/swephlib.js";
import {SE_SUN,SE_MOON,SEFLG_MOSEPH,SEFLG_SPEED,SEFLG_SIDEREAL,SE_SIDM_LAHIRI} from "@typescriptify/sweph/dist/constants.js";
import {openVerifiedV6SiderealSource} from "../lib/v6-unified-calendar-staging";

const catalog=readFileSync("artifacts/wave3ao-jpl-global-sidereal-transitions.json","utf8");
const anchors=readFileSync("artifacts/wave3ao-lahiri-6h-anchors.json","utf8");
const source=openVerifiedV6SiderealSource(catalog,anchors);
const prior=JSON.parse(readFileSync("artifacts/wave3ar-swiss-jpl-transition-clock-reconciliation.json","utf8"));
if(prior.wave!=="3AR"||prior.JplSource.siderealCatalogSha256!==source.sourceDigest||
   prior.scientificJudgment.fullProductionV6Released!==false)
  throw Error("Wave3AS Swiss coordinate study received incompatible prior roots");
const observations=new Map<string,{atUtc:string;roles:string[]}>();
function add(atUtc:string,role:string){
  const ms=Date.parse(atUtc);
  if(!Number.isFinite(ms)||new Date(ms).toISOString()!==atUtc)
    throw Error("Unparseable model observation "+atUtc);
  const row=observations.get(atUtc)??{atUtc,roles:[]};
  row.roles.push(role);
  observations.set(atUtc,row);
}
for(const [jplMs,index] of source.table.events.sunRashi){
  const atUtc=new Date(jplMs).toISOString();
  add(atUtc,"Solar Rashi JPL root "+index);
}
for(const [family,v] of Object.entries(prior.family)){
  for(const item of v.worst){
    add(item.atUtc,family+" high-offset JPL root "+item.targetIndex);
  }
}
// Stable time controls that prevent incidentally choosing only zero-angle roots
for(const atUtc of [
  "2026-01-01T00:00:00.000Z","2026-07-01T00:00:00.000Z",
  "2027-03-15T00:00:00.000Z","2027-07-17T00:00:00.000Z",
  "2028-01-01T00:00:00.000Z","2028-12-31T00:00:00.000Z"
])add(atUtc,"independent wall-clock control");
const swed=createDefaultSweData();
sweSetSidMode(swed,SE_SIDM_LAHIRI,0,0);
const JD0=2440587.5,DAY=86400000;
const normalize=(x:number)=>((x%360)+360)%360;
const signed=(a:number,b:number)=>((a-b+540)%360)-180;
const samples=[];
try{
  for(const row of [...observations.values()].sort((a,b)=>a.atUtc.localeCompare(b.atUtc))){
    const jd=JD0+Date.parse(row.atUtc)/DAY;
    const jsDeltaTSeconds=sweDeltatEx(jd,SEFLG_MOSEPH,swed)*86400;
    if(!Number.isFinite(jsDeltaTSeconds)||jsDeltaTSeconds<40||jsDeltaTSeconds>120)
      throw Error("Invalid JavaScript Swiss UT-to-ET correction "+row.atUtc);
    const flags=SEFLG_MOSEPH|SEFLG_SPEED;
    const body=(target:number)=>{
      const tropical=sweCalcUt(swed,jd,target,flags).xx;
      const sidereal=sweCalcUt(swed,jd,target,flags|SEFLG_SIDEREAL).xx;
      if(!Number.isFinite(tropical[0])||!Number.isFinite(sidereal[0])||
         !Number.isFinite(tropical[3])||!Number.isFinite(sidereal[3]))
        throw Error("Incomplete same-UT JS astronomical values "+row.atUtc);
      return {tropicalDeg:normalize(tropical[0]),
        siderealDeg:normalize(sidereal[0]),
        tropicalSpeedDegPerDay:tropical[3],siderealSpeedDegPerDay:sidereal[3],
        effectiveLahiriDeg:normalize(tropical[0]-sidereal[0])};
    };
    const sun=body(SE_SUN),moon=body(SE_MOON);
    const sameFrameOffsetArcsec=Math.abs(signed(sun.effectiveLahiriDeg,moon.effectiveLahiriDeg))*3600;
    if(sameFrameOffsetArcsec>3)
      throw Error("Inconsistent same-UT Sun/Moon sidereal offset "+row.atUtc);
    samples.push({...row,sun,moon,sameFrameOffsetArcsec,jsDeltaTSeconds});
  }
}finally{sweClose(swed);}
if(samples.length<90)throw Error("Insufficient independent physical root/control instants");
const report={wave:"3AS",source:"@typescriptify/sweph sweCalcUt; SEFLG_MOSEPH|SEFLG_SPEED; SE_SIDM_LAHIRI",
  sourceCatalogSha256:source.sourceDigest,sourceLahiriAnchorSha256:source.lahiriAnchorDigest,
  all36SolarRashiRootsCovered:true,sampleCount:samples.length,
  coordinatesUnrounded:true,sourceRole:"JS Swiss, not JPL and not native Swiss C",
  fullyIndependentLahiriApproved:false,productionChangeAllowed:false,samples};
writeFileSync("artifacts/wave3as-js-swiss-coordinate-baseline.json",JSON.stringify(report,null,2)+"\n");
console.log("[Wave3AS JS UT] coordinateSamples="+samples.length+
  " solarRootCount="+source.table.events.sunRashi.length+" production=false");
