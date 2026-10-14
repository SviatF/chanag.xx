/**
 * Wave 3U: reproducible UT-vs-ET and Janmashtami night/observance diagnostic.
 * No public Vrat, daily Panchang, precompute shard or festival date changes.
 */
import {mkdirSync,writeFileSync} from "node:fs";
import {findCityBySlug} from "../lib/cities";
import {compareVratTimeScales} from "../lib/vrat-ut-et-diagnostic";
import {calculateVratCalendar} from "../lib/vrat";
import {getPanchang} from "../lib/panchang";
import {festivalNightEligibility} from "../lib/festival-night-eligibility";
import {festivalBySlugYear} from "../lib/festivals";
import {addIsoDays} from "../lib/india-time";

const output=process.argv.find(v=>v.startsWith("--report="))?.slice(9)||
  "artifacts/wave3u-ut-et-janmashtami-diagnostic.json";
const citySlugs=["delhi","mumbai","chennai","kolkata"] as const;
const dates=[
  "2026-06-29","2026-06-30","2026-07-01",
  "2026-09-04","2027-08-24","2027-08-25","2027-08-26","2027-10-29"
];
const issues:string[]=[];
const compared=[];
const janmashtami=[];
for(const slug of citySlugs){
  const city=findCityBySlug(slug);
  if(!city)throw Error("Unknown city "+slug);
  for(const date of dates){
    try{
      const comparison=compareVratTimeScales(city,date);
      const rows=calculateVratCalendar(
        "purnima",Number(date.slice(0,4)),city
      ).filter(r=>r.date===date);
      compared.push({
        ...comparison,legacySunrisePurnimaPublishedInVrat:rows.length>0,
        correctedPurnimaAtSunrise:comparison.utCorrectTithiIndex===14,
        sameTargetPurnima:comparison.utCorrectTithiIndex===14&&
          comparison.legacyTithiIndex===14,
        pendingProductionCorrection:"full-Panchang-Vrat-UT-normalization-requires-shard-regeneration-and-independent-local-sources"
      });
    }catch(error){issues.push(slug+"/"+date+": "+String(error))}
  }
  for(const year of [2026,2027] as const){
    const festival=festivalBySlugYear("janmashtami",year);
    if(!festival){issues.push("Missing Janmashtami "+year);continue}
    const data=await getPanchang(new Date(festival.date+"T06:00:00Z"),city);
    const following=await getPanchang(
      new Date(addIsoDays(festival.date,1)+"T06:00:00Z"),city);
    const screen=festivalNightEligibility("janmashtami",data,following);
    if(!screen||screen.status==="unverified")
      issues.push("Unresolved published Janmashtami local night "+slug+"/"+year);
    janmashtami.push({
      city:slug,year,maintainedDate:festival.date,
      rawFestivalDayTithi:data.tithi,rawFestivalDayPaksha:data.paksha,
      localSunrise:data.sunrise,localSunset:data.sunset,
      ashtamiEndLocal:data.tithiEnd,
      ashtamiEndLocalDate:data.tithiEndDate,
      nishitaPeriod:screen?.period??null,
      nishitaAshtamiOverlapStatus:screen?.status??"unverified",
      nishitaAshtamiOverlap:screen?.overlap??null,
      publishedDateDoesNotImplyAshtamiAtNishita:true,
      status:"astronomical-overlap-not-full-janmashtami-ritual-selection",
      selectedSmartaOrVaishnavaFastDay:null,
      paranaCertified:false,
      approvedCeremonyMuhurat:false
    });
  }
}
const deltaSamples=compared.map(x=>x.nextTransitionClockDriftSeconds).filter(
  (x):x is number=>x!==null);
