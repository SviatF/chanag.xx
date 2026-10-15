/**
 * Wave 3AF: all supported cities × every India-local civil day in 2026–2028.
 * V6 CANARY only; does not mutate V5, rituals, shards, SEO or metadata.
 *
 * Global 6° JPL roots are exact table data from a SHA-pinned DE440s kernel.
 * Physical sunrise remains on the same Swiss apparent upper-limb convention
 * as current PANCHVANI; avoid mixing JPL USNO sunrise with V5 refraction.
 *
 * Compute a deterministic NOAA analytical approximate sunrise for every day.
 * Only expensive Swiss sunrise/longitude math where the nearest GLOBAL JPL
 * root falls within ±120 min of that approximation, or on deterministic
 * calibration rows. We assert analytical sunrise is within 35 minutes of
 * Swiss for every examined row; thus all sunrise Tithi flips with a JPL root
 * <=85 minutes of the physical sunrise are candidates if this bound holds.
 * This is a controlled, conservative SCREEN, not a formal global error bound.
 */
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {createDefaultSweData} from "@typescriptify/sweph/dist/types.js";
import {sweCalcUt,sweClose} from "@typescriptify/sweph/dist/sweph.js";
import {sweRiseTrans} from "@typescriptify/sweph/dist/swecl.js";
import {SE_SUN,SE_MOON,SEFLG_MOSEPH,SE_CALC_RISE} from "@typescriptify/sweph/dist/constants.js";
import {supportedCities,findCityBySlug} from "../lib/cities";
import {validateJplHalfTithiTable,jplHalfTithiAtMs} from "../lib/jpl-v6-tithi-karana-canary";

const tablePath=process.argv.find(x=>x.startsWith("--table="))?.slice(8)??"artifacts/wave3af-jpl-global-tithi-transitions.json";
const out=process.argv.find(x=>x.startsWith("--report="))?.slice(9)??"artifacts/wave3af-dynamic-v6-canary-impact.json";
const table=validateJplHalfTithiTable(JSON.parse(readFileSync(tablePath,"utf8")));
const rows=table.halfTithiTransitions;
const JD_ZERO=2440587.5,IST=330*60_000,DAY=86_400_000;
const DEG=Math.PI/180;
const PRE_FILTER_MIN=120,ERROR_GUARD_MIN=35;
const START=Date.UTC(2026,0,1),END=Date.UTC(2029,0,1);
const splitDate=(utcMs:number)=>new Date(utcMs).toISOString().slice(0,10);
const tithiNames=["Pratipada","Dvitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami","Navami","Dashami","Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Purnima"];
const label=(index:number)=>(index<15?"Shukla ":"Krishna ")+(index===29?"Amavasya":tithiNames[index%15]);
const swissIdx=(swed:ReturnType<typeof createDefaultSweData>,jd:number)=>{
  const sun=sweCalcUt(swed,jd,SE_SUN,SEFLG_MOSEPH).xx[0];
  const moon=sweCalcUt(swed,jd,SE_MOON,SEFLG_MOSEPH).xx[0];
  if(!Number.isFinite(sun)||!Number.isFinite(moon))
    throw Error("Nonfinite Swiss Sun-Moon longitude");
  return Math.floor(((((moon-sun)%360)+360)%360)/12);
};
function approximateSunriseIST(utcMidnightMs:number,lat:number,lng:number){
  const base=new Date(utcMidnightMs);
  const yearStart=Date.UTC(base.getUTCFullYear(),0,1);
  const dayOfYear=Math.floor((utcMidnightMs-yearStart)/DAY)+1;
  const daysInYear=(Date.UTC(base.getUTCFullYear()+1,0,1)-yearStart)/DAY;
  const gamma=2*Math.PI/daysInYear*(dayOfYear-1);
  const eq=229.18*(0.000075+0.001868*Math.cos(gamma)-0.032077*Math.sin(gamma)
    -0.014615*Math.cos(2*gamma)-0.040849*Math.sin(2*gamma));
  const decl=0.006918-0.399912*Math.cos(gamma)+0.070257*Math.sin(gamma)
    -0.006758*Math.cos(2*gamma)+0.000907*Math.sin(2*gamma)
    -0.002697*Math.cos(3*gamma)+0.00148*Math.sin(3*gamma);
  const latRad=lat*DEG;
  const cosHourAngle=(Math.cos(90.833*DEG)/(Math.cos(latRad)*Math.cos(decl))
                     -Math.tan(latRad)*Math.tan(decl));
  if(cosHourAngle<=-1||cosHourAngle>=1)
    throw Error("Non-Indian polar-night sunrise approximation "+lat+" "+lng);
  const angle=Math.acos(cosHourAngle)/DEG;
  // Local India civil midnight (UTC day 00:00 minus offset) plus IST clock.
  const minutesSinceLocalMidnight=720-4*(lng+angle)-eq+330;
  if(minutesSinceLocalMidnight<120||minutesSinceLocalMidnight>650)
    throw Error("Non-Indian approximate sunrise clock "+lat+" "+lng);
  return utcMidnightMs-IST+minutesSinceLocalMidnight*60_000;
}
function nearestRoot(at:number){
  let lo=0,hi=rows.length;
  while(lo<hi){
    const mid=(lo+hi)>>1;
    if(rows[mid][0]<at)lo=mid+1;else hi=mid;
  }
  const left=lo>0?rows[lo-1]:null;
  const right=lo<rows.length?rows[lo]:null;
  if(!left||!right)throw Error("JPL transition coverage incomplete "+new Date(at).toISOString());
  return Math.abs(at-left[0])<=Math.abs(right[0]-at)?left:right;
}
function utcIso(ms:number){return new Date(ms).toISOString();}
function istIso(ms:number){return new Date(ms+IST).toISOString().replace("Z","+05:30");}

