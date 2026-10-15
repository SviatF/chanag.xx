/**
 * Wave 3AN — exact JPL DE440s geocentric apparent Sun/Moon longitudes of
 * date, converted with one explicitly versioned effective Lahiri offset.
 * Numeric samples are generated off-line by Skyfield from SHA-pinned kernel.
 * The sidereal offset comes from Swiss/Moshier's UT-correct Lahiri mode:
 * this is a hybrid reference-frame convention, NOT a V6 ritual release.
 */
import {JPL_V6_ROOTS_ASSET_SHA256} from "./jpl-v6-pinned-data";
const DE440S_SHA="c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2";
const NAMES=[
 "Ashwini","Bharani","Krittika","Rohini","Mrigashirsha","Ardra","Punarvasu",
 "Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra",
 "Swati","Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha","Uttara Ashadha",
 "Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"
] as const;
const YOGAS=[
 "Vishkambha","Priti","Ayushman","Saubhagya","Shobhana","Atiganda",
 "Sukarma","Dhriti","Shula","Ganda","Vriddhi","Dhruva","Vyaghata",
 "Harshana","Vajra","Siddhi","Vyatipata","Variyana","Parigha",
 "Shiva","Siddha","Sadhya","Shubha","Shukla","Brahma","Indra","Vaidhriti"
] as const;
const RASHIS=["Mesha","Vrishabha","Mithuna","Karka","Simha","Kanya","Tula",
 "Vrishchika","Dhanu","Makara","Kumbha","Meena"] as const;
const STEP=360/27,PADA=STEP/4;
const DEGREE_WARNING=0.02; // 72 arcsec; review, never silently round to an arbitrary side
const norm=(n:number)=>((n%360)+360)%360;
const dist=(v:number,step:number)=>{
  const r=norm(v)%step;
  return Math.min(r,step-r);
};
const finite=(v:number,name:string)=>{
  if(!Number.isFinite(v))throw Error("Invalid JPL sidereal coordinate "+name);
  return v;
};
export type JplSiderealObservation={
  atUtc:string;
  sunTropicalDeg:number;
  moonTropicalDeg:number;
  lahiriEffectiveDeg:number;
  effectiveSunMoonOffsetDisagreementArcsec:number;
  kernelSha256:typeof DE440S_SHA;
  skyfieldVersion:"1.55";
  coordinateFrame:"geocentric apparent ecliptic and equinox of date";
  lunarRootAssetSha256:typeof JPL_V6_ROOTS_ASSET_SHA256;
  siderealOffsetSource:"Swiss/Moshier Lahiri UT, tropical-minus-sidereal solar longitude";
};
export function getJplSiderealCandidate(x:JplSiderealObservation){
  const at=Date.parse(x.atUtc);
  if(!Number.isFinite(at)||new Date(at).toISOString()!==x.atUtc||
     x.kernelSha256!==DE440S_SHA||x.skyfieldVersion!=="1.55"||
     x.lunarRootAssetSha256!==JPL_V6_ROOTS_ASSET_SHA256||
     x.coordinateFrame!=="geocentric apparent ecliptic and equinox of date"||
     x.siderealOffsetSource!=="Swiss/Moshier Lahiri UT, tropical-minus-sidereal solar longitude")
    throw Error("Wave3AN JPL sidereal provenance/date mismatch");
  const sun=norm(finite(x.sunTropicalDeg,"Sun")-finite(x.lahiriEffectiveDeg,"Lahiri"));
  const moon=norm(finite(x.moonTropicalDeg,"Moon")-x.lahiriEffectiveDeg);
  if(x.lahiriEffectiveDeg<20||x.lahiriEffectiveDeg>29||
     x.sunTropicalDeg<0||x.sunTropicalDeg>=360||
     x.moonTropicalDeg<0||x.moonTropicalDeg>=360)
    throw Error("Wave3AN impossible ecliptic longitude or Lahiri offset");
  const offsetDifference=finite(x.effectiveSunMoonOffsetDisagreementArcsec,"offset agreement");
  if(offsetDifference<0||offsetDifference>300)
    throw Error("Wave3AN inconsistent solar versus lunar Lahiri convention");
  const sum=norm(sun+moon);
  const elongation=norm(x.moonTropicalDeg-x.sunTropicalDeg);
  const nakIndex=Math.floor(moon/STEP);
  const yogaIndex=Math.floor(sum/STEP);
  const nakPada=Math.floor((moon%STEP)/PADA)+1;
  const risk=[
    ["Nakshatra",dist(moon,STEP)],
    ["Nakshatra Pada",dist(moon,PADA)],
    ["Moon Rashi",dist(moon,30)],
    ["Sun Rashi",dist(sun,30)],
    ["Yoga",dist(sum,STEP)]
  ] as const;
  const nearBoundary:Array<{field:string;angularDistanceDegrees:number}>=risk.filter(([,degrees])=>degrees<=DEGREE_WARNING)
    .map(([field,degrees])=>({field,angularDistanceDegrees:degrees}));
  // An offset mismatch between Swiss Sun/Moon can also make one label
  // ambiguous; treat it as a QA blocker, never choose an approval.
  if(offsetDifference>72)
    nearBoundary.push({field:"Lahiri cross-body offset",angularDistanceDegrees:offsetDifference/3600});
  return {
    atUtc:x.atUtc,source:"JPL DE440s geocentric apparent coordinates" as const,
    sunTropicalDeg:x.sunTropicalDeg,moonTropicalDeg:x.moonTropicalDeg,
    effectiveLahiriDeg:x.lahiriEffectiveDeg,sunSiderealDeg:sun,moonSiderealDeg:moon,
    moonRashi:RASHIS[Math.floor(moon/30)],
    solarRashi:RASHIS[Math.floor(sun/30)],
    nakshatra:NAMES[nakIndex],nakshatraPada:nakPada,
    yoga:YOGAS[yogaIndex],yogaLongitudeDeg:sum,
    tithiIndex:Math.floor(elongation/12),
    phaseDegrees:elongation,nearBoundary,
    sourceKernelSha256:x.kernelSha256,lunarRootAssetSha256:x.lunarRootAssetSha256,
    siderealOffsetConvention:x.siderealOffsetSource,
    fullyJplSiderealIndependentlyCertified:false as const,
    ritualRulesCertified:false as const,publicReleaseAllowed:false as const
  };
}
