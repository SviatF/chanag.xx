/**
 * Wave 3AC: independent astronomical model comparison, never an automatic
 * vote to rewrite a ritual calendar date.
 *
 * Compares the 3AB Swiss/Moshier UT exact-second diagnostic with a separately
 * implemented Brown lunar theory / Astronomy Engine rise-set library. The
 * model difference is evidence ABOUT uncertainty, not absolute truth.
 */
import {mkdirSync,writeFileSync} from "node:fs";
import {cityBySlug} from "../lib/cities";
import {getPanchang} from "../lib/panchang";
import {compareSunriseConventions} from "../lib/sunrise-convention-differential";
import {independentAstronomicalCheck,independentTithiIndexAt} from "../lib/wave3ac-independent-astronomy";
import {patnaJan2027PublishedClocks} from "../tests/fixtures/patna-wave3ab-observations";

const path=process.argv.find(x=>x.startsWith("--report="))?.slice("--report=".length)||
  "artifacts/wave3ac-independent-astronomy-evidence.json";
const issues:string[]=[];
const patna=cityBySlug("patna");
const date="2027-01-31";
const swiss=compareSunriseConventions(patna,date);
const independent=independentAstronomicalCheck(patna,date,288);
const daily=await getPanchang(new Date(date+"T06:00:00Z"),patna);
const swissSunriseMs=Date.parse(swiss.defaultApparentUpperLimb.sunrise.utc);
const swissBoundaryMs=Date.parse(swiss.defaultApparentUpperLimb.previousTithiEnds.utc);
const independentBoundaryMs=independent.independentPhase288Boundary?.unixMs;
if(independentBoundaryMs===undefined)issues.push("Independent 288-degree lunar root missing");
const sunriseDeltaSeconds=Math.round((independent.independentRise.unixMs-swissSunriseMs)/1000);
const lunarBoundaryDeltaSeconds=independentBoundaryMs===undefined?null:
  Math.round((independentBoundaryMs-swissBoundaryMs)/1000);
const swissTithiAtIndependentRise=independent.independentRise.unixMs>=swissBoundaryMs?
  "Krishna Dashami":"Krishna Navami";
const independentTithiAtSwissRise=independentTithiIndexAt(new Date(swissSunriseMs));
const independentTithiAtSwissSunriseName=independentTithiAtSwissRise===24?
  "Krishna Dashami":independentTithiAtSwissRise===23?
  "Krishna Navami":"other index "+independentTithiAtSwissRise;
const comparison={
  city:"patna",date,
  observer:{latitude:patna.lat,longitude:patna.lng,heightMeters:0},
  swissUtMoshier:swiss,
  independentAstronomyEngine:independent,
  productionDailyPanchang:{
    date:daily.date,tithi:daily.paksha+" "+daily.tithi,
    sunriseRoundedToMinute:daily.sunrise
  },
  deltaSeconds:{
    independentMinusSwissSunrise:sunriseDeltaSeconds,
    independentMinusSwissNavamiToDashami:lunarBoundaryDeltaSeconds
  },
  crossModelStateAtSunrise:{
    swissLunarAtSwissSunrise:swiss.defaultApparentUpperLimb.tithi,
    independentLunarAtSwissSunrise:independentTithiAtSwissSunriseName,
    swissLunarAtIndependentSunrise:swissTithiAtIndependentRise,
    independentLunarAtIndependentSunrise:independent.independentlyCalculatedTithiAtRise
  },
  allFourModelAndSunriseCombinationsAgreeOnDashami:[
    swiss.defaultApparentUpperLimb.tithi,
    independentTithiAtSwissSunriseName,
    swissTithiAtIndependentRise,
    independent.independentlyCalculatedTithiAtRise
  ].every(value=>value==="Krishna Dashami"),
  independentlyReproducedSameSunriseTithi:swiss.defaultApparentUpperLimb.tithi===
    independent.independentlyCalculatedTithiAtRise,
  independentlyReproducedNavamiEndWithin60Seconds:
    lunarBoundaryDeltaSeconds!==null&&Math.abs(lunarBoundaryDeltaSeconds)<=60,
  publishedExternalData:patnaJan2027PublishedClocks,
  independentPublishedMatchedMinuteAndMethod:false,
  exactSecondThirdPublisherMatch:false,
  certifiedTraditionDay:false,
  productionOverridePermitted:false
};
if(daily.paksha+" "+daily.tithi!==swiss.defaultApparentUpperLimb.tithi)
  issues.push("Swiss production no longer matches Wave 3AB reference");
