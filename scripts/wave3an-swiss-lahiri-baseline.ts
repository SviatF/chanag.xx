/**
 * Wave 3AN: export EXACT same UT instants to compare Swiss/Moshier Lahiri
 * with the independent JPL DE440s apparent ecliptic of date. Baseline is
 * CI-only data; never used by user-facing calendar or SEO routes.
 *
 * Important: subtracting sweGetAyanamsaUt's MEAN offset from an apparent
 * JPL longitude would mix nutation conventions. Instead record the effective
 * apparent Lahiri correction from Swiss tropical-minus-sidereal positions at
 * the identical UT instant, and cross-check Sun-vs-Moon offsets.
 */
import {mkdirSync,writeFileSync} from "node:fs";
import {createDefaultSweData} from "@typescriptify/sweph/dist/types.js";
import {sweCalcUt,sweClose,sweSetSidMode} from "@typescriptify/sweph/dist/sweph.js";
import {SE_SUN,SE_MOON,SEFLG_MOSEPH,SEFLG_SIDEREAL,SE_SIDM_LAHIRI} from "@typescriptify/sweph/dist/constants.js";
import {cityBySlug} from "../lib/cities";
import {getPinnedV6HalfTithiTable,JPL_V6_ROOTS_ASSET_SHA256} from "../lib/jpl-v6-pinned-data";
import {getJplV6SunriseLunarCanary} from "../lib/jpl-v6-crossfamily-canary";
const CASES=[
 ["delhi","2026-06-30"],["kanpur","2026-11-21"],
 ["patna","2027-01-31"],["lucknow","2027-09-17"],
 ["mumbai","2027-03-17"],["chennai","2026-12-09"],
 ["kolkata","2027-10-25"],["bengaluru","2028-01-31"]
] as const;
const norm=(v:number)=>((v%360)+360)%360;
const circularDiff=(a:number,b:number)=>((a-b+540)%360)-180;
const JD_UNIX=2440587.5,DAY=86400000;
const table=getPinnedV6HalfTithiTable();
const events=new Map<string,{atUtc:string;tags:string[]}>();
for(const [slug,date] of CASES){
  const lunar=getJplV6SunriseLunarCanary(date,cityBySlug(slug),table);
  for(const [kind,atUtc] of [["sunrise",lunar.sunriseUtc],["previousNewMoon",lunar.previousNewMoonUtc]] as const){
    const existing=events.get(atUtc)??{atUtc,tags:[]};
    existing.tags.push(slug+":"+date+":"+kind);
    events.set(atUtc,existing);
  }
}
const swed=createDefaultSweData();
sweSetSidMode(swed,SE_SIDM_LAHIRI,0,0);
const samples=[];
try{
  for(const row of [...events.values()].sort((a,b)=>a.atUtc.localeCompare(b.atUtc))){
    const jd=JD_UNIX+Date.parse(row.atUtc)/DAY;
    const flags=SEFLG_MOSEPH;
    const sunT=sweCalcUt(swed,jd,SE_SUN,flags).xx[0];
    const moonT=sweCalcUt(swed,jd,SE_MOON,flags).xx[0];
    const sunS=sweCalcUt(swed,jd,SE_SUN,flags|SEFLG_SIDEREAL).xx[0];
    const moonS=sweCalcUt(swed,jd,SE_MOON,flags|SEFLG_SIDEREAL).xx[0];
    if([sunT,moonT,sunS,moonS].some(x=>!Number.isFinite(x)))throw Error("Nonfinite Swiss apparent baseline "+row.atUtc);
    const effectiveSun=norm(sunT-sunS),effectiveMoon=norm(moonT-moonS);
    const offsetDelta=Math.abs(circularDiff(effectiveSun,effectiveMoon))*3600;
    if(effectiveSun<20||effectiveSun>29||offsetDelta>300)
      throw Error("Inconsistent Lahiri apparent coordinate correction "+row.atUtc+" "+offsetDelta);
    samples.push({atUtc:row.atUtc,tags:row.tags,swiss:{
      tropicalSunDeg:norm(sunT),tropicalMoonDeg:norm(moonT),
      siderealSunDeg:norm(sunS),siderealMoonDeg:norm(moonS)
    },lahiriEffectiveDeg:effectiveSun,
      effectiveSunMoonOffsetDisagreementArcsec:offsetDelta});
  }
}finally{sweClose(swed);}
if(samples.length<12||samples.length>20)throw Error("Incomplete JPL/Swiss same-instant evidence");
const out={
  wave:"3AN",source:"Same instant Swiss/Moshier UT tropical-minus-sidereal Lahiri apparent correction",
  convention:"SE_SIDM_LAHIRI; SEFLG_MOSEPH; SEFLG_SIDEREAL; sweCalcUt",
  jplRootsSha256:JPL_V6_ROOTS_ASSET_SHA256,
  scienceCertified:false,productionSwitchAllowed:false,samples
};
mkdirSync("artifacts",{recursive:true});
writeFileSync("artifacts/wave3an-swiss-apparent-lahiri-baseline.json",JSON.stringify(out,null,2)+"\n");
console.log("[Wave3AN Swiss] samples="+samples.length+" offsetMaxArcsec="+Math.max(...samples.map(x=>x.effectiveSunMoonOffsetDisagreementArcsec)).toFixed(3)+" productionChange=false");
