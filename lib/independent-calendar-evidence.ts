/**
 * Source-ledger checkpoints, transcribed from actual external published pages
 * on 2026-10-26. Publication corroboration != independent astronomical proof;
 * one tradition's fast/puja date cannot be silently generalized to all cities.
 * Scopes below are deliberately limited to Delhi; never infer city-wide verdicts.
 */
export const independentCalendarReviewedOn="2026-10-26" as const;

export const delhiEkadashiExamples=[
  {
    year:2026,month:"November",name:"Devutthana Ekadashi",
    smarta:"2026-11-20",vaishnava:"2026-11-21",
    explanation:"Smarta fast on 20 November; Gauna/Vaishnava fast on 21 November. Ekadashi Tithi begins after sunrise on the 20th and ends before sunrise on the 21st, so the sunrise-only list does not prescribe either fast."
  },
  {
    year:2027,month:"January",name:"Pausha Putrada Ekadashi",
    smarta:"2027-01-18",vaishnava:"2027-01-19",
    explanation:"Smarta fast on 18 January and Vaishnava on 19 January in the cited Delhi calendar; the astronomical Tithi begins at 10:26 on the 18th and continues beyond sunrise on the 19th."
  }
] as const;

export const delhiFestivalExamples=[
  {
    year:2027,slug:"makar-sankranti",observance:"2027-01-15",
    title:"Solar ingress versus observance day",
    explanation:"For Delhi, the source reports the Sun entering Makara at 21:14 IST on 14 January 2027, after sunset. Ritual Punya Kaal is therefore listed for 15 January, the next civil day. A holiday listing on 14 January can represent the solar transition or another calendar convention, not the same observed Punya Kaal.",
    independentRitualTimingCertified:false
  },
  {
    year:2027,slug:"akshaya-tritiya",observance:"2027-05-09",
    title:"Puja date versus previous-day Tithi / purchase window",
    explanation:"For Delhi, Tritiya Tithi starts at 11:42 on 8 May 2027 and ends at 09:03 on 9 May. The festival puja date is 9 May. A published gold-purchase period beginning on 8 May is not evidence that the Delhi festival puja date itself is 8 May.",
    independentRitualTimingCertified:false
  }
] as const;

export function delhiFestivalEvidence(slug:string,year:number,citySlug:string){
  if(citySlug!=="delhi")return null;
  return delhiFestivalExamples.find(x=>x.slug===slug&&x.year===year)??null;
}
export function delhiEkadashiEvidence(slug:string,year:number,citySlug:string){
  if(citySlug!=="delhi"||slug!=="ekadashi")return null;
  return delhiEkadashiExamples.find(x=>x.year===year)??null;
}
