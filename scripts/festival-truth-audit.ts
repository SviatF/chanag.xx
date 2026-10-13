import {mkdirSync,writeFileSync} from "node:fs";
import {festivalCatalogSlugs,festivalCoverageSnapshot,festivalCityPageIsIndexable} from "../lib/festival-expansion";
import {festivalsForYear,festivalBySlugYear} from "../lib/festivals";
import {findCityBySlug} from "../lib/cities";
import {activeIndexCitySlugs} from "../lib/seo-policy";
import {getPanchang} from "../lib/panchang";
import {getFestivalTithiEvidence} from "../lib/festival-lunar-evidence";
import {festivalDateEvidence,festivalTraditionDateEvidence,independentFestivalDateChecks} from "../tests/fixtures/festival-date-evidence";
import {chhathFollowingSunrise} from "../lib/festival-content-engine";
import {getFestivalLocalReference,getFestivalRuleProfile} from "../lib/religious-integrity";
import {rakhiBhadraAtSunrise} from "../lib/rakhi-bhadra-evidence";
import {festivalNightEligibility} from "../lib/festival-night-eligibility";
import {addIsoDays} from "../lib/india-time";

const output=process.argv.find(x=>x.startsWith("--report="))?.slice(9)??"artifacts/festival-truth-audit.json";
const coverage=festivalCoverageSnapshot();
const authoritativeDisagreements:Array<Record<string,string>>=[];
const missingSourcedDates:Array<Record<string,string>>=[];
for(const source of festivalDateEvidence){
  const row=festivalBySlugYear(source.slug,source.year);
  if(!row){missingSourcedDates.push({slug:source.slug,year:String(source.year),expected:source.date,source:source.source});continue;}
  if(row.date!==source.date)authoritativeDisagreements.push({slug:source.slug,year:String(source.year),expected:source.date,actual:row.date,source:source.source});
}
// Count source coverage by unique festival + year, not by repeated source URLs.
const recordKey=(row:{slug:string;year:number})=>`${row.year}|${row.slug}`;
const sourceKeys=new Set(festivalDateEvidence.map(recordKey));
const sourceDuplicateKeys=festivalDateEvidence.map(recordKey).filter((key,i,a)=>a.indexOf(key)!==i);
const unreferencedDates=[2026,2027].flatMap(year=>festivalsForYear(year)
  .filter(f=>!sourceKeys.has(recordKey(f)))
  .map(f=>({slug:f.slug,year,date:f.date})));
