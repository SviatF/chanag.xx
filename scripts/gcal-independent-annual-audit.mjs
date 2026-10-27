/**
 * Fetch original GCal 11 Build 5 yearly TXT exports (public, third-party
 * publication using the GCal program) and reconcile each *full year* against
 * PANCHVANI's sunrise-only Ekadashi observations. RESEARCH ONLY.
 *
 * Writes only derived data / provenance, never republishes the source files.
 * A network failure or mismatched source heading is "unverified", not "pass".
 */
import {mkdirSync,writeFileSync} from "node:fs";
import {parseGcalAnnualText} from "../lib/gcal-annual-parser.mjs";
import {calculateVratCalendar} from "../lib/vrat.ts";
import {findCityBySlug} from "../lib/cities.ts";
import {compareEkadashiArunodaya} from "../lib/ekadashi-observance-research.ts";

const SITE="https://www.vaisnavacalendar.info";
const cityMap=[
  {slug:"delhi",published:"Delhi"},
  {slug:"mumbai",published:"Bombay"},
  {slug:"chennai",published:"Madras"},
  {slug:"kolkata",published:"Calcutta"},
  {slug:"pune",published:"Pune"},
];
const years=[2026,2027];
const out=process.argv.find(v=>v.startsWith("--out="))?.slice(6)??"artifacts/gcal-11-independent-yearly.json";
const issues=[],series=[];
const timeout=(ms)=>AbortSignal.timeout(ms);
async function fetchText(uri){
 let error;
 for(let attempt=0;attempt<3;attempt++){
  try{
   const response=await fetch(uri,{signal:timeout(28000),headers:{"user-agent":"Panchvani-independent-calendar-auditor/1.0 (research; source review)","accept":"text/plain,text/html;q=0.9,*/*;q=0.7"}});
   if(!response.ok)throw Error("HTTP "+response.status);
   const data=await response.text();
   if(!data||data.length<400)throw Error("Empty/too-small export");
   return data;
  }catch(e){error=e;}
 }
 throw Error("Failed to retrieve "+new URL(uri).pathname+": "+String(error));
}
function decodeHtml(s){return s.replace(/&amp;/g,"&").replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n)));}
function matchingDownloadHref(html,city,year){
 const regex=/<a\b[^>]*href\s*=\s*(["'])(.*?)\1[^>]*>[\s\S]*?<\/a>/gi;
 for(const match of html.matchAll(regex)){
   const href=decodeHtml(match[2]),u=new URL(href,SITE);
   let name;
   try{name=decodeURIComponent(u.pathname.split("/").at(-1));}catch{continue}
   if(name!==city+" [India].txt")continue;
   if(u.hostname!=="www.vaisnavacalendar.info"&&u.hostname!=="vaisnavacalendar.info")continue;
   if(!u.pathname.includes("/wp-content/uploads/calendars/"+year+"/"))continue;
   return u.href;
 }
 throw Error("No safe, city-specific GCal TXT link for "+city+" "+year);
}
function paranaFlags(pair){
 const reasons=[pair.parana?.startReason??"",pair.parana?.endReason??""].join("|").toLowerCase();
 return {
  firstQuarterTithi:reasons.includes("1/4 of tithi"),
  sourceOpenEnded:!!pair.parana?.openEnded,
  endOfTithi:reasons.includes("end of tithi"),
  endOfNakshatra:reasons.includes("end of naksatra"),
  oneThirdDaylight:reasons.includes("1/3 of daylight"),
  sunriseRestricted:reasons.includes("sunrise"),
  dayAfterDwadashi:pair.dwadashiExpiredBeforeParanaSunrise,
  vedhaOrUnmilani:pair.prevNotSuitable,
  mahadvadasi:pair.mahadvadasi.length>0
 };
}
for(const year of years){
 const indexUrl=SITE+"/calendar-file-downloads/txt-calendar-files-"+year;
 let html;
 try{html=await fetchText(indexUrl);}catch(e){issues.push("index/"+year+": "+String(e));continue;}
 for(const item of cityMap){
  const city=findCityBySlug(item.slug);
  if(!city){issues.push(item.slug+"/"+year+": unsupported city registry");continue;}
  try{
   const url=matchingDownloadHref(html,item.published,year);
   const source=await fetchText(url);
   const parsed=parseGcalAnnualText(source,{city:item.published,year});
   const expected=year%4===0&&year%100!==0||year%400===0?366:365;
   if(parsed.summary.days!==expected)issues.push(item.slug+"/"+year+": expected "+expected+" civil days, got "+parsed.summary.days);
   if(parsed.warnings.length)issues.push(item.slug+"/"+year+": "+parsed.warnings.join(", "));
   if(parsed.summary.unparsedParana)issues.push(item.slug+"/"+year+": "+parsed.summary.unparsedParana+" unparsed Parana shape(s)");
   if(parsed.pairs.some(x=>x.paranaUnpaired)&&!parsed.pairs.every(x=>!x.paranaUnpaired||x.fastDate.endsWith("-12-31")))
      issues.push(item.slug+"/"+year+": unpaired source fast(s)");
   const sunrise=calculateVratCalendar("ekadashi",year,city).map(x=>x.date);
   const sunriseSet=new Set(sunrise);
   const gcalSet=new Set(parsed.fasts.map(x=>x.date));
   const fastingOutsideSunrise=parsed.pairs.filter(x=>!sunriseSet.has(x.fastDate));
   const sunriseWithoutFast=sunrise.filter(x=>!gcalSet.has(x));
   // Vedha/Mahadvadasi & Dwadashi-after-sunrise classification is performed
   // from actual GCal daily+Parana rows, not inferred from a single Tithi name.
   const special=parsed.pairs.filter(p=>{
    const v=paranaFlags(p);
    return v.firstQuarterTithi||v.endOfTithi||v.endOfNakshatra||v.dayAfterDwadashi||v.vedhaOrUnmilani||v.mahadvadasi||v.sourceOpenEnded;
   });
   // Independent mathematical diagnosis for only decisive special cases; NOT
   // a replacement for GCal's multi-phase tradition selection.
   const diagnostics=[];
   for(const event of special){
    try{
     const d=compareEkadashiArunodaya(city,event.fastDate);
     diagnostics.push({date:event.fastDate,arunodayaScreen:d.dashamiArunodayaScreen,
       sunriseTithi:d.sunriseTithi,followingSunriseTithi:d.followingSunriseTithi,
       nearFiveMinuteBoundary:d.nearFiveMinuteAstronomicalBoundary,
       hariVasaraFirstQuarter:d.hariVasara?.firstQuarterEnds??null,
       suggestedFastDate:null,certifiedParana:false});
    }catch(e){issues.push(item.slug+"/"+year+"/"+event.fastDate+": diagnostic "+String(e));}
   }
   series.push({
    city:item.slug,year,source:{url,origin:"third-party-export-GCal-11-build5",
     publishedCity:item.published,software:parsed.source.software,
     independence:"independent-calendar-software-export-not-automatically-GBC-endorsed-or-method-certified"},
    summary:parsed.summary,sourceWarnings:parsed.warnings,
    sunriseObservationCount:sunrise.length,sourceFastCount:parsed.fasts.length,
    fastOutsideSunrise:fastingOutsideSunrise.map(x=>x.fastDate),
    sunriseTithiWithoutGcalFast:sunriseWithoutFast,
    vedhaExcludedDates:parsed.ineligibleEkadashi,
    // All annual events are retained for source-by-source reconciliation.
    observedFasts:parsed.pairs.map(x=>({
      date:x.fastDate,fastSunriseTithi:x.fastSunriseTithi,
      sourceSubtype:x.mahadvadasi,paranaDate:x.paranaDate,
      paranaSunriseTithi:x.paranaSunriseTithi,
      sourceParana:x.parana,flags:paranaFlags(x),
      ritualCertification:false
    })),
    exceptionDiagnostics:diagnostics,
    independentlyCertifiedForPublicDateSelection:false,
    independentlyCertifiedParanaEngine:false
   });
  }catch(e){issues.push(item.slug+"/"+year+": "+String(e));}
 }
}
const report={
 generatedAt:new Date().toISOString(),
 study:"GCal 11 export versus PANCHVANI sunrise Ekadashi + arunodaya research",
 years,cityCount:cityMap.length,expectedCityYears:cityMap.length*years.length,
 completedCityYears:series.length,
 status:issues.length?"RESEARCH_INCOMPLETE":series.length===cityMap.length*years.length?"RESEARCH_ANNUAL_RECONCILIATION_COMPLETE_NOT_RITUAL_CERTIFIED":"RESEARCH_INCOMPLETE",
 publicationApproved:false,smartaRuleEngineComplete:false,iskconRuleEngineComplete:false,
 paranaEngineCertified:false,mahadvadasiMethodCertified:false,
 notes:[
 "GCAL TXT exports include Ekadasi or Dvadasi fasting, Mahadvadasi and observed Parana start/end reason labels.",
 "A published Ekadasi labelled not suitable for fasting is not automatically a proved Dashami-Vedha; inspect GCal event classification.",
 "Some Parana windows terminate at Nakshatra, have a one-minute published duration, or provide only an open-ended lower bound.",
 "PANCHVANI sunrise Tithi is an astronomical observation, not the ISKCON fast selector.",
 "Dates differing across systems must be reviewed, not blindly corrected to match another program.",
 "The source is a third party publishing exported GCal 11 Build 5 files; it is not an independent execution of local GCal binary.",
 "GCAL export reports LT/DST; no timezone conversions have been applied without source-locality validation.",
 "Full local GCal binary execution and a second independently implemented rule engine remain release blockers."
 ],
 issues,series
};
mkdirSync("artifacts",{recursive:true});
writeFileSync(out,JSON.stringify(report,null,2)+"\n");
console.log("[gcal-oracle] status="+report.status+" city-years="+series.length+"/"+report.expectedCityYears+" issues="+issues.length+" report="+out);
for(const s of series)console.log("[gcal-oracle] "+s.city+"/"+s.year+" days="+s.summary.days+" fasts="+s.sourceFastCount+" parana="+s.summary.paranaEvents+" vedha="+s.summary.vedhaExclusions+" mahadvadasi="+s.summary.mahadvadasi+" firstQuarter="+s.summary.paranaStartQuarter+" noDwadashiAtSunrise="+s.summary.dwadashiEndedBeforeSunrise+" outsideSunrise="+s.fastOutsideSunrise.length);
for(const err of issues)console.error("[gcal-oracle] "+err);
if(issues.length||series.length!==cityMap.length*years.length)process.exitCode=1;
