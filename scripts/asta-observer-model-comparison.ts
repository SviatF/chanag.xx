/**
 * PANCHVANI Wave 3O: controlled local Asta MODEL COMPARISON ONLY.
 *
 * Evaluates three mathematical angular-separation conventions against recorded
 * published boundary snapshots. None implements verified planetary first/last
 * visual observability (Sun altitude, extinction, horizon, atmosphere, magnitude,
 * observer physiology) or an astrologer's ceremony-specific Asta convention.
 * No calibration values are promoted to wedding or Griha Pravesh.
 */
import {mkdirSync,writeFileSync} from "node:fs";
import {createDefaultSweData} from "@typescriptify/sweph/dist/types.js";
import {sweCalc,sweClose,sweSetTopo} from "@typescriptify/sweph/dist/sweph.js";
import {
  SE_SUN,SE_VENUS,SE_JUPITER,SEFLG_MOSEPH,SEFLG_EQUATORIAL,SEFLG_TOPOCTR,SEFLG_SPEED
} from "@typescriptify/sweph/dist/constants.js";
import {coreCities} from "../lib/cities";
import {indiaLocalPartsFromJulian} from "../lib/india-time";
import {
  ASTA_MODEL_IDS,astaThresholdDegrees,eclipticLongitudeSeparationDegrees,
  greatCircleSeparationDegrees,localIstDateTimeToJulian,
  nearestAstaResidualMinutes,scanAstaModelCrossings,type AstaModelId
} from "../lib/asta-model-benchmark";
import {astaEvidenceLedger} from "../tests/fixtures/asta-evidence-ledger";

const reportPath=process.argv.find(arg=>arg.startsWith("--report="))?.slice(9)||
  "artifacts/asta-observer-model-comparison.json";
const swe=createDefaultSweData();
const samples=astaEvidenceLedger.filter(x=>x.precision==="minute");
const reportCases:Array<Record<string,unknown>>=[];
let computed=0,unresolved=0,modelFailures=0,unavailableCoordinates=0;

function localIso(jd:number){
  const value=indiaLocalPartsFromJulian(jd);
  return value.date+"T"+value.time;
}
function modelMargin(jd:number,model:AstaModelId,planet:"Jupiter"|"Venus"){
  const bodyId=planet==="Jupiter"?SE_JUPITER:SE_VENUS;
  const topoFlag=model==="topocentric-spherical"?SEFLG_TOPOCTR:0;
  const flags=SEFLG_MOSEPH|topoFlag;
  const angular=model==="geocentric-ecliptic-longitude"
    ?(()=>{
      const sun=sweCalc(swe,jd,SE_SUN,flags).xx;
      const body=sweCalc(swe,jd,bodyId,flags).xx;
      return eclipticLongitudeSeparationDegrees(sun[0],body[0]);
    })()
    :(()=>{
      const sun=sweCalc(swe,jd,SE_SUN,flags|SEFLG_EQUATORIAL).xx;
      const body=sweCalc(swe,jd,bodyId,flags|SEFLG_EQUATORIAL).xx;
      return greatCircleSeparationDegrees(sun[0],sun[1],body[0],body[1]);
    })();
  // Geocentric ecliptic longitude speed only identifies Venus direction;
  // it is NOT the local visual-observability criterion.
  const velocity=sweCalc(swe,jd,bodyId,SEFLG_MOSEPH|SEFLG_SPEED).xx[3];
  if(!Number.isFinite(velocity)||!Number.isFinite(angular))throw Error("Non-finite model state");
  const retrograde=velocity<0;
  return {marginDegrees:angular-astaThresholdDegrees(planet,retrograde),retrograde};
}
try{
  for(const reference of samples){
    // The repository currently has geolocation-specific snapshots without
    // reproducible pinned-city sources; they remain explicitly untrusted.
    const city=coreCities.find(x=>x.name+", "+x.state===reference.locality||
      (x.slug==="delhi"&&reference.locality==="New Delhi"));
    const base={
      locality:reference.locality,planet:reference.planet,year:reference.year,
      source:reference.url,publisher:reference.publisher,
      referenceMethod:reference.method,sourceLocationMode:reference.sourceLocationMode,
      referenceStartLocal:reference.startLocal,referenceEndLocal:reference.endLocal,
      sameCityIndependentMinuteSourceCount:0,
      safeForCeremonyFiltering:false
    };
    if(!city){
      unavailableCoordinates++;
      reportCases.push({...base,status:"coordinates-not-in-curated-core-cities",models:[]});
      continue;
    }
    const start=localIstDateTimeToJulian(reference.startLocal);
    const end=localIstDateTimeToJulian(reference.endLocal);
    if(start===null||end===null||end<=start)throw Error("Corrupt source ledger boundary");
    sweSetTopo(swe,city.lng,city.lat,0);
    const methods=[];
    for(const model of ASTA_MODEL_IDS){
      try{
        // The scan covers a generous period before and after both published
        // endpoints; it does not change the publisher reference to fit a model.
        const events=scanAstaModelCrossings(
          jd=>modelMargin(jd,model,reference.planet),
          start-45,end+45,0.25
        );
        const enterResidualMinutes=nearestAstaResidualMinutes(start,"enter",events);
        const exitResidualMinutes=nearestAstaResidualMinutes(end,"exit",events);
        const bracketProblems=events.filter(e=>e.quality!=="continuous-threshold");
        if(enterResidualMinutes===null||exitResidualMinutes===null||bracketProblems.length)unresolved++;
        const closest=(kind:"enter"|"exit",to:number)=>{
          const rows=events.filter(e=>e.kind===kind&&e.quality==="continuous-threshold")
            .sort((a,b)=>Math.abs(a.julian-to)-Math.abs(b.julian-to));
          return rows[0]?localIso(rows[0].julian):null;
        };
        methods.push({
          model,enterCalculatedLocal:closest("enter",start),
          exitCalculatedLocal:closest("exit",end),
          enterResidualMinutes,exitResidualMinutes,
          stationSwitchUnresolved:bracketProblems.length,
          crossingCount:events.length,
          // "low residual" is descriptive ONLY, never a model acceptance.
          within30MinutesOfSingleSource:
            enterResidualMinutes!==null&&exitResidualMinutes!==null&&
            Math.abs(enterResidualMinutes)<=30&&Math.abs(exitResidualMinutes)<=30,
          methodVerifiedAgainstIndependentObserverSources:false
        });
        computed++;
      }catch(e){
        modelFailures++;
        methods.push({model,error:String(e),methodVerifiedAgainstIndependentObserverSources:false});
      }
    }
    reportCases.push({...base,status:"exploratory-single-source-comparison",
      observer:{city:city.slug,lat:city.lat,lng:city.lng,heightMeters:0},
      models:methods
    });
  }
}finally{sweClose(swe);}

