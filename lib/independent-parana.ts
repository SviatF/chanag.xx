/**
 * Independent pure-timing GCal-family Parana research calculation.
 * Inputs MUST be independently computed Sun/Moon tithi boundaries and local
 * sunrise/sunset. Does not silently substitute GCal oracle minutes.
 */
import type {MahadvadashiKind} from "./independent-mahadvadashi";
export type ParanaMethod="GCal-normal"|"GCal-trisprsha-review"|"GCal-nakshatra-review";
/**
 * Research method selection MUST derive from independent astronomical evidence.
 * Never pass GCal's observed Mahadvadashi subtype into this function.
 */
export function researchParanaMethodFromIndependentKind(kind:MahadvadashiKind):ParanaMethod{
 if(kind==="NAKSHATRA_REVIEW")return "GCal-nakshatra-review";
 if(kind!==null)return "GCal-trisprsha-review";
 return "GCal-normal";
}
export type ParanaInput={
 fastDate:string;paranaDate:string;sunrise:number;sunset:number;
 dwadashiStart:number|null;dwadashiEnd:number|null;
 method:ParanaMethod;nakshatraEnd?:number|null
};
export type CandidateParana={
 from:number|null;to:number|null;openEnded:boolean;daylightThird:number|null;
 hariVasaraEnd:number|null;reasons:string[];
 status:"calculated-research-only"|"insufficient-input"|"special-rule-review";
 certified:false
};
const finite=(n:number)=>Number.isFinite(n)&&n>0;
const day=(ms:number)=>new Date(ms).toISOString().slice(0,10);
export function calculateIndependentParana(v:ParanaInput):CandidateParana{
 const reject=(status:CandidateParana["status"],reason:string):CandidateParana=>({
  from:null,to:null,openEnded:false,daylightThird:null,hariVasaraEnd:null,
  reasons:[reason],status,certified:false
 });
 if(!finite(v.sunrise)||!finite(v.sunset)||v.sunset<=v.sunrise||v.sunset-v.sunrise>18*3600000)
   return reject("insufficient-input","Invalid daylight interval");
 if(!v.dwadashiStart||!v.dwadashiEnd||!finite(v.dwadashiStart)||!finite(v.dwadashiEnd)||v.dwadashiEnd<=v.dwadashiStart)
   return reject("insufficient-input","Missing or inverted Dvadashi tithi bounds");
 // UTC timestamps, local civil dates verified separately in the caller.
 const daylightThird=v.sunrise+(v.sunset-v.sunrise)/3;
 const quarter=v.dwadashiStart+(v.dwadashiEnd-v.dwadashiStart)/4;
 if(v.method!=="GCal-normal")return {
  ...reject("special-rule-review","Mahadvadashi/Nakshatra Parana demands subtype-specific method"),
  daylightThird,hariVasaraEnd:quarter
 };
 if(v.dwadashiEnd<=v.sunrise){
  // Trayodashi already at sunrise: GCal source may allow sunrise to the
  // daylight third. No Dvadashi tithi window remains to enforce. Needs review.
  return {...reject("special-rule-review","Dvadashi expired before Parana sunrise"),
   daylightThird,hariVasaraEnd:quarter};
 }
 const from=Math.max(v.sunrise,quarter);
 const end=Math.min(v.dwadashiEnd,daylightThird);
 const reasons=[from===v.sunrise?"sunrise":"1/4 of Dvadashi",end===v.dwadashiEnd?"end of Dvadashi":"1/3 daylight"];
 return {from,to:end>from?end:null,openEnded:end<=from,daylightThird,
  hariVasaraEnd:quarter,reasons,
  status:"calculated-research-only",certified:false};
}
export function minutesBetween(proposed:number,originalClock:string,offsetMinutes=330){
 if(!/^\d{2}:\d{2}$/.test(originalClock)||!finite(proposed))return null;
 const local=new Date(proposed+offsetMinutes*60000).toISOString().slice(11,16);
 return Math.min(Math.abs(Number(local.slice(0,2))*60+Number(local.slice(3))-Number(originalClock.slice(0,2))*60-Number(originalClock.slice(3))),
  1440-Math.abs(Number(local.slice(0,2))*60+Number(local.slice(3))-Number(originalClock.slice(0,2))*60-Number(originalClock.slice(3))));
}
