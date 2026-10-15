/** Wave 3AQ — deterministic final gate over three independently executed years. */
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
const years=[2026,2027,2028];
const families=["halfTithi","moonPada","nakshatra","yoga","moonRashi","sunRashi"];
const annual=years.map(year=>JSON.parse(readFileSync(
  "artifacts/wave3aq-full-city-day-jpl-sunrise-"+year+".json","utf8")));
const verifiedCatalogs=new Set();
let total=0,controls=0,near2=0,near10=0,sourceCompared=0,distinctCities=0;
const sourceDiffs=Object.fromEntries(families.map(f=>[f,0]));
const sourceNear2=Object.fromEntries(families.map(f=>[f,0]));
const sourceNear10=Object.fromEntries(families.map(f=>[f,0]));
for(let i=0;i<years.length;i++){
  const year=years[i],r=annual[i],days=(Date.UTC(year+1,0,1)-Date.UTC(year,0,1))/86400000;
  const expected=454*days;
  if(r.wave!=="3AQ"||r.schema!==1||r.year!==year||r.uniqueCities!==454||
    r.expectedCityDays!==expected||r.examinedCityDays!==expected||
    r.exactSwissUpperLimbSunrises!==expected||r.daysPerCity!==days||
    r.crossInterfaceExactSunriseChecks!==454||
    r.NOAAApproximationUsed!==false||
    r.fullJplLunarAndSiderealClassificationCoverage!==true||
    r.checkedV5SwissSiderealAndLunarReferenceCityDays<1000||
    r.source?.lunarRootSha256!=="0cab0c6accaf2e2125fe417bf4a4f14a22453a4013a1609dce6dce84ec44142e"||
    r.release?.publicEngineRemainsV5!==true||
    r.release?.productionV6ActivationDenied!==true||
    r.release?.fullSwissModelComparisonAllDays!==false||
    r.release?.festivalVratParanaMuhuratApproved!==false||
    !/^[a-f0-9]{64}$/.test(r.allClassificationRowsSha256))
    throw Error("Missing/incomplete/unsafe independent year "+year+" JPL 454-city census");
  if(r.annual[String(year)]?.cityDays!==expected||
     r.annual[String(year)]?.physicalSunrises!==expected)
    throw Error("Missing exact sunrise by-year evidence "+year);
  verifiedCatalogs.add(r.source.combinedIdentity);
  total+=r.examinedCityDays;controls+=r.crossInterfaceExactSunriseChecks;
  near2+=r.nearJplBoundaryTwoMinutes;near10+=r.nearJplBoundaryTenMinutes;
  sourceCompared+=r.checkedV5SwissSiderealAndLunarReferenceCityDays;
  distinctCities=Math.max(distinctCities,r.uniqueCities);
  for(const f of families){
    if(!Number.isSafeInteger(r.disagreementByFamily[f])||
       !Number.isSafeInteger(r.countsNear2MinutesByFamily[f])||
       !Number.isSafeInteger(r.countsNear10MinutesByFamily[f]))
      throw Error("Missing bounded root/mismatch count "+year+" "+f);
    sourceDiffs[f]+=r.disagreementByFamily[f];
    sourceNear2[f]+=r.countsNear2MinutesByFamily[f];
    sourceNear10[f]+=r.countsNear10MinutesByFamily[f];
  }
}
if(verifiedCatalogs.size!==1||total!==497584||controls!==454*3||
   sourceCompared>=total||sourceCompared<3000||near10<near2)
  throw Error("Incomplete or mixed-source three-year global JPL sunrise coverage");
const summary={
  wave:"3AQ",status:"research-only",years,uniqueCities:distinctCities,
  totalCityDays:total,exactSwissSunrises:total,
  sourceCatalogIdentity:[...verifiedCatalogs][0],
  unfilteredSameSourceInterfaceChecks:controls,
  SwissV5SourceClassificationComparisons:sourceCompared,
  V5ComparedAllDays:false,
  rootWithinTwoMinutesAnyFamily:near2,
  rootWithinTenMinutesAnyFamily:near10,
  nearTwoByFamily:sourceNear2,nearTenByFamily:sourceNear10,
  V5vsJplDisagreementsByFamily:sourceDiffs,
  yearlyEvidence:annual.map(r=>({year:r.year,cityDays:r.examinedCityDays,
    classificationSHA:r.allClassificationRowsSha256,
    boundarySHA:r.allSensitivityAndMismatchRowsSha256,
    sourceCompared:r.checkedV5SwissSiderealAndLunarReferenceCityDays,
    riskCount:r.nearJplBoundaryTwoMinutes})),
  exactPhysicalSunriseAtEveryCityDay:true,
  JplAllFamilySunriseStateAtEveryCityDay:true,
  independentlyCertifiedLahiri:false,regionalRitualApproved:false,
  publicV6Released:false
};
mkdirSync("artifacts",{recursive:true});
writeFileSync("artifacts/wave3aq-497584-exact-jpl-sunrise-summary.json",JSON.stringify(summary,null,2)+"\n");
console.log("[Wave3AQ COMPLETE] "+JSON.stringify({cities:distinctCities,
  allCityDays:total,sunrises:total,SwissV5Comparisons:sourceCompared,
  near2,near10,modelDisagreements:sourceDiffs,productionV5:true}));
