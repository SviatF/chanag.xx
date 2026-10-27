/**
 * Research-only native GCal ↔ independently written Swiss-geometry reconciliation.
 * All differences remain review items; never unlock public ritual dates.
 */
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {findCityBySlug} from "../lib/cities";
import {addIsoDays} from "../lib/india-time";
import {calculateIndependentParanaGeometry,isEkadashiDvadashiNativeFast,parseGcalNativeDate,boundaryAlignment} from "../lib/ritual-parana-independent";
const arg=(key:string,def:string)=>process.argv.find(x=>x.startsWith("--"+key+"="))?.slice(key.length+3)??def;
const shard=Number(arg("shard","0")),shards=Number(arg("shards","1"));
if(!Number.isInteger(shard)||!Number.isInteger(shards)||shards<1||shard<0||shard>=shards)throw Error("Invalid sharding parameters");
const input=arg("input","artifacts/gcal-city-run/native-city-year-summary.json");
const output="artifacts/gcal-parana-compare/shard-"+shard+".json";
type GFast={date:string;sunriseTithi:string;arunodayaTithi:string};
type GParana={date:string;from:string;to:string;sunriseTithi:string};
type Annual={city:string;year:number;lat:number;lng:number;timezone:number;days:number;fasts:GFast[];parana:GParana[];mahadvadasi:{date:string;subtype:string}[]};
const source=JSON.parse(readFileSync(input,"utf8")) as {cityCount:number;expectedCityYears:number;completedCityYears:number;failures:string[];publicRitualApproved:boolean;hasIndependentSecondMethod:boolean;records:Annual[]};
if(source.cityCount!==454||source.completedCityYears!==908||source.expectedCityYears!==908||
   source.records.length!==908||source.failures.length||source.publicRitualApproved!==false||source.hasIndependentSecondMethod!==false)
 throw Error("Original native GCal 908-calendar artifact incomplete or wrongly marked certified");
const reports:any[]=[],errors:string[]=[];
const totals={annual:0,fastTags:0,unrelatedFastTags:0,ekadashiDvadashiFasts:0,
  paired:0,missingParana:0,computed:0,geometryErrors:0,
  dashamiArunodayaCandidates:0,trisprshaGeometryCandidates:0,
  dwadashiBeforeSunrise:0,sourceStartNearGeometry:0,sourceStartUnexplained:0,
  sourceEndNearGeometry:0,sourceEndUnexplained:0,openEndedParana:0,sourceMahaNames:0};