// Independently corroborated festival-year keys must match both maintained
// dates and the first publisher, not merely each other. Regional observance
// and minute-level Puja accuracy still require their own sources.
const independentDisagreements:Array<Record<string,string>>=[];
const independentDuplicateKeys:string[]=[];
const corroborated=new Set<string>();
for(const row of independentFestivalDateChecks){
  const key=recordKey(row);
  if(corroborated.has(key))independentDuplicateKeys.push(key);
  corroborated.add(key);
  const primary=festivalDateEvidence.find(p=>recordKey(p)===key);
  const maintained=festivalBySlugYear(row.slug,row.year);
  const independentHost=new URL(row.source).hostname.replace(/^www\./,"");
  const primaryHost=primary?new URL(primary.source).hostname.replace(/^www\./,""):null;
  if(!primary||!maintained||maintained.date!==row.date||primary.date!==row.date||primaryHost===independentHost){
    independentDisagreements.push({
      slug:row.slug,year:String(row.year),independent:row.date,
      maintained:maintained?.date??"missing",primary:primary?.date??"missing",
      primaryHost:primaryHost??"missing",independentHost
    });
  }
}
const sourceCoverage=[2026,2027].map(year=>{
  const supported=festivalDateEvidence.filter(r=>r.year===year);
  return {year,maintained:festivalsForYear(year).length,sourced:supported.length,
    distinctSourceUrls:new Set(supported.map(r=>r.source)).size};
});
const variants=festivalTraditionDateEvidence.map(({slug,year,tradition,date,source})=>({
  slug,year,tradition,date,source,mainDate:festivalBySlugYear(slug,year)?.date??null,
  isAlternativeDate:festivalBySlugYear(slug,year)?.date!==date
}));
const cities=activeIndexCitySlugs();
const counts:Record<string,number>={};
const flagged:Array<{city:string;festival:string;date:string;status:string;sunriseTithi:string;transition:string}>=[];
const errors:Array<{city:string;festival:string;date:string;error:string}>=[];
const ritualScreening={checked:0,unsupportedReference:0,missingNextSunrise:0,notCertifiedRituals:new Set<string>()};
const rakhiChecks={checked:0,bhadraCleared:0,unresolved:[] as Array<{city:string;year:number;date:string;reason:string}>};
const nightChecks:{checked:number,verified:number,unverified:Array<{city:string;slug:string;date:string}>,statuses:Record<string,number>}={checked:0,verified:0,unverified:[],statuses:{}};
let checked=0;
for(const year of [2026,2027]){
  for(const festival of festivalsForYear(year)){
    for(const slug of cities){
      const city=findCityBySlug(slug);
      if(!city){errors.push({city:slug,festival:festival.slug,date:festival.date,error:"Missing city"});continue;}
      try{
        const data=await getPanchang(new Date(festival.date+"T06:00:00Z"),city);
        const e=getFestivalTithiEvidence(festival,data);
        if(festival.slug==="janmashtami"||festival.slug==="diwali"){
          const next=await getPanchang(new Date(`${addIsoDays(festival.date,1)}T06:00:00Z`),city);
          const night=festivalNightEligibility(festival.slug,data,next);
          nightChecks.checked++;
          const status=night?.status??"unverified";
          nightChecks.statuses[`${festival.slug}:${year}:${status}`]=(nightChecks.statuses[`${festival.slug}:${year}:${status}`]??0)+1;
          if(!night||night.status==="unverified")nightChecks.unverified.push({city:slug,slug:festival.slug,date:festival.date});
          else nightChecks.verified++;
        }
        if(["diwali","janmashtami","raksha-bandhan","karwa-chauth","chhath-puja"].includes(festival.slug)){
          ritualScreening.checked++;
          const profile=getFestivalRuleProfile(festival);
          const local=getFestivalLocalReference(festival,data);
          if(profile.exactness==="context-only")ritualScreening.notCertifiedRituals.add(festival.slug);
          if(festival.slug==="raksha-bandhan"){
            rakhiChecks.checked++;
            const bhadra=rakhiBhadraAtSunrise(data);
            if(bhadra.status==="purnima-bhadra-cleared"){
              rakhiChecks.bhadraCleared++;
              if(local?.label!=="Bhadra-free Purnima reference"||local.value!==`${bhadra.start} — ${bhadra.end}`)
                ritualScreening.unsupportedReference++;
            }else{
              rakhiChecks.unresolved.push({city:slug,year:festival.year,date:festival.date,reason:bhadra.status});
              if(local?.value!=="Bhadra check required")ritualScreening.unsupportedReference++;
            }
          }
          if(festival.slug==="diwali"&&local?.label!=="Pradosh reference")ritualScreening.unsupportedReference++;
          if(festival.slug==="janmashtami"&&local?.label!=="Nishita reference")ritualScreening.unsupportedReference++;
          if(festival.slug==="karwa-chauth"&&local?.label!=="Fasting reference")ritualScreening.unsupportedReference++;
          if(festival.slug==="chhath-puja"&&!chhathFollowingSunrise(data))ritualScreening.missingNextSunrise++;
        }
        counts[e.key]=(counts[e.key]??0)+1;
        checked++;
        if(e.key==="not-in-first-transition"||e.key==="begins-on-later-date")flagged.push({city:slug,festival:festival.slug,date:festival.date,status:e.key,sunriseTithi:`${data.paksha} ${data.tithi}`,transition:`${data.tithiEnd} ${data.tithiEndDate??""}`});
      }catch(error){errors.push({city:slug,festival:festival.slug,date:festival.date,error:String(error)});}
    }
  }
}
const report={
  generatedAt:new Date().toISOString(),
  scope:"all maintained 2026/2027 festival dates × all 25 active cities; not a certification of ritual selection",
  checked,cityCount:cities.length,catalogSlugs:festivalCatalogSlugs.length,years:coverage,
  classificationCounts:counts,
  ritualScreening:{...ritualScreening,notCertifiedRituals:[...ritualScreening.notCertifiedRituals].sort()},rakhiChecks,nightChecks,
  sourceComparison:{references:festivalDateEvidence.length,sourceCoverage,independentSecondPublisherChecks:independentFestivalDateChecks.length,independentlyCorroboratedFestivalYears:corroborated.size,independentDisagreements,independentDuplicateKeys,unreferencedDates,sourceDuplicateKeys,missingSourcedDates,authoritativeDisagreements,traditionVariants:variants},
  indexabilityPreserved:{
    year2027Indexed:festivalCityPageIsIndexable("diwali",2027,"mumbai"),
    note:"Complete 2027 date ledger remains deliberately non-indexable under explicit release gate."
  },
  needsHumanReview:flagged,calculationFailures:errors,
  limitations:["The first Tithi transition does not replace festival-specific observance rules.","Source comparisons cover only dated references listed in audit fixtures.","A maintained date without source confirmation is not automatically verified.","No new 2027 URLs are activated by this audit."]
};
mkdirSync(output.split("/").slice(0,-1).join("/")||".",{recursive:true});
writeFileSync(output,JSON.stringify(report,null,2));
console.log(`[festival-truth] checked=${checked}; sourced dates=${festivalDateEvidence.length}; unsourced=${unreferencedDates.length}; duplicates=${sourceDuplicateKeys.length}; missing=${missingSourcedDates.length}; source disagreements=${authoritativeDisagreements.length}`);
console.log(`[festival-truth] sourceCoverage=${JSON.stringify(sourceCoverage)}; independentSecondPublisherChecks=${independentFestivalDateChecks.length}; independentDisagreements=${independentDisagreements.length}`);
console.log(`[festival-truth] statuses=${JSON.stringify(counts)}; humanReview=${flagged.length}; calculationFailures=${errors.length}`);
console.log(`[festival-truth] ritualScreening=${ritualScreening.checked} unsupported=${ritualScreening.unsupportedReference} missingNextSunrise=${ritualScreening.missingNextSunrise}`);
console.log(`[festival-truth] rakhiBhadra=${rakhiChecks.bhadraCleared}/${rakhiChecks.checked} cleared, unresolved=${rakhiChecks.unresolved.length}`);
console.log(`[festival-truth] lunarNight=${nightChecks.verified}/${nightChecks.checked}, unverified=${nightChecks.unverified.length}; statuses=${JSON.stringify(nightChecks.statuses)}`);
for(const flag of flagged.slice(0,12))console.log(`[festival-truth] REVIEW ${flag.festival}/${flag.date}/${flag.city} ${flag.status} ${flag.sunriseTithi}`);
for(const m of missingSourcedDates)console.log(`[festival-truth] NOT PUBLISHED ${m.slug} ${m.year} expected=${m.expected} source=${m.source}`);
for(const e of errors.slice(0,15))console.error(`[festival-truth] FAIL ${e.festival} ${e.city} ${e.error}`);
console.log(`[festival-truth] report=${output}`);
if(errors.length||authoritativeDisagreements.length||independentDisagreements.length||independentDuplicateKeys.length||missingSourcedDates.length||sourceDuplicateKeys.length||unreferencedDates.length||sourceCoverage.some(x=>x.sourced!==x.maintained)||ritualScreening.unsupportedReference||ritualScreening.missingNextSunrise||rakhiChecks.unresolved.length||nightChecks.unverified.length||festivalCityPageIsIndexable("diwali",2027,"mumbai"))process.exitCode=1;
