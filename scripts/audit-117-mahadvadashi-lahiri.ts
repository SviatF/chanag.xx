/**
 * 117 original JPL fasting/subtype disagreements, 454-city provenance.
 * Independent high-precision Swiss/Moshier Lahiri Moon + pinned JPL DE440s
 * applied at the SAME UTC time. GCal original XML is comparison-only.
 */
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {dirname} from "node:path";
import {createDefaultSweData} from "@typescriptify/sweph/dist/types.js";
import {sweCalcUt,sweClose,sweSetSidMode} from "@typescriptify/sweph/dist/sweph.js";
import {sweRiseTrans} from "@typescriptify/sweph/dist/swecl.js";
import {SE_MOON,SE_SUN,SEFLG_MOSEPH,SEFLG_SIDEREAL,SE_SIDM_LAHIRI,SE_CALC_RISE,SE_CALC_SET}
 from "@typescriptify/sweph/dist/constants.js";
import {findCityBySlug} from "../lib/cities";
import {indiaCivilDayStartJulian} from "../lib/india-time";
import {getPinnedV6HalfTithiTable,JPL_V6_ROOTS_ASSET_SHA256} from "../lib/jpl-v6-pinned-data";
import {jplHalfTithiAtMs} from "../lib/jpl-v6-tithi-karana-canary";
import {nearestJplTithiBoundaryMs} from "../lib/jpl-observance-research";
import {openVerifiedV6SiderealSource} from "../lib/v6-unified-calendar-staging";
import {siderealStateAtUtc} from "../lib/jpl-v6-sidereal-transitions";
import {identifySourceMahadvadashi,identifySourceNakshatra} from "../lib/independent-mahadvadashi";
import {documentedMahadvadashiPredicates,MAHADVADASHI_PUBLISH_GUARD,type IndependentRuleDay}
 from "../lib/mahadvadashi-documented-rule-research";
import {directlySolveSwissLahiriNakshatraIngress,DIRECT_LAHIRI_RELEASE_GUARD}
 from "../lib/direct-swiss-lahiri-nakshatra-research";
const params=Object.fromEntries(process.argv.slice(2).map(x=>{
 const m=x.match(/^--([a-z-]+)=(.+)$/);if(!m)throw Error("Incorrect research argument "+x);
 return [m[1],m[2]];
}));
const required=["residual","gcal","catalog","anchors","output"];
for(const n of required)if(!params[n])throw Error("Missing science input --"+n);
const read=(n:string)=>JSON.parse(readFileSync(params[n],"utf8"));
const check=(yes:boolean,err:string):asserts yes=>{if(!yes)throw Error("Independent 117-case Mahadvadashi/Lahiri audit: "+err);};
const residual=read("residual"),gcal=read("gcal");
check(residual.status==="JPL_TITHI_RESIDUAL_AND_PARANA_FULL_454_RESEARCH_COMPLETE"&&
 residual.coverage?.cities===454&&residual.coverage?.cityYears===908&&
 residual.coverage.remainingDateDisagreements===84&&residual.coverage.remainingSubtypeDisagreements===73&&
 residual.coverage.uniqueDisputedEventKeys===117&&residual.publicRitualApproval===false,
 "previous 908-city-year 84/73 source census no longer pinned");
check(gcal.status==="RAW_GCAL_DAWN_TRACE_COMPLETE_RESEARCH_ONLY"&&
 gcal.originalExeGitBlob==="1d20f6e0caf29b6293157d258d02287e4edf0481"&&
 gcal.observedDayXmlRows===1360&&gcal.independentlyCertified===false,
 "original independent GCal dawn evidence unavailable");
const sidereal=openVerifiedV6SiderealSource(readFileSync(params.catalog,"utf8"),
 readFileSync(params.anchors,"utf8"));
const jpl=getPinnedV6HalfTithiTable();
check(jpl.halfTithiBoundaryCount===4512&&
 JPL_V6_ROOTS_ASSET_SHA256==="0cab0c6accaf2e2125fe417bf4a4f14a22453a4013a1609dce6dce84ec44142e"&&
 sidereal.researchOnly===true&&sidereal.table.fullIndependentAyanamsaApproved===false,
 "missing verified JPL moon phase and anchored Lahiri source identity");
type GcalOriginalDay={city:string;year:number;date:string;latitude:number;longitude:number;
 sunriseXml:string;arunodayaXml:string;sunsetXml:string};
const original=new Map<string,GcalOriginalDay>(
 (gcal.dailySourceEvidence as GcalOriginalDay[]).map(r=>[r.city+"/"+r.date,r]));
