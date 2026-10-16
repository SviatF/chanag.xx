/**
 * Wave 3AU. Full 36-event × 454-city, research-only local-day selection
 * comparison for V5's Bengal, Tamil and Kerala solar-month conventions.
 *
 * This distinguishes:
 * (a) sunrise sign changes (3AT, 44 observations), from
 * (b) the regional civil date to which a solar month is assigned.
 * Neither is equivalent to a certified festival / vrata / muhurat date.
 */
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {createHash} from "node:crypto";
import {createDefaultSweData} from "@typescriptify/sweph/dist/types.js";
import {sweClose} from "@typescriptify/sweph/dist/sweph.js";
import {sweRiseTrans} from "@typescriptify/sweph/dist/swecl.js";
import {SE_SUN,SEFLG_MOSEPH,SE_CALC_RISE,SE_CALC_SET} from "@typescriptify/sweph/dist/constants.js";
import {supportedCities,type City} from "../lib/cities";
import {indiaCivilDayStartJulian} from "../lib/india-time";
import {openVerifiedV6SiderealSource} from "../lib/v6-unified-calendar-staging";
import {validateSiderealTransitionTable,siderealStateAtUtc} from "../lib/jpl-v6-sidereal-transitions";
import {IST_OFFSET_MS,SANKRANTI_RULES,regionalIngressCandidates,compareRegionalIngress,
  type LocalSolarDay,type SankrantiRule} from "../lib/wave3au-sankranti-policy";

const originalText=readFileSync("artifacts/wave3ao-jpl-global-sidereal-transitions.json","utf8");
const anchorsText=readFileSync("artifacts/wave3ao-lahiri-6h-anchors.json","utf8");
const nativeText=readFileSync("artifacts/wave3as-jpl-native-lahiri-root-candidate.json","utf8");
const nativeAnchorsText=readFileSync("artifacts/wave3as-native-swiss-lahiri-candidate.json","utf8");
const counterText=readFileSync("artifacts/wave3as-native-lahiri-jpl-root-counterfactual.json","utf8");
const reportText=readFileSync("artifacts/wave3at-native-lahiri-sankranti-sunrise-impact.json","utf8");
const digest=(s:string)=>createHash("sha256").update(s).digest("hex");
const pinned=openVerifiedV6SiderealSource(originalText,anchorsText);
const native=validateSiderealTransitionTable(JSON.parse(nativeText));
const counter=JSON.parse(counterText);
const previous=JSON.parse(reportText);
if(counter.wave!=="3AS"||counter.full36SolarRashiRootClockParityWithinThreeSeconds!==true||
   counter.nativeLahiriCatalogSha256!==digest(nativeText)||
   counter.nativeLahiriAnchorSha256!==digest(nativeAnchorsText)||
   native.lahiriAnchorSha256!==digest(nativeAnchorsText)||
   native.solarLunarKernelSha256!==pinned.table.solarLunarKernelSha256||
   native.lunarRootSourceSha256!==pinned.table.lunarRootSourceSha256||
   native.productionSwitchAllowed!==false||
   previous.wave!=="3AT"||previous.status!=="research-only"||
   previous.productionV6ReleaseAllowed!==false||
   previous.independentLahiriPolicyApproved!==false||
   previous.ritualSankrantiDatesApproved!==false||
   previous.provenance?.originalCatalogSha256!==digest(originalText)||
   previous.provenance?.nativeCatalogSha256!==digest(nativeText)||
   previous.provenance?.nativeAnchorSha256!==digest(nativeAnchorsText))
  throw Error("Wave3AU received unreviewed or mixed JPL/Lahiri sources");

const cities=new Map<string,City>();
for(const city of supportedCities){
  const old=cities.get(city.slug);
  if(old&&(city.lng!==old.lng||city.lat!==old.lat||city.state!==old.state))
    throw Error("Conflicting canonical city: "+city.slug);
  cities.set(city.slug,city);
}
if(cities.size!==454||previous.uniqueCities!==454||
   previous.events!==36||previous.inspectedExactSunrises<48000||
   previous.changedSolarRashiClassifications!==44)
  throw Error("Unexpected canonical geographic census or source reference totals");
if(!Array.isArray(previous.observations)||!Array.isArray(previous.changedDateClusters))
  throw Error("3AT exact dawn evidence missing");
const changedSunriseRows=previous.observations.filter((o:{difference:boolean})=>o.difference);
if(changedSunriseRows.length!==44)
  throw Error("3AT source contains no complete 44-case sunrise discrepancy sample");
