/**
 * Wave 3Q — observer-method reconciliation, research only.
 *
 * Swiss HE ecliptic/heliacal events and published Hindu Asta may represent
 * DIFFERENT definitions. This module measures *scenario sensitivity*, never
 * claims a confidence interval, model validation, or Muhurat suitability.
 */
import type {AstaPlanet,AstaReference} from "./asta-reference-audit";
import {evaluateAstaReferences,astaLocalMinute} from "./asta-reference-audit";

export type AstaNativeEvent="evening-last"|"morning-first";
export type AstaNativeRecord={
  locality:string;planet:AstaPlanet;event:AstaNativeEvent;
  atmosphere:{id:string};
  status:string;
  instantLocalIst?:string;
  targetYear?:number;
  sourceAgreementStatus?:string;
};
export type AstaScenarioPair={
  profile:string;
  lastEveningLocal:string;firstMorningLocal:string;
  lastEveningMinute:number;firstMorningMinute:number;
  hiddenPeriodMinutes:number;
  temporalOnlyOffsetsMinutes:null|{publishedStart:number;publishedEnd:number};
  /** NOT a reconstructed Hindu Asta interval or valid wedding ban. */
  eventDefinition:"swiss-heliacal-last-evening-to-first-morning";
};
export type AstaUncertaintyStatus=
  "missing-native-events"|"outside-target-year"|"invalid-native-pair"|
  "unpaired-atmosphere"|"exploratory-scenario-spread";

const eventTypes=["evening-last","morning-first"] as const;
export function reconcileAstaScenarios(
  planet:AstaPlanet,year:number,locality:string,
  records:readonly AstaNativeRecord[],references:readonly AstaReference[]
){
  if(!Number.isInteger(year)||year<1||!locality.trim())throw Error("Invalid Asta comparison target");
  const evidence=evaluateAstaReferences(references,planet,year,locality);
  const sameCityMinute=references.filter(r=>r.planet===planet&&r.year===year&&
    r.locality===locality&&r.precision==="minute");
  const eligibleRecords=records.filter(r=>r.locality===locality&&r.planet===planet);
  const buckets=new Map<string,Partial<Record<AstaNativeEvent,AstaNativeRecord>>>();
  let rejectedNativeRecords=0;
  for(const record of eligibleRecords){
    if(!record.atmosphere?.id?.trim()||!eventTypes.includes(record.event)){
      rejectedNativeRecords++;
      continue;
    }
    const entries=buckets.get(record.atmosphere.id)||{};
    if(entries[record.event]){rejectedNativeRecords++;continue;}
    entries[record.event]=record;
    buckets.set(record.atmosphere.id,entries);
  }
  const pairs:AstaScenarioPair[]=[];
  const excluded:Array<{profile:string;reason:string}>=[];
  let hasYearMismatch=false,hasInvalidOrder=false,hasUnpaired=false;
  for(const [profile,values] of buckets){
    const evening=values["evening-last"];
    const morning=values["morning-first"];
    if(!evening||!morning){
      excluded.push({profile,reason:"missing-one-event"});
      hasUnpaired=true;continue;
    }
    const first=evening.instantLocalIst,last=morning.instantLocalIst;
    if(!first||!last||!first.startsWith(year+"-")||!last.startsWith(year+"-")||
      evening.status!=="predicted-native-swiss-heliacal"||
      morning.status!=="predicted-native-swiss-heliacal"){
      excluded.push({profile,reason:"native-event-outside-target-year-or-unresolved"});
      hasYearMismatch=true;continue;
    }
    const start=astaLocalMinute(first),end=astaLocalMinute(last);
    if(start===null||end===null||start>=end){
      excluded.push({profile,reason:"invalid-native-order-or-civil-time"});
      hasInvalidOrder=true;continue;
    }
    const published=sameCityMinute.length===1?sameCityMinute[0]:null;
    const publishedStart=published?astaLocalMinute(published.startLocal):null;
    const publishedEnd=published?astaLocalMinute(published.endLocal):null;
    pairs.push({
      profile,lastEveningLocal:first,firstMorningLocal:last,
      lastEveningMinute:start,firstMorningMinute:end,
      hiddenPeriodMinutes:end-start,
      temporalOnlyOffsetsMinutes:publishedStart!==null&&publishedEnd!==null?
        {publishedStart:start-publishedStart,publishedEnd:end-publishedEnd}:null,
      eventDefinition:"swiss-heliacal-last-evening-to-first-morning"
    });
  }
  const status:AstaUncertaintyStatus=hasYearMismatch?"outside-target-year":
    hasInvalidOrder?"invalid-native-pair":hasUnpaired?"unpaired-atmosphere":
    !pairs.length?"missing-native-events":"exploratory-scenario-spread";
  const starts=pairs.map(p=>p.lastEveningMinute);
  const ends=pairs.map(p=>p.firstMorningMinute);
  const durations=pairs.map(p=>p.hiddenPeriodMinutes);
  return {
    planet,year,locality,status,
    sampleCount:eligibleRecords.length,
    rejectedNativeRecords,profilesAttempted:buckets.size,
    usableProfiles:pairs.length,
    sourceEvidence:evidence.status,
    referenceMethodologies:[...new Set(sameCityMinute.map(r=>r.method))],
    sameCityMinuteSourceCount:sameCityMinute.length,
    reproduciblePublisherMinuteSourceCount:evidence.reproducibleMinuteSourceCount,
    // Event dates may show close *clock proximity* but Drik's algorithm is
    // unpublished; do NOT assert the same definition.
    nativeMethod:"swiss-heliacal-first-last-visibility",
    sourceMethodMapping:"UNESTABLISHED" as const,
    independentlyValidated:false as const,
    safeForCeremonyFiltering:false as const,
    pairs,excluded,
    scenarioSensitivity:pairs.length>=2?{
      // Observed span of THESE assumed profiles, NOT any statistically
      // bounded interval, astronomical uncertainty or confidence interval.
      type:"sampled-hypothetical-scenario-envelope" as const,
      lastEveningEarliestMinute:Math.min(...starts),
      lastEveningLatestMinute:Math.max(...starts),
      firstMorningEarliestMinute:Math.min(...ends),
      firstMorningLatestMinute:Math.max(...ends),
      lastEveningSpreadMinutes:Math.max(...starts)-Math.min(...starts),
      firstMorningSpreadMinutes:Math.max(...ends)-Math.min(...ends),
      durationSpreadMinutes:Math.max(...durations)-Math.min(...durations),
      notAConfidenceInterval:true as const
    }:null,
    reason:"Neither a native Swiss visibility profile nor a single geolocated Hindu Asta source proves local or ritual equivalence."
  };
}
