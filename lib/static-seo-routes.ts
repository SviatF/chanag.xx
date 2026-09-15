export type FestivalCityStaticParam={festival:string;year:string;city:string};

/**
 * Phase 1 SSG pilot for deterministic, traffic-priority festival city pages.
 *
 * These URLs are pre-rendered during build. The dynamic route keeps
 * `dynamicParams = true` with `revalidate = 86400`, so every festival/city URL
 * not listed here remains available through ISR and is cached after generation.
 *
 * Keep this registry intentionally small until production metrics confirm the
 * build/runtime behavior. Expanding to 300-500 URLs is then a data-only change.
 */
export const festivalCitySsgPilot:FestivalCityStaticParam[]=[
  {festival:"ganesh-chaturthi",year:"2026",city:"ahmedabad"},
  {festival:"ganesh-chaturthi",year:"2026",city:"delhi"},
  {festival:"ganesh-chaturthi",year:"2026",city:"hyderabad"},
  {festival:"ganesh-chaturthi",year:"2026",city:"mumbai"},
  {festival:"ganesh-chaturthi",year:"2026",city:"pune"},
  {festival:"ganesh-chaturthi",year:"2026",city:"surat"},

  {festival:"dussehra",year:"2026",city:"hyderabad"},
  {festival:"dussehra",year:"2026",city:"chennai"},
  {festival:"dussehra",year:"2026",city:"kolkata"},
  {festival:"dussehra",year:"2026",city:"delhi"},
  {festival:"dussehra",year:"2026",city:"mumbai"},

  {festival:"shardiya-navratri",year:"2026",city:"hyderabad"},
  {festival:"shardiya-navratri",year:"2026",city:"chennai"},
  {festival:"shardiya-navratri",year:"2026",city:"kolkata"},
  {festival:"shardiya-navratri",year:"2026",city:"ahmedabad"},
  {festival:"shardiya-navratri",year:"2026",city:"mumbai"},

  {festival:"diwali",year:"2026",city:"mumbai"},
  {festival:"diwali",year:"2026",city:"delhi"},
  {festival:"diwali",year:"2026",city:"ahmedabad"},
  {festival:"diwali",year:"2026",city:"hyderabad"},
];

export function festivalCityStaticKey(item:FestivalCityStaticParam){
  return `${item.festival}/${item.year}/${item.city}`;
}