const observed=new Map<string,{originalIndex:number;nativeCandidateIndex:number;exactSunriseUtc:string}>();
for(const row of changedSunriseRows){
  if(!cities.has(row.city)||!/^2027-(03-15|07-17)$/.test(row.date)||
     !Number.isInteger(row.originalIndex)||!Number.isInteger(row.nativeCandidateIndex))
    throw Error("Unexpected 3AT sunrise observation location/date");
  const key=row.city+"|"+row.date;
  if(observed.has(key))throw Error("Duplicate 3AT sunrise observation "+key);
  const first=siderealStateAtUtc(pinned.table,row.exactSunriseUtc).sunRashi.index;
  const second=siderealStateAtUtc(native,row.exactSunriseUtc).sunRashi.index;
  if(first===second||first!==row.originalIndex||second!==row.nativeCandidateIndex)
    throw Error("3AT sign disagreement cannot be reproduced at exact UTC dawn");
  observed.set(key,row);
}
if(observed.size!==44)throw Error("Not all 44 unique 3AT city-dates found");
const countsByDate=new Map<string,number>();
for(const [,row] of observed){
  const date=row.exactSunriseUtc; // Each exact dawn is still validated against its city/date below.
  if(!Number.isFinite(Date.parse(date)))throw Error("Invalid sunrise timestamp");
}
for(const key of observed.keys()){
  const day=key.split("|")[1];countsByDate.set(day,(countsByDate.get(day)??0)+1);
}
if(countsByDate.get("2027-03-15")!==8||countsByDate.get("2027-07-17")!==36||
   previous.changedDateClusters.length!==2)
  throw Error("3AT city-date clusters have changed without independent review");

const swed=createDefaultSweData();
const JD0=2440587.5,DAY_MS=86400_000;
const cache=new Map<string,LocalSolarDay>();
function indiaDate(ms:number){
  return new Date(ms+IST_OFFSET_MS).toISOString().slice(0,10);
}
function sunClocks(city:City,date:string):LocalSolarDay{
  const key=city.slug+"|"+date;
  const old=cache.get(key);if(old)return old;
  const [y,m,d]=date.split("-").map(Number);
  const at=indiaCivilDayStartJulian(y,m,d);
  const geo=[city.lng,city.lat,0];
  const rise=sweRiseTrans(swed,at,SE_SUN,null,SEFLG_MOSEPH,SE_CALC_RISE,geo,1013.25,25,null);
  const set=sweRiseTrans(swed,at,SE_SUN,null,SEFLG_MOSEPH,SE_CALC_SET,geo,1013.25,25,null);
  if(rise.retval<0||set.retval<0||!Number.isFinite(rise.tret)||!Number.isFinite(set.tret))
    throw Error("Cannot determine real local dawn or dusk for "+key);
  const val={date,sunriseUtcMs:Math.round((rise.tret-JD0)*DAY_MS),
    sunsetUtcMs:Math.round((set.tret-JD0)*DAY_MS)};
  if(indiaDate(val.sunriseUtcMs)!==date||indiaDate(val.sunsetUtcMs)!==date||
     val.sunsetUtcMs<=val.sunriseUtcMs)
    throw Error("Out-of-day or reversed physical solar clocks for "+key);
  cache.set(key,val);return val;
}

const changesPerRule:Record<SankrantiRule,number>={
  "bengal-midnight-v5":0,"tamil-sunset-v5":0,"kerala-three-fifths-v5":0
};
const eventChanges:Array<{eventIndex:number;oldUtc:string;nativeUtc:string;
  signIndex:number;counts:Record<SankrantiRule,number>}>=[];

type ReviewItem={
  city:string;state:string;eventIndex:number;solarSignIndex:number;
  originalEventUtc:string;nativeCandidateEventUtc:string;
  originalDateIst:string;nativeDateIst:string;
  sunriseUtc:string;sunsetUtc:string;
  previousWaveSunriseDisagreement:boolean;
  changedRegionalRules:SankrantiRule[];
  oldMonthStart:Record<SankrantiRule,string>;
  nativeMonthStart:Record<SankrantiRule,string>;
  signedSecondsToCutoffOld:Record<SankrantiRule,number>;
  signedSecondsToCutoffNative:Record<SankrantiRule,number>;
  reviewerStatus:"pending-independent-calendar-source";
};
const queue:ReviewItem[]=[];
const highestRisk:Array<{city:string;eventIndex:number;closestCutoffSeconds:number;
  modelClockShiftSeconds:number;changedRules:SankrantiRule[]}>=[];
