/**
 * Wave 3AR: turn the *complete* Wave 3AQ three-year model disagreement
 * evidence into an explicit, reproducible review queue. Every mismatch
 * must occur near an actual global event; there is no silent auto-fix.
 */
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {createHash} from "node:crypto";
const years=[2026,2027,2028];
const families=["halfTithi","moonPada","nakshatra","yoga","moonRashi","sunRashi"];
const tiers=["0-30s","31-120s","121-300s","301-600s",">600s"];
const sha=x=>createHash("sha256").update(x).digest("hex");
const input=years.map(year=>JSON.parse(readFileSync(
  "artifacts/wave3aq-full-city-day-jpl-sunrise-"+year+".json","utf8")));
const totals=Object.fromEntries(families.map(f=>[f,0]));
const histogram=Object.fromEntries(families.map(f=>[f,Object.fromEntries(tiers.map(t=>[t,0]))]));
const grouped=new Map();
const examplesByDate=new Map();
let checked=0,risks=0,near10=0;
const sources=new Set();
for(let y=0;y<years.length;y++){
  const year=years[y],report=input[y];
  if(report.wave!=="3AQ"||report.year!==year||report.uniqueCities!==454||
     report.release?.publicEngineRemainsV5!==true||
     report.release?.festivalVratParanaMuhuratApproved!==false||
     report.release?.fullSwissModelComparisonAllDays!==false||
     report.modelDisagreementRowsStored!==report.capturedMismatchSamples.length||
     report.modelDisagreementRowsStored>=report.modelDisagreementRowsCappedAt||
     !/^[a-f0-9]{64}$/.test(report.allClassificationRowsSha256)||
     !/^[a-f0-9]{64}$/.test(report.allSensitivityAndMismatchRowsSha256))
    throw Error("Wave3AR invalid/incomplete Wave3AQ full-year source "+year);
  sources.add(report.source.combinedIdentity);
  risks+=report.nearJplBoundaryTwoMinutes;
  near10+=report.nearJplBoundaryTenMinutes;
  const annual=Object.fromEntries(families.map(f=>[f,0]));
  for(const row of report.capturedMismatchSamples){
    if(!families.includes(row.family)||typeof row.city!=="string"||
       !/^20(26|27|28)-\d{2}-\d{2}$/.test(row.date)||
       !row.date.startsWith(String(year))||
       Number.isInteger(row.v5Index)!==true||
       Number.isInteger(row.v6Index)!==true||
       row.v5Index===row.v6Index||
       !Number.isSafeInteger(row.closestJplBoundarySeconds)||
       row.closestJplBoundarySeconds<0)
      throw Error("Wave3AR malformed Swiss/JPL mismatch row "+year);
    // A disagreement >10min away from a JPL root cannot be explained by
    // the existing ±10min risk window; FAIL rather than quietly promote V6.
    if(row.closestJplBoundarySeconds>600)
      throw Error("Wave3AR model disagreement outside documented 10min root window "+JSON.stringify(row));
    const mod={halfTithi:60,moonPada:108,nakshatra:27,yoga:27,moonRashi:12,sunRashi:12}[row.family];
    const delta=((row.v5Index-row.v6Index+mod)%mod);
    if(delta!==1&&delta!==mod-1)
      throw Error("Nonadjacent V5/JPL model indices: "+JSON.stringify(row));
    totals[row.family]++;annual[row.family]++;checked++;
    const tier=row.closestJplBoundarySeconds<=30?"0-30s":
      row.closestJplBoundarySeconds<=120?"31-120s":
      row.closestJplBoundarySeconds<=300?"121-300s":
      row.closestJplBoundarySeconds<=600?"301-600s":">600s";
    histogram[row.family][tier]++;
    const dayKey=row.city+"|"+row.date;
    const group=grouped.get(dayKey)??{city:row.city,date:row.date,
      families:[],largestDistanceSeconds:0};
    group.families.push(row.family);
    group.largestDistanceSeconds=Math.max(group.largestDistanceSeconds,row.closestJplBoundarySeconds);
    grouped.set(dayKey,group);
    const dateKey=row.date+"|"+row.family;
    const dateGroup=examplesByDate.get(dateKey)??{date:row.date,family:row.family,
      affectedCityDays:0,maxDistanceSeconds:0,exampleCities:[]};
    dateGroup.affectedCityDays++;
    dateGroup.maxDistanceSeconds=Math.max(dateGroup.maxDistanceSeconds,row.closestJplBoundarySeconds);
    if(dateGroup.exampleCities.length<10)dateGroup.exampleCities.push(row.city);
    examplesByDate.set(dateKey,dateGroup);
  }
  for(const family of families){
    if(annual[family]!==report.disagreementByFamily[family])
      throw Error("Wave3AR full mismatch ledger differs from original SHA-backed annual totals "+year+" "+family);
  }
}
if(sources.size!==1||checked!==Object.values(totals).reduce((a,b)=>a+b,0)||
   checked<2000||grouped.size<1700)
  throw Error("Wave3AR incomplete three-year model disagreement review census");