const days=new Map<string,IndependentRuleDay>();
const sunriseUtc=new Map<string,number>();
const sourceEventKey=(city:string,date:string)=>city+"/"+date;
const msPerDay=86400000,jd0=2440587.5;
const s=createDefaultSweData();
sweSetSidMode(s,SE_SIDM_LAHIRI,0,0);
const phases=(at:number)=>jplHalfTithiAtMs(jpl,Math.round(at)).tithiIndex;
const moonSidereal=(at:number)=>{
 const result=sweCalcUt(s,jd0+at/msPerDay,SE_MOON,SEFLG_MOSEPH|SEFLG_SIDEREAL).xx[0];
 if(!Number.isFinite(result))throw Error("Nonfinite physical Swiss Lahiri Moon state");
 return (result%360+360)%360;
};
const swissNak=(at:number)=>Math.floor(moonSidereal(at)/(360/27));
const gcalClock=(date:string,xml:string,tag:string)=>{
 const m=xml?.match(new RegExp("^<"+tag+"\\b[^>]*\\btime=\"(\\d\\d):(\\d\\d):(\\d\\d)\""));
 if(!m)throw Error("Original GCal "+tag+" clock absent "+date);
 const result=Date.parse(date+"T00:00:00Z")+((+m[1]*60+ +m[2])*60+ +m[3])*1000-330*60_000;
 check(Number.isSafeInteger(result),"invalid original GCal IST source timestamp");
 return result;
};
const originalTithi=(xml:string)=>{
 const m=xml?.match(/<tithi\b[^>]*\bindex="(\d+)"/);
 if(!m)throw Error("Source original GCal sunrise Tithi index absent");
 const n=+m[1];check(n>=1&&n<=30,"GCal original Tithi source index out of range");
 return (n+14)%30;
};
const sample=(cityName:string,date:string):IndependentRuleDay=>{
 const id=sourceEventKey(cityName,date),old=days.get(id);if(old)return old;
 const city=findCityBySlug(cityName);
 check(Boolean(city),"unknown original 454-city case "+id);
 const [yy,mm,dd]=date.split("-").map(Number),mid=indiaCivilDayStartJulian(yy,mm,dd);
 const place=[city!.lng,city!.lat,0];
 const r=sweRiseTrans(s,mid,SE_SUN,null,SEFLG_MOSEPH,SE_CALC_RISE,place,1013.25,25,null);
 const e=sweRiseTrans(s,mid,SE_SUN,null,SEFLG_MOSEPH,SE_CALC_SET,place,1013.25,25,null);
 check(r.retval>=0&&e.retval>=0&&Number.isFinite(r.tret)&&e.tret>r.tret,
  "invalid physical Swiss sunrise/sunset "+id);
 const rise=(r.tret-jd0)*msPerDay,end=(e.tret-jd0)*msPerDay;
 check(new Date(rise+330*60_000).toISOString().slice(0,10)===date&&
  new Date(end+330*60_000).toISOString().slice(0,10)===date,
  "physical independent sunset/sunrise outside original Indian civil date "+id);
 const na=siderealStateAtUtc(sidereal.table,new Date(rise).toISOString()).nakshatra.index;
 const value:IndependentRuleDay={date,sunriseTithi:phases(rise),
  arunodayaTithi:phases(rise-96*60_000),sunsetTithi:phases(end),
  swissNakshatra:swissNak(rise),jplNakshatra:na};
 days.set(id,value);sunriseUtc.set(id,rise);return value;
};
const results=[],counts:Record<string,number>={dateDisagreements:0,subtypeDisagreements:0,
 oldSwissSunriseNakMismatch:0,originalGcalSunriseTithiDiffersFromJplAtSameClock:0,
 originalGcalSunriseTithiMatchesJplAtSameClock:0,
 gcalSunriseTithiDiffersFromJplWithinTwoMinutesOfJplRoot:0,
 documentedSwissSourceSubtypeMatches:0,documentedJplSourceSubtypeMatches:0,
 possibleTrisprshaNearBoundaryNotAValidIndependentRule:0};