const near=compared.filter(x=>x.withinFiveMinutesOfUtBoundary);
const disagreements=compared.filter(x=>x.localDateSelectionPotentiallyChanges);
const jan2027=janmashtami.filter(x=>x.year===2027);
const report={
  generatedAt:new Date().toISOString(),wave:"3U",
  status:"RESEARCH-ONLY-UT-ET-AND-JANMASHTAMI-CONVENTION-GAP",
  safeForCeremonyFiltering:false,
  productionSunriseTithiCorrectionsApplied:0,
  sourceMethod:"Swiss Ephemeris sweRiseTrans UT, sweCalcUt vs sweCalc (ET)",
  sunriseDatesChecked:compared.length,
  sampledCityCount:citySlugs.length,
  sampledDates:dates,
  mismatchAtSunriseCount:disagreements.length,
  mismatchExamples:disagreements,
  nearUTSunriseBoundaryCount:near.length,
  nearUTSunriseBoundaryRecords:near,
  comparableNextBoundaryCount:deltaSamples.length,
  nextBoundaryClockDriftSeconds:{
    min:deltaSamples.length?Math.min(...deltaSamples):null,
    max:deltaSamples.length?Math.max(...deltaSamples):null,
    mean:deltaSamples.length?
      Math.round(deltaSamples.reduce((a,b)=>a+b,0)/deltaSamples.length):null
  },
  sampledTimeScaleComparisons:compared,
  janmashtamiLocalNightChecks:janmashtami,
  janmashtami2027NoAshtamiAtNishita:jan2027.filter(x=>
    x.nishitaAshtamiOverlapStatus==="none").length,
  sourceObservation:{
    publisher:"Drik Panchang",
    locality:"Kalyan, Maharashtra, India (pinned geoname id 1268295)",
    url:"https://www.drikpanchang.com/dashavatara/lord-krishna/krishna-janmashtami-date-time.html?geoname-id=1268295",
    janmashtamiDate:"2027-08-25",
    ashtamiStartIst:"2027-08-24T20:24",
    ashtamiEndIst:"2027-08-25T19:19",
    rohiniStartIst:"2027-08-25T12:27",
    rohiniEndIst:"2027-08-26T11:42",
    nishitaAtKalyanStartIst:"2027-08-26T00:17",
    nishitaAtKalyanEndIst:"2027-08-26T01:02",
    note:"Publisher's Janmashtami date and next-day Nishita interval coexist with Ashtami having ended before Nishita. This is not a validated fast-selection algorithm."
  },
  gates:[
    "The legacy sweCalc() receives UTC/UT Julian days from sweRiseTrans, although sweCalc expects ET. The correct Swiss API for UT is sweCalcUt.",
    "Do not switch only Vrat or only Panchang to UT-correct; they share dates and the 48-shard/338-dataset V4 snapshot contract.",
    "A near-sunrise Tithi transition must use subminute UT instants, not an equality of two rounded HH:mm clock strings.",
    "Drik Nishita time in 2027 does not assert the Ashtami Tithi is active at Nishita; a festival-date selection is a different rule-family.",
    "Smarta and Vaishnava Janmashtami traditions and Rohini preference still require separately source-reviewed selectors.",
    "Any corrected public date requires a migration/versioned V4 data rebuild and external city-pinned regression sources. No automatic ritual approval."
  ],
  errors:issues
};
mkdirSync("artifacts",{recursive:true});
writeFileSync(output,JSON.stringify(report,null,2)+"\n");
console.log("[vrat-3u] sampled="+compared.length+
  " sunrise-state-differences="+disagreements.length+
  " near-UT-boundary="+near.length+" correct-minus-legacy-next-seconds="+
  JSON.stringify(report.nextBoundaryClockDriftSeconds));
for(const r of compared.filter(x=>x.city==="delhi"&&x.date==="2026-06-30"))
  console.log("[vrat-3u] DELHI 2026-06-30: "+JSON.stringify(r));
console.log("[festival-3u] 2027 Janmashtami: "+
  jan2027.filter(x=>x.nishitaAshtamiOverlapStatus==="none").length+
  "/"+jan2027.length+" no Ashtami/Nishita overlap in sampled cities; NOT proof of invalid Janmashtami date");
console.log("[vrat-3u] report="+output+" errors="+issues.length);
for(const error of issues.slice(0,8))console.error("[vrat-3u] FAIL "+error);
if(issues.length||compared.length!==citySlugs.length*dates.length||
  janmashtami.length!==citySlugs.length*2||
  deltaSamples.length===0||jan2027.some(x=>x.nishitaAshtamiOverlapStatus==="unverified"))
    process.exitCode=1;
