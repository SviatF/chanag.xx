/**
 * Wave 3AT: evaluate every real Indian city sunrise around all 36 Sankranti
 * roots under the original JS-Lahiri JPL vs alternate native-C-Lahiri JPL.
 * Research only: no production date is rewritten.
 */
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {createHash} from "node:crypto";
import {createDefaultSweData} from "@typescriptify/sweph/dist/types.js";
import {sweRiseTrans} from "@typescriptify/sweph/dist/swecl.js";
import {SE_SUN,SEFLG_MOSEPH,SE_CALC_RISE} from "@typescriptify/sweph/dist/constants.js";
import {supportedCities,type City} from "../lib/cities";
import {indiaCivilDayStartJulian} from "../lib/india-time";
import {openVerifiedV6SiderealSource} from "../lib/v6-unified-calendar-staging";
import {validateSiderealTransitionTable,siderealStateAtUtc} from "../lib/jpl-v6-sidereal-transitions";
const oldText=readFileSync("artifacts/wave3ao-jpl-global-sidereal-transitions.json","utf8");
const oldAnchors=readFileSync("artifacts/wave3ao-lahiri-6h-anchors.json","utf8");
const nativeText=readFileSync("artifacts/wave3as-jpl-native-lahiri-root-candidate.json","utf8");
const nativeAnchorText=readFileSync("artifacts/wave3as-native-swiss-lahiri-candidate.json","utf8");
const counter=JSON.parse(readFileSync("artifacts/wave3as-native-lahiri-jpl-root-counterfactual.json","utf8"));
const pinned=openVerifiedV6SiderealSource(oldText,oldAnchors);
const alt=JSON.parse(nativeText);
const native=validateSiderealTransitionTable(alt);
const digest=(s:string)=>createHash("sha256").update(s).digest("hex");
if(counter.wave!=="3AS"||counter.full36SolarRashiRootClockParityWithinThreeSeconds!==true||
   counter.nativeLahiriCatalogSha256!==digest(nativeText)||
   counter.nativeLahiriAnchorSha256!==digest(nativeAnchorText)||
   native.lahiriAnchorSha256!==digest(nativeAnchorText)||
   native.solarLunarKernelSha256!==pinned.table.solarLunarKernelSha256||
   native.lunarRootSourceSha256!==pinned.table.lunarRootSourceSha256||
   native.productionSwitchAllowed!==false)
  throw Error("Unreviewed candidate source identity or release flags");
const canonical=new Map<string,City>();
for(const c of supportedCities){
  const previous=canonical.get(c.slug);
  if(previous){
    if(c.lat!==previous.lat||c.lng!==previous.lng||c.state!==previous.state)
      throw Error("Contradictory same-slug geographic records");
  }else canonical.set(c.slug,c);
}
if(canonical.size!==454)throw Error("Missing 454 unique cities");
const DAY=86400000,JD0=2440587.5,IST=330*60_000;
const datesNear=(utcMs:number)=>{
  const base=Math.floor((utcMs+IST)/DAY)*DAY;
  return [base-DAY,base,base+DAY].filter(ms=>ms>=Date.UTC(2026,0,1)&&ms<Date.UTC(2029,0,1));
};
const rows:Array<{index:number;eventUtc:string;date:string;city:string;
   exactSunriseUtc:string;originalIndex:number;nativeCandidateIndex:number;
   difference:boolean;secondsFromOriginalBoundary:number;
   secondsFromNativeBoundary:number}>=[];
const dateFamilies=new Map<string,{original:number;candidate:number;cities:Set<string>}>();
const swed=createDefaultSweData();
let examined=0,changed=0;
try{
  for(let event=0;event<36;event++){
    const old=pinned.table.events.sunRashi[event],next=native.events.sunRashi[event];
    if(old[1]!==next[1])throw Error("JPL Solar Rashi index changed");
    for(const civilMs of datesNear(old[0])){
      const date=new Date(civilMs).toISOString().slice(0,10);
      const [y,m,d]=date.split("-").map(Number);
      for(const city of canonical.values()){
        const rise=sweRiseTrans(swed,indiaCivilDayStartJulian(y,m,d),
           SE_SUN,null,SEFLG_MOSEPH,SE_CALC_RISE,[city.lng,city.lat,0],1013.25,25,null);
        if(rise.retval<0||!Number.isFinite(rise.tret))throw Error("Missing true sunrise "+city.slug+" "+date);
        const at=Math.round((rise.tret-JD0)*DAY);
        if(new Date(at+IST).toISOString().slice(0,10)!==date)
          throw Error("Indian local sunrise shifted date "+date+" "+city.slug);
        const iso=new Date(at).toISOString();
        const orig=siderealStateAtUtc(pinned.table,iso).sunRashi.index;
        const candidate=siderealStateAtUtc(native,iso).sunRashi.index;
        const different=orig!==candidate;
        if(different){
          const step=(orig-candidate+12)%12;
          if(step!==1&&step!==11)throw Error("Nonadjacent Sankranti sign disagreement");
          changed++;
        }
        const key=date+"|"+old[1];
        const family=dateFamilies.get(key)??{original:0,candidate:0,cities:new Set<string>()};
        family.original+=Number(orig===old[1]);
        family.candidate+=Number(candidate===old[1]);
        family.cities.add(city.slug);
        dateFamilies.set(key,family);
        examined++;
        if(different||rows.length<15)rows.push({
          index:old[1],eventUtc:new Date(old[0]).toISOString(),date,city:city.slug,
          exactSunriseUtc:iso,originalIndex:orig,nativeCandidateIndex:candidate,
          difference:different,secondsFromOriginalBoundary:Math.round((at-old[0])/1000),
          secondsFromNativeBoundary:Math.round((at-next[0])/1000)
        });
      }
    }
  }
}finally{
  // lifecycle is intentionally local to this research-only process
}
const clusters=[...dateFamilies].map(([key,value])=>{
  const [date,index]=key.split("|");
  return {date,solarSignIndex:Number(index),cities:value.cities.size,
    originalSignAtSunrise:value.original,nativeLahiriCandidateSignAtSunrise:value.candidate,
    changedCount:Math.abs(value.original-value.candidate)};
}).filter(row=>row.changedCount).sort((a,b)=>b.changedCount-a.changedCount);
if(examined<48000||examined>50000||changed!==rows.filter(r=>r.difference).length)
  throw Error("Incomplete 36-event / 454-city true-sunrise study "+JSON.stringify({examined,changed}));
const report={wave:"3AT",status:"research-only",events:36,uniqueCities:canonical.size,
  inspectedExactSunrises:examined,changedSolarRashiClassifications:changed,
  changedDateClusters:clusters,
  provenance:{originalCatalogSha256:digest(oldText),nativeCatalogSha256:digest(nativeText),
    nativeAnchorSha256:digest(nativeAnchorText),counterfactual36SolarRootsApproved:true},
  observations:rows,
  independentLahiriPolicyApproved:false,ritualSankrantiDatesApproved:false,
  publicV5Modified:false,productionV6ReleaseAllowed:false};
mkdirSync("artifacts",{recursive:true});
writeFileSync("artifacts/wave3at-native-lahiri-sankranti-sunrise-impact.json",JSON.stringify(report,null,2)+"\n");
console.log("[Wave3AT] "+JSON.stringify({events:36,cities:canonical.size,examined,
  changed,clusters:clusters.slice(0,8),publicV5:false,approved:false}));