const swed=createDefaultSweData();
// Multiple candidate records can share a slug. Dynamic routes resolve that
// slug using the canonical findCityBySlug() Map (last candidate wins), so the
// census MUST use the same observer coordinates as the actual URL runtime.
const uniqueSlugs=[...new Set(supportedCities.map(city=>city.slug))];
const cityList=uniqueSlugs.map(slug=>{
  const city=findCityBySlug(slug);
  if(!city)throw Error("Public runtime missing city slug "+slug);
  return city;
}).sort((a,b)=>a.slug.localeCompare(b.slug));
const duplicateCandidateSlugCount=supportedCities.length-cityList.length;
const observedCities=new Set();
if(cityList.length<400||cityList.length!==uniqueSlugs.length||
  new Set(cityList.map(c=>c.slug)).size!==cityList.length)
  throw Error("Incomplete canonical route-city expansion");
const details=[];
let cityDays=0,screened=0,samples=0,calibrationMaxSeconds=0,changed=0,nearestFiveMin=0;
let unfilteredControlAgreement=0;
const reviewedGroups:Record<string,number>={};
const reviewedCandidateMonths=new Set<string>();
const errors=[];
const perYear:Record<string,{days:number;physicalSunrises:number;modelFlips:number}>={};
try {
  for(const city of cityList){
    observedCities.add(city.slug);
    for(let localDayMidnight=START;localDayMidnight<END;localDayMidnight+=DAY){
      const date=splitDate(localDayMidnight);
      const year=date.slice(0,4);
      const accumulator=perYear[year]??{days:0,physicalSunrises:0,modelFlips:0};
      perYear[year]=accumulator;
      cityDays++;accumulator.days++;
      const estimate=approximateSunriseIST(localDayMidnight,city.lat,city.lng);
      const approxNearRoot=nearestRoot(estimate);
      const near=Math.abs(approxNearRoot[0]-estimate)<=PRE_FILTER_MIN*60_000;
      const calibration=((Math.floor((localDayMidnight-START)/DAY)%93)===0);
      if(!near&&!calibration)continue;
      const jd0=(localDayMidnight-IST)/DAY+JD_ZERO;
      const rise=sweRiseTrans(swed,jd0,SE_SUN,null,SEFLG_MOSEPH,SE_CALC_RISE,
        [city.lng,city.lat,0],1013.25,25,null);
      if(rise.retval<0||!Number.isFinite(rise.tret))
        throw Error("Missing city sunrise "+city.slug+" "+date);
      const physicalSunriseMs=(rise.tret-JD_ZERO)*DAY;
      if(splitDate(physicalSunriseMs+IST)!==date)
        throw Error("Swiss sunrise wrong India date "+city.slug+" "+date);
      const err=Math.abs(physicalSunriseMs-estimate)/1000;
      calibrationMaxSeconds=Math.max(calibrationMaxSeconds,err);
      if(err>ERROR_GUARD_MIN*60)
        throw Error("NOAA coarse sunrise outside 35min safety envelope "+city.slug+" "+date+" "+err);
      if(calibration)samples++;
      accumulator.physicalSunrises++;
      const actualRoot=nearestRoot(physicalSunriseMs);
      if(!near){
        // This sparse, independent calibration guard catches unexpected
        // missed model flips well outside our conservative candidate window.
        const j=jplHalfTithiAtMs(table,physicalSunriseMs).tithiIndex;
        const sw=swissIdx(swed,rise.tret);
        if(j!==sw)throw Error("V6 model flip outside candidate window "+city.slug+" "+date);
        unfilteredControlAgreement++;
        continue;
      }
      screened++;
      const jpl=jplHalfTithiAtMs(table,physicalSunriseMs);
      const swiss=swissIdx(swed,rise.tret);
      const flip=swiss!==jpl.tithiIndex;
      if(flip&&!(Math.abs(swiss-jpl.tithiIndex)===1||Math.abs(swiss-jpl.tithiIndex)===29))
        throw Error("Impossible non-adjacent lunar Tithi disagreement "+city.slug+" "+date);
      if(Math.abs(actualRoot[0]-physicalSunriseMs)<=5*60_000)nearestFiveMin++;
      if(flip){changed++;accumulator.modelFlips++;}
      // Keep ALL flips, and near-boundary evidence (<=3min) in a bounded
      // artifact; no 100k massive list for routine nonflipping days.
      if(flip||Math.abs(actualRoot[0]-physicalSunriseMs)<=3*60_000){
        details.push({
          city:city.slug,date,lat:city.lat,lng:city.lng,
          swissSunriseUtc:utcIso(physicalSunriseMs),
          swissSunriseIst:istIso(physicalSunriseMs),
          approximateSunriseErrorSeconds:+err.toFixed(3),
          jplNearestHalfPhaseTransitionUtc:utcIso(actualRoot[0]),
          rootMinusSunriseSeconds:+((actualRoot[0]-physicalSunriseMs)/1000).toFixed(3),
          swissTithi:label(swiss),jplTithi:label(jpl.tithiIndex),
          jplKaranaHalfPhaseIndex:jpl.karanaIndex,
          jplNextKaranaUtc:jpl.nextKaranaBoundaryUtc,
          jplNextTithiUtc:jpl.nextTithiBoundaryUtc,
          modelTithiFlip:flip,
          ritualCertified:false,
          automaticallyApplied:false
        });
      }
      if(flip){
        const key=year+"-"+date.slice(5,7);
        reviewedGroups[key]=(reviewedGroups[key]??0)+1;
      }
      reviewedCandidateMonths.add(date.slice(0,7));
    }
    if(observedCities.size%100===0){
      console.log("[3af-progress] city="+observedCities.size+"/"+cityList.length+
        " allDates="+cityDays+" coarseCandidates="+screened+" modelFlips="+changed);
    }
  }
} finally{sweClose(swed);}
const expectedDays=(END-START)/DAY*cityList.length;
if(cityDays!==expectedDays||screened<1000||samples<1000||screened>cityDays||
  observedCities.size!==cityList.length)
  throw Error("Incomplete dynamic V6 city-day census "+JSON.stringify({cityDays,screened,samples,expectedDays}));
