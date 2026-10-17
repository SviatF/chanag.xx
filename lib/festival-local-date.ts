import type {City} from "./cities";
import type {Festival} from "./festivals";

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

/** Explicit evidence for deterministic tests and cross-source reconciliation. */
export const reviewedLocalFestivalDates=reviewed;
