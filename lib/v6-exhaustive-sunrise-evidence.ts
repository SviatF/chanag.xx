/** Shared deterministic boundary arithmetic for the exhaustive Wave 3AQ census. */
export function nearestExactRoot(
  rows:ReadonlyArray<readonly [number,number]>,instantMs:number
){
  if(!Number.isSafeInteger(instantMs)||!rows.length)
    throw Error("Missing or invalid exact JPL event lookup");
  let low=0,high=rows.length;
  while(low<high){
    const middle=(low+high)>>>1;
    if(rows[middle][0]<=instantMs)low=middle+1;
    else high=middle;
  }
  const previous=low>0?rows[low-1][0]:null;
  const next=low<rows.length?rows[low][0]:null;
  const distanceMs=Math.min(
    previous===null?Infinity:instantMs-previous,
    next===null?Infinity:next-instantMs
  );
  if(!Number.isFinite(distanceMs)||distanceMs<0)
    throw Error("JPL event sequence does not bracket instant");
  return {distanceMs,previous,next};
}
export function sourceLabelsAreAdjacent(v5Index:number,v6Index:number,modulus:number){
  if(!Number.isInteger(v5Index)||!Number.isInteger(v6Index)||
     !Number.isInteger(modulus)||modulus<2||
     v5Index<0||v6Index<0||v5Index>=modulus||v6Index>=modulus)
    throw Error("Invalid astronomical source classification index");
  if(v5Index===v6Index)return false;
  const difference=(v5Index-v6Index+modulus)%modulus;
  return difference===1||difference===modulus-1;
}
export function daysInGregorianYear(year:number){
  if(!Number.isInteger(year)||year<2026||year>2028)
    throw Error("Unsupported exhaustive city sunrise year");
  return (Date.UTC(year+1,0,1)-Date.UTC(year,0,1))/86_400_000;
}