let evaluated=0,crossChecked=0,geographicSunriseDisagreements=0;
try{
  for(let i=0;i<36;i++){
    const oldEvent=pinned.table.events.sunRashi[i];
    const newEvent=native.events.sunRashi[i];
    if(!oldEvent||!newEvent||oldEvent[1]!==newEvent[1])
      throw Error("Mismatched physical ingress identity "+i);
    const clockShiftSeconds=Math.abs(newEvent[0]-oldEvent[0])/1000;
    if(clockShiftSeconds>3600)throw Error("Unreasonably shifted physical ingress "+i);
    const perEvent:Record<SankrantiRule,number>={
      "bengal-midnight-v5":0,"tamil-sunset-v5":0,"kerala-three-fifths-v5":0
    };
    for(const city of cities.values()){
      const originalDay=sunClocks(city,indiaDate(oldEvent[0]));
      const candidateDay=sunClocks(city,indiaDate(newEvent[0]));
      const original=regionalIngressCandidates(oldEvent[0],originalDay);
      const candidate=regionalIngressCandidates(newEvent[0],candidateDay);
      const delta=compareRegionalIngress(original,candidate);
      evaluated++;
      for(const rule of delta.changedRules){changesPerRule[rule]++;perEvent[rule]++;}
      const sunriseKey=city.slug+"|"+indiaDate(oldEvent[0]);
      const prior=observed.get(sunriseKey);
      let sunriseChanged=false;
      if(prior){
        const sunrise=originalDay.sunriseUtcMs;
        if(Math.abs(sunrise-Date.parse(prior.exactSunriseUtc))>2500)
          throw Error("Exact 3AT dawn clock failed local replay "+sunriseKey);
        const first=siderealStateAtUtc(pinned.table,new Date(sunrise).toISOString()).sunRashi.index;
        const second=siderealStateAtUtc(native,new Date(sunrise).toISOString()).sunRashi.index;
        if(first!==prior.originalIndex||second!==prior.nativeCandidateIndex)
          throw Error("Source-root sunrise sign identity changed "+sunriseKey);
        sunriseChanged=true;crossChecked++;
      }
      if(sunriseChanged)geographicSunriseDisagreements++;
      const risk=delta.nearestCutoffDistanceSeconds<=Math.ceil(clockShiftSeconds)+120;
      if(risk)highestRisk.push({city:city.slug,eventIndex:i,
        closestCutoffSeconds:delta.nearestCutoffDistanceSeconds,
        modelClockShiftSeconds:Math.round(clockShiftSeconds),
        changedRules:delta.changedRules});
      if(delta.changedRules.length||sunriseChanged||risk){
        queue.push({
          city:city.slug,state:city.state,eventIndex:i,solarSignIndex:oldEvent[1],
          originalEventUtc:new Date(oldEvent[0]).toISOString(),
          nativeCandidateEventUtc:new Date(newEvent[0]).toISOString(),
          originalDateIst:originalDay.date,nativeDateIst:candidateDay.date,
          sunriseUtc:new Date(originalDay.sunriseUtcMs).toISOString(),
          sunsetUtc:new Date(originalDay.sunsetUtcMs).toISOString(),
          previousWaveSunriseDisagreement:sunriseChanged,
          changedRegionalRules:delta.changedRules,
          oldMonthStart:original.proposedMonthStart,
          nativeMonthStart:candidate.proposedMonthStart,
          signedSecondsToCutoffOld:original.signedSecondsFromCutoff,
          signedSecondsToCutoffNative:candidate.signedSecondsFromCutoff,
          reviewerStatus:"pending-independent-calendar-source"
        });
      }
    }
    eventChanges.push({eventIndex:i,oldUtc:new Date(oldEvent[0]).toISOString(),
      nativeUtc:new Date(newEvent[0]).toISOString(),signIndex:oldEvent[1],counts:perEvent});
  }
}finally{sweClose(swed);}
if(evaluated!==36*454||crossChecked!==44||geographicSunriseDisagreements!==44)
  throw Error("Incomplete regional policy counterfactual: "+JSON.stringify({evaluated,crossChecked,geographicSunriseDisagreements}));
const result={
  wave:"3AU",status:"research-only",method:"exact source UTC ingress + actual local sunrise/sunset",
  sourcePolicies:SANKRANTI_RULES,
  sourceAcknowledgement:"Regional policies mirror the current public V5 implementation, not independently approved liturgical rules",
  totalEventCityPairs:evaluated,events:36,canonicalCities:454,
  reproducedPriorWaveSunriseDisagreements:crossChecked,
  changedMonthStartAssignmentsPerRule:changesPerRule,
  eventSummary:eventChanges,
  reviewQueue:queue.sort((a,b)=>a.originalEventUtc.localeCompare(b.originalEventUtc)||a.city.localeCompare(b.city)),
  nearSourceClockCutoffCandidates:highestRisk.length,
  evidence:{
    priorWave3AT:digest(reportText),originalJplCatalog:digest(originalText),
    originalLahiriAnchors:digest(anchorsText),nativeJplCatalog:digest(nativeText),
    nativeLahiriAnchors:digest(nativeAnchorsText),native36RootCounterfactual:digest(counterText)
  },
  independentCalendarAuthorityValidated:false,
  independentLahiriPolicyApproved:false,
  ritualSankrantiDatesApproved:false,
  monthSamvatVratFestivalMuhuratDatesApproved:false,
  publicV5Modified:false,
  productionV6ReleaseAllowed:false
};
mkdirSync("artifacts",{recursive:true});
writeFileSync("artifacts/wave3au-sankranti-regional-rule-review.json",JSON.stringify(result,null,2)+"\n");
console.log("[Wave3AU] "+JSON.stringify({events:36,cities:454,pairs:evaluated,
  priorSunriseDisagreements:crossChecked,regionalMonthStartDifferences:changesPerRule,
  reviewerQueue:queue.length,nearCutoff:highestRisk.length,liveModified:false}));