const originalSourceTithiRisk=[];
const rootSigned=[];
try{
 for(const c of residual.allCasePhysicalDawnEvidence){
  const key=sourceEventKey(c.city,c.date),src=original.get(key);
  check(src!==undefined,"original GCal exact source sunrise missing for residual "+key);
  const city=findCityBySlug(c.city)!;
  check(Math.abs(city.lat-src.latitude)<0.01&&Math.abs(city.lng-src.longitude)<0.01,
   "original GCal city longitude or latitude differs "+key);
  const input:IndependentRuleDay[]=c.exactJplTithiWindow.map((d:{date:string;jplSunriseTithi:number;jplArunodayaTithi:number;swissNakshatraIndex:number})=>{
   const calculated=sample(c.city,d.date);
   check(calculated.sunriseTithi===d.jplSunriseTithi&&
    calculated.arunodayaTithi===d.jplArunodayaTithi&&
    calculated.swissNakshatra===d.swissNakshatraIndex,
    "independent physical sunrise or Swiss Lahiri Nakshatra changed in pinned case "+c.city+"/"+d.date);
   return calculated;
  });
  const independentSwiss=documentedMahadvadashiPredicates(input,c.date,"swiss-lahiri");
  const independentJpl=documentedMahadvadashiPredicates(input,c.date,"jpl-lahiri-anchored");
  const sunrise=gcalClock(c.date,src.sunriseXml,"sunrise"),
   aru=gcalClock(c.date,src.arunodayaXml,"arunodaya");
  const sourceAtSunrise=originalTithi(src.sunriseXml);
  const jplAtSourceSunrise=phases(sunrise),jplAtSourceArunodaya=phases(aru);
  const swissAtSourceNakshatra=swissNak(sunrise);
  const jplAtSourceNakshatra=siderealStateAtUtc(sidereal.table,new Date(sunrise).toISOString()).nakshatra.index;
  const distance=nearestJplTithiBoundaryMs(jpl,sunrise)/1000;
  const gcalTithiDiffers=sourceAtSunrise!==jplAtSourceSunrise;
  counts.dateDisagreements+=Number(c.dateMismatch);
  counts.subtypeDisagreements+=Number(c.subtypeMismatch);
  counts.originalGcalSunriseTithiDiffersFromJplAtSameClock+=Number(gcalTithiDiffers);
  counts.originalGcalSunriseTithiMatchesJplAtSameClock+=Number(!gcalTithiDiffers);
  counts.gcalSunriseTithiDiffersFromJplWithinTwoMinutesOfJplRoot+=Number(gcalTithiDiffers&&distance<=120);
  counts.oldSwissSunriseNakMismatch+=Number(input[1].swissNakshatra!==c.current.swissNakshatraIndex);
  const docSource=c.sourceSubtype?identifySourceMahadvadashi(c.sourceSubtype):null;
  const docNak=c.sourceSubtype?identifySourceNakshatra(c.sourceSubtype):null;
  const classifyMatch=(x:typeof independentSwiss)=>{
   if(docSource===null)return x.family==="NO_DOCUMENTED_SUBTYPE";
   if(docSource==="NAKSHATRA_REVIEW")return x.family===docNak;
   return x.family===docSource;
  };
  counts.documentedSwissSourceSubtypeMatches+=Number(classifyMatch(independentSwiss));
  counts.documentedJplSourceSubtypeMatches+=Number(classifyMatch(independentJpl));
  counts.possibleTrisprshaNearBoundaryNotAValidIndependentRule+=Number(
   independentSwiss.nearBoundaryNotARule&&/trispr/i.test(c.sourceSubtype??""));
  if(gcalTithiDiffers)originalSourceTithiRisk.push({city:c.city,date:c.date,
   sourceTithi:sourceAtSunrise,jplTithiAtSourceClock:jplAtSourceSunrise,
   nearestJplRootSeconds:distance});
  const vignette=c.vijaya20270912||c.unmilani20270304;
  results.push({city:c.city,date:c.date,year:c.year,
   sourceFast:c.sourceFast,sourceSubtype:c.sourceSubtype,
   oldIndependentFast:c.jplIndependentFast,oldIndependentKind:c.jplKind,
   originalFastDateDisagreement:c.dateMismatch,originalSubtypeDisagreement:c.subtypeMismatch,
   gcalOriginalSunriseUtc:new Date(sunrise).toISOString(),
   gcalOriginalArunodayaUtc:new Date(aru).toISOString(),
   originalSunriseTithi:sourceAtSunrise,
   exactJplTithiAtOriginalGcalSunrise:jplAtSourceSunrise,
   exactJplTithiAtOriginalGcalArunodaya:jplAtSourceArunodaya,
   nearestPhysicalJplSunriseTithiRootSeconds:+distance.toFixed(3),
   originalGcalVsJplSunriseTithiDisagreement:gcalTithiDiffers,
   originalSwissMoonNakshatraAtGcalSunrise:swissAtSourceNakshatra,
   originalJplMoonNakshatraAtGcalSunrise:jplAtSourceNakshatra,
   sourceSunriseXml:src.sunriseXml,sourceArunodayaXml:src.arunodayaXml,
   originalGcalSunsetXml:src.sunsetXml,
   independentSwissLahiriDocumentedDecision:independentSwiss,
   independentJplAnchorLahiriDocumentedDecision:independentJpl,
   matchesSourceSubtypeSwissModel:classifyMatch(independentSwiss),
   matchesSourceSubtypeJplAnchorModel:classifyMatch(independentJpl),
   independentJplTithiAtSunset:input[1].sunsetTithi,
   independentSwissNakshatraAtSunrise:input[1].swissNakshatra,
   independentJplAnchorNakshatraAtSunrise:input[1].jplNakshatra,
   fullyIndependentAyanamsa:false,ritualRulesCertified:false,
   originalSourceLabelsOnlyUsedAfterIndependentComputation:true});
  if(c.vijaya20270912){
   const next=original.get(sourceEventKey(c.city,"2027-09-13"));
   check(next!==undefined,"original GCal following Vijaya sunrise source is missing "+c.city);
   const at=gcalClock("2027-09-13",next.sunriseXml,"sunrise");
   const near=sidereal.table.events.nakshatra.find(([t,idx])=>
     idx===22&&t>=Date.UTC(2027,8,12)&&t<=Date.UTC(2027,8,14));
   check(Boolean(near),"physical JPL Sravana to Dhanishta ingress absent");
   const root=directlySolveSwissLahiriNakshatraIngress(near![0],22,at);
   rootSigned.push({city:c.city,sourceGcalNextSunriseUtc:new Date(at).toISOString(),
    sourceGcalNextSunriseNakshatraXml:next.sunriseXml,
    jplMoonNakshatraAtOriginalSourceSunrise:
     siderealStateAtUtc(sidereal.table,new Date(at).toISOString()).nakshatra.index,
    swissMoonNakshatraAtOriginalSourceSunrise:swissNak(at),
    jplVsSwissExactLahiriRoot:root,
    originalGcalStillOnlyComparison:true});
  }
 }
}finally{sweClose(s);}
check(results.length===117&&counts.dateDisagreements===84&&counts.subtypeDisagreements===73,
 "original 117 unique 84/73 residual case accounting incomplete");
