import {mkdirSync,writeFileSync} from "node:fs";
import {festivalCatalogSlugs,festivalCoverageSnapshot,festivalCityPageIsIndexable} from "../lib/festival-expansion";
import {festivalsForYear,festivalBySlugYear} from "../lib/festivals";
import {findCityBySlug} from "../lib/cities";
import {activeIndexCitySlugs} from "../lib/seo-policy";
import {getPanchang} from "../lib/panchang";
import {getFestivalTithiEvidence} from "../lib/festival-lunar-evidence";
import {festivalDateEvidence} from "../tests/fixtures/festival-date-evidence";
import {chhathFollowingSunrise} from "../lib/festival-content-engine";
import {getFestivalLocalReference,getFestivalRuleProfile} from "../lib/religious-integrity";

const output=process.argv.find(x=>x.startsWith("--report="))?.slice(9)??"artifacts/festival-truth-audit.json";
const coverage=festivalCoverageSnapshot();
const authoritativeDisagreements:Array<Record<string,string>>=[];
const missingSourcedDates:Array<Record<string,string>>=[];
for(const source of festivalDateEvidence){
  const row=festivalBySlugYear(source.slug,source.year);
  if(!row){missingSourcedDates.push({slug:source.slug,year:String(source.year),expected:source.date,source:source.source});continue;}
  if(row.date!==source.date)authoritativeDisagreements.push({slug:source.slug,year:String(source.year),expected:source.date,actual:row.date,source:source.source});
}
const cities=activeIndexCitySlugs();
const counts:Record<string,number>={};
const flagged:Array<{city:string;festival:string;date:string;status:string;sunriseTithi:string;transition:string}>=[];
const errors:Array<{city:string;festival:string;date:string;error:string}>=[];
const ritualScreening={checked:0,unsupportedReference:0,missingNextSunrise:0,notCertifiedRituals:new Set<string>()};
let checked=0;
for(const year of [2026,2027]){
  for(const festival of festivalsForYear(year)){
    for(const slug of cities){
      const city=findCityBySlug(slug);
      if(!city){errors.push({city:slug,festival:festival.slug,date:festival.date,error:"Missing city"});continue;}
      try{
        const data=await getPanchang(new Date(festival.date+"T06:00:00Z"),city);
        const e=getFestivalTithiEvidence(festival,data);
        if(["diwali","janmashtami","raksha-bandhan","karwa-chauth","chhath-puja"].includes(festival.slug)){
          ritualScreening.checked++;
          const profile=getFestivalRuleProfile(festival);
          const local=getFestivalLocalReference(festival,data);
          if(profile.exactness==="context-only")ritualScreening.notCertifiedRituals.add(festival.slug);
          if(festival.slug==="raksha-bandhan"&&local?.value!=="Bhadra check required")ritualScreening.unsupportedReference++;
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
  ritualScreening:{...ritualScreening,notCertifiedRituals:[...ritualScreening.notCertifiedRituals].sort()},
  sourceComparison:{references:festivalDateEvidence.length,missingSourcedDates,authoritativeDisagreements},
  indexabilityPreserved:{
    year2027Indexed:festivalCityPageIsIndexable("diwali",2027,"mumbai"),
    note:"Complete 2027 date ledger remains deliberately non-indexable under explicit release gate."
  },
  needsHumanReview:flagged,calculationFailures:errors,
  limitations:["The first Tithi transition does not replace festival-specific observance rules.","Source comparisons cover only dated references listed in audit fixtures.","A maintained date without source confirmation is not automatically verified.","No new 2027 URLs are activated by this audit."]
};
mkdirSync(output.split("/").slice(0,-1).join("/")||".",{recursive:true});
writeFileSync(output,JSON.stringify(report,null,2));
console.log(`[festival-truth] checked=${checked}; source dates=${festivalDateEvidence.length}; missing=${missingSourcedDates.length}; source disagreements=${authoritativeDisagreements.length}`);
console.log(`[festival-truth] statuses=${JSON.stringify(counts)}; humanReview=${flagged.length}; calculationFailures=${errors.length}`);
console.log(`[festival-truth] ritualScreening=${ritualScreening.checked} unsupported=${ritualScreening.unsupportedReference} missingNextSunrise=${ritualScreening.missingNextSunrise}`);
for(const flag of flagged.slice(0,12))console.log(`[festival-truth] REVIEW ${flag.festival}/${flag.date}/${flag.city} ${flag.status} ${flag.sunriseTithi}`);
for(const m of missingSourcedDates)console.log(`[festival-truth] NOT PUBLISHED ${m.slug} ${m.year} expected=${m.expected} source=${m.source}`);
for(const e of errors.slice(0,15))console.error(`[festival-truth] FAIL ${e.festival} ${e.city} ${e.error}`);
console.log(`[festival-truth] report=${output}`);
if(errors.length||authoritativeDisagreements.length||missingSourcedDates.length||ritualScreening.unsupportedReference||ritualScreening.missingNextSunrise||festivalCityPageIsIndexable("diwali",2027,"mumbai"))process.exitCode=1;
