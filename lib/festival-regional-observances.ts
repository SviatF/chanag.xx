import type {Festival} from "./festivals";
import type {City} from "./cities";
import {getReviewedLocalFestivalDate} from "./festival-local-date";
export type RegionalFestivalObservance={
  label:string; date:string; message:string;
};
/**
 * Curated observance differences must be source-reviewed by actual city + year.
 * Never apply a generic city offset or infer regional dates from UTC clock shifts.
 * Audit source: tests/fixtures/festival-regional-date-evidence.ts.
 */
export function getRegionalFestivalObservance(festival:Festival,city:City):RegionalFestivalObservance|null{
  const cityDate=getReviewedLocalFestivalDate(festival,city);
  if(cityDate){
    return {
      label:"Source-reviewed local Govardhan Puja date",
      date:cityDate.date,
      message:`The reviewed Govardhan Puja / Annakut observance for ${city.name} in 2026 is on Monday, 9 November, not the maintained Delhi-calendar reference of Tuesday, 10 November. The two observance dates follow different local worship-period preferences while Kartika Shukla Pratipada runs across both civil dates. This city's sunrise Tithi, Nakshatra and solar times are recalculated for 9 November from the actual ${city.name} coordinates, rather than reusing 10 November's lunar snapshot. Source: ${cityDate.sourceLocality}, reviewed ${cityDate.observedOn}.`
    };
  }
  if(festival.slug==="dussehra"&&festival.year===2026&&city.slug==="kolkata"){
    return {
      label:"Bengal Vijayadashami",
      date:"2026-10-21",
      message:"Bengal Vijayadashami in Kolkata is observed on Wednesday, 21 October 2026. The wider Vijayadashami festival date is Tuesday, 20 October 2026. The Bengali observance follows on the next local day."
    };
  }
  return null;
}