let interFamily=0,missingPada=0;
for(const row of grouped.values()){
  row.families.sort();
  if(row.families.length>1)interFamily++;
  if(row.families.includes("nakshatra")&&!row.families.includes("moonPada"))missingPada++;
}
if(missingPada>0)
  throw Error("Nakshatra model difference without underlying Moon Pada event on same city-day");
const dates=[...examplesByDate.values()].sort((a,b)=>b.maxDistanceSeconds-a.maxDistanceSeconds||
  b.affectedCityDays-a.affectedCityDays||a.date.localeCompare(b.date));
const priority=dates.filter(x=>x.maxDistanceSeconds>120);
const report={
  wave:"3AR",sourceWave:"3AQ",status:"research-only",
  sourceIdentity:[...sources][0],sourceAnnualSHA:input.map(r=>({
    year:r.year,classificationSHA:r.allClassificationRowsSha256,
    sensitivitySHA:r.allSensitivityAndMismatchRowsSha256,
    rawReportSHA256:sha(JSON.stringify(r))
  })),
  totals:{
    exactCityDaysCensused:input.reduce((n,r)=>n+r.examinedCityDays,0),
    SwissV5CrossSourceComparedDays:input.reduce((n,r)=>n+r.checkedV5SwissSiderealAndLunarReferenceCityDays,0),
    mismatchFieldRows:checked,uniqueCityDaysWithOneOrMoreMismatches:grouped.size,
    multiFamilyCityDays:interFamily,within2minAllJplFamilyEvents:risks,
    within10minAllJplFamilyEvents:near10
  },
  mismatchesByFamily:totals,rootDistanceTierByFamily:histogram,
  referenceReviewQueues:{
    manualSolarRashiClusters:dates.filter(r=>r.family==="sunRashi"),
    >120s:priority,
    priorityClusters:priority.length,
    criticalCityDayExamples:[...grouped.values()].filter(x=>x.largestDistanceSeconds>120)
      .sort((a,b)=>b.largestDistanceSeconds-a.largestDistanceSeconds).slice(0,100)
  },
  cannotTreatDifferencesAsVerifiedErrors:true,
  independentlyApprovedLahiri:false,ritualOrFestivalApproval:false,
  publicV6ActivationAllowed:false
};
if(report.totals.exactCityDaysCensused!==497584)
  throw Error("Wave3AR incomplete physical sunrise census");
mkdirSync("artifacts",{recursive:true});
writeFileSync("artifacts/wave3ar-v5-jpl-2562-disagreement-triage.json",JSON.stringify(report,null,2)+"\n");
console.log("[Wave3AR TRIAGE] "+JSON.stringify({
  matchedOriginalRows:checked,uniqueCityDays:grouped.size,multiFamily:interFamily,
  mismatchesByFamily:totals,priorityReviewClusters:priority.length,
  solarRashiDayClusters:report.referenceReviewQueues.manualSolarRashiClusters.map(x=>({
    day:x.date,cities:x.affectedCityDays,maxDistanceSeconds:x.maxDistanceSeconds
  })),productionV5:true
}));
