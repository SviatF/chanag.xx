/**
 * Wave 3AP — use the checked-in SHA pins to prove both research artifacts
 * regenerate byte-for-byte, then combine JPL 6° phase and JPL sidereal
 * events at the SAME physical sunrise in each supported Indian city.
 *
 * Coverage is candid: all supported cities × four targeted dates plus three
 * COMPLETE critical months. NOT all 454 cities × all 1,096 days.
 */
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {supportedCities,cityBySlug} from "../lib/cities";
import {getPanchang} from "../lib/panchang";
import {
  openVerifiedV6SiderealSource,getV6UnifiedSunrise,getV6UnifiedMonth,
  unifiedV6ResearchKey,UNIFIED_V6_RESEARCH_SCHEMA,
  V6_UNIFIED_PINNED_SIDEREAL_SHA256,V6_UNIFIED_PINNED_LAHIRI_SHA256
} from "../lib/v6-unified-calendar-staging";
import {assertProductionLunarEngine,PUBLIC_LUNAR_ENGINE_VERSION,
  STAGED_LUNAR_ENGINE_VERSION} from "../lib/v6-calendar-staging";
const catalogRaw=readFileSync("artifacts/wave3ao-jpl-global-sidereal-transitions.json","utf8");
const lahiriRaw=readFileSync("artifacts/wave3ao-lahiri-6h-anchors.json","utf8");
const source=openVerifiedV6SiderealSource(catalogRaw,lahiriRaw);
const sha=(s:string)=>createHash("sha256").update(s).digest("hex");
if(source.sourceDigest!==V6_UNIFIED_PINNED_SIDEREAL_SHA256||
   source.lahiriAnchorDigest!==V6_UNIFIED_PINNED_LAHIRI_SHA256||
   source.table.productionSwitchAllowed!==false)
  throw Error("Unpinned sidereal catalog or unauthorized V6 staging release");