if(!independent.independentBoundaryChronologyValid)
  issues.push("Independent 288-degree phase root failed internal order");
if(sunriseDeltaSeconds< -900||sunriseDeltaSeconds>900)
  issues.push("Independent model sunrise deviates over 15 minutes — incompatible observer assumptions");
if(lunarBoundaryDeltaSeconds!==null&&Math.abs(lunarBoundaryDeltaSeconds)>3600)
  issues.push("Independent lunar phase model transition deviates over one hour — likely wrong angle convention");
if(new Set(patnaJan2027PublishedClocks.map(x=>x.domain)).size!==4)
  issues.push("Independent published source ledger mutated");

const vedhaDays=["2026-05-26","2027-10-25"];
const vedhaCities=["delhi","kanpur","mumbai","chennai"];
const vedha=[] as Array<{
  date:string;city:string;
  independentRise:string;swissRise:string;independentRiseMinusSwissSeconds:number;
  independentLunarAtSwissArunodayaIndex:number;
  independentLunarAtIndependentArunodayaIndex:number;
  independentLunarAtIndependentSunriseIndex:number;
  swissArunodayaTithi:string;
  independentDashamiAtSwissArunodaya:boolean;
  independentDashamiAtIndependentArunodaya:boolean;
  independentEkadashiAtIndependentSunrise:boolean;
  modelSensitive:boolean;
  traditionFastApproved:false;paranaApproved:false;
}>;
for(const d of vedhaDays){
  for(const slug of vedhaCities){
    const city=cityBySlug(slug);
    const s=compareSunriseConventions(city,d);
    const i=independentAstronomicalCheck(city,d,null);
    const atSwissArunodaya=independentTithiIndexAt(new Date(s.defaultApparentUpperLimb.arunodaya96MinutesBeforeSunrise.utc));
    const atIndependentArunodaya=independentTithiIndexAt(new Date(i.independentRise.unixMs-96*60_000));
    const independentAtRise=i.independentTithiAtRiseIndex;
    const isDashami=(n:number)=>n===9||n===24;
    const isEkadashi=(n:number)=>n===10||n===25;
    const swRiseTithi=s.defaultApparentUpperLimb.tithi;
    const observedSunrise=new Date(i.independentRise.unixMs-96*60_000);
    if(!Number.isFinite(observedSunrise.getTime())||
      !swRiseTithi.endsWith("Ekadashi")||
      !s.defaultApparentUpperLimb.arunodayaTithi.endsWith("Dashami"))
      issues.push("3AB Vedha fixed-case invariants changed "+slug+" "+d);
    const data={
      date:d,city:slug,
      independentRise:i.independentRise.ist,
      swissRise:s.defaultApparentUpperLimb.sunrise.ist,
      independentRiseMinusSwissSeconds:Math.round((i.independentRise.unixMs-Date.parse(s.defaultApparentUpperLimb.sunrise.utc))/1000),
      independentLunarAtSwissArunodayaIndex:atSwissArunodaya,
      independentLunarAtIndependentArunodayaIndex:atIndependentArunodaya,
      independentLunarAtIndependentSunriseIndex:independentAtRise,
      swissArunodayaTithi:s.defaultApparentUpperLimb.arunodayaTithi,
      independentDashamiAtSwissArunodaya:isDashami(atSwissArunodaya),
      independentDashamiAtIndependentArunodaya:isDashami(atIndependentArunodaya),
      independentEkadashiAtIndependentSunrise:isEkadashi(independentAtRise),
      modelSensitive:!(isDashami(atSwissArunodaya)&&isDashami(atIndependentArunodaya)&&isEkadashi(independentAtRise)),
      traditionFastApproved:false as const,paranaApproved:false as const
    };
    if(Math.abs(data.independentRiseMinusSwissSeconds)>900)
      issues.push("Vedha city independent sunrise >15 min different "+slug+"/"+d);
    vedha.push(data);
  }
}
if(vedha.length!==8)issues.push("Vedha independently checked case count != 8");
const report={
  wave:"3AC",createdAt:new Date().toISOString(),
  independentEphemeris:"astronomy-engine@2.1.19",
  sourceCode:"https://github.com/cosinekitty/astronomy",
  lunarTheory:"Brown's Improved Lunar Ephemeris / 1954 (not Swiss/Moshier)",
  sunrise:"Astronomy Engine SearchRiseSet apparent upper limb, usual refraction (not identical Swiss atmosphere settings)",
  sourceIndependentFromSwiss:true,
  exactRiseAndTithiTransitionInstantsToSeconds:true,
  calibratedAstrometricAccuracy:false,
  independentTraditionalCalendarValidation:false,
  patna:comparison,
  vedha:{
    cases:vedha,
    total:vedha.length,
    modelSensitiveCount:vedha.filter(x=>x.modelSensitive).length,
    robustArithmeticScreensAcrossBothModels:vedha.filter(x=>!x.modelSensitive).length,
    certifiedSmartaFasts:0,certifiedISKCONFasts:0,approvedParanaWindows:0
  },
  releaseDecision:{
    astronomicalEngineChanged:false,
    publicCuratedDatesChanged:false,
    independentPublisherMethodAndObserverAgreementProven:false,
    fastOrPujaDaysCertified:false,
    PatnaSourceConflictClosed:false,
    safeToFilterCeremony:false,
    followUp:"Review disagreement against JPL high-precision ephemeris and published city-local observer method before changing production; fetch independent GCal/Smarta ritual date outputs before fast/Parana selectors."
  },errors:issues
};
mkdirSync("artifacts",{recursive:true});
writeFileSync(path,JSON.stringify(report,null,2)+"\n");
const time=(str:string)=>str.slice(11,19);
console.log("[3ac-patna] swiss-sunrise="+time(swiss.defaultApparentUpperLimb.sunrise.ist)+
  " independent-sunrise="+time(independent.independentRise.ist)+
  " delta="+sunriseDeltaSeconds+"s");
