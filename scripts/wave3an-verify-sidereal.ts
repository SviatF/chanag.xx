/** Wave 3AN: verify real JPL-vs-Swiss coordinate samples, NOT simulated astrology. */
import {readFileSync,writeFileSync} from "node:fs";
import {getJplSiderealCandidate,type JplSiderealObservation} from "../lib/jpl-v6-sidereal-candidate";
import {jplHalfTithiAtMs} from "../lib/jpl-v6-tithi-karana-canary";
import {getPinnedV6HalfTithiTable,JPL_V6_ROOTS_ASSET_SHA256} from "../lib/jpl-v6-pinned-data";
type JplRow={
  tags:string[];
  observation:JplSiderealObservation;
  independentJplPhaseDegrees:number;
  modelResidual:{jplMinusSwissTropicalSunDegrees:number;jplMinusSwissTropicalMoonDegrees:number;
    swissVsJplSiderealSunArcsec:number;swissVsJplSiderealMoonArcsec:number};
  approved:false;
};
type Report={wave:string;kernelSha256:string;jplRootsSha256:string;
 independentJplSiderealAyanamsaVerified:false;productionSwitchAllowed:false;
 ritualOrFestivalDatesCertified:false;sampledInstants:number;samples:JplRow[]};
type Baseline={jplRootsSha256:string;samples:Array<{atUtc:string;swiss:{
 tropicalSunDeg:number;tropicalMoonDeg:number;siderealSunDeg:number;siderealMoonDeg:number}}>} ;
const report=JSON.parse(readFileSync("artifacts/wave3an-jpl-sidereal-candidates.json","utf8")) as Report;
const baseline=JSON.parse(readFileSync("artifacts/wave3an-swiss-apparent-lahiri-baseline.json","utf8")) as Baseline;
if(report.wave!=="3AN"||report.productionSwitchAllowed!==false||
   report.independentJplSiderealAyanamsaVerified!==false||
   report.ritualOrFestivalDatesCertified!==false||
   report.jplRootsSha256!==JPL_V6_ROOTS_ASSET_SHA256||
   baseline.jplRootsSha256!==JPL_V6_ROOTS_ASSET_SHA256||
   report.sampledInstants!==report.samples.length||report.samples.length<12||
   baseline.samples.length!==report.samples.length)
  throw Error("Wave 3AN source safety or full-sample provenance failed");
const source=getPinnedV6HalfTithiTable();
const norm=(x:number)=>((x%360)+360)%360;
const sep=(x:number,y:number)=>Math.abs(((x-y+540)%360)-180);
let safe=0,boundary=0,sourceDifferences=0,phaseBoundaries=0;
const verified=[];
for(let i=0;i<report.samples.length;i++){
  const row=report.samples[i],ref=baseline.samples[i],x=row.observation;
  if(row.approved!==false||row.tags.length<1||row.tags.some(tag=>!tag.includes(":"))||
     x.atUtc!==ref.atUtc||x.kernelSha256!==report.kernelSha256)
    throw Error("JPL sample order and provenance mismatch "+i);
  const candidate=getJplSiderealCandidate(x);
  if(candidate.publicReleaseAllowed||candidate.fullyJplSiderealIndependentlyCertified||
     candidate.ritualRulesCertified)
    throw Error("Unapproved JPL sidereal coordinate promoted");
  if(sep(candidate.phaseDegrees,row.independentJplPhaseDegrees)>1e-8)
    throw Error("JPL Sun-Moon coordinate phase does not match independent Skyfield phase "+i);
  if(sep(norm(x.sunTropicalDeg-x.lahiriEffectiveDeg),candidate.sunSiderealDeg)>1e-9||
     sep(norm(x.moonTropicalDeg-x.lahiriEffectiveDeg),candidate.moonSiderealDeg)>1e-9)
    throw Error("Incorrect Lahiri subtraction "+i);
  if(!Number.isFinite(row.modelResidual.swissVsJplSiderealMoonArcsec)||
     !Number.isFinite(row.modelResidual.swissVsJplSiderealSunArcsec))
    throw Error("Missing Swiss residual "+i);
  const oldMoon=norm(ref.swiss.siderealMoonDeg);
  const oldSun=norm(ref.swiss.siderealSunDeg);
  const oldNakshatraIndex=Math.floor(oldMoon/(360/27));
  const oldYogaIndex=Math.floor(norm(oldMoon+oldSun)/(360/27));
  const changes={
    nakshatra:oldNakshatraIndex!==Math.floor(candidate.moonSiderealDeg/(360/27)),
    pada:Math.floor(oldMoon/(360/108))!==Math.floor(candidate.moonSiderealDeg/(360/108)),
    moonRashi:Math.floor(oldMoon/30)!==Math.floor(candidate.moonSiderealDeg/30),
    solarRashi:Math.floor(oldSun/30)!==Math.floor(candidate.sunSiderealDeg/30),
    yoga:oldYogaIndex!==Math.floor(candidate.yogaLongitudeDeg/(360/27))
  };
  const phaseRoot=jplHalfTithiAtMs(source,Date.parse(x.atUtc));
  const halfPhaseRootDiff=Math.min(candidate.phaseDegrees%6,6-(candidate.phaseDegrees%6));
  const nearJplRoot=halfPhaseRootDiff<0.02;
  if(!nearJplRoot&&phaseRoot.tithiIndex!==candidate.tithiIndex)
    throw Error("JPL root-vs-coordinate sunrise Tithi mismatch away from an exact root "+i);
  if(nearJplRoot)phaseBoundaries++;
  const changed=Object.values(changes).some(Boolean);
  if(changed)sourceDifferences++;
  if(candidate.nearBoundary.length||changed||nearJplRoot)boundary++;else safe++;
  verified.push({tags:row.tags,atUtc:x.atUtc,candidate,
    swiss:{tropicalSun:ref.swiss.tropicalSunDeg,tropicalMoon:ref.swiss.tropicalMoonDeg,
      siderealSun:oldSun,siderealMoon:oldMoon},
    changedVersusSwiss:changes,
    nearExactJplHalfTithiRoot:nearJplRoot,
    modelResidual:row.modelResidual,
    researchOnly:true});
}
const summary={wave:"3AN",sampledInstants:verified.length,
 awayFromBoundaryAndUnchanged:safe,boundaryOrModelSensitive:boundary,
 samplesWithSwissSiderealClassificationChanges:sourceDifferences,
 exactJplHalfTithiBoundarySamples:phaseBoundaries,
 jplKernelSha256:report.kernelSha256,jplRootAssetSha256:report.jplRootsSha256,
 labelDifferencesAutomatedApproved:0,
 fullJplAyanamsaMethodApproved:false,
 productionSwitchAllowed:false,
 sampleOnlyNotFullCityDateCoverage:true,verified};
writeFileSync("artifacts/wave3an-jpl-sidereal-verification.json",JSON.stringify(summary,null,2)+"\n");
console.log("[Wave3AN] "+JSON.stringify({instants:verified.length,safe,boundary,
  sourceDifferences,phaseBoundaries,published:false,approved:false}));
