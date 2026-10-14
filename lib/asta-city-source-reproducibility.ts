/**
 * Wave 3S: observer-locality source integrity. Research-only.
 *
 * Drik Panchang's published URL with a `year` query can render DISTINCT
 * observer cities in two retrieval contexts. A published city heading does
 * not mean the address itself is city-pinned or reproducible.
 *
 * Never treat an HTTP page's rendered city as URL-encoded observer identity
 * unless its locality binding is independently and repeatedly demonstrated.
 */
import type {AstaPlanet,AstaReference} from "./asta-reference-audit";

export type AstaSourceCapture={
  planet:AstaPlanet;
  renderedYear:2025|2026|2027;
  url:string;
  publisher:string;
  renderedLocality:string;
  renderedTimeZone:string;
  startLocal:string;
  endLocal:string;
  captureContext:"indexed-result"|"anonymous-page-fetch";
  capturedOn:string;
};
/** A time-stamped snapshot is NOT a verified fixed-location permalink. */
export type AstaReproducibilityState=
  "observed-multi-locality-at-one-url"|"single-locality-not-reproduced";
const MIN=/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/;
const DATE=/^\d{4}-\d{2}-\d{2}$/;
function validDate(s:string){
  if(!DATE.test(s))return false;
  const t=Date.parse(s+"T00:00:00Z");
  return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===s;
}
function validTime(s:string){
  return MIN.test(s)&&validDate(s.slice(0,10));
}
export function sourceCaptureErrors(s:AstaSourceCapture):string[]{
  const errors:string[]=[];
  if(!["Jupiter","Venus"].includes(s.planet)||![2025,2026,2027].includes(s.renderedYear))
    errors.push("invalid-planet-year");
  if(!s.publisher.trim()||!s.renderedLocality.trim()||!s.renderedTimeZone.trim())
    errors.push("missing-publisher-locality-or-timezone");
  try{
    const u=new URL(s.url);
    if(u.protocol!=="https:"||u.username||u.password||!u.hostname.includes("."))
      errors.push("invalid-source-url");
  }catch{errors.push("invalid-source-url")}
  if(!validTime(s.startLocal)||!validTime(s.endLocal)||s.startLocal>=s.endLocal)
    errors.push("invalid-observation-interval");
  if(s.renderedYear!==Number(s.startLocal.slice(0,4))||
    s.renderedYear!==Number(s.endLocal.slice(0,4)))
    errors.push("unexpected-event-year");
  if(!["indexed-result","anonymous-page-fetch"].includes(s.captureContext))
    errors.push("invalid-capture-context");
  if(!validDate(s.capturedOn))errors.push("invalid-capture-date");
  return errors;
}
function addressKey(url:string){
  const u=new URL(url);
  u.hash="";
  u.hostname=u.hostname.toLowerCase();
  u.searchParams.sort();
  return u.toString();
}
export function auditCitySourceReproducibility(
  captures:readonly AstaSourceCapture[],
  references:readonly AstaReference[]
){
  const invalidCaptures=captures.flatMap((r,index)=>
    sourceCaptureErrors(r).map(reason=>({index,reason,url:r.url})));
  const valid=captures.filter(r=>sourceCaptureErrors(r).length===0);
  const byURL=new Map<string,AstaSourceCapture[]>();
  for(const row of valid){
    const k=addressKey(row.url);
    byURL.set(k,[...(byURL.get(k)??[]),row]);
  }
  const urls=[...byURL.entries()].map(([url,observations])=>{
    const cities=[...new Set(observations.map(x=>x.renderedLocality))].sort();
    const contextTypes=[...new Set(observations.map(x=>x.captureContext))].sort();
    const yearParams=[...new Set(observations.map(x=>{
      const p=new URL(x.url).searchParams.get("year");
      return {raw:p,renderedYear:x.renderedYear};
    }).map(x=>JSON.stringify(x)))].map(x=>JSON.parse(x) as {raw:string|null;renderedYear:number});
    return {
      url,publisherDomains:[...new Set(observations.map(x=>new URL(x.url).hostname))],
      cities,observationCount:observations.length,contextTypes,yearParams,
      state:(cities.length>1?"observed-multi-locality-at-one-url":
        "single-locality-not-reproduced") as AstaReproducibilityState,
      // Even a single city shown twice is not proof of a permalink binding;
      // must independently prove immutable city-identifier URL semantics.
      cityPermalinkIndependentlyVerified:false as const,
      safeForCeremonyFiltering:false as const
    };
  });
  const targetRows=references.map((r,index)=>{
    const address=addressKey(r.url);
    const current=byURL.get(address)??[];
    const observedCities=[...new Set(current.map(x=>x.renderedLocality))].sort();
    const cityConflict=observedCities.some(c=>c!==r.locality);
    const twoDistinctCaptureTypes=new Set(current.map(x=>x.captureContext)).size>=2;
    const sameSourceMatch=current.some(x=>x.renderedLocality===r.locality&&
      x.planet===r.planet&&x.renderedYear===r.year&&
      x.startLocal===r.startLocal&&x.endLocal===r.endLocal);
    const reason=cityConflict?"observed-locality-conflict":
      !current.length?"no-observation-for-url":
      !sameSourceMatch?"record-not-reproduced-at-this-url":
      !twoDistinctCaptureTypes?"single-capture-context-only":
      "no-proven-immutable-city-url-binding";
    return {
      index,publisher:r.publisher,planet:r.planet,year:r.year,locality:r.locality,
      sourceLocationMode:r.sourceLocationMode,precision:r.precision,
      sourceURL:r.url,observedCities,
      sameSourceMatch,reason,
      hasIndependentImmutableCityPermalink:false as const,
      safeForCeremonyFiltering:false as const
    };
  });
  return {
    status:"RESEARCH-ONLY-URL-LOCATION-REPRODUCIBILITY-UNVERIFIED" as const,
    safeForCeremonyFiltering:false as const,
    totalCaptures:captures.length,
    invalidCaptures,
    conflictingURLCount:urls.filter(x=>x.state==="observed-multi-locality-at-one-url").length,
    independentlyCityPinnedURLCount:0 as const,
    urls,targetRows
  };
}
