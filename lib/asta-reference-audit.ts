/**
 * Wave 3N: SOURCE COMPARISON ONLY. Never import these results as wedding
 * prohibitions or claims of location-specific planetary observability.
 *
 * Same-city, same-planet, same-year, INDEPENDENT minute records are necessary
 * to benchmark a model, but even agreement here is not ritual certification.
 */
export type AstaPlanet="Jupiter"|"Venus";
export type AstaMethod="observer-sensitive"|"fixed-angular-threshold"|"not-disclosed";
export type AstaReference={
  planet:AstaPlanet;
  year:2025|2026|2027;
  locality:string;
  publisher:string;
  url:string;
  method:AstaMethod;
  precision:"minute"|"day";
  /** Civil dates/times in Asia/Kolkata; no hidden 24+ clock notation. */
  startLocal:string;
  endLocal:string;
  reviewedOn:string;
};
export type AstaEvaluationStatus=
  "insufficient-independent-minute-sources"|"method-disagreement"|
  "boundary-disagreement"|"comparison-ready";

const DATE=/^\d{4}-\d{2}-\d{2}$/;
const MINUTE=/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/;
function civilUtc(value:string){
  const date=value.slice(0,10);
  if(!DATE.test(date))return null;
  const millis=Date.parse(date+"T00:00:00Z");
  return Number.isFinite(millis)&&new Date(millis).toISOString().slice(0,10)===date?millis:null;
}
export function astaLocalMinute(value:string):number|null{
  if(!MINUTE.test(value)||civilUtc(value)===null)return null;
  const mins=Number(value.slice(11,13))*60+Number(value.slice(14,16));
  return civilUtc(value)!/60000+mins;
}

/** Convert a publisher's 24+ time to a real next-civil-day timestamp. */
export function normalizeAsta24Plus(date:string,clock:string):string|null{
  const day=civilUtc(date);
  const parts=/^([0-4]\d):([0-5]\d)\+?$/.exec(clock);
  if(day===null||!parts)return null;
  const h=Number(parts[1]),m=Number(parts[2]);
  if(h>47)return null;
  const instant=new Date(day+(h*60+m)*60000);
  return instant.toISOString().slice(0,16);
}

function domain(url:string):string|null{
  try{
    const u=new URL(url);
    if(u.protocol!=="https:"||u.username||u.password||!u.hostname.includes("."))return null;
    const parts=u.hostname.toLowerCase().replace(/^www\./,"").split(".");
    return parts.length>=2?parts.slice(-2).join("."):null;
  }catch{return null;}
}

export function astaReferenceErrors(r:AstaReference):string[]{
  const issues:string[]=[];
  if(!["Jupiter","Venus"].includes(r.planet))issues.push("unknown-planet");
  if(![2025,2026,2027].includes(r.year))issues.push("unsupported-year");
  if(!r.locality.trim()||!r.publisher.trim())issues.push("missing-location-or-publisher");
  if(!domain(r.url))issues.push("invalid-source-url");
  if(!["observer-sensitive","fixed-angular-threshold","not-disclosed"].includes(r.method))issues.push("invalid-method");
  if(!["minute","day"].includes(r.precision))issues.push("invalid-precision");
  const start=r.precision==="minute"?astaLocalMinute(r.startLocal):(DATE.test(r.startLocal)?civilUtc(r.startLocal):null);
  const end=r.precision==="minute"?astaLocalMinute(r.endLocal):(DATE.test(r.endLocal)?civilUtc(r.endLocal):null);
  if(start===null||end===null)issues.push("invalid-civil-time-or-precision");
  else{
    if(start>=end)issues.push("non-positive-interval");
    const durationDays=(end-start)/(r.precision==="minute"?1440:86400000);
    if(durationDays>366)issues.push("implausible-interval");
    const from=Number(r.startLocal.slice(0,4)),through=Number(r.endLocal.slice(0,4));
    if(from>r.year||through<r.year)issues.push("interval-not-in-reference-year");
  }
  if(civilUtc(r.reviewedOn)===null)issues.push("invalid-review-date");
  return issues;
}

export function evaluateAstaReferences(
  references:readonly AstaReference[],planet:AstaPlanet,year:number,locality:string,
  toleranceMinutes=5
){
  const matched=references.filter(r=>r.planet===planet&&r.year===year&&r.locality===locality);
  const invalid=matched.filter(r=>astaReferenceErrors(r).length);
  const valid=matched.filter(r=>astaReferenceErrors(r).length===0);
  const exact=valid.filter(r=>r.precision==="minute");
  // A site publishing two differently formatted copies counts ONCE.
  const independent=new Map<string,AstaReference>();
  for(const row of exact)independent.set(domain(row.url)!,row);
  const accepted=[...independent.values()];
  const methodSet=new Set(accepted.map(r=>r.method));
  const comparisons=accepted.map(r=>({
    publisher:r.publisher,url:r.url,method:r.method,
    startLocal:r.startLocal,endLocal:r.endLocal
  }));
  let startSpreadMinutes:null|number=null,endSpreadMinutes:null|number=null;
  if(accepted.length>=2){
    const starts=accepted.map(r=>astaLocalMinute(r.startLocal)!);
    const ends=accepted.map(r=>astaLocalMinute(r.endLocal)!);
    startSpreadMinutes=Math.max(...starts)-Math.min(...starts);
    endSpreadMinutes=Math.max(...ends)-Math.min(...ends);
  }
  const status:AstaEvaluationStatus=accepted.length<2?"insufficient-independent-minute-sources":
    methodSet.size!==1||methodSet.has("not-disclosed")?"method-disagreement":
    startSpreadMinutes!>toleranceMinutes||endSpreadMinutes!>toleranceMinutes?"boundary-disagreement":
    "comparison-ready";
  return {
    planet,year,locality,status,
    sourceCount:matched.length,invalidCount:invalid.length,
    independentMinuteSourceCount:accepted.length,
    startSpreadMinutes,endSpreadMinutes,toleranceMinutes,
    methods:[...methodSet],comparisons,
    /** A source consensus only permits method benchmarking, not a ceremony verdict. */
    safeForCeremonyFiltering:false,
    nextStep:status==="comparison-ready"?"independent-observer-model-benchmark":"obtain-comparable-local-minute-evidence"
  };
}
