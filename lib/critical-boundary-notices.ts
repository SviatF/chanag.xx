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
    summary:"Kanpur's sunrise lies inside a model-sensitive Ekadashi-to-Dwadashi transition. PANCHVANI's Swiss/Moshier model computes a 06:31:19.850 IST boundary and 06:31:57.425 sunrise (Dwadashi), while independent JPL DE440s calculates the boundary at 06:32:01.530 and sunrise 06:31:51.135 (Ekadashi). JPL supports Ekadashi at sunrise, but no complete Smarta/ISKCON fast or Parana date has been certified; no automatic override is applied.",
    mathematicalCalculationChanged:false,fastOrCeremonyDateCertified:false
  },
  {
    city:"patna",date:"2027-01-31",
    kind:"published-clock-boundary-disagreement",
    summary:"Patna's Navami-to-Dashami boundary has three independently implemented astronomical outcomes: PANCHVANI Swiss/Moshier 06:33:30.643 IST (sunrise 06:33:40.748; Dashami); Astronomy Engine 06:34:54 (sunrise 06:33:33; Navami); and high-precision JPL DE440s 06:34:15.581 (sunrise 06:33:34.599; Navami). JPL supports Navami at sunrise and reveals an approximately 45-second difference from the current Swiss/Moshier Tithi transition. The calculation models use differing lunar theories and observer conventions, so the production date is NOT independently certified; ritual or fasting selection must not rely on this label alone.",
    mathematicalCalculationChanged:false,fastOrCeremonyDateCertified:false
  },
  {
    city:"lucknow",date:"2027-09-17",
    kind:"round-minute-publication-ambiguity",
    summary:"Lucknow's Pratipada-to-Dwitiya transition occurs extremely close to sunrise. PANCHVANI Swiss/Moshier estimates 05:51:38.289 IST, sunrise 05:52:26.078; high-precision JPL DE440s computes the transition at 05:52:18.899 and sunrise at 05:52:19.732 — only about 0.8 seconds apart. Both current calculations label Dwitiya at sunrise, but such a sub-second margin is sensitive to atmospheric refraction, observer elevation and methodology. It is not an independently certified ritual date.",
    mathematicalCalculationChanged:false,fastOrCeremonyDateCertified:false
  }
] as const;

const notices=new Map(criticalBoundaryNotices.map(n=>[n.city+"|"+n.date,n]));
export function criticalBoundaryNotice(citySlug:string,date:string):CriticalBoundaryNotice|null{
  return notices.get(citySlug+"|"+date)??null;
}