for(let ri=0;ri<source.records.length;ri++){
 if(ri%shards!==shard)continue;
 const item=source.records[ri],city=findCityBySlug(item.city);
 totals.annual++;
 if(!city||Math.abs(city.lat-item.lat)>0.011||Math.abs(city.lng-item.lng)>0.011||Math.abs(item.timezone-5.5)>0.001||item.days!==365){
  errors.push(item.city+"/"+item.year+": invalid source locality/day coverage");continue;
 }
 const paranas=new Map(item.parana.map(p=>[parseGcalNativeDate(p.date),p]));
 const maha=new Map<string,string[]>();
 for(const x of item.mahadvadasi){
  const key=parseGcalNativeDate(x.date);
  maha.set(key,[...(maha.get(key)||[]),x.subtype]);
 }
 totals.sourceMahaNames+=item.mahadvadasi.length;
 totals.fastTags+=item.fasts.length;
 for(const f of item.fasts){
  if(!isEkadashiDvadashiNativeFast(f)){totals.unrelatedFastTags++;continue;}
  totals.ekadashiDvadashiFasts++;
  const fastDate=parseGcalNativeDate(f.date),paranaDate=addIsoDays(fastDate,1);
  const p=paranas.get(paranaDate);
  if(!p){totals.missingParana++;reports.push({city:item.city,year:item.year,fastDate,status:"NO_NEXT_DAY_PARANA",safeForPublication:false});continue;}
  totals.paired++;
  try{
   const g=calculateIndependentParanaGeometry(city,fastDate,paranaDate);
   totals.computed++;
   if(g.possibleDashamiVedha)totals.dashamiArunodayaCandidates++;
   if(g.trispashaAstronomicalCandidate)totals.trisprshaGeometryCandidates++;
   if(g.dwadashiEndedBeforeParanaSunrise)totals.dwadashiBeforeSunrise++;
   const start=boundaryAlignment(p.from||null,{
    sunrise:g.sunrise.time,
    dvadashiQuarter:g.dwadashiWindow?.firstQuarterEnds.date===paranaDate?g.dwadashiWindow.firstQuarterEnds.time:null
   },7);
   const end=boundaryAlignment(p.to||null,{
    daylightThird:g.daylightThird.time,
    dvadashiEnd:g.dwadashiWindow?.end.date===paranaDate?g.dwadashiWindow.end.time:null,
    nakshatraEnd:g.nakshatraNextEnd?.date===paranaDate?g.nakshatraNextEnd.time:null
   },7);
   if(start.withinTolerance)totals.sourceStartNearGeometry++;
   else totals.sourceStartUnexplained++;
   if(!p.to)totals.openEndedParana++;
   else if(end.withinTolerance)totals.sourceEndNearGeometry++;
   else totals.sourceEndUnexplained++;
   reports.push({
    city:item.city,year:item.year,fastDate,paranaDate,
    native:{fastSunriseTithi:f.sunriseTithi,arunodayaTithi:f.arunodayaTithi,from:p.from,to:p.to,mahadvadasi:maha.get(fastDate)||[]},
    independentlyComputed:{
      sunrise:g.sunrise,daylightThird:g.daylightThird,dvadashi:g.dwadashiWindow,
      nakshatraNextEnd:g.nakshatraNextEnd,fastSunriseTithiIndex:g.fastSunriseTithiIndex,
      fastArunodayaTithiIndex:g.fastArunodayaTithiIndex,paranaSunriseTithiIndex:g.followingSunriseTithiIndex,
      possibleDashamiVedha:g.possibleDashamiVedha,trisprshaGeometryCandidate:g.trispashaAstronomicalCandidate,
      dwadashiEndedBeforeSunrise:g.dwadashiEndedBeforeParanaSunrise
    },
    sourceStartVsGeometry:start,sourceEndVsGeometry:end,
    unresolved:!start.withinTolerance||!!p.to&&!end.withinTolerance,
    gcalSubtypesAreNotIndependentlyCertified:true,safeForPublication:false
   });
  }catch(e){totals.geometryErrors++;reports.push({city:item.city,year:item.year,fastDate,paranaDate,status:"ASTRONOMY_FAILED",error:String(e),safeForPublication:false});}
 }
}
const result={
 generatedAt:new Date().toISOString(),shard,shards,
 inputCityYears:908,sourceGcalNativeGitBlob:"1d20f6e0caf29b6293157d258d02287e4edf0481",
 method:"Independently authored Swiss/Moshier geometry; not independent ephemeris and not complete GCal ritual logic",
 toleranceMinutes:7,totals,errors,
 researchStatus:errors.length||totals.geometryErrors?"RESEARCH_REQUIRES_TECHNICAL_FIX":"RESEARCH_DATE_BY_DATE_ANALYSIS_UNCERTIFIED",
 releaseApproved:false,independentFastSelectorComplete:false,independentParanaMethodComplete:false,
 reports
};
mkdirSync("artifacts/gcal-parana-compare",{recursive:true});
writeFileSync(output,JSON.stringify(result,null,2)+"\n");
console.log("[parana-independent] shard="+shard+"/"+shards+" years="+totals.annual+
 " candidates="+totals.ekadashiDvadashiFasts+" compared="+totals.computed+
 " unrelatedFastTags="+totals.unrelatedFastTags+" startUnexplained="+totals.sourceStartUnexplained+
 " endUnexplained="+totals.sourceEndUnexplained+" errors="+totals.geometryErrors+" state="+result.researchStatus);
if(errors.length||totals.geometryErrors)process.exitCode=1;