console.log("[3ac-patna] swiss-transition="+time(swiss.defaultApparentUpperLimb.previousTithiEnds.ist)+
  " independent-transition="+(independent.independentPhase288Boundary?time(independent.independentPhase288Boundary.ist):"MISSING")+
  " delta="+lunarBoundaryDeltaSeconds+"s");
console.log("[3ac-patna] swiss@swiss="+comparison.crossModelStateAtSunrise.swissLunarAtSwissSunrise+
  " independent@swiss="+comparison.crossModelStateAtSunrise.independentLunarAtSwissSunrise+
  " swiss@independent="+comparison.crossModelStateAtSunrise.swissLunarAtIndependentSunrise+
  " independent@independent="+comparison.crossModelStateAtSunrise.independentLunarAtIndependentSunrise);
console.log("[3ac-vedha] samples="+vedha.length+" robust-across-two-models="+report.vedha.robustArithmeticScreensAcrossBothModels+
  " model-sensitive="+report.vedha.modelSensitiveCount);
for(const r of vedha)console.log("[3ac-vedha] "+r.date+" "+r.city+" sensitive="+r.modelSensitive+
  " atSwissArunodaya="+r.independentLunarAtSwissArunodayaIndex+
  " atIndependentArunodaya="+r.independentLunarAtIndependentArunodayaIndex+
  " atIndependentSunrise="+r.independentLunarAtIndependentSunriseIndex);
console.log("[3ac] no-production-override=true report="+path+" errors="+issues.length);
for(const e of issues)console.error("[3ac] FAILURE "+e);
if(issues.length)process.exitCode=1;
