/**
 * Wave 3W: named, publisher-disputed *astronomical sunrise-boundary* cases.
 * Does not change the Swiss UT-correct calculation or select a ritual fast day.
 * These are three source-reviewed editorial cautions, NOT scientific
 * uncertainty intervals and NOT a list of all possible near-sunrise events.
 */
export type CriticalBoundaryNotice={
  city:string;
  date:string;
  kind:"published-clock-boundary-disagreement"|"round-minute-publication-ambiguity";
  summary:string;
  mathematicalCalculationChanged:false;
  fastOrCeremonyDateCertified:false;
};
export const criticalBoundaryNotices:readonly CriticalBoundaryNotice[]=[
  {
    city:"kanpur",date:"2026-11-21",
    kind:"published-clock-boundary-disagreement",
    summary:"Ekadashi ends very close to Kanpur sunrise. Independent published minute-resolution clocks and day-label conventions do not all establish the same exact sunrise state. This page shows PANCHVANI's calculated UT-based state, not an approved Ekadashi fasting or Parana date.",
    mathematicalCalculationChanged:false,fastOrCeremonyDateCertified:false
  },
  {
    city:"patna",date:"2027-01-31",
    kind:"published-clock-boundary-disagreement",
    summary:"Patna sunrise falls within a disputed Navami-to-Dashami boundary. PANCHVANI's Swiss/Moshier UT model computes Dashami at 06:33:40 IST sunrise (Tithi changed around 06:33:30), while independently implemented Astronomy Engine computes Navami at 06:33:33 IST sunrise (Tithi changes around 06:34:54). Published city calendars also report Navami at minute precision. The two astronomical models disagree by about 84 seconds on the boundary; neither result is independently certified against a high-precision reference or complete publisher method. Do not use this sunrise Tithi as a certified ritual/fast decision.",
    mathematicalCalculationChanged:false,fastOrCeremonyDateCertified:false
  },
  {
    city:"lucknow",date:"2027-09-17",
    kind:"round-minute-publication-ambiguity",
    summary:"Pratipada ends around Lucknow sunrise, and published Tithi endpoints are rounded to the minute. PANCHVANI calculates Dwitiya at its precise UT sunrise; these rounded publications alone cannot independently confirm a second-level transition order or a ritual date.",
    mathematicalCalculationChanged:false,fastOrCeremonyDateCertified:false
  }
] as const;

const notices=new Map(criticalBoundaryNotices.map(n=>[n.city+"|"+n.date,n]));
export function criticalBoundaryNotice(citySlug:string,date:string):CriticalBoundaryNotice|null{
  return notices.get(citySlug+"|"+date)??null;
}
