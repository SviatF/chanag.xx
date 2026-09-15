import {festivals2026} from "./festivals";
import {phase1PriorityCities,primaryVratTypes,yearlyIndexYears} from "./seo-policy";

export type FestivalCityStaticParam={festival:string;year:string;city:string};
export type VratYearStaticParam={vrat:string;year:string};
export type VratCityStaticParam=VratYearStaticParam&{city:string};

/**
 * Phase 2 SSG priority registry for deterministic festival/city pages.
 *
 * The project already has an SEO-policy list of 20 phase-1 priority cities.
 * Combining those cities with the maintained 2026 festival calendar gives
 * 380 deterministic URLs (20 cities x 19 festivals) that can be generated at
 * build time without changing the page content, metadata, schema or formulas.
 *
 * Every valid festival/city URL outside this registry remains available through
 * the route's existing ISR fallback (`dynamicParams = true`, revalidate=86400).
 */
export const festivalCitySsgPriority:FestivalCityStaticParam[]=phase1PriorityCities.flatMap(city=>
  festivals2026.map(festival=>({festival:festival.slug,year:"2026",city}))
);

// Backward-compatible export used by the route introduced in the bounded pilot.
// It now points at the validated Phase 2 priority registry.
export const festivalCitySsgPilot=festivalCitySsgPriority;

/**
 * Vrat routes are deterministic for a fixed vrat/year/city. Keep the build-time
 * matrix aligned with the exact SEO indexation policy: 3 primary vrat types,
 * four rolling index years, and the 20 phase-1 priority cities.
 */
const vratStaticYears=yearlyIndexYears();
export const vratYearSsgPriority:VratYearStaticParam[]=primaryVratTypes.flatMap(vrat=>
  vratStaticYears.map(year=>({vrat,year:String(year)}))
);
export const vratCitySsgPriority:VratCityStaticParam[]=vratYearSsgPriority.flatMap(item=>
  phase1PriorityCities.map(city=>({...item,city}))
);

export function festivalCityStaticKey(item:FestivalCityStaticParam){
  return `${item.festival}/${item.year}/${item.city}`;
}
export function vratYearStaticKey(item:VratYearStaticParam){
  return `${item.vrat}/${item.year}`;
}
export function vratCityStaticKey(item:VratCityStaticParam){
  return `${item.vrat}/${item.year}/${item.city}`;
}
