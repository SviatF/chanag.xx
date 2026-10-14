/**
 * Wave 3T: independent publication DATE evidence ≠ local ritual eligibility.
 *
 * This is an isolated, auditable evidence taxonomy; importing these statuses
 * into public approval / SEO gates is forbidden until regional rule validation.
 */
export type FestivalPublishedEvidence={
  slug:string;year:number;date:string;source:string;sourceLocality:string;observedOn:string;
};
export type DateEvidenceStatus=
  "published-date-mismatch"|"two-publisher-date-corroboration"|
  "one-publisher-date-only"|"no-published-date";
const civil=/^\d{4}-\d{2}-\d{2}$/;
function validDay(d:string){
  if(!civil.test(d))return false;
  const t=Date.parse(d+"T00:00:00Z");
  return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===d;
}
export function evidencePublisherDomain(source:string):string|null{
  try{
    const u=new URL(source);
    if(u.protocol!=="https:"||u.username||u.password)return null;
    const parts=u.hostname.toLowerCase().replace(/^www\./,"").split(".");
    if(parts.length<2||parts.some(p=>!p))return null;
    return parts.slice(-2).join(".");
  }catch{return null}
}
export function festivalDateEvidenceStatus(
  slug:string,year:number,maintainedDate:string,
  primary:readonly FestivalPublishedEvidence[],
  secondary:readonly FestivalPublishedEvidence[]
){
  if(!slug||!Number.isInteger(year)||!validDay(maintainedDate)||
    Number(maintainedDate.slice(0,4))!==year)throw Error("Invalid maintained festival key");
  const match=(r:FestivalPublishedEvidence)=>r.slug===slug&&r.year===year;
  const selected=[...primary.filter(match),...secondary.filter(match)];
  const bad=selected.filter(r=>!validDay(r.date)||!evidencePublisherDomain(r.source));
  const contradictions=selected.filter(r=>r.date!==maintainedDate);
  const distinctPublishers=[...new Set(selected.map(r=>evidencePublisherDomain(r.source)).filter(
    (x):x is string=>x!==null))];
  const primaryPublishers=new Set(primary.filter(match).map(r=>evidencePublisherDomain(r.source)));
  const secondPublisherCount=secondary.filter(match).filter(r=>
    !primaryPublishers.has(evidencePublisherDomain(r.source))).length;
  const status:DateEvidenceStatus=bad.length||contradictions.length?
    "published-date-mismatch":!selected.length?"no-published-date":
    distinctPublishers.length>=2&&secondPublisherCount>0?
      "two-publisher-date-corroboration":"one-publisher-date-only";
  return {
    slug,year,maintainedDate,status,rawRecords:selected.length,
    distinctPublisherDomainCount:distinctPublishers.length,
    conflictingSourceCount:bad.length+contradictions.length,
    // Even a national festival DATE published by 2 sites cannot verify
    // per-city puja moment / tradition variant / Shuddhi.
    localRitualDateCertified:false as const,
    exactPujaTimeCertified:false as const,
    independentlyVerifiedLocalObservance:false as const,
    safeForCeremonyFiltering:false as const
  };
}
export type RitualVratObservation={
  date:string;paksha:"Shukla"|"Krishna";tithi:"Ekadashi"|"Purnima"|"Amavasya";
  sunrise:string;tithiEnd:string;tithiEndDate:string;
  sequence:number;repeatedAtSunrise:boolean;
};
export function auditVratSunriseRows(
  slug:"ekadashi"|"purnima"|"amavasya",year:number,
  rows:readonly RitualVratObservation[]
){
  if(!Number.isInteger(year)||year<1)throw Error("Invalid year");
  const errors:string[]=[];
  const duplicateDates=new Set<string>();
  let repeatedAtSunrise=0,unresolvedTransitions=0;
  for(let i=0;i<rows.length;i++){
    const r=rows[i];
    const key=r.date;
    if(!validDay(key)||Number(key.slice(0,4))!==year)errors.push("invalid-year-or-date:"+key);
    if(i>0&&rows[i-1].date>=key)errors.push("unordered-date:"+key);
    if(duplicateDates.has(key))errors.push("duplicate-sunrise-date:"+key);
    duplicateDates.add(key);
    if(r.tithi!==slug[0].toUpperCase()+slug.slice(1))errors.push("wrong-tithi:"+key);
    if(slug==="purnima"&&r.paksha!=="Shukla"||
       slug==="amavasya"&&r.paksha!=="Krishna")
      errors.push("wrong-paksha:"+key);
    if(r.sequence!==i+1)errors.push("incorrect-sequence:"+key);
    const prior=rows[i-1];
    const adjacent=prior&&Date.parse(key+"T00:00:00Z")-Date.parse(prior.date+"T00:00:00Z")===86400000;
    const shouldRepeat=Boolean(adjacent&&prior?.paksha===r.paksha&&prior?.tithi===r.tithi);
    if(r.repeatedAtSunrise!==shouldRepeat)errors.push("bad-repeat-marker:"+key);
    if(r.repeatedAtSunrise)repeatedAtSunrise++;
    if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(r.sunrise))errors.push("invalid-sunrise:"+key);
    if(r.tithiEnd==="—"||!validDay(r.tithiEndDate))unresolvedTransitions++;
    else{
      if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(r.tithiEnd)||
        r.tithiEndDate<key||
        r.tithiEndDate>new Date(Date.parse(key+"T00:00:00Z")+2*86400000).toISOString().slice(0,10))
        errors.push("invalid-transition:"+key);
      else if(r.tithiEndDate===key&&r.tithiEnd<=r.sunrise)
        errors.push("transition-not-after-sunrise:"+key);
    }
  }
  return{
    slug,year,sunriseRows:rows.length,repeatedAtSunrise,
    unresolvedTransitions,errors,
    actualFastDayCertified:false as const,
    paranaTimeCalculated:false as const,
    smarthaVaishnavaConventionResolved:false as const,
    releaseStatus:"astronomical-sunrise-reference-only" as const
  };
}
