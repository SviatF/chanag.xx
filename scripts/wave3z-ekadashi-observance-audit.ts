/**
 * Wave 3Z - research-only Ekadashi/Janmashtami tradition gap audit.
 * Validates exact UT clocks, not a priest/sampradaya fasting or Parana date.
 */
import {mkdirSync,writeFileSync} from "node:fs";
import {findCityBySlug} from "../lib/cities";
import {compareEkadashiArunodaya,ARUNODAYA_MINUTES_BEFORE_SUNRISE} from "../lib/ekadashi-observance-research";
import {getPanchang} from "../lib/panchang";
import {festivalNightEligibility} from "../lib/festival-night-eligibility";
import {festivalBySlugYear} from "../lib/festivals";
import {addIsoDays} from "../lib/india-time";
import {wave3zMethodSources,wave3zSourceObservations} from "../tests/fixtures/wave3z-source-observations";

const target=process.argv.find(x=>x.startsWith("--report="))?.slice(9)||
  "artifacts/wave3z-ekadashi-tradition-parana-evidence.json";
const cities=["delhi","kanpur","mumbai","chennai"] as const;
const sampleDates=[
  "2026-11-20","2026-11-21","2027-01-03",
  "2027-01-18","2027-01-19","2027-09-11"
] as const;
const errors:string[]=[];
const ekadashiCases=[];
for(const slug of cities){
  const city=findCityBySlug(slug);
  if(!city){errors.push("Unsupported city "+slug);continue;}
  for(const date of sampleDates){
    try{
      const calculation=compareEkadashiArunodaya(city,date);
      const daily=await getPanchang(new Date(date+"T06:00:00Z"),city);
      if(daily.date!==date||daily.sunrise!==calculation.sunrise.time||
        (daily.paksha+" "+daily.tithi)!==calculation.sunriseTithi){
        errors.push(slug+"/"+date+" UT-correct daily Panchang mismatch");
      }
      if(calculation.hariVasara&&!calculation.hariVasara.validOrder)
        errors.push(slug+"/"+date+" Dwadashi temporal ordering invalid");
      if(calculation.chosenSmartaFastDate!==null||
        calculation.chosenVaishnavaFastDate!==null||
        calculation.chosenISKCONFastDate!==null||
        calculation.independentlyCertifiedFast||
        calculation.paranaWindowCertified||
        calculation.safeForCeremonyFiltering)
        errors.push(slug+"/"+date+" unacceptable ritual certification");
      const published=wave3zSourceObservations.filter(x=>x.city===slug&&x.date===date);
      ekadashiCases.push({...calculation,publishedFastEvidence:published.map(x=>({
        tradition:x.tradition,date:x.observedFastingDate,publisher:x.publisher,url:x.url,
        datePublicationVerifiedForCity:x.publishedCityPinned,
        independentAstronomicalMethodVerified:x.independentlyMethodCertified
      })),publisherFastDateVsSunriseTithiIsNotAutomaticContradiction:true});
    }catch(e){errors.push(slug+"/"+date+" "+String(e));}
  }
}
const janmashtami=[];
for(const slug of cities){
  const city=findCityBySlug(slug);
  if(!city)continue;
  for(const year of [2026,2027]){
    const festival=festivalBySlugYear("janmashtami",year);
    if(!festival){errors.push("Missing Janmashtami "+year);continue;}
    const current=await getPanchang(new Date(festival.date+"T06:00:00Z"),city);
    const following=await getPanchang(new Date(addIsoDays(festival.date,1)+"T06:00:00Z"),city);
    const screen=festivalNightEligibility("janmashtami",current,following);
    if(!screen||screen.status==="unverified"){
      errors.push(slug+"/"+year+" Janmashtami lunar-night screen unavailable");
    }
    janmashtami.push({
      city:slug,year,publishedDate:festival.date,
      sunriseTithi:current.paksha+" "+current.tithi,
      followingSunriseNakshatra:following.nakshatra,
      localNishitaAshtamiOverlap:screen?.status??"unverified",
      localNishita:screen?.period??null,
      rohiniAtNishita:null,
      sourceMatchedSmartaDay:null,
      sourceMatchedVaishnavaDay:null,
      localPujaWindowCertified:false,paranaCertified:false,
      outcome:"astronomical-overlap-only-no-tradition-day-selected"
    });
  }
}
const publisherDomains=new Set(wave3zSourceObservations.map(x=>new URL(x.url).hostname.replace(/^www\./,"")));
const citedSourceKeys=new Set(wave3zSourceObservations.map(x=>x.city+"|"+x.date+"|"+x.tradition));
if(publisherDomains.size!==1||wave3zSourceObservations.length!==3||
  citedSourceKeys.size!==3)errors.push("Publisher independence/date attribution inconsistency");
