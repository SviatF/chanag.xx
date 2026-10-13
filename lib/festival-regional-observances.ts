import type {Festival} from "./festivals";
import type {City} from "./cities";
export type RegionalFestivalObservance={
  label:string; date:string; message:string;
};
/**
 * Curated observance differences must be source-reviewed by actual city + year.
 * Never apply a generic city offset or infer regional dates from UTC clock shifts.
 * Audit source: tests/fixtures/festival-regional-date-evidence.ts.
 */
export function getRegionalFestivalObservance(festival:Festival,city:City):RegionalFestivalObservance|null{
  if(festival.slug==="dussehra"&&festival.year===2026&&city.slug==="kolkata"){
    return {
      label:"Bengal Vijayadashami",
      date:"2026-10-21",
      message:"Bengal Vijayadashami in Kolkata is observed on Wednesday, 21 October 2026. The wider Vijayadashami festival date is Tuesday, 20 October 2026. The Bengali observance follows on the next local day."
    };
  }
  return null;
}
