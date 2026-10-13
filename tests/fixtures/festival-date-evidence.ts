/** Audit-only dated references, transcribed from specified Indian localities on 2026-10-13.
 * 2027: one Delhi annual calendar source for 19 dates (NOT 19 independent publishers).
 * 2026: five festival-specific pages plus a Haryana-local 2026 annual calendar for the remaining 14.
 * Dates and ritual-variant evidence are sourced separately, NOT 19 independent publishers.
 * A date matching a snapshot does not establish regional timing eligibility.
 */
export type FestivalDateReference={
  slug:string;year:number;date:string;source:string;sourceLocality:string;observedOn:string;
};
const delhi2027="https://www.drikpanchang.com/calendars/hindu/hinducalendar.html?geoname-id=1273294&year=2027";
const haryana2026="https://www.drikpanchang.com/calendars/hindu/hinducalendar.html?geoname-id=1264455";
export const festivalTraditionDateEvidence=[
  {slug:"rama-navami",year:2026,tradition:"Smarta",date:"2026-03-26",source:haryana2026},
  {slug:"rama-navami",year:2026,tradition:"ISKCON",date:"2026-03-27",source:haryana2026}
] as const;
export const festivalDateEvidence:readonly FestivalDateReference[]=[
  {slug:"chaitra-navratri",year:2026,date:"2026-03-19",source:"https://www.drikpanchang.com/navratri/chaitra-navratri-ghatasthapana.html?lang=en&year=2026",sourceLocality:"India, festival-specific local calendar",observedOn:"2026-10-13"},
  {slug:"akshaya-tritiya",year:2026,date:"2026-04-19",source:"https://www.drikpanchang.com/festivals/akshaya-tritiya/akshaya-tritiya-date-time.html?geoname-id=1261481&year=2026",sourceLocality:"India, festival-specific local calendar",observedOn:"2026-10-13"},
  {slug:"ganesh-chaturthi",year:2026,date:"2026-09-14",source:"https://www.drikpanchang.com/festivals/ganesh-chaturthi/ganesh-chaturthi-date-time.html?geoname-id=1278685&year=2026",sourceLocality:"India, festival-specific local calendar",observedOn:"2026-10-13"},
  {slug:"dussehra",year:2026,date:"2026-10-20",source:"https://www.drikpanchang.com/festivals/vijayadashami/vijayadashami-date-time.html?geoname-id=1273294&year=2026",sourceLocality:"India, festival-specific local calendar",observedOn:"2026-10-13"},
  {slug:"diwali",year:2026,date:"2026-11-08",source:"https://www.drikpanchang.com/festivals/lakshmipuja/festivals-lakshmipuja-timings.html?geoname-id=1273294&year=2026",sourceLocality:"India, festival-specific local calendar",observedOn:"2026-10-13"},
  {slug:"makar-sankranti",year:2026,date:"2026-01-14",source:haryana2026,sourceLocality:"Maham, Haryana, India",observedOn:"2026-10-13"},
  {slug:"maha-shivaratri",year:2026,date:"2026-02-15",source:haryana2026,sourceLocality:"Maham, Haryana, India",observedOn:"2026-10-13"},
  {slug:"holi",year:2026,date:"2026-03-04",source:haryana2026,sourceLocality:"Maham, Haryana, India",observedOn:"2026-10-13"},
  {slug:"rama-navami",year:2026,date:"2026-03-26",source:haryana2026,sourceLocality:"Maham, Haryana, India",observedOn:"2026-10-13"},
  {slug:"hanuman-jayanti",year:2026,date:"2026-04-02",source:haryana2026,sourceLocality:"Maham, Haryana, India",observedOn:"2026-10-13"},
  {slug:"guru-purnima",year:2026,date:"2026-07-29",source:haryana2026,sourceLocality:"Maham, Haryana, India",observedOn:"2026-10-13"},
  {slug:"raksha-bandhan",year:2026,date:"2026-08-28",source:haryana2026,sourceLocality:"Maham, Haryana, India",observedOn:"2026-10-13"},
  {slug:"janmashtami",year:2026,date:"2026-09-04",source:haryana2026,sourceLocality:"Maham, Haryana, India",observedOn:"2026-10-13"},
  {slug:"shardiya-navratri",year:2026,date:"2026-10-11",source:haryana2026,sourceLocality:"Maham, Haryana, India",observedOn:"2026-10-13"},
  {slug:"karwa-chauth",year:2026,date:"2026-10-29",source:haryana2026,sourceLocality:"Maham, Haryana, India",observedOn:"2026-10-13"},
  {slug:"dhanteras",year:2026,date:"2026-11-06",source:haryana2026,sourceLocality:"Maham, Haryana, India",observedOn:"2026-10-13"},
  {slug:"govardhan-puja",year:2026,date:"2026-11-10",source:haryana2026,sourceLocality:"Maham, Haryana, India",observedOn:"2026-10-13"},
  {slug:"bhai-dooj",year:2026,date:"2026-11-11",source:haryana2026,sourceLocality:"Maham, Haryana, India",observedOn:"2026-10-13"},
  {slug:"chhath-puja",year:2026,date:"2026-11-15",source:haryana2026,sourceLocality:"Maham, Haryana, India",observedOn:"2026-10-13"},
  {slug:"makar-sankranti",year:2027,date:"2027-01-15",source:delhi2027,sourceLocality:"Delhi, NCT, India",observedOn:"2026-10-13"},
  {slug:"maha-shivaratri",year:2027,date:"2027-03-06",source:delhi2027,sourceLocality:"Delhi, NCT, India",observedOn:"2026-10-13"},
  {slug:"holi",year:2027,date:"2027-03-22",source:delhi2027,sourceLocality:"Delhi, NCT, India",observedOn:"2026-10-13"},
  {slug:"chaitra-navratri",year:2027,date:"2027-04-07",source:delhi2027,sourceLocality:"Delhi, NCT, India",observedOn:"2026-10-13"},
  {slug:"rama-navami",year:2027,date:"2027-04-15",source:delhi2027,sourceLocality:"Delhi, NCT, India",observedOn:"2026-10-13"},
  {slug:"hanuman-jayanti",year:2027,date:"2027-04-20",source:delhi2027,sourceLocality:"Delhi, NCT, India",observedOn:"2026-10-13"},
  {slug:"akshaya-tritiya",year:2027,date:"2027-05-09",source:delhi2027,sourceLocality:"Delhi, NCT, India",observedOn:"2026-10-13"},
  {slug:"guru-purnima",year:2027,date:"2027-07-18",source:delhi2027,sourceLocality:"Delhi, NCT, India",observedOn:"2026-10-13"},
  {slug:"raksha-bandhan",year:2027,date:"2027-08-17",source:delhi2027,sourceLocality:"Delhi, NCT, India",observedOn:"2026-10-13"},
  {slug:"janmashtami",year:2027,date:"2027-08-25",source:delhi2027,sourceLocality:"Delhi, NCT, India",observedOn:"2026-10-13"},
  {slug:"ganesh-chaturthi",year:2027,date:"2027-09-04",source:delhi2027,sourceLocality:"Delhi, NCT, India",observedOn:"2026-10-13"},
  {slug:"shardiya-navratri",year:2027,date:"2027-09-30",source:delhi2027,sourceLocality:"Delhi, NCT, India",observedOn:"2026-10-13"},
  {slug:"dussehra",year:2027,date:"2027-10-09",source:delhi2027,sourceLocality:"Delhi, NCT, India",observedOn:"2026-10-13"},
  {slug:"karwa-chauth",year:2027,date:"2027-10-18",source:delhi2027,sourceLocality:"Delhi, NCT, India",observedOn:"2026-10-13"},
  {slug:"dhanteras",year:2027,date:"2027-10-27",source:delhi2027,sourceLocality:"Delhi, NCT, India",observedOn:"2026-10-13"},
  {slug:"diwali",year:2027,date:"2027-10-29",source:delhi2027,sourceLocality:"Delhi, NCT, India",observedOn:"2026-10-13"},
  {slug:"govardhan-puja",year:2027,date:"2027-10-30",source:delhi2027,sourceLocality:"Delhi, NCT, India",observedOn:"2026-10-13"},
  {slug:"bhai-dooj",year:2027,date:"2027-10-31",source:delhi2027,sourceLocality:"Delhi, NCT, India",observedOn:"2026-10-13"},
  {slug:"chhath-puja",year:2027,date:"2027-11-04",source:delhi2027,sourceLocality:"Delhi, NCT, India",observedOn:"2026-10-13"},
] as const;


