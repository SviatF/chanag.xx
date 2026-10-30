/**
 * Independent research-only JPL DE440s Parana astronomy.
 *
 * Dvadasi and Trayodasi intervals come ONLY from pinned real JPL 6° roots.
 * Sunrise/sunset are separately computed with the original Swiss upper-limb
 * observer convention. GCal clock values are never consumed here.
 * Special Nakshatra end may come from independently computed Swiss Lahiri
 * and is labelled as mixed-source research (never tradition-certified).
 */
import type {City} from "./cities";
import type {JplHalfTithiTable} from "./jpl-v6-tithi-karana-canary";
import type {ParanaInput} from "./independent-parana";
import type {NakshatraMahadvadashi} from "./independent-mahadvadashi";
import {createDefaultSweData} from "@typescriptify/sweph/dist/types.js";
import {sweClose} from "@typescriptify/sweph/dist/sweph.js";
import {sweRiseTrans} from "@typescriptify/sweph/dist/swecl.js";
import {SE_SUN,SEFLG_MOSEPH,SE_CALC_RISE,SE_CALC_SET} from "@typescriptify/sweph/dist/constants.js";
import {indiaCivilDayStartJulian} from "./india-time";
import {independentParanaAstronomy} from "./independent-parana-astronomy";
const JD0=2440587.5,DAY_MS=86400000;
const readDate=(date:string)=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||new Date(date+"T00:00:00Z").toISOString().slice(0,10)!==date)
  throw Error("Bad independent Parana local civil date");
 return date.split("-").map(Number);
};
const ms=(jd:number)=>(jd-JD0)*DAY_MS;
type Span={start:number;end:number};
const cache=new WeakMap<JplHalfTithiTable,Map<11|12,Span[]>>();
function getSpans(table:JplHalfTithiTable,tithi:11|12):Span[]{
 if(table.canaryOnly!==true||table.ritualSelectionCertified!==false||
  table.ephemeris!=="JPL DE440s"||table.halfTithiBoundaryCount!==4512)
  throw Error("JPL physical Tithi source not approved for research");
 let cached=cache.get(table);
 if(!cached){cached=new Map();cache.set(table,cached);}
 const prior=cached.get(tithi);if(prior)return prior;
 const phase=tithi*2,rows=table.halfTithiTransitions,found:Span[]=[];
 for(let i=0;i+2<rows.length;i++){
  if(rows[i][1]!==phase&&rows[i][1]!==phase+30)continue;
  if(rows[i+2][1]!==((rows[i][1]+2)%60))throw Error("JPL Tithi root steps broken");
  found.push({start:rows[i][0],end:rows[i+2][0]});
 }
 cached.set(tithi,found);
 return found;
}
export function jplParanaTithiBounds(table:JplHalfTithiTable,fastDate:string,paranaDate:string){
 const [y,m,d]=readDate(fastDate),[py,pm,pd]=readDate(paranaDate);
 const start=ms(indiaCivilDayStartJulian(y,m,d)),parana=ms(indiaCivilDayStartJulian(py,pm,pd));
 if(parana-start<0.9*DAY_MS||parana-start>2.1*DAY_MS)throw Error("Parana date must follow fasting date");
 const dwadashi=getSpans(table,11).find(x=>x.end>=start&&x.start<=parana+DAY_MS);
 const trayodashi=getSpans(table,12).find(x=>x.end>=parana&&x.start<=parana+DAY_MS);
 return {dwadashiStart:dwadashi?.start??null,dwadashiEnd:dwadashi?.end??null,
  trayodashiEnd:trayodashi?.end??null,fastCivilStartMs:start,paranaCivilStartMs:parana};
}
export function getJplResearchParanaAstronomy(
 city:City,fastDate:string,paranaDate:string,table:JplHalfTithiTable,
 subtype:NakshatraMahadvadashi|null=null
):ParanaInput|null{
 const bounds=jplParanaTithiBounds(table,fastDate,paranaDate);
 if(bounds.dwadashiStart===null||bounds.dwadashiEnd===null)return null;
 const [py,pm,pd]=readDate(paranaDate),start=indiaCivilDayStartJulian(py,pm,pd),s=createDefaultSweData();
 let riseMs:number,setMs:number;
 try{
  const place=[city.lng,city.lat,0];
  const rise=sweRiseTrans(s,start,SE_SUN,null,SEFLG_MOSEPH,SE_CALC_RISE,place,1013.25,25,null);
  const set=sweRiseTrans(s,start,SE_SUN,null,SEFLG_MOSEPH,SE_CALC_SET,place,1013.25,25,null);
  if(rise.retval<0||set.retval<0||!(set.tret>rise.tret))throw Error("No independent positive Swiss Parana daylight");
  riseMs=ms(rise.tret);setMs=ms(set.tret);
 }finally{sweClose(s);}
 if(new Date(riseMs+330*60000).toISOString().slice(0,10)!==paranaDate||
    new Date(setMs+330*60000).toISOString().slice(0,10)!==paranaDate)
  throw Error("Swiss Parana solar event outside local civil date");
 // Nakshatra time is separately independent Swiss/Lahiri, not JPL sidereal.
 // When its original solver cannot establish the event, leave it null.
 const nakshatraEnd=subtype?
  (independentParanaAstronomy(city,fastDate,paranaDate,subtype)?.nakshatraEnd??null):null;
 return {fastDate,paranaDate,sunrise:riseMs,sunset:setMs,
  dwadashiStart:bounds.dwadashiStart,dwadashiEnd:bounds.dwadashiEnd,
  trayodashiEnd:bounds.trayodashiEnd,nakshatraEnd,
  nakshatraSubtype:subtype,method:"GCal-normal"};
}
export const JPL_PARANA_RESEARCH_GUARD={publicRitualApproval:false,
 independentlyCertified:false,jplParanaCertified:false,
 sourceGcalOracleNotUsedForAstronomy:true,mixedSwissLahiriSpecialsUncertified:true} as const;
