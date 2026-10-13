import {mkdirSync,writeFileSync} from "node:fs";
import {getPanchang} from "../lib/panchang";
import {findCityBySlug} from "../lib/cities";
import {activeIndexCitySlugs} from "../lib/seo-policy";
import {festivalBySlugYear} from "../lib/festivals";
import {checkAgainstReference,checkPanchangIntegrity} from "../lib/content-truth-checks";
import {festivalTruthReferences} from "../lib/content-truth-references";

const sampleDates=["2026-09-14","2026-10-11","2026-10-20","2026-10-29","2026-11-08"];
const output=process.argv.find(arg=>arg.startsWith("--report="))?.slice(9)??"artifacts/content-integrity-audit.json";
const cities=activeIndexCitySlugs();
const findings:Array<{type:string;city:string;date:string;field:string;explanation:string;source?:string}>=[];
const tested:Array<{city:string;date:string;checks:number;errorCount:number}>=[];
const seen=new Map<string,Awaited<ReturnType<typeof getPanchang>>>();
async function dataFor(citySlug:string,date:string){
  const key=`${citySlug}|${date}`;
  const cached=seen.get(key);if(cached)return cached;
  const city=findCityBySlug(citySlug);
  if(!city)throw new Error(`Unknown city: ${citySlug}`);
  const value=await getPanchang(new Date(`${date}T06:00:00Z`),city);
  seen.set(key,value);return value;
}
function record(type:string,city:string,date:string,field:string,explanation:string,source?:string){
  findings.push({type,city,date,field,explanation,source});
}
for(const city of cities){
  for(const date of sampleDates){
    try{
      const data=await dataFor(city,date);
      const issues=checkPanchangIntegrity(data);
      issues.forEach(issue=>record("chronology",city,date,issue.field,issue.explanation));
      tested.push({city,date,checks:1,errorCount:issues.length});
    }catch(error){
      record("calculation",city,date,"getPanchang",error instanceof Error?error.message:String(error));
      tested.push({city,date,checks:1,errorCount:1});
    }
  }
}
for(const fixture of festivalTruthReferences){
  const item=festivalBySlugYear(fixture.festival,Number(fixture.date.slice(0,4)));
  if(item?.date!==fixture.date)record("festival-date",fixture.city,fixture.date,fixture.festival,`Maintained festival date ${item?.date??"missing"} conflicts with sourced date`,fixture.source);
  try{
    const data=await dataFor(fixture.city,fixture.date);
    checkAgainstReference(data,fixture).forEach(finding=>record("independent-reference",fixture.city,fixture.date,finding.field,finding.explanation,fixture.source));
  }catch(error){record("independent-reference",fixture.city,fixture.date,"getPanchang",String(error),fixture.source);}
}
const report={
  startedAt:new Date().toISOString(),
  stage:"wave-0 independent sources + internal chronology sample; NOT full corpus verification",
  counts:{activeCities:cities.length,sampleDates:sampleDates.length,calculatedPages:tested.length,independentFixtures:festivalTruthReferences.length,errors:findings.length},
  limitations:[
    "Source records are fixed observations on named dates; no automatic independent ephemeris is assumed.",
    "The city×date sample does not imply the remaining sitemap URLs are factually certified.",
    "Content usefulness, ritual completeness, and human editorial value require family-specific reviews in subsequent waves."
  ],
  findings,tested
};
mkdirSync(output.split("/").slice(0,-1).join("/")||".",{recursive:true});
writeFileSync(output,JSON.stringify(report,null,2));
console.log(`[truth-audit] ${tested.length} city/date samples, ${festivalTruthReferences.length} independent references, ${findings.length} findings`);
for(const f of findings.slice(0,25))console.error(`[truth-audit] ${f.type} ${f.city} ${f.date} ${f.field}: ${f.explanation}`);
console.log(`[truth-audit] report=${output}`);
if(findings.length)process.exitCode=1;
