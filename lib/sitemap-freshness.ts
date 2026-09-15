import {todayInIndia} from "./dates";

export const sitemapFeedNames=[
  "sitemap-core.xml",
  "sitemap-panchang-daily.xml",
  "sitemap-panchang-monthly.xml",
  "sitemap-yearly.xml",
  "sitemap-festivals.xml",
  "sitemap-vrat.xml",
  "sitemap-muhurat.xml",
  "sitemap-regional.xml",
  "sitemap-tools.xml",
  "sitemap-knowledge.xml",
] as const;

export type SitemapFeedName=typeof sitemapFeedNames[number];

// This date is intentionally release-bound, not a moving "today" value.
// It must change only when the generalized festival-city content layer changes.
export const FESTIVAL_CITY_CONTENT_LASTMOD="2026-09-15";

export const protectedFestivalExperimentPaths=new Set([
  "/festivals/ganesh-chaturthi/2026/ahmedabad",
  "/festivals/dussehra/2026/hyderabad",
]);

export function sitemapFreshnessDates(reference:Date=todayInIndia()){
  const today=reference.toISOString().slice(0,10);
  return {
    today,
    month:`${today.slice(0,7)}-01`,
    year:`${today.slice(0,4)}-01-01`,
  };
}

export function sitemapFeedLastmod(name:SitemapFeedName,reference:Date=todayInIndia()){
  const dates=sitemapFreshnessDates(reference);
  switch(name){
    // These sitemap payloads really change every India day: homepage/live tools,
    // regional today pages, or the rolling daily URL membership.
    case "sitemap-core.xml":
    case "sitemap-panchang-daily.xml":
    case "sitemap-regional.xml":
    case "sitemap-tools.xml":
      return dates.today;

    // Their rolling URL matrices change only when the India month changes.
    case "sitemap-panchang-monthly.xml":
    case "sitemap-muhurat.xml":
      return dates.month;

    // Their four-year windows change only at the India year boundary.
    case "sitemap-yearly.xml":
    case "sitemap-vrat.xml":
      return dates.year;

    // Festival-city content has a tracked release timestamp. Knowledge pages are
    // intentionally left without lastmod until a real content release is tracked.
    case "sitemap-festivals.xml":
      return FESTIVAL_CITY_CONTENT_LASTMOD;
    case "sitemap-knowledge.xml":
      return undefined;
  }
}

export function festivalCityLastmod(path:string){
  return protectedFestivalExperimentPaths.has(path)?undefined:FESTIVAL_CITY_CONTENT_LASTMOD;
}