check(rootSigned.length===3,"all three original Vijaya sidereal UTC roots must be solved directly");
const byType:Record<string,{events:number;physicalGcalJplSunriseTithiConflict:number;documentedSwissMatch:number;documentedJplAnchorMatch:number}>={};
for(const row of results){
 const key=row.sourceSubtype??(row.oldIndependentKind??"DATE_ONLY");
 const g=byType[key]??{events:0,physicalGcalJplSunriseTithiConflict:0,
  documentedSwissMatch:0,documentedJplAnchorMatch:0};
 g.events++;
 g.physicalGcalJplSunriseTithiConflict+=Number(row.originalGcalVsJplSunriseTithiDisagreement);
 g.documentedSwissMatch+=Number(row.matchesSourceSubtypeSwissModel);
 g.documentedJplAnchorMatch+=Number(row.matchesSourceSubtypeJplAnchorModel);
 byType[key]=g;
}
const report={status:"PINNED_117_MAHADVADASHI_LAHIRI_DECISION_RESEARCH_ONLY",
 coverage:{cityYearsFromParent:908,citiesFromParent:454,uniqueSourceComparisonCases:results.length,
  fastingDateDisagreements:counts.dateDisagreements,
  bidirectionalSubtypeDisagreements:counts.subtypeDisagreements,
  sourceGcalRawDayEvidence:gcal.observedDayXmlRows},
 originalSourceExecutableGitBlob:gcal.originalExeGitBlob,
 jplLunarPhysicalRootSha256:JPL_V6_ROOTS_ASSET_SHA256,
 jplSiderealCatalogSha256:sidereal.sourceDigest,
 swissLahiriAnchorSha256:sidereal.lahiriAnchorDigest,
 docs:"GCAL Vaisnava Events Calculation, tables 1–2: special Nakshatra sunrise/sunset condition and Dvadasi/Unmilani/Trisprsha/Vyanjuli/Paksha-vardhini order",
 calculations:{...counts,bySourceSubtype:byType,sourceJplPhysicalTithiConflicts:originalSourceTithiRisk,
  directSwissLahiriVijayaIngressRoots:rootSigned},
 all117IndependentRuleDecisionProofs:results,
 modelLimitations:{jplSiderealAnchorBasedOnSwissLahiri:true,
  exactSwissLahiriSiderealRootSolvedDirectly:true,
  originalGcalLabelsDoNotDetermineClassifier:true,
  sourceMatchedNotEquivalentToTraditionCertified:true,
  nearBoundaryRequiresExplicitObserverAndEphemerisConvention:true,
  fullGcalRulePriorityNotIndependentlyReligiousValidated:true},
 ...MAHADVADASHI_PUBLISH_GUARD,...DIRECT_LAHIRI_RELEASE_GUARD,
 independentlyCertified:false,publicRitualApproval:false,approvedForSEO:false};
mkdirSync(dirname(params.output),{recursive:true});
writeFileSync(params.output,JSON.stringify(report,null,2)+"\n");
console.log("[JPL vs directly solved Swiss Lahiri 117 cases]",JSON.stringify({
 coverage:report.coverage,counts,bySubtype:byType,roots:rootSigned.map(x=>({
  city:x.city,jplMinusSwissSeconds:x.jplVsSwissExactLahiriRoot.swissMinusJplSeconds}))}));