const reviewedDates=["2026-06-30","2026-11-21","2027-01-31","2028-12-31"];
const uniqueCities=new Map<string,(typeof supportedCities)[number]>();
const repeatedCityRecords=[];
for(const city of supportedCities){
  const previous=uniqueCities.get(city.slug);
  if(previous){
    if(previous.name!==city.name||previous.state!==city.state||
       previous.lat!==city.lat||previous.lng!==city.lng||
       previous.language.join(",")!==city.language.join(","))
      throw Error("Same city slug refers to inconsistent geographic coordinates: "+city.slug);
    repeatedCityRecords.push(city.slug);
  }else uniqueCities.set(city.slug,city);
}
const cities=[...uniqueCities.values()].sort((a,b)=>a.slug.localeCompare(b.slug));
if(cities.length<450)throw Error("Insufficient unique India cities for Wave3AP");
const researchOnlyExamples=[];
const distinctCities=new Set<string>();
const familyNames=new Map<string,Set<string>>();
const closeToSunrise=[];
let sampled=0,missingEnd=0;
for(const city of cities){
  for(const date of reviewedDates){
    const result=getV6UnifiedSunrise(date,city,source);
    if(result.date!==date||result.city!==city.slug||
       result.sources.combinedIdentity!==source.combinedIdentity||
       result.publicReleaseAllowed!==false||
       result.sunriseUtc.slice(0,4)<"2026"||
       result.sidereal.nakshatra.pada<1||result.sidereal.nakshatra.pada>4)
      throw Error("Incomplete unified astronomy result "+city.slug+" "+date);
    sampled++;
    distinctCities.add(city.slug);
    for(const [name,field] of Object.entries(result.sidereal)){
      const set=familyNames.get(name)??new Set<string>();
      set.add("name" in field?String(field.name):String(field.index));
      familyNames.set(name,set);
      if(field.next.utc===null)missingEnd++;
    }
    if(result.nearSunriseTransition.length){
      closeToSunrise.push({city:city.slug,date,
        transitions:result.nearSunriseTransition});
    }
    if(researchOnlyExamples.length<12&&(
       ["delhi","kanpur","patna"].includes(city.slug)||
       date==="2028-12-31"))
      researchOnlyExamples.push(result);
  }
}
const cases=[
  {city:"delhi",year:2026,month:6,date:"2026-06-30",expectedTithi:"Purnima"},
  {city:"kanpur",year:2026,month:11,date:"2026-11-21",expectedTithi:"Ekadashi"},
  {city:"patna",year:2027,month:1,date:"2027-01-31",expectedTithi:"Navami"}
];
const months=[];
let fullMonthDays=0;
for(const c of cases){
  const city=cityBySlug(c.city);
  const month=getV6UnifiedMonth(c.year,c.month,city,source);
  if(month.dayCount!==month.dates.length)throw Error("Incomplete V6 unified month "+c.city);
  const critical=month.dates.find(day=>day.date===c.date);
  if(!critical||critical.lunar.tithi!==c.expectedTithi)
    throw Error("Known JPL lunar boundary failed "+c.city+" "+c.date);
  const publicV5=await getPanchang(new Date(c.date+"T12:00:00Z"),city);
  if(publicV5.date!==critical.date)
    throw Error("India civil date mismatch "+c.date);
  const changed={
    tithi:publicV5.tithi!==critical.lunar.tithi||publicV5.paksha!==critical.lunar.paksha,
    nakshatra:publicV5.nakshatra!==critical.sidereal.nakshatra.name,
    nakshatraPada:publicV5.nakshatraPada!==critical.sidereal.nakshatra.pada,
    yoga:publicV5.yoga!==critical.sidereal.yoga.name,
    moonRashi:publicV5.rashi!==critical.sidereal.moonRashi.name,
    solarRashi:publicV5.solarRashi!==critical.sidereal.sunRashi.name
  };
  if(!changed.tithi)throw Error("Critical V5/JPL Tithi flip not detected "+c.city);
  fullMonthDays+=month.dates.length;
  months.push({
    city:c.city,year:c.year,month:c.month,key:month.key,
    count:month.dates.length,criticalDate:c.date,changed,
    first:month.dates[0].date,last:month.dates.at(-1)?.date,
    monthNearSunriseTransitions:month.dates.filter(x=>x.nearSunriseTransition.length).length
  });
}
assertProductionLunarEngine(PUBLIC_LUNAR_ENGINE_VERSION);
let blocked=false;
try{assertProductionLunarEngine(STAGED_LUNAR_ENGINE_VERSION);}
catch{blocked=true;}
if(!blocked)throw Error("Unapproved V6 switched public engine");
const report={
  wave:"3AP",schema:UNIFIED_V6_RESEARCH_SCHEMA,
  catalogSha256:sha(catalogRaw),lahiriSha256:sha(lahiriRaw),
  combinedIdentity:source.combinedIdentity,
  sourceProof:"Raw SHA-pinned DE440s sidereal roots + Lahiri anchors matched reviewed CI bytes",
  allSupportedCityCount:cities.length,
  repeatedButIdenticalSourceCitySlugs:repeatedCityRecords,
  distinctCities:distinctCities.size,
  datesCheckedPerCity:reviewedDates,
  sampledCityDays:sampled,
  completeCriticalMonthDays:fullMonthDays,
  criticalMonths:months,
  sampledDistinctClassifications:Object.fromEntries([...familyNames].map(([k,v])=>[k,v.size])),
  nearSunriseSiderealBoundaries:closeToSunrise.length,
  boundaryExamples:closeToSunrise.slice(0,50),
  absentNextTransitionFieldsAtCoverageEnd:missingEnd,
  sampleSnapshots:researchOnlyExamples,
  allCityDays2026To2028Checked:false,
  independentAyanamsaApproved:false,
  festivalVratMuhuratApproved:false,
  publicV5Unchanged:true,productionV6ActivationDenied:blocked,
  researchOnly:true
};
if(report.distinctCities!==report.allSupportedCityCount||
   report.sampledCityDays!==cities.length*reviewedDates.length||
   report.completeCriticalMonthDays!==91)
  throw Error("Incomplete combined JPL sunrise evidence");
mkdirSync("artifacts",{recursive:true});
writeFileSync("artifacts/wave3ap-unified-jpl-sunrise-staging.json",JSON.stringify(report,null,2)+"\n");
console.log("[Wave3AP] "+JSON.stringify({
  cities:report.distinctCities,sampledCityDays:sampled,
  criticalMonthDays:fullMonthDays,boundaryCases:closeToSunrise.length,
  absentEndFields:missingEnd,approved:false,productionV5:true
}));
