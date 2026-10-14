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
  evidence:ReadonlyArray<{publisher:string;url:string;observation:string}>;
  mathematicalCalculationChanged:false;
  fastOrCeremonyDateCertified:false;
};
export const criticalBoundaryNotices:readonly CriticalBoundaryNotice[]=[
  {
    city:"kanpur",date:"2026-11-21",
    kind:"published-clock-boundary-disagreement",
    summary:"Ekadashi ends very close to Kanpur sunrise. Independent published minute-resolution clocks and day-label conventions do not all establish the same exact sunrise state. This page shows PANCHVANI's calculated UT-based state, not an approved Ekadashi fasting or Parana date.",
    evidence:[
      {publisher:"Vaya",url:"https://vaya.so/tools/panchang?d=2026-11-21&l=kanpur",
        observation:"Publishes Ekadashi ending at 06:31 and sunrise at 06:31:49 (not an exact-second Tithi end)."},
      {publisher:"Astro Vedic Kundali",url:"https://astrovedickundali.in/panchang/kanpur/2026-11-21/",
        observation:"Publishes Ekadashi ending at 06:32 with a minute-rounded sunrise."},
      {publisher:"Drik Panchang",url:"https://www.drikpanchang.com/iskcon/iskcon-ekadashi-list.html?geoname-id=1267995",
        observation:"Lists Utthana Ekadashi fasting on November 21 according to the ISKCON observance convention; fasting-day choice is not equivalent to raw Tithi-at-sunrise classification."}
    ],
    mathematicalCalculationChanged:false,fastOrCeremonyDateCertified:false
  },
  {
    city:"patna",date:"2027-01-31",
    kind:"published-clock-boundary-disagreement",
    summary:"Navami changes to Dashami very close to Patna sunrise. A published local minute-level Panchang indicates Navami still active at dawn, while PANCHVANI's UT-based calculation selects Dashami. The publisher methods and exact-second boundary have not been independently reconciled.",
    evidence:[
      {publisher:"Dev Panchang",url:"https://devpanchang.in/en/panchang/patna/2027-01-31",
        observation:"Publishes Navami until 06:34 and Patna sunrise at 06:33, without a second-resolution transition."},
      {publisher:"LivePanditji",url:"https://www.livepanditji.com/panchang-in/patna/january-2027/",
        observation:"Lists Dashami for January 31 but notes its day Tithi and Nakshatra come from national/New Delhi reference data; not independent Patna-local minute verification."}
    ],
    mathematicalCalculationChanged:false,fastOrCeremonyDateCertified:false
  },
  {
    city:"lucknow",date:"2027-09-17",
    kind:"round-minute-publication-ambiguity",
    summary:"Pratipada ends around Lucknow sunrise, and published Tithi endpoints are rounded to the minute. PANCHVANI calculates Dwitiya at its precise UT sunrise; these rounded publications alone cannot independently confirm a second-level transition order or a ritual date.",
    evidence:[
      {publisher:"Vaya",url:"https://vaya.so/tools/panchang?d=2027-09-17&l=lucknow",
        observation:"Publishes Pratipada until 05:52 and sunrise 05:52:27; Tithi-end seconds are not exposed."},
      {publisher:"BDA",url:"https://www.bda.ai/_functions/tithiPage?city=lucknow&slug=krishna-dwitiya&year=2027",
        observation:"Publishes Dwitiya beginning at 05:52, again minute-rounded."}
    ],
    mathematicalCalculationChanged:false,fastOrCeremonyDateCertified:false
  }
] as const;

const notices=new Map(criticalBoundaryNotices.map(n=>[n.city+"|"+n.date,n]));
export function criticalBoundaryNotice(citySlug:string,date:string):CriticalBoundaryNotice|null{
  return notices.get(citySlug+"|"+date)??null;
}
