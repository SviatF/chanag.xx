/**
 * Wave 3P — location-specific sky altitude and optional native heliacal research.
 *
 * Geometry mode (Quality CI): exact UT-based Swiss Ephemeris coordinates,
 * horizontal conversion + refraction, 10-minute twilight diagnostics.
 * Deep mode: Swiss heliacal event search including atmospheric & observer
 * assumptions. Neither mode is verified Drik methodology or ritual approval.
 */
import {mkdirSync,writeFileSync} from "node:fs";
import {createDefaultSweData} from "@typescriptify/sweph/dist/types.js";
import {sweCalcUt,sweClose,sweSetTopo} from "@typescriptify/sweph/dist/sweph.js";
import {sweAzalt} from "@typescriptify/sweph/dist/swecl.js";
import {sweHeliacalUt} from "@typescriptify/sweph/dist/swehel.js";
import {
  SE_SUN,SE_VENUS,SE_JUPITER,SEFLG_MOSEPH,SEFLG_TOPOCTR,
  SEFLG_EQUATORIAL,SE_EQU2HOR
} from "@typescriptify/sweph/dist/constants.js";
import {coreCities} from "../lib/cities";
import {indiaLocalPartsFromJulian} from "../lib/india-time";
import {localIstDateTimeToJulian} from "../lib/asta-model-benchmark";
import {
  ASTA_ATMOSPHERE_SCENARIOS,geometryOnlyCandidate,groupGeometrySamples,
  type AstaSkySample,type VisibilityProfile
} from "../lib/asta-heliacal-visibility";
import {astaEvidenceLedger} from "../tests/fixtures/asta-evidence-ledger";

const deep=process.argv.includes("--deep-heliacal");
const reportFile=process.argv.find(a=>a.startsWith("--report="))?.slice(9)||
  "artifacts/asta-heliacal-visibility-research.json";
const swe=createDefaultSweData();
const referenceRows=astaEvidenceLedger.filter(r=>r.precision==="minute");
let geometryFailures=0,skippedLocations=0,scenariosEvaluated=0;
const results:Array<Record<string,unknown>>=[];
const deepResults:Array<Record<string,unknown>>=[];

function getCoreCity(locality:string){
  return coreCities.find(c=>c.name+", "+c.state===locality||
    (c.slug==="delhi"&&locality==="New Delhi"));
}
function local(jd:number){
  const l=indiaLocalPartsFromJulian(jd);
  return l.date+"T"+l.time;
}
function instant(jd:number,planet:"Jupiter"|"Venus",city:{lng:number;lat:number},
  atmosphere:VisibilityProfile):AstaSkySample{
  // SWE Calc UT and SWE Azalt both receive Universal Time Julian days.
  // Unlike Wave 3O baseline, do not pass UT directly to an ET API.
  const geopos=[city.lng,city.lat,0];
  const topo=SEFLG_MOSEPH|SEFLG_TOPOCTR|SEFLG_EQUATORIAL;
  const sun=sweCalcUt(swe,jd,SE_SUN,topo).xx;
  const planetPos=sweCalcUt(swe,jd,planet==="Jupiter"?SE_JUPITER:SE_VENUS,topo).xx;
  const solarHorizontal=[0,0,0],planetHorizontal=[0,0,0];
  sweAzalt(swe,jd,SE_EQU2HOR,geopos,atmosphere.pressureHpa,
    atmosphere.temperatureC,[sun[0],sun[1],sun[2]],solarHorizontal);
  sweAzalt(swe,jd,SE_EQU2HOR,geopos,atmosphere.pressureHpa,
    atmosphere.temperatureC,[planetPos[0],planetPos[1],planetPos[2]],planetHorizontal);
  const values=[...solarHorizontal,...planetHorizontal];
  if(!values.every(Number.isFinite))throw Error("Non-finite horizontal coordinates");
  return {
    julianUt:jd,
    sunAzimuthDegrees:solarHorizontal[0],
    sunTrueAltitudeDegrees:solarHorizontal[1],
    sunApparentAltitudeDegrees:solarHorizontal[2],
    planetAzimuthDegrees:planetHorizontal[0],
    planetTrueAltitudeDegrees:planetHorizontal[1],
    planetApparentAltitudeDegrees:planetHorizontal[2]
  };
}
function scanLocalDay(date:string,daypart:"dawn"|"dusk",planet:"Jupiter"|"Venus",
  city:{lng:number;lat:number},profile:VisibilityProfile){
  const first=daypart==="dawn"?"04:00":"15:30";
  const last=daypart==="dawn"?"08:30":"20:30";
  const start=localIstDateTimeToJulian(date+"T"+first);
  const end=localIstDateTimeToJulian(date+"T"+last);
  if(start===null||end===null)throw Error("Invalid reference day");
  const points=[];
  let considered=0,twilightCount=0,geometricCount=0;
  const bands=new Set<string>();
  for(let i=0;i<=Math.round((end-start)*144);i++){
    const jd=start+i/144; // EXACT ten-minute grid: 1/144 Julian day.
    const s=instant(jd,planet,city,profile);
    const screened=geometryOnlyCandidate(s,profile);
    considered++;
    bands.add(screened.twilightBand);
    if(screened.twilightBand!=="daylight"&&screened.twilightBand!=="night")twilightCount++;
    if(screened.geometryWindowOnly)geometricCount++;
    points.push({julianUt:jd,geometryWindowOnly:screened.geometryWindowOnly});
  }
  const grouped=groupGeometrySamples(points,10);
  return {
    daypart,date,firstLocal:first,lastLocal:last,stepMinutes:10,
    evaluatedSamples:considered,twilightSamples:twilightCount,
    geometryOnlySamples:geometricCount,twilightBands:[...bands],
    candidateWindows:grouped.map(w=>({
      fromLocal:local(w.firstJulianUt),toLocal:local(w.lastJulianUt),
      sampledPoints:w.sampleCount,
      // Bounds are sampled points, NOT physically exact first/last visibility.
      transitionPrecision:"ten-minute-grid-not-precise-visibility"
    })),
    nakedEyeVisibilityVerified:false
  };
}