const report={
  createdAt:new Date().toISOString(),wave:"3Z",
  status:"RESEARCH-ONLY-TRADITION-OBSERVANCE-NOT-FAST-OR-PARANA-CERTIFICATION",
  calculation:"Swiss Ephemeris sweRiseTrans(UT) and sweCalcUt(UT); upper-limb refraction sunrise",
  arunodayaMinutesBeforeSunrise:ARUNODAYA_MINUTES_BEFORE_SUNRISE,
  cityCount:cities.length,dateSampleCount:sampleDates.length,
  mathematicalSamples:ekadashiCases.length,
  nearFiveMinuteBoundaryCount:ekadashiCases.filter(x=>x.nearFiveMinuteAstronomicalBoundary).length,
  dashamiAtArunodayaCount:ekadashiCases.filter(x=>x.dashamiArunodayaScreen==="dashami-at-arunodaya").length,
  sunriseArunodayaTithiDisagreements:ekadashiCases.filter(x=>x.sunriseAndArunodayaDisagree).length,
  nextSunriseDwadashiCases:ekadashiCases.filter(x=>x.dwadashiNextSunrise).length,
  sourceCaseCount:wave3zSourceObservations.length,
  publisherDomainCount:publisherDomains.size,
  independentlyMatchedCalendarImplementations:0,
  chosenOrApprovedFastDays:0,approvedParanaWindows:0,
  sourceMethodCautions:[
    "A published Smarta/Vaishnava/ISKCON fasting day need not equal the raw sunrise Ekadashi Tithi label.",
    "Arunodaya Dashami is a diagnostic screen only. Kshaya, Vriddhi, Mahadwadashi subtypes, regional sunrise definitions and GCal selection remain unimplemented.",
    "Hari Vasara first-quarter end is a calculated instant; a valid Parana additionally needs Pratahkal, Dwadashi and tradition-specific eligibility, reviewed against city-pinned independent calendars.",
    "A single publisher's multiple pages are ONE independent publisher, not a two-source proof.",
    "Neither a non-overlapping Nishita nor sunrise Ashtami alone settles Janmashtami Smarta/Vaishnava festival selection or Parana.",
    "The sampled cities/dates are targeted diagnostic examples, not a census or a license to expand SEO indexation."
  ],
  independentlyVerifiedCitySpecificRitualTime:false,
  fastOrCeremonyDateCertified:false,
  paranaCertified:false,
  safeForCeremonyFiltering:false,
  sourceObservations:wave3zSourceObservations,
  methodSources:wave3zMethodSources,
  ekadashiCases,janmashtami,
  errors
};
mkdirSync("artifacts",{recursive:true});
writeFileSync(target,JSON.stringify(report,null,2)+"\n");
console.log("[wave3z] cases="+ekadashiCases.length+" dates="+sampleDates.length+
  " cities="+cities.length+" arunodaya-dashami="+report.dashamiAtArunodayaCount+
  " mathematical-dawn-disagreements="+report.sunriseArunodayaTithiDisagreements+
  " publisher-domains="+publisherDomains.size);
console.log("[wave3z] Janmashtami="+janmashtami.length+
  " ritual-certified=0 parana-approved=0 report="+target+" errors="+errors.length);
for(const error of errors.slice(0,12))console.error("[wave3z] FAIL "+error);
if(errors.length||ekadashiCases.length!==cities.length*sampleDates.length||
  janmashtami.length!==cities.length*2||report.sourceCaseCount!==3)
  process.exitCode=1;
