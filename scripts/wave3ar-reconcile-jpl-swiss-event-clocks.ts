/**
 * Wave 3AR: compare exact JPL DE440s event clocks against the current
 * Swiss/Moshier (UT-correct Lahiri) physical event clocks, NOT merely
 * calendar names at selected city sunrises.  Research-only; public V5 intact.
 */
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {createDefaultSweData} from "@typescriptify/sweph/dist/types.js";
import {sweCalcUt,sweClose,sweSetSidMode} from "@typescriptify/sweph/dist/sweph.js";
import {SE_SUN,SE_MOON,SEFLG_MOSEPH,SEFLG_SIDEREAL,SEFLG_SPEED,SE_SIDM_LAHIRI} from "@typescriptify/sweph/dist/constants.js";
import {getPinnedV6HalfTithiTable,JPL_V6_ROOTS_ASSET_SHA256} from "../lib/jpl-v6-pinned-data";
import {openVerifiedV6SiderealSource} from "../lib/v6-unified-calendar-staging";
import {SIDEREAL_FAMILY_MODULUS,type SiderealFamily} from "../lib/jpl-v6-sidereal-transitions";
import {bisectSwissRoot,eventDegrees,rootDisagreementTier} from "../lib/v6-root-clock-reconciliation";

const START=Date.UTC(2026,0,1),END=Date.UTC(2029,0,1);
const JD0=2440587.5,DAY=86400000;
const normalize=(n:number)=>((n%360)+360)%360;
type Family=SiderealFamily|"halfTithi";
const families=["halfTithi","moonPada","nakshatra","yoga","moonRashi","sunRashi"] as const;
type Entry={family:Family;jplRootMs:number;index:number};
const catalogRaw=readFileSync("artifacts/wave3ao-jpl-global-sidereal-transitions.json","utf8");
const anchorRaw=readFileSync("artifacts/wave3ao-lahiri-6h-anchors.json","utf8");
const source=openVerifiedV6SiderealSource(catalogRaw,anchorRaw);
const table=getPinnedV6HalfTithiTable();
if(source.table.lunarRootSourceSha256!==JPL_V6_ROOTS_ASSET_SHA256||
   source.table.fullIndependentAyanamsaApproved!==false)
  throw Error("Wave3AR invalid pinned JPL/Lahiri source");
const roots:Entry[]=[
 ...table.halfTithiTransitions.filter(([t])=>t>=START&&t<END)
     .map(([jplRootMs,index])=>({family:"halfTithi" as const,jplRootMs,index})),
 ...Object.entries(source.table.events).flatMap(([family,rows])=>
   rows.map(([jplRootMs,index])=>({family:family as SiderealFamily,jplRootMs,index})))
];
const byFamily=Object.fromEntries(families.map(f=>[f,{
  checked:0,largestAbsSeconds:0,meanSignedSeconds:0,
  tiers:{"0-30s":0,"31-120s":0,"121-300s":0,"301-600s":0,">600s":0},
  years:{2026:0,2027:0,2028:0},
  worst:[] as Array<{atUtc:string;swissUtc:string;offsetSeconds:number;targetIndex:number}>
}]));
const swed=createDefaultSweData();
sweSetSidMode(swed,SE_SIDM_LAHIRI,0,0);
let evaluated=0;
try{
  for(const root of roots){
    const target=eventDegrees(root.index,
      root.family==="halfTithi"?60:SIDEREAL_FAMILY_MODULUS[root.family]);
    // Reuse exactly the V5 Swiss sidereal mode and Moshier fallback.
    // At the event root all functions below are smoothly increasing across
    // the tiny ±30-minute comparison window.
    const angleAt=(instant:number)=>{
      const jd=JD0+instant/DAY;
      const tropical=SEFLG_MOSEPH|SEFLG_SPEED;
      const sidereal=tropical|SEFLG_SIDEREAL;
      if(root.family==="sunRashi")
        return normalize(sweCalcUt(swed,jd,SE_SUN,sidereal).xx[0]);
      if(root.family==="moonRashi"||
         root.family==="moonPada"||root.family==="nakshatra")
        return normalize(sweCalcUt(swed,jd,SE_MOON,sidereal).xx[0]);
      if(root.family==="yoga"){
        const sun=sweCalcUt(swed,jd,SE_SUN,sidereal).xx[0];
        const moon=sweCalcUt(swed,jd,SE_MOON,sidereal).xx[0];
        return normalize(sun+moon);
      }
      const sun=sweCalcUt(swed,jd,SE_SUN,tropical).xx[0];
      const moon=sweCalcUt(swed,jd,SE_MOON,tropical).xx[0];
      return normalize(moon-sun);
    };
    let solved:ReturnType<typeof bisectSwissRoot>;
    try{solved=bisectSwissRoot(target,root.jplRootMs,angleAt);}
    catch(error){
      throw Error("Wave3AR JPL/Swiss physical root clock divergence "+
        root.family+" "+new Date(root.jplRootMs).toISOString()+
        " target="+root.index+" "+String(error));
    }
    const info=byFamily[root.family];
    info.checked++;
    const delta=solved.deltaSeconds,abs=Math.abs(delta);
    const tier=rootDisagreementTier(abs);
    info.tiers[tier]++;
    info.largestAbsSeconds=Math.max(info.largestAbsSeconds,abs);
    info.meanSignedSeconds+=delta;
    const year=new Date(root.jplRootMs).getUTCFullYear() as 2026|2027|2028;
    info.years[year]++;
    info.worst.push({
      atUtc:new Date(root.jplRootMs).toISOString(),
      swissUtc:new Date(solved.swissRootUtcMs).toISOString(),
      offsetSeconds:+delta.toFixed(3),targetIndex:root.index
    });
    info.worst.sort((a,b)=>Math.abs(b.offsetSeconds)-Math.abs(a.offsetSeconds));
    if(info.worst.length>12)info.worst.length=12;
    evaluated++;
  }
}finally{sweClose(swed);}
if(evaluated!==roots.length||evaluated<7000)
  throw Error("Incomplete Wave3AR direct Swiss-versus-JPL global boundary audit");
