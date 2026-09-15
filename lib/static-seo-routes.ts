import {festivals2026} from "./festivals";
import {phase1PriorityCities,primaryVratTypes,yearlyIndexYears} from "./seo-policy";
import {rollingDailyDates,rollingMonths,sitemapPriorityCities} from "./seo-sitemap";

export type FestivalCityStaticParam={festival:string;year:string;city:string};
export type VratYearStaticParam={vrat:string;year:string};
export type VratCityStaticParam=VratYearStaticParam&{city:string};
export type DatedPanchangStaticParam={city:string;date:string[]};
export type CalendarMonthStaticParam={city:string;year:string;month:string};

/**
 * Deterministic festival/city pages for the maintained 2026 festival calendar
 * and the existing 20-city SEO priority policy.
 */
export const festivalCitySsgPriority:FestivalCityStaticParam[]=phase1PriorityCities.flatMap(city=>
  festivals2026.map(festival=>({festival:festival.slug,year:"2026",city}))
);

// Backward-compatible export used by the route introduced in the bounded pilot.
export const festivalCitySsgPilot=festivalCitySsgPriority;

/**
 * Vrat routes are deterministic for a fixed vrat/year/city. Keep the build-time
 * matrix aligned with the exact SEO indexation policy.
 */
const vratStaticYears=yearlyIndexYears();
export const vratYearSsgPriority:VratYearStaticParam[]=primaryVratTypes.flatMap(vrat=>
  vratStaticYears.map(year=>({vrat,year:String(year)}))
);
export const vratCitySsgPriority:VratCityStaticParam[]=vratYearSsgPriority.flatMap(item=>
  phase1PriorityCities.map(city=>({...item,city}))
);

/**
 * Dated Panchang and monthly calendar pages are deterministic for their explicit
 * date/month. Generate exactly the same rolling windows that are exposed by the
 * live SEO sitemaps. The undated `/panchang/[city]` route is intentionally not
 * included so its "today" semantics stay on hourly ISR.
 */
const dailyStaticDates=rollingDailyDates(14,45);
export const datedPanchangSsgPriority:DatedPanchangStaticParam[]=sitemapPriorityCities.flatMap(city=>
  dailyStaticDates.map(date=>({city:city.slug,date:[date]}))
);

const monthlyStaticMonths=rollingMonths(2,12);
export const calendarMonthSsgPriority:CalendarMonthStaticParam[]=sitemapPriorityCities.flatMap(city=>
  monthlyStaticMonths.map(item=>({city:city.slug,year:String(item.year),month:item.slug}))
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
export function datedPanchangStaticKey(item:DatedPanchangStaticParam){
  return `${item.city}/${item.date.join("/")}`;
}
export function calendarMonthStaticKey(item:CalendarMonthStaticParam){
  return `${item.city}/${item.year}/${item.month}`;
}
