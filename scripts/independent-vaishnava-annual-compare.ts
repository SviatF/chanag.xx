/**
 * Derived *independent-rule* annual screen from original city coordinates.
 * Reads a prior native GCal artifact as an oracle. Does not parse or reuse GCal
 * decisions to derive its own classification: our candidate is based on Swiss
 * astronomy, then compared with the actual GCal fast set.
 */
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {findCityBySlug} from "../lib/cities";
import {compareEkadashiArunodaya} from "../lib/ekadashi-observance-research";
import {calculateVratCalendar} from "../lib/vrat";
import {addIsoDays} from "../lib/india-time";
import {independentlyScreenVaishnavaDay} from "../lib/independent-vaishnava-rule-screen";
const input=process.argv.find(x=>x.startsWith("--input="))?.slice(8);
if(!input)throw Error("Must provide genuine native GCal JSON via --input");
const source=JSON.parse(readFileSync(input,"utf8"));
if(source.researchOnly!==true||source.publicRitualApproved!==false||source.completedCityYears!==source.expectedCityYears||source.failures?.length)throw Error("Incomplete or improperly scoped GCal oracle");
if(source.gcalOriginalExeGitBlob!=="1d20f6e0caf29b6293157d258d02287e4edf0481")throw Error("Wrong original GCal binary");
const sampleCities=new Set((process.env.INDEPENDENT_RULE_CANARY_CITIES??"delhi,mumbai,chennai,kolkata,pune").split(","));
const reports=[],errors=[];
const monthNames={Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12};
function normalizeGcalDate(s:string){
 const m=s.match(/^(\d{1,2})\s+([A-Z][a-z]{2})\s+(\d{4})$/);
 if(!m||!monthNames[m[2] as keyof typeof monthNames])throw Error("Unrecognized GCal date: "+s);
 return [m[3],String(monthNames[m[2] as keyof typeof monthNames]).padStart(2,"0"),m[1].padStart(2,"0")].join("-");
}
for(const record of source.records){
 if(!sampleCities.has(record.city))continue;
 const city=findCityBySlug(record.city);
 if(!city){errors.push("Unknown city "+record.city);continue}
 const originalSet=new Set<string>(record.fasts.map((x:{date:string})=>normalizeGcalDate(x.date)));
 const sunrise=calculateVratCalendar("ekadashi",record.year,city).map(x=>x.date);
 const candidateDates=new Set([...sunrise,...sunrise.map(x=>addIsoDays(x,1)),...originalSet]);
 const rows=[];
 for(const date of [...candidateDates].sort()){
  if(!date.startsWith(record.year+"-"))continue;
  try{
   const obs=compareEkadashiArunodaya(city,date);
   const screen=independentlyScreenVaishnavaDay(obs);
   rows.push({...screen,gcalFast:originalSet.has(date),
     classificationMismatch:originalSet.has(date)!==(screen.tentativeFastEligibility==="screen-compatible"),
     mathMethod:obs.conventionProfile});
  }catch(e){errors.push(record.city+"/"+date+": "+String(e))}
 }
 reports.push({city:record.city,year:record.year,gcalFastDates:originalSet.size,
   sunriseObservationDates:sunrise.length,reviewedDates:rows.length,
   disagreements:rows.filter(x=>x.classificationMismatch).map(x=>({date:x.date,screen:x.tentativeFastEligibility,gcalFast:x.gcalFast,
     mahadvadashiReview:x.requiresMahadvadashiReview,kshayaReview:x.requiresKshayaReview,boundaryRisk:x.boundaryRisk})),
   certifiedFastCount:0,certifiedParanaCount:0,
   coverage:{vedhaArunodaya:true,hariVasaraFirstQuarterMath:true,fullMahadvadashi:false,smarta:false,iskconParana:false},rows});
}
const report={status:errors.length?"RESEARCH_INCOMPLETE":"RESEARCH_ONLY_INDEPENDENT_PARTIAL_RULE_COMPARISON",generatedAt:new Date().toISOString(),
 oracleCityYears:source.completedCityYears,reviewedCityYears:reports.length,errors,reports,
 publicationApproved:false,completeIndependentRuleEngine:false};
mkdirSync("artifacts",{recursive:true});
writeFileSync("artifacts/gcal-rule-screen.json",JSON.stringify(report,null,2));
console.log("[independent-rules] reviewed city years "+reports.length+"; mismatches "+reports.reduce((s,r)=>s+r.disagreements.length,0)+"; errors "+errors.length);
if(errors.length)process.exitCode=1;
