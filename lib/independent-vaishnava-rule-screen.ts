/**
 * Independent-rule research screen — not a GCal result parser or certified vrata selector.
 * Consumes astronomical sunrise/arunodaya Tithi independently computed by Swiss,
 * and applies separately specified, intentionally INCOMPLETE rule checks.
 * DO NOT use results to publish a fast or Parana recommendation.
 */
export const VAISHNAVA_RESEARCH_PROFILE="arunodaya-96m-provisional-partial-v1" as const;
export type DayObservation={
 date:string;
 sunriseTithiIndex:number;
 arunodayaTithiIndex:number;
 followingSunriseTithiIndex:number;
 nearFiveMinuteAstronomicalBoundary:boolean;
 hariVasara:null|{validOrder:boolean;dwadashiStart:{date:string;time:string};dwadashiEnd:{date:string;time:string};firstQuarterEnds:{date:string;time:string};researchEarliestPostSunriseAndQuarter:{date:string;time:string}};
};
const is=(v:number,tithi:number)=>v===tithi||v===tithi+15;
export type ResearchClassification={
 date:string;sunriseEkadashi:boolean;dashamiAtArunodaya:boolean;ekadashiRepeatedAtNextSunrise:boolean;
 nextSunriseDwadashi:boolean;hariVasaraLowerBound:string|null;
 boundaryRisk:boolean;requiresMahadvadashiReview:boolean;requiresKshayaReview:boolean;
 tentativeFastEligibility:"screen-compatible"|"dashami-vedha-flag"|"not-ekadashi-at-sunrise"|"boundary-uncertain";
 certifiedFastDate:null;certifiedParana:null;reason:string
};
export function independentlyScreenVaishnavaDay(v:DayObservation):ResearchClassification{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(v.date)||[v.sunriseTithiIndex,v.arunodayaTithiIndex,v.followingSunriseTithiIndex].some(x=>!Number.isInteger(x)||x<0||x>29))throw Error("Invalid independent observation");
 const ek=is(v.sunriseTithiIndex,10),dashami=is(v.arunodayaTithiIndex,9),nextDwadashi=is(v.followingSunriseTithiIndex,11);
 const repeated=ek&&v.followingSunriseTithiIndex===v.sunriseTithiIndex;
 if(v.hariVasara&&!v.hariVasara.validOrder)throw Error("Invalid Hari Vasara arithmetic");
 const lower=v.hariVasara?.researchEarliestPostSunriseAndQuarter??null;
 return {
  date:v.date,sunriseEkadashi:ek,dashamiAtArunodaya:dashami&&ek,
  ekadashiRepeatedAtNextSunrise:repeated,nextSunriseDwadashi:nextDwadashi,
  hariVasaraLowerBound:lower?lower.date+"T"+lower.time:null,
  boundaryRisk:v.nearFiveMinuteAstronomicalBoundary,
  requiresMahadvadashiReview:repeated||!ek,
  requiresKshayaReview:ek&&!nextDwadashi&&!repeated,
  tentativeFastEligibility:v.nearFiveMinuteAstronomicalBoundary?"boundary-uncertain":!ek?"not-ekadashi-at-sunrise":dashami?"dashami-vedha-flag":"screen-compatible",
  certifiedFastDate:null,certifiedParana:null,
  reason:"Partial independent astronomical screening only; complete Mahadvadashi, Kshaya and sampradaya rules not implemented."
 };
}