details.sort((a,b)=>a.date.localeCompare(b.date)||a.city.localeCompare(b.city));
const flips=details.filter(d=>d.modelTithiFlip);
if(flips.length!==changed)throw Error("V6 flip list incomplete");
for(const [slug,date,sw,j] of [
  ["kanpur","2026-11-21","Shukla Dwadashi","Shukla Ekadashi"],
  ["patna","2027-01-31","Krishna Dashami","Krishna Navami"]
]){
  const r=flips.find(d=>d.city===slug&&d.date===date);
  if(!r||r.swissTithi!==sw||r.jplTithi!==j)
    throw Error("Known real JPL disagreement missing from dynamic audit "+slug+" "+date);
}
const report={
  wave:"3AF",
  source:"JPL DE440s SHA-pinned 6° true-ecliptic/apparent global Tithi/Karana table",
  sunriseObserverConvention:"current V5 Swiss upper-limb + 1013.25 hPa, 25 C, sea-level",
  scope:{
    years:[2026,2027,2028],supportedCityCount:cityList.length,
    duplicateCandidateSourceSlugsResolvedByCanonicalCityLookup:duplicateCandidateSlugCount,
    totalSupportedCityDaysEnumerated:cityDays,
    completeForArbitraryYearsOutside2026To2028:false,
    includesAllCurrentlySupportedCities:true,
    independentPhysicalSunrisesCalculated:screened+unfilteredControlAgreement,
    conservativeNOAASunriseApproximation:true,
    numericalPrefilterMinutes:PRE_FILTER_MIN,
    checkedApproximateSunriseErrorMaxSeconds:+calibrationMaxSeconds.toFixed(3),
    approximationErrorGuardMinutes:ERROR_GUARD_MIN,
    guaranteedTransitionCandidateWindowIfGuardHoldsMinutes:PRE_FILTER_MIN-ERROR_GUARD_MIN,
    deterministicUnfilteredControlDays:samples,
    unfilteredControlsWithModelAgreement:unfilteredControlAgreement,
    checkedCandidates:screened,
    physicalSunriseWithin5MinutesOfJplPhaseBoundary:nearestFiveMin,
    modelFlipCount:changed,
    monthsContainingModelFlips:reviewedGroups,
    candidatesReviewedByMonth:[...reviewedCandidateMonths].sort(),
    countsByYear:perYear
  },
  modelFlipRows:flips,
  near3MinAdditionalRows:details.filter(d=>!d.modelTithiFlip),
  productionGate:{
    v6TithiAndKaranaCanaryFunctionReady:true,
    jplTableGeneratedOnlyInCI:true,
    tithiTransitionLookupSharedAcrossCities:true,
    productionPanchangStillV5:true,
    productionVratStillV5:true,
    muhuratSnapshotsStillV5:true,
    incompleteOtherLunarComponents:["Nakshatra","Yoga","Rashi","Amanta/VikramSamvat rules","Puja tradition selectors"],
    cannotAutoSwitchProduction:true,
    requiresCanaryEndToEndOutputConsistencyAndCompleteShardRebuild:true,
    ritualFastingApproved:false
  }
};
mkdirSync("artifacts",{recursive:true});
writeFileSync(out,JSON.stringify(report,null,2)+"\n");
console.log("[3af-summary] cities="+cityList.length+" dates="+cityDays+
  " candidates="+screened+" sampledControls="+samples+
  " maxNOAAErrorSeconds="+report.scope.checkedApproximateSunriseErrorMaxSeconds+
  " flipCount="+changed+" near5min="+nearestFiveMin);
console.log("[3af-summary] flipsByMonth="+JSON.stringify(reviewedGroups)+
  " byYear="+JSON.stringify(perYear)+" output="+out);
for(const r of flips.slice(0,80))
  console.log("[3af-FLIP] "+r.date+" "+r.city+" Swiss="+r.swissTithi+
    " JPL="+r.jplTithi+" gap="+r.rootMinusSunriseSeconds+"s");
