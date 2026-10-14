/**
 * Wave 3R: Compare publisher claims about the FIXED-ANGULAR combustion family.
 * The output NEVER certifies observer visibility or ritual Muhurat.
 *
 * Sources using NPT (UTC+05:45) cannot be compared with IST (UTC+05:30)
 * before explicit instant normalization. Publisher-domain distinction does
 * not establish independent underlying astronomical implementations.
 */
export type AngularSource={
  planet:"Jupiter"|"Venus";
  year:2025|2026|2027;
  publisher:string;
  url:string;
  methodFamily:"fixed-angular-threshold";
  // A city printed on a page is not evidence that this fixed-angle rule
  // measures first/last VISIBILITY for that city's actual observer.
  geographicScope:"nonlocal-angular"|"city-labeled-angular";
  printedCity?:string;
  precision:"minute"|"day";
  timezone:"Asia/Kathmandu"|"Asia/Kolkata";
  startLocal:string;
  endLocal:string;
  reviewedOn:string;
};
const OFFSETS:Readonly<Record<AngularSource["timezone"],number>>={
  "Asia/Kathmandu":345,"Asia/Kolkata":330
};
const DAY=/^\d{4}-\d{2}-\d{2}$/;
const MIN=/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/;
function validCivilDay(value:string):number|null{
  if(!DAY.test(value))return null;
  const time=Date.parse(value+"T00:00:00Z");
  return Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===value?time:null;
}
function rootDomain(url:string):string|null{
  try{
    const u=new URL(url);
    if(u.protocol!=="https:"||u.username||u.password)return null;
    const tokens=u.hostname.toLowerCase().replace(/^www\./,"").split(".");
    if(tokens.length<2||tokens.some(x=>!x))return null;
    return tokens.slice(-2).join(".");
  }catch{return null;}
}
export function toIstEvidenceInstant(value:string,timezone:AngularSource["timezone"]){
  if(!MIN.test(value))return null;
  const civil=validCivilDay(value.slice(0,10));
  if(civil===null)return null;
  const h=Number(value.slice(11,13)),m=Number(value.slice(14,16));
  const utcMinutes=Math.round(civil/60000)+h*60+m-OFFSETS[timezone];
  const istLocal=new Date((utcMinutes+330)*60000).toISOString().slice(0,16);
  return {utcMinutes,istLocal,sourceOffsetMinutes:OFFSETS[timezone]};
}
export function angularSourceErrors(row:AngularSource):string[]{
  const errors:string[]=[];
  if(!["Jupiter","Venus"].includes(row.planet))errors.push("invalid-planet");
  if(![2025,2026,2027].includes(row.year))errors.push("unsupported-year");
  if(!row.publisher.trim()||!rootDomain(row.url))errors.push("invalid-publisher-url");
  if(row.methodFamily!=="fixed-angular-threshold")errors.push("not-a-fixed-angular-source");
  if(!["nonlocal-angular","city-labeled-angular"].includes(row.geographicScope))errors.push("invalid-scope");
  if(row.geographicScope==="city-labeled-angular"&&!row.printedCity?.trim())errors.push("missing-printed-city");
  if(!["Asia/Kathmandu","Asia/Kolkata"].includes(row.timezone))errors.push("unknown-offset");
  if(!["minute","day"].includes(row.precision))errors.push("unknown-precision");
  if(validCivilDay(row.reviewedOn)===null)errors.push("invalid-review-day");
  if(row.precision==="minute"){
    const start=toIstEvidenceInstant(row.startLocal,row.timezone);
    const end=toIstEvidenceInstant(row.endLocal,row.timezone);
    if(!start||!end||start.utcMinutes>=end.utcMinutes)errors.push("invalid-interval-or-clock");
  }else if(!DAY.test(row.startLocal)||!DAY.test(row.endLocal)||
    validCivilDay(row.startLocal)===null||validCivilDay(row.endLocal)===null||
    row.startLocal>=row.endLocal)errors.push("invalid-date-only-interval");
  if(Number(row.startLocal.slice(0,4))>row.year||
    Number(row.endLocal.slice(0,4))<row.year)errors.push("outside-reference-year");
  return errors;
}
export function comparePublishedAngularFamily(
  records:readonly AngularSource[],planet:AngularSource["planet"],year:number,
  toleranceMinutes=5
){
  if(!Number.isFinite(toleranceMinutes)||toleranceMinutes<0||toleranceMinutes>1440)
    throw Error("Invalid tolerance");
  const matched=records.filter(r=>r.planet===planet&&r.year===year);
  const rejected=matched.filter(r=>angularSourceErrors(r).length);
  const accepted=matched.filter(r=>!angularSourceErrors(r).length);
  const byDomain=new Map<string,AngularSource>();
  for(const row of accepted)if(!byDomain.has(rootDomain(row.url)!))
    byDomain.set(rootDomain(row.url)!,row);
  const independentPublisherEntries=[...byDomain.values()];
  const minute=independentPublisherEntries.filter(r=>r.precision==="minute");
  const startTimes=minute.map(r=>toIstEvidenceInstant(r.startLocal,r.timezone)!.utcMinutes);
  const endTimes=minute.map(r=>toIstEvidenceInstant(r.endLocal,r.timezone)!.utcMinutes);
  const startSpreadMinutes=startTimes.length>=2?Math.max(...startTimes)-Math.min(...startTimes):null;
  const endSpreadMinutes=endTimes.length>=2?Math.max(...endTimes)-Math.min(...endTimes):null;
  const dateStarts=independentPublisherEntries.map(r=>r.precision==="minute"?
    toIstEvidenceInstant(r.startLocal,r.timezone)!.istLocal.slice(0,10):r.startLocal);
  const dateEnds=independentPublisherEntries.map(r=>r.precision==="minute"?
    toIstEvidenceInstant(r.endLocal,r.timezone)!.istLocal.slice(0,10):r.endLocal);
  const calendarDatesAgree=new Set(dateStarts).size<=1&&new Set(dateEnds).size<=1;
  const status=independentPublisherEntries.length<2?"single-publisher-only":
    minute.length>=2?
      startSpreadMinutes!<=toleranceMinutes&&endSpreadMinutes!<=toleranceMinutes?
        "fixed-angle-published-minute-agreement":"fixed-angle-minute-disagreement":
    calendarDatesAgree?"date-only-publisher-agreement":"date-only-calendar-disagreement";
  return {
    planet,year,status,
    sourceCount:matched.length,invalidCount:rejected.length,
    distinctPublisherDomainCount:independentPublisherEntries.length,
    independentAstronomicalImplementationVerified:false as const,
    independentCityObserverVerified:false as const,
    methodFamily:"fixed-angular-threshold" as const,
    sameSpecificFormulaValidated:false as const,
    fixedAngleComparisonOnly:true as const,
    safeForCeremonyFiltering:false as const,
    minutePublisherCount:minute.length,
    startSpreadMinutes,endSpreadMinutes,calendarDatesAgree,
    sources:independentPublisherEntries.map(r=>({
      publisher:r.publisher,url:r.url,scope:r.geographicScope,
      printedCity:r.printedCity??null,precision:r.precision,
      timezone:r.timezone,originalStart:r.startLocal,originalEnd:r.endLocal,
      startIst:r.precision==="minute"?toIstEvidenceInstant(r.startLocal,r.timezone)!.istLocal:null,
      endIst:r.precision==="minute"?toIstEvidenceInstant(r.endLocal,r.timezone)!.istLocal:null
    }))
  };
}
export function temporalGapFromAngularToLocalSnapshot(
  angular:AngularSource,
  local:{planet:AngularSource["planet"];year:number;locality:string;
    startLocal:string;endLocal:string;precision:"minute"|"day";
    method:"observer-sensitive"|"fixed-angular-threshold"|"not-disclosed"}
){
  if(angularSourceErrors(angular).length||
     angular.precision!=="minute"||local.precision!=="minute"||
     angular.planet!==local.planet||angular.year!==local.year||
     local.method!=="observer-sensitive")return null;
  const a=toIstEvidenceInstant(angular.startLocal,angular.timezone)!;
  const b=toIstEvidenceInstant(angular.endLocal,angular.timezone)!;
  const localStart=toIstEvidenceInstant(local.startLocal,"Asia/Kolkata");
  const localEnd=toIstEvidenceInstant(local.endLocal,"Asia/Kolkata");
  if(!localStart||!localEnd)return null;
  return {
    planet:angular.planet,year:angular.year,locality:local.locality,
    startGapMinutes:a.utcMinutes-localStart.utcMinutes,
    endGapMinutes:b.utcMinutes-localEnd.utcMinutes,
    comparison:"cross-method-time-gap-not-local-validation" as const,
    sourceMethodsEquivalent:false as const,
    sourceObserverPinned:false as const,
    safeForCeremonyFiltering:false as const
  };
}