/**
 * Second-publisher cross-checks. These do NOT inflate the 38 unique primary
 * records in festivalDateEvidence. Prokerala describes a general Indian
 * calendar, not per-city ritual timing, and is independent of Drik's ledger.
 * Every row is checked separately by the Festival Truth Audit.
 */
export const independentFestivalDateChecks:readonly FestivalDateReference[]=[
  {slug:"ganesh-chaturthi",year:2026,date:"2026-09-14",source:"https://www.prokerala.com/festivals/ganesh-chaturthi.html",sourceLocality:"Prokerala India-wide festival date reference",observedOn:"2026-10-13"},
  {slug:"ganesh-chaturthi",year:2027,date:"2027-09-04",source:"https://www.prokerala.com/calendar/hinducalendar-2027.html",sourceLocality:"Prokerala general Hindu calendar 2027",observedOn:"2026-10-13"},
  {slug:"dussehra",year:2027,date:"2027-10-09",source:"https://www.prokerala.com/calendar/hinducalendar-2027.html",sourceLocality:"Prokerala general Hindu calendar 2027",observedOn:"2026-10-13"},
  {slug:"karwa-chauth",year:2027,date:"2027-10-18",source:"https://www.prokerala.com/calendar/hinducalendar-2027.html",sourceLocality:"Prokerala general Hindu calendar 2027",observedOn:"2026-10-13"},
  {slug:"diwali",year:2027,date:"2027-10-29",source:"https://www.prokerala.com/calendar/hinducalendar-2027.html",sourceLocality:"Prokerala general Hindu calendar 2027",observedOn:"2026-10-13"},
  {slug:"govardhan-puja",year:2027,date:"2027-10-30",source:"https://www.prokerala.com/calendar/hinducalendar-2027.html",sourceLocality:"Prokerala general Hindu calendar 2027",observedOn:"2026-10-13"},
  {slug:"bhai-dooj",year:2027,date:"2027-10-31",source:"https://www.prokerala.com/calendar/hinducalendar-2027.html",sourceLocality:"Prokerala general Hindu calendar 2027",observedOn:"2026-10-13"},
] as const;
