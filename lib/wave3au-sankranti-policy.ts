/**
 * Wave 3AU — calendar-day *candidates* for three currently implemented
 * regional solar-month conventions. This does not approve a religious
 * observance, a published Sankranti festival date, or an ayanamsa policy.
 *
 * The policies below intentionally describe the current V5 implementation
 * in lib/calendar-conventions.ts, not a universal Indian-calendar standard:
 * Bengal: sign at IST civil midnight; Tamil: sign at local sunset;
 * Malayalam: sign 3/5 of the way through local daylight.
 */
import {addIsoDays} from "./india-time";

export const IST_OFFSET_MS=330*60_000;
export type SankrantiRule="bengal-midnight-v5"|"tamil-sunset-v5"|"kerala-three-fifths-v5";
export const SANKRANTI_RULES:SankrantiRule[]=[
  "bengal-midnight-v5","tamil-sunset-v5","kerala-three-fifths-v5"
];

export type LocalSolarDay={
  date:string;
  sunriseUtcMs:number;
  sunsetUtcMs:number;
};

export type RegionalIngressCandidate={
  dateOfIngressIst:string;
  sourceEventUtc:string;
  proposedMonthStart:Record<SankrantiRule,string>;
  cutoffUtc:Record<SankrantiRule,string>;
  signedSecondsFromCutoff:Record<SankrantiRule,number>;
  independentlyCertified:false;
  ritualDateApproved:false;
};

/** This convention records which *civil day* receives the new solar month.
 * Do not use its output to select Pongal, Vishu, fasting or Muhurat dates. */
export function regionalIngressCandidates(ingressUtcMs:number,day:LocalSolarDay):RegionalIngressCandidate{
  if(!Number.isSafeInteger(ingressUtcMs)||!Number.isSafeInteger(day.sunriseUtcMs)||
     !Number.isSafeInteger(day.sunsetUtcMs)||day.sunriseUtcMs>=day.sunsetUtcMs)
    throw Error("Nonfinite or impossible local solar clocks");
  if(!/^20(26|27|28)-\d\d-\d\d$/.test(day.date)||
     !Number.isFinite(Date.parse(day.date+"T00:00:00Z"))||
     new Date(day.date+"T00:00:00Z").toISOString().slice(0,10)!==day.date)
    throw Error("Research day outside 2026–2028 coverage");
  const istDate=(ms:number)=>new Date(ms+IST_OFFSET_MS).toISOString().slice(0,10);
  if(istDate(ingressUtcMs)!==day.date||istDate(day.sunriseUtcMs)!==day.date||
     istDate(day.sunsetUtcMs)!==day.date)
    throw Error("Ingress and solar clocks are not from the same IST civil day");
  const midnightStart=Date.parse(day.date+"T00:00:00Z")-IST_OFFSET_MS;
  const midnightNext=Date.parse(addIsoDays(day.date,1)+"T00:00:00Z")-IST_OFFSET_MS;
  const daylight=day.sunsetUtcMs-day.sunriseUtcMs;
  if(daylight<6*3600_000||daylight>16*3600_000)
    throw Error("Impossible local daylight duration");
  const keralaCutoff=day.sunriseUtcMs+daylight*3/5;
  const cutoffs:Record<SankrantiRule,number>={
    "bengal-midnight-v5":midnightNext,
    "tamil-sunset-v5":day.sunsetUtcMs,
    "kerala-three-fifths-v5":keralaCutoff
  };
  const following=addIsoDays(day.date,1);
  return {
    dateOfIngressIst:day.date,
    sourceEventUtc:new Date(ingressUtcMs).toISOString(),
    proposedMonthStart:{
      "bengal-midnight-v5":ingressUtcMs===midnightStart?day.date:following,
      "tamil-sunset-v5":ingressUtcMs<=day.sunsetUtcMs?day.date:following,
      "kerala-three-fifths-v5":ingressUtcMs<=keralaCutoff?day.date:following
    },
    cutoffUtc:Object.fromEntries(SANKRANTI_RULES.map(k=>[k,new Date(cutoffs[k]).toISOString()])) as Record<SankrantiRule,string>,
    signedSecondsFromCutoff:Object.fromEntries(SANKRANTI_RULES.map(k=>[k,Math.round((ingressUtcMs-cutoffs[k])/1000)])) as Record<SankrantiRule,number>,
    independentlyCertified:false,ritualDateApproved:false
  };
}

export type TwoSourceRegionalDelta={
  old:RegionalIngressCandidate;
  native:RegionalIngressCandidate;
  changedRules:SankrantiRule[];
  nearestCutoffDistanceSeconds:number;
  ritualPublicationAllowed:false;
};
export function compareRegionalIngress(old:RegionalIngressCandidate,native:RegionalIngressCandidate):TwoSourceRegionalDelta{
  const changedRules=SANKRANTI_RULES.filter(k=>old.proposedMonthStart[k]!==native.proposedMonthStart[k]);
  const nearestCutoffDistanceSeconds=Math.min(...SANKRANTI_RULES.flatMap(k=>[
    Math.abs(old.signedSecondsFromCutoff[k]),Math.abs(native.signedSecondsFromCutoff[k])
  ]));
  return {old,native,changedRules,nearestCutoffDistanceSeconds,ritualPublicationAllowed:false};
}
