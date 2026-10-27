/**
 * Independent pure-timing GCal-family Parana research calculation.
 * Inputs MUST be independently computed Sun/Moon tithi boundaries and local
 * sunrise/sunset. Does not silently substitute GCal oracle minutes.
 */
import type {MahadvadashiKind,NakshatraMahadvadashi} from "./independent-mahadvadashi";
export type ParanaMethod="GCal-normal"|"GCal-viddha-research"|"GCal-unmilani-research"|"GCal-vyanjuli-research"|"GCal-trisprsha-research"|"GCal-nakshatra-review";
/**
 * Research method selection MUST derive from independent astronomical evidence.
 * Never pass GCal's observed Mahadvadashi subtype into this function.
 */
export function researchParanaMethodFromIndependentKind(kind:MahadvadashiKind,fastSunriseTithiIndex?:number,paranaSunriseTithiIndex?:number):ParanaMethod{
 switch(kind){
  case null: return fastSunriseTithiIndex!==undefined&&paranaSunriseTithiIndex!==undefined&&
   fastSunriseTithiIndex%15===11&&paranaSunriseTithiIndex%15===12&&
   Math.floor(fastSunriseTithiIndex/15)===Math.floor(paranaSunriseTithiIndex/15)?
   "GCal-viddha-research":"GCal-normal";
  case "NAKSHATRA_REVIEW": return "GCal-nakshatra-review";
  case "UNMILANI": return "GCal-unmilani-research";
  case "VYANJULI": return "GCal-vyanjuli-research";
  case "TRISPRSHA": return "GCal-trisprsha-research";
  case "PAKSHA_VARDHINI": return "GCal-viddha-research";
  default: throw Error("Unknown independent Mahadvadashi kind; GCal source strings are forbidden");
 }
}
export type ParanaInput={
 fastDate:string;paranaDate:string;sunrise:number;sunset:number;
 dwadashiStart:number|null;dwadashiEnd:number|null;trayodashiEnd?:number|null;
 method:ParanaMethod;nakshatraEnd?:number|null;nakshatraSubtype?:NakshatraMahadvadashi|null
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
 if(v.method==="GCal-viddha-research"){
  // Source-specific Viddha rule, computed without importing GCal clock data:
  // Parana after sunrise on Trayodashi, by earliest of Trayodashi end
  // or first third of daylight.
  if(!v.trayodashiEnd||!finite(v.trayodashiEnd)||v.trayodashiEnd<=v.sunrise)
   return {...reject("special-rule-review","Missing independent Trayodashi end after sunrise"),
    daylightThird,hariVasaraEnd:quarter};
  const until=Math.min(v.trayodashiEnd,daylightThird);
  return {from:v.sunrise,to:until,openEnded:false,daylightThird,hariVasaraEnd:quarter,
   reasons:["sunrise",until===v.trayodashiEnd?"end of Trayodashi":"1/3 daylight"],
   status:"calculated-research-only",certified:false};
 }
 // Distinct source-documented ritual-clock conventions, with astronomical
 // inputs computed solely by Swiss; these remain uncertified research outputs.
 const sunriseBeginEnd=(end:number,reason:string):CandidateParana=>{
  if(!finite(end)||end<=v.sunrise)return {...reject("special-rule-review","No positive special Parana clock interval: "+reason),daylightThird,hariVasaraEnd:quarter};
  return {from:v.sunrise,to:end,openEnded:false,daylightThird,hariVasaraEnd:quarter,
   reasons:["sunrise",reason],status:"calculated-research-only",certified:false};
 };
 if(v.method==="GCal-trisprsha-research")
   return sunriseBeginEnd(daylightThird,"1/3 daylight after skipped Dvadasi");
 if(v.method==="GCal-unmilani-research"||v.method==="GCal-vyanjuli-research")
   return sunriseBeginEnd(Math.min(v.dwadashiEnd,daylightThird),
    v.dwadashiEnd<=daylightThird?"end of Dvadasi":"1/3 daylight");
 if(v.method==="GCal-nakshatra-review"){
  // GCal Jayanti/Vijaya source-described Parana timing uses the independently
  // solved Nakshatra end. Jaya/Papanasini require different restrictions.
  if(v.nakshatraSubtype!=="JAYANTI"&&v.nakshatraSubtype!=="VIJAYA")
   return {...reject("special-rule-review","Nakshatra subtype has no implemented independent Parana rule"),
    daylightThird,hariVasaraEnd:quarter};
  const nakEnd=v.nakshatraEnd;
  if(nakEnd===undefined||nakEnd===null||!finite(nakEnd)||nakEnd<=v.sunrise)
   return {...reject("special-rule-review","Nakshatra end not independently established after sunrise"),
    daylightThird,hariVasaraEnd:quarter};
  const dvadashiPresent=v.dwadashiStart<=v.sunrise&&v.dwadashiEnd>v.sunrise;
  let from=v.sunrise,to:number;
  if(!dvadashiPresent){
   to=Math.min(nakEnd,daylightThird);
  }else if(nakEnd<v.dwadashiEnd){
   from=nakEnd;
   to=nakEnd<=daylightThird?Math.min(v.dwadashiEnd,daylightThird):v.dwadashiEnd;
  }else {
   to=Math.min(v.dwadashiEnd,daylightThird);
  }
  if(to<=from)
   return {...reject("special-rule-review","Nakshatra-specific Parana interval is empty"),
    daylightThird,hariVasaraEnd:quarter};
  return {from,to,openEnded:false,daylightThird,hariVasaraEnd:quarter,
   reasons:["Jayanti/Vijaya Nakshatra independent timing","source-rule conditional"],
   status:"calculated-research-only",certified:false};
 }
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
