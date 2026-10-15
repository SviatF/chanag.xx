/**
 * Wave 3AO — fail-closed, research-only in-memory reader for one fully
 * SHA-verified JPL global sidereal event catalog.
 *
 * Validates event sequence, root ordering, provenance, and immutable
 * non-publication flags. Never imported by live V5 or SEO routes.
 */
export type SiderealFamily="moonPada"|"nakshatra"|"yoga"|"moonRashi"|"sunRashi";
export const SIDEREAL_FAMILY_MODULUS:Record<SiderealFamily,number>={
  moonPada:108,nakshatra:27,yoga:27,moonRashi:12,sunRashi:12
};
const SHA="c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2";
const RAW_SHA="0cab0c6accaf2e2125fe417bf4a4f14a22453a4013a1609dce6dce84ec44142e";
export interface JplSiderealTransitionTable{
  wave:"3AO";schema:1;status:"research-only";
  coverageStartUtc:string;coverageEndUtc:string;
  years:number[];
  solarLunarKernelSha256:typeof SHA;
  lunarRootSourceSha256:typeof RAW_SHA;
  maxMeasuredAnchorMidpointErrorArcsec:number;
  lahiriAnchorSha256:string;
  fullIndependentAyanamsaApproved:false;
  ritualSelectionCertified:false;
  productionSwitchAllowed:false;
  events:Record<SiderealFamily,[number,number][]>;
}
export function validateSiderealTransitionTable(value:unknown):JplSiderealTransitionTable{
  if(!value||typeof value!=="object")throw Error("Missing Wave3AO sidereal catalog");
  const t=value as JplSiderealTransitionTable;
  if(t.wave!=="3AO"||t.schema!==1||t.status!=="research-only"||
     t.solarLunarKernelSha256!==SHA||t.lunarRootSourceSha256!==RAW_SHA||
     t.fullIndependentAyanamsaApproved!==false||
     t.ritualSelectionCertified!==false||t.productionSwitchAllowed!==false||
     t.coverageStartUtc!=="2026-01-01T00:00:00.000Z"||
     t.coverageEndUtc!=="2029-01-01T00:00:00.000Z"||
     !Array.isArray(t.years)||t.years.join(",")!=="2026,2027,2028"||
     !Number.isFinite(t.maxMeasuredAnchorMidpointErrorArcsec)||
     t.maxMeasuredAnchorMidpointErrorArcsec<0||
     t.maxMeasuredAnchorMidpointErrorArcsec>0.5||
     !/^[0-9a-f]{64}$/.test(t.lahiriAnchorSha256))
    throw Error("Invalid Wave3AO source hash, reference frame or release gate");
  const low=Date.parse(t.coverageStartUtc),high=Date.parse(t.coverageEndUtc);
  for(const [family,modulus] of Object.entries(SIDEREAL_FAMILY_MODULUS) as [SiderealFamily,number][]){
    const entries=t.events?.[family];
    if(!Array.isArray(entries)||entries.length<30)throw Error("Empty or incomplete JPL "+family+" event stream");
    let last=-Infinity,prevIndex=-1;
    for(const [time,index] of entries){
      if(!Number.isSafeInteger(time)||time<low||time>=high||
         !Number.isInteger(index)||index<0||index>=modulus||time<=last)
        throw Error("Unordered/nonfinite JPL "+family+" transition");
      if(prevIndex>=0&&(prevIndex+1)%modulus!==index)
        throw Error("Skipped JPL "+family+" transition index");
      last=time;prevIndex=index;
    }
  }
  const pada=t.events.moonPada;
  const nak=t.events.nakshatra;
  const derived=pada.filter(([,idx])=>idx%4===0).map(([ms,idx])=>[ms,idx/4] as [number,number]);
  if(derived.length!==nak.length||derived.some((x,i)=>x[0]!==nak[i][0]||x[1]!==nak[i][1]))
    throw Error("Nakshatra and Pada roots must be exact shared JPL instants");
  return t;
}
export function siderealStateAtUtc(table:JplSiderealTransitionTable,utc:string){
  const ms=Date.parse(utc),lo=Date.parse(table.coverageStartUtc),hi=Date.parse(table.coverageEndUtc);
  if(!Number.isFinite(ms)||new Date(ms).toISOString()!==utc||ms<lo||ms>=hi)
    throw Error("JPL sidereal candidate outside verified global catalog");
  const result={} as Record<SiderealFamily,{index:number;nextTransitionUtc:string|null}>;
  for(const [family,modulus] of Object.entries(SIDEREAL_FAMILY_MODULUS) as [SiderealFamily,number][]){
    const rows=table.events[family];
    let low=0,high=rows.length;
    while(low<high){const mid=(low+high)>>>1;if(rows[mid][0]<=ms)low=mid+1;else high=mid;}
    const position=low-1;
    const index=position>=0?rows[position][1]:(rows[0][1]+modulus-1)%modulus;
    result[family]={index,nextTransitionUtc:low<rows.length?new Date(rows[low][0]).toISOString():null};
  }
  if(result.nakshatra.index!==Math.floor(result.moonPada.index/4))
    throw Error("JPL Moon Pada/Nakshatra state mismatch");
  return {
    ...result,
    nakshatraPada:result.moonPada.index%4+1,
    productionReleaseAllowed:false as const,
    ritualsApproved:false as const
  };
}
