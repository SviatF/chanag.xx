/**
 * Wave 3AD: Swiss/Moshier observation export consumed by the JPL DE440s
 * research comparison. Never used by live Panchang/Vrat/Festival/Muhurat.
 */
import {mkdirSync,writeFileSync} from "node:fs";
import {cityBySlug} from "../lib/cities";
import {compareSunriseConventions} from "../lib/sunrise-convention-differential";

const flagged=[["patna","2027-01-31"],["kanpur","2026-11-21"],["lucknow","2027-09-17"]] as const;
const vedhaDates=["2026-05-26","2027-10-25"] as const;
const vedhaCities=["delhi","kanpur","mumbai","chennai"] as const;

const boundaryCases=flagged.map(([slug,date])=>{
  const city=cityBySlug(slug);
  const a=compareSunriseConventions(city,date);
  const sunrise=a.defaultApparentUpperLimb.sunrise;
  const nearest=a.nearestTithiTransition;
  const after=nearest.jdUT<=sunrise.jdUT;
  const targetIndex=after?a.defaultApparentUpperLimb.tithiIndex:
    (a.defaultApparentUpperLimb.tithiIndex+1)%30;
  return {
    city:slug,date,lat:city.lat,lng:city.lng,
    sunriseUt:sunrise.utc, sunriseIst:sunrise.ist,
    nearestBoundaryUt:nearest.utc,nearestBoundaryIst:nearest.ist,
    targetEclipticElongationDeg:targetIndex*12,
    tithiIndexAtSunrise:a.defaultApparentUpperLimb.tithiIndex,
    swissTithiAtSunrise:a.defaultApparentUpperLimb.tithi,
    boundaryBeforeSunrise:after,
    swissSunriseMinusBoundarySeconds:Math.round((sunrise.jdUT-nearest.jdUT)*86400),
    swissMethod:"Swiss/Moshier sweCalcUt geocentric tropical and apparent upper-limb sunrise"
  };
});
const vedhaCases=vedhaDates.flatMap(date=>vedhaCities.map(slug=>{
  const city=cityBySlug(slug);
  const a=compareSunriseConventions(city,date);
  return {
    city:slug,date,lat:city.lat,lng:city.lng,
    sunriseUt:a.defaultApparentUpperLimb.sunrise.utc,
    arunodayaUt:a.defaultApparentUpperLimb.arunodaya96MinutesBeforeSunrise.utc,
    swissSunriseTithi:a.defaultApparentUpperLimb.tithi,
    swissArunodayaTithi:a.defaultApparentUpperLimb.arunodayaTithi,
    arunodayaConventionMinutes:96,ritualCertified:false
  };
}));
if(boundaryCases.length!==3||vedhaCases.length!==8)throw Error("Missing cases");
if(boundaryCases[0].swissTithiAtSunrise!=="Krishna Dashami"||
  boundaryCases[0].targetEclipticElongationDeg!==288)
  throw Error("Patna Swiss reference or 288-degree Tithi boundary changed");
for(const row of vedhaCases){
  if(!row.swissSunriseTithi.endsWith("Ekadashi")||
     !row.swissArunodayaTithi.endsWith("Dashami"))
    throw Error("Wave 3AB Vedha criterion changed at "+row.city+" "+row.date);
}
const payload={
  wave:"3AD",reference:"Wave3AC accepted Swiss/Moshier production UT math",
  boundaryCases,vedhaCases,
  externallyIndependentlyCertified:false,ritualApproved:false,
  readOnlyResearch:true
};
const path=process.argv.find(x=>x.startsWith("--report="))?.slice(9)||
  "artifacts/wave3ad-swiss-baseline.json";
mkdirSync("artifacts",{recursive:true});
writeFileSync(path,JSON.stringify(payload,null,2)+"\n");
console.log("[3ad-baseline] edgeCases="+boundaryCases.length+
  " vedha="+vedhaCases.length+" patnaTithi="+boundaryCases[0].swissTithiAtSunrise+
  " patnaTransition="+boundaryCases[0].nearestBoundaryIst);