/** Optional deep native Swiss heliacal search; never silently substitute its
 * first next event for a source Asta boundary without matching the definition. */
function nativeHeliacal(
  planet:"Jupiter"|"Venus",event:"morning-first"|"evening-last",
  startJulian:number,city:{lng:number;lat:number},profile:VisibilityProfile
){
  const eventType=event==="morning-first"?1:2; // Swiss SE_HELIACAL_RISING / SETTING
  const geo=[city.lng,city.lat,0];
  const datm=[profile.pressureHpa,profile.temperatureC,profile.humidityPct,
    profile.meteorologicalRangeKm,0,0];
  const observer=[36,1,0,0,0,0]; // assumed naked-eye adult observer
  try{
    const r=sweHeliacalUt(swe,startJulian,geo,datm,observer,planet,eventType,
      SEFLG_MOSEPH|1024) as unknown as {
        retval?:number;retc?:number;dret?:number[]|Float64Array;
        serr?:string;error?:string
      };
    const raw=r.dret?.[0];
    if(!Number.isFinite(raw)||raw!<=0)return{
      status:"not-computed",detail:r.serr||r.error||"No finite native heliacal event",
      safeForCeremonyFiltering:false
    };
    return {
      status:"predicted-native-swiss-heliacal",
      eventType:event,
      julianUt:raw,instantLocalIst:local(raw),
      method:"Swiss heliacal visibility search, assumed atmosphere + naked-eye observer",
      notComparableToDrikAstaWithoutMethodMapping:true,
      safeForCeremonyFiltering:false
    };
  }catch(e){
    return {status:"native-ephemeris-error",detail:String(e).slice(0,400),
      safeForCeremonyFiltering:false};
  }
}
try{
  for(const reference of referenceRows){
    const city=getCoreCity(reference.locality);
    if(!city){
      skippedLocations++;
      results.push({
        locality:reference.locality,planet:reference.planet,
        source:reference.url,status:"skipped-no-curated-observer-coordinate",
        safeForCeremonyFiltering:false
      });
      continue;
    }
    sweSetTopo(swe,city.lng,city.lat,0);
    for(const profile of ASTA_ATMOSPHERE_SCENARIOS){
      try{
        const anchors=[
          {boundary:"reported-start",date:reference.startLocal.slice(0,10),at:reference.startLocal},
          {boundary:"reported-end",date:reference.endLocal.slice(0,10),at:reference.endLocal}
        ];
        const diagnostics=anchors.map(anchor=>{
          const jd=localIstDateTimeToJulian(anchor.at);
          if(jd===null)throw Error("Invalid source boundary");
          const sky=instant(jd,reference.planet,city,profile);
          return {
            ...anchor,
            // The published boundary time may occur in full daylight; do not
            // call that a measured heliacal sunrise/setting moment.
            atPublishedInstant:sky,
            geometryOnly:geometryOnlyCandidate(sky,profile),
            dawn:scanLocalDay(anchor.date,"dawn",reference.planet,city,profile),
            dusk:scanLocalDay(anchor.date,"dusk",reference.planet,city,profile)
          };
        });
        results.push({
          status:"geometry-only-not-visibility-certified",
          locality:reference.locality,planet:reference.planet,
          observer:{lat:city.lat,lng:city.lng,eyeHeightMeters:0},
          publisher:reference.publisher,sourceUrl:reference.url,
          sourceLocationMode:reference.sourceLocationMode,
          atmosphere:profile,diagnostics,
          safeForCeremonyFiltering:false,
          claimedPhysicalVisibility:false
        });
        scenariosEvaluated++;
      }catch(e){
        geometryFailures++;
        results.push({status:"geometry-computation-error",locality:reference.locality,
          atmosphere:profile.id,error:String(e),safeForCeremonyFiltering:false});
      }
    }
  }
  if(deep){
    // Controlled native visibility sensitivity: Mumbai 2027 Jupiter and Venus.
    // Mumbai Venus lacks independently corroborated city-specific references.
    const city=coreCities.find(c=>c.slug==="mumbai");
    if(!city)throw Error("Mumbai observer not found");
    sweSetTopo(swe,city.lng,city.lat,0);
    const start=localIstDateTimeToJulian("2027-06-01T00:00");
    if(start===null)throw Error("Invalid heliacal start");
    for(const planet of ["Jupiter","Venus"] as const){
      for(const profile of ASTA_ATMOSPHERE_SCENARIOS.slice(0,2)){
        for(const event of ["evening-last","morning-first"] as const){
          const computed=nativeHeliacal(planet,event,start,city,profile);
          deepResults.push({
            locality:"Mumbai, Maharashtra",planet,event,
            atmosphere:profile,searchFromLocal:"2027-06-01T00:00",
            sourceAgreementStatus:"UNVERIFIED-NOT-CEREMONY-GRADE",
            ...computed
          });
        }
      }
    }
  }
}finally{sweClose(swe);}
const report={
  createdAt:new Date().toISOString(),
  wave:"3P",mode:deep?"native-heliacal-sensitivity-and-sky-geometry":"sky-geometry-only",
  status:"RESEARCH-ONLY-NOT-ASTA-CERTIFIED",
  safeForCeremonyFiltering:false,
  publisherAstaEquivalentToNativeHeliacal:false,
  ephemeris:"Swiss Ephemeris Moshier; UT positions, topocentric observer, Swiss azimuth/altitude conversion and refraction",
  observerParameters:"Eye height 0m assumption, curated core city coordinates, pressure/temperature/humidity/meteorological range as hypothetical scenarios",
  atmosphericScenarios:ASTA_ATMOSPHERE_SCENARIOS,
  notImplemented:[
    "Live measured weather, mountains/buildings horizon silhouette, aerosol optical depth and sky brightness",
    "Drik Panchang exact published local Guru/Shukra Asta convention not independently reproduced",
    "Ceremony ritual Shishutva/Vriddhatva and community-specific eligible dates",
    "Independent city-pinned minute sources and astronomical model accuracy confidence bounds"
  ],
  sourceReferenceCount:referenceRows.length,scenariosEvaluated,
  skippedLocations,geometryFailures,
  heliacalSearchCount:deepResults.length,
  geometryResults:results,
  nativeHeliacalResults:deepResults
};
mkdirSync("artifacts",{recursive:true});
writeFileSync(reportFile,JSON.stringify(report,null,2)+"\n");
console.log("[asta-3p] referenceRows="+referenceRows.length+" geometryScenarios="+
  scenariosEvaluated+" skippedCities="+skippedLocations+" errors="+geometryFailures+
  " nativeHeliacalAttempts="+deepResults.length);
for(const row of deepResults)console.log("[asta-3p-heliacal] "+row.planet+
  " "+row.event+" "+(row.atmosphere as VisibilityProfile).id+" "+
  row.status+" "+(row.instantLocalIst??"unresolved"));
console.log("[asta-3p] RESEARCH ONLY; source conventions unverified; report="+reportFile);
if(geometryFailures||!scenariosEvaluated)process.exitCode=1;
