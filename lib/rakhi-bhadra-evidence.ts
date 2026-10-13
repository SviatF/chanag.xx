import type {Panchang} from "./panchang";

/**
 * Minimal evidence-based Raksha Bandhan screening.
 * On Shukla Purnima the first half (Vishti karana) is Bhadra;
 * the second half is Bava. When the first sunrise state is
 * Purnima + Bava, Bhadra has already ended before that sunrise.
 *
 * This does NOT calculate Bhadra's exact start/end or certify
 * exceptional Bhadra Mukha/Puchha, Aparahna/Pradosh preferences,
 * and region-/tradition-dependent full Muhurat rules.
 */
export type RakhiBhadraEvidence={
  status:"purnima-bhadra-cleared"|"vishti-at-sunrise"|"no-sunrise-purnima"|"unresolved";
  start:string|null;end:string|null;
  explanation:string;
};
const minute=(clock:string)=>{
  const match=/^([01][0-9]|2[0-3]):([0-5][0-9])$/.exec(clock);
  return match?Number(match[1])*60+Number(match[2]):null;
};
export function rakhiBhadraAtSunrise(data:Panchang):RakhiBhadraEvidence{
  if(data.paksha!=="Shukla"||data.tithi!=="Purnima")
    return {status:"no-sunrise-purnima",start:null,end:null,
      explanation:"Purnima is not active at local sunrise; a sunrise-only karana screen cannot establish a Rakhi window."};
  if(data.karana==="Vishti")
    return {status:"vishti-at-sunrise",start:null,end:null,
      explanation:"Vishti (Bhadra) is active at local sunrise; no Rakhi time is approved without its actual end."};
  if(data.karana!=="Bava")
    return {status:"unresolved",start:null,end:null,
      explanation:"The sunrise Karana does not confirm the post-Bhadra half of Purnima."};
  const rise=minute(data.sunrise),end=minute(data.tithiEnd),sunset=minute(data.sunset);
  if(rise===null||end===null||sunset===null||data.tithiEndDate!==data.date||end<=rise||sunset<=rise)
    return {status:"unresolved",start:null,end:null,
      explanation:"Local Purnima end or sunrise chronology could not be verified for a same-day Rakhi interval."};
  const cutoff=Math.min(end,sunset);
  if(cutoff<=rise)return {status:"unresolved",start:null,end:null,
    explanation:"Purnima does not yield a daylight Rakhi interval after sunrise."};
  const finalTime=cutoff===end?data.tithiEnd:data.sunset;
  return {status:"purnima-bhadra-cleared",start:data.sunrise,end:finalTime,
    explanation:`At ${data.sunrise} local sunrise, Shukla Purnima is active and its Karana is Bava (the half following Vishti/Bhadra). Bhadra has therefore already ended by sunrise. The calculated daylight overlap with Purnima runs until ${finalTime} on ${data.date}.`};
}