const report={
  createdAt:new Date().toISOString(),
  stage:"Wave 3O / MODEL SENSITIVITY, NOT OBSERVABILITY CALIBRATION",
  safeForCeremonyFiltering:false,
  status:"UNVERIFIED-NO-RITUAL-RULES-ENABLED",
  computation:"Swiss Ephemeris Moshier; geocentric equatorial spherical, geocentric ecliptic longitude, observer topocentric equatorial spherical",
  atmosphereAndHorizonModel:"NOT IMPLEMENTED",
  comparisonType:"Published snapshots against geometric thresholds (Jupiter 11°, Venus direct 10° / retrograde 8°)",
  referenceCount:samples.length,computedModels:computed,modelFailures,
  unresolvedModelComparisons:unresolved,skippedWithoutCuratedCoordinates:unavailableCoordinates,
  cases:reportCases,
  limitations:[
    "Topocentric spherical angular separation is NOT the same thing as location-sensitive heliacal visibility; local sky extinction and the solar horizon have not been modeled.",
    "Publisher city selection may be cookie/geolocation-dependent; geolocated-snapshot references are not pinned-city independent verification.",
    "Jupiter and Venus planetary Asta religious traditions can use different angular, visibility, Shishutva and Vriddhatva conventions.",
    "Venus retrograde station switches can create threshold jumps; they are recorded as unresolved instead of solved to spurious minute precision.",
    "A 30-minute residual with one publisher does not establish validation or authority to exclude a date.",
    "No current 2025–27 core-city/planet group has two reproducibly pinned independent minute sources; see Wave 3N report.",
    "No changes to production Wedding/Griha Pravesh calendars or ceremony eligibility can be inferred from this report."
  ]
};
mkdirSync("artifacts",{recursive:true});
writeFileSync(reportPath,JSON.stringify(report,null,2)+"\n");
console.log("[asta-3o] references="+samples.length+" computed="+computed+
  " skipped-no-coordinates="+unavailableCoordinates+" model-failures="+modelFailures+
  " unresolved="+unresolved);
for(const item of reportCases){
  const c=item as Record<string,unknown>;
  if(!Array.isArray(c.models))continue;
  for(const model of c.models){
    const r=model as Record<string,unknown>;
    console.log("[asta-3o] "+c.locality+" "+c.planet+" "+r.model+
      " enterDelta="+r.enterResidualMinutes+" exitDelta="+r.exitResidualMinutes+
      " stationUnresolved="+r.stationSwitchUnresolved);
  }
}
console.log("[asta-3o] RESEARCH ONLY; no model may enable ritual filtering; report="+reportPath);
// This job validates that all available core-city models execute, not that they
// agree with the publisher or that location-sensitive combustion is solved.
if(modelFailures||!computed)process.exitCode=1;
