/**
 * Research-only: Moshier geocentric angular separation and traditional Surya
 * Siddhanta-style thresholds. NOT Drik's validated locality-sensitive method.
 *
 * Never import into lib/muhurat.ts or use these research intervals to approve
 * or block a ceremony. Reconcile with independent publishers first.
 */
import {createDefaultSweData} from "@typescriptify/sweph/dist/types.js";
import {sweCalc,sweClose} from "@typescriptify/sweph/dist/sweph.js";
import {julDay} from "@typescriptify/sweph/dist/swedate.js";
import {SE_SUN,SE_VENUS,SE_JUPITER,SE_GREG_CAL,SEFLG_MOSEPH,SEFLG_SPEED,SEFLG_EQUATORIAL} from "@typescriptify/sweph/dist/constants.js";
import {indiaLocalPartsFromJulian} from "../lib/india-time";
import {mkdirSync,writeFileSync} from "node:fs";

const deg=Math.PI/180;
const toDeg=180/Math.PI;
const clamp=(n:number)=>Math.max(-1,Math.min(1,n));
const swed=createDefaultSweData();
type Planet="Venus"|"Jupiter";
type Event={planet:Planet;kind:"enter"|"exit";at:string;julian:number;angle:number;retrograde:boolean;threshold:number};

function angularSeparation(jd:number,planet:Planet){
  const p=planet==="Venus"?SE_VENUS:SE_JUPITER;
  const flags=SEFLG_MOSEPH|SEFLG_EQUATORIAL;
  const sun=sweCalc(swed,jd,SE_SUN,flags).xx;
  const body=sweCalc(swed,jd,p,flags).xx;
  const speed=sweCalc(swed,jd,p,SEFLG_MOSEPH|SEFLG_SPEED).xx[3];
  if(![sun[0],sun[1],body[0],body[1],speed].every(Number.isFinite))throw new Error("Ephemeris returned invalid coordinates");
  const raDelta=(body[0]-sun[0])*deg,decSun=sun[1]*deg,decBody=body[1]*deg;
  const cosSep=Math.sin(decSun)*Math.sin(decBody)+Math.cos(decSun)*Math.cos(decBody)*Math.cos(raDelta);
  const separation=Math.acos(clamp(cosSep))*toDeg;
  const retrograde=speed<0;
  // Indicative angular cutoffs, not locale-observed planet visibility.
  const threshold=planet==="Jupiter"?11:retrograde?8:10;
  return {separation,retrograde,threshold,inAsta:separation<=threshold};
}
function localIso(jd:number){
  const local=indiaLocalPartsFromJulian(jd);
  return local.date+"T"+local.time+":00+05:30";
}
function localMinuteDelta(a:string,b:string){
  return Math.round((Date.parse(a)-Date.parse(b))/60000);
}
const events:Event[]=[];
const warnings:string[]=[];
try{
  const start=julDay(2025,1,1,0,SE_GREG_CAL)-1;
  const end=julDay(2028,1,1,0,SE_GREG_CAL)+1;
  for(const planet of ["Venus","Jupiter"] as const){
    let oldTime=start,old=angularSeparation(oldTime,planet);
    for(let jd=start+0.25;jd<=end+0.00001;jd+=0.25){
      const now=angularSeparation(jd,planet);
      if(now.inAsta!==old.inAsta){
        let lo=oldTime,hi=jd,loStatus=old.inAsta;
        for(let i=0;i<36;i++){
          const mid=(lo+hi)/2;
          const state=angularSeparation(mid,planet);
          if(state.inAsta===loStatus)lo=mid;else hi=mid;
        }
        const instant=(lo+hi)/2,state=angularSeparation(instant,planet);
        events.push({planet,kind:now.inAsta?"enter":"exit",at:localIso(instant),julian:instant,angle:state.separation,retrograde:state.retrograde,threshold:state.threshold});
        if(planet==="Venus"&&old.retrograde!==now.retrograde)
          warnings.push("Venus classification changed near a station; threshold switch may create artificial edges at "+localIso(instant));
      }
      oldTime=jd;old=now;
    }
  }
}finally{sweClose(swed);}

const reference={
  planet:"Jupiter" as Planet,
  locality:"Mumbai",
  year:2027,
  publisher:"Drik Panchang",
  source:"https://www.drikpanchang.com/planet/asta/guru-asta-date-time.html?year=3206",
  enter:"2027-08-19T19:34:00+05:30",
  exit:"2027-09-13T05:46:00+05:30",
  status:"SINGLE PUBLISHER; location/method not independently reproduced"
};
const comparisons=(["enter","exit"] as const).map(kind=>{
  const expected=reference[kind];
  const matching=events.filter(e=>e.planet===reference.planet&&e.kind===kind)
    .sort((a,b)=>Math.abs(localMinuteDelta(a.at,expected))-Math.abs(localMinuteDelta(b.at,expected)))[0];
  const deltaMinutes=matching?localMinuteDelta(matching.at,expected):null;
  return {kind,expected,calculated:matching?.at??null,deltaMinutes,
    within30Minutes:deltaMinutes!==null&&Math.abs(deltaMinutes)<=30,
    significantDisagreement:deltaMinutes===null||Math.abs(deltaMinutes)>720,
    methodMatchesPublisher:false};
});
const report={
  createdAt:new Date().toISOString(),
  status:"RESEARCH-ONLY-NOT-CEREMONY-CERTIFIED",
  safeForCeremonyFiltering:false,
  statusReason:"Benchmark differs from Mumbai publisher by multiple days at both boundaries; this is not a validated location-specific observability calculation.",
  engine:"Swiss Ephemeris Moshier, geocentric equatorial angular separation",
  thresholdDegrees:{jupiter:11,venusDirect:10,venusRetrograde:8},
  methodLimitations:[
    "Asta here is GEOCENTRIC angular separation, not validated observer-specific visual disappearance or Drik's published modern location-dependent algorithm.",
    "Venus retrograde threshold changes at stations and can create discontinuities; compare station events and alternative methods.",
    "Geo/topocentric coordinates, ecliptic versus spherical separation, observational factors, and Shishutva/Vriddhatva exclusions remain unverified.",
    "Do not use this research output to block or approve weddings, house entry, or any ritual."
  ],
  publishedReference:reference,
  comparisons,events:events.filter(e=>e.at.slice(0,4)>="2025"&&e.at.slice(0,4)<="2027"),
  warnings
};
mkdirSync("artifacts",{recursive:true});
writeFileSync("artifacts/planetary-asta-research.json",JSON.stringify(report,null,2));
console.log("[asta-research] intervals events="+report.events.length+" warnings="+warnings.length);
for(const c of comparisons)console.log("[asta-research] Jupiter 2027 Mumbai "+c.kind+" expected="+c.expected+" calculated="+c.calculated+" deltaMinutes="+c.deltaMinutes);
console.log("[asta-research] NOT a production Muhurat exclusion. Compare observational methods before any use.");
