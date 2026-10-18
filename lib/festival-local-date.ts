import type {City} from "./cities";
import {allFestivals,festivalsForYear,indiaFestivalDateIso,type Festival} from "./festivals";

/**
 * Published local observance dates, not algorithmically inferred from longitude,
 * state, or the generic festival date.
 *
 * The maintained 2026 Govardhan date (Nov 10) is the Delhi reference.
 * In several western cities the reviewed Annakut/Govardhan observance is Nov 9.
 * Do not apply a blanket Maharashtra/Gujarat or country-wide offset.
 */
export type LocalFestivalDateEvidence={
  slug:string;year:number;city:string;date:string;
  evidenceId:string;sourceLocality:string;observedOn:string;
  method:"published-city-observance";
};
const reviewed:readonly LocalFestivalDateEvidence[]=[
  {
    slug:"govardhan-puja",year:2026,city:"mumbai",date:"2026-11-09",
    evidenceId:"govardhan2026-mumbai",
    sourceLocality:"Mumbai, Maharashtra",observedOn:"2026-10-17",method:"published-city-observance"
  },
  {
    slug:"govardhan-puja",year:2026,city:"pune",date:"2026-11-09",
    evidenceId:"govardhan2026-pune",
    sourceLocality:"Pune, Maharashtra",observedOn:"2026-10-17",method:"published-city-observance"
  },
  {
    slug:"govardhan-puja",year:2026,city:"jaipur",date:"2026-11-09",
    evidenceId:"govardhan2026-jaipur",
    sourceLocality:"Jaipur, Rajasthan",observedOn:"2026-10-17",method:"published-city-observance"
  },
  {
    slug:"govardhan-puja",year:2026,city:"indore",date:"2026-11-09",
    evidenceId:"govardhan2026-indore",
    sourceLocality:"Indore, Madhya Pradesh",observedOn:"2026-10-17",method:"published-city-observance"
  },
  {
    slug:"govardhan-puja",year:2026,city:"ahmedabad",date:"2026-11-09",
    evidenceId:"govardhan2026-ahmedabad",
    sourceLocality:"Ahmedabad, Gujarat (Govardhan Puja / Annakut)",observedOn:"2026-10-17",method:"published-city-observance"
  },
];

export function getReviewedLocalFestivalDate(festival:Festival,city:City):LocalFestivalDateEvidence|null{
  return reviewed.find(row=>row.slug===festival.slug&&row.year===festival.year&&row.city===city.slug)??null;
}

/** The local observation date determines ALL city-page astronomy and text. */
export function getFestivalForCity(festival:Festival,city:City):Festival{
  const reference=getReviewedLocalFestivalDate(festival,city);
  return reference?{...festival,date:reference.date}:festival;
}

/**
 * A regional observance is not interchangeable with the India-wide festival
 * sharing its name. Kolkata's Dussehra (20 Oct 2026) and Bengal-specific
 * Vijayadashami (21 Oct 2026) are two DIFFERENT published rule outcomes.
 * Display the second event as an additional marker, never overwrite the first.
 *
 * Audit-only source: tests/fixtures/festival-regional-date-evidence.ts;
 * Drik Panchang Kolkata Bengal-rule calendar, reviewed 2026-10-13.
 */
const cityExtraObservances=[
  {city:"kolkata",year:2026,slug:"dussehra",date:"2026-10-21",
   name:"Bengal Vijayadashami",
   short:"Bengal-rule Vijayadashami observance, distinct from India-wide Dussehra on 20 October.",
   evidenceId:"bengal-vijayadashami-2026-kolkata"}
] as const;

export function getCalendarFestivalsForCity(year:number,city:City):Festival[]{
  const national=festivalsForYear(year);
  const published=national.map(festival=>getFestivalForCity(festival,city));
  for(const row of cityExtraObservances){
    if(row.year!==year||row.city!==city.slug)continue;
    const parent=national.find(festival=>festival.slug===row.slug);
    if(!parent)throw Error("Missing maintained parent festival for published regional variant");
    published.push({...parent,date:row.date,name:row.name,short:row.short});
  }
  return published.sort((left,right)=>left.date.localeCompare(right.date)||left.name.localeCompare(right.name));
}

/**
 * The next REAL date for a particular city, ordered after reviewed local
 * overrides have been applied. A generic baseline record must not displace a
 * source-reviewed local observance or be shown on its previous baseline day.
 *
 * Null means no future maintained record, NOT a request to recycle 2026.
 */
export function nextFestivalForCity(instant:Date,city:City):Festival|null{
  const today=indiaFestivalDateIso(instant);
  const years=[...new Set(allFestivals.map(festival=>festival.year))];
  return years.flatMap(year=>getCalendarFestivalsForCity(year,city))
    .filter(festival=>festival.date>=today)
    .sort((left,right)=>left.date.localeCompare(right.date)||left.name.localeCompare(right.name))[0]??null;
}

/** Explicit evidence for deterministic tests and cross-source reconciliation. */
export const reviewedLocalFestivalDates=reviewed;