const data=Object.fromEntries(Object.entries(byFamily).map(([family,info])=>[
  family,{...info,meanSignedSeconds:+(info.meanSignedSeconds/info.checked).toFixed(3),
    largestAbsSeconds:+info.largestAbsSeconds.toFixed(3)}
]));
const globalMaximum=Math.max(...Object.values(byFamily).map(x=>x.largestAbsSeconds));
const highRisk=Object.entries(data).flatMap(([family,row])=>
  row.worst.filter(x=>Math.abs(x.offsetSeconds)>120).map(x=>({family,...x})));
const report={
  wave:"3AR",status:"research-only",years:[2026,2027,2028],
  actualClockRootsCompared:evaluated,requiredCoverage:roots.length,
  JplSource:{
    kernelSha256:source.table.solarLunarKernelSha256,
    lunarRootsSha256:JPL_V6_ROOTS_ASSET_SHA256,
    siderealCatalogSha256:source.sourceDigest,
    LahiriAnchorSha256:source.lahiriAnchorDigest
  },
  method:"JPL DE440s pinned event UT vs Swiss/Moshier sweCalcUt same Lahiri SE_SIDM_LAHIRI; 30m brackets, 100ms bisection",
  family:data,largestAbsoluteRootOffsetSeconds:+globalMaximum.toFixed(3),
  mostSensitiveClockRoots:highRisk,
  scientificJudgment:{
    modelDifferenceIsNotAutomaticallyAnError:true,
    independentAyanamsaSourceApproved:false,
    ritualDatesReviewed:false,
    festivalVratMuhuratRecomputed:false,
    fullProductionV6Released:false,
    publicEngine:"V5 Swiss/Moshier"
  }
};
mkdirSync("artifacts",{recursive:true});
writeFileSync("artifacts/wave3ar-swiss-jpl-transition-clock-reconciliation.json",
  JSON.stringify(report,null,2)+"\n");
console.log("[Wave3AR CLOCKS] "+JSON.stringify({
  checked:evaluated,globalMaximumSeconds:report.largestAbsoluteRootOffsetSeconds,
  byFamily:Object.fromEntries(Object.entries(data).map(([f,v])=>[f,
    {checked:v.checked,maximumSeconds:v.largestAbsSeconds,over120sec:
      v.tiers["121-300s"]+v.tiers["301-600s"]+v.tiers[">600s"]}])),
  liveV5:true,ritualApproved:false
}));
