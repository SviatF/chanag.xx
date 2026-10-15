/**
 * Wave 3AG — exact V6 side-by-side correctness for real Daily/Vrat/Muhurat.
 * Authenticated static JPL 6° table loaded from checked-in source; the very
 * same bytes are generated from DE440s in CI and verified before any build.
 * This is evidence ONLY. It must not change live routes or ritual approvals.
 */
import {mkdirSync,writeFileSync} from "node:fs";
import {cityBySlug} from "../lib/cities";
import {getPinnedV6HalfTithiTable} from "../lib/jpl-v6-pinned-data";
import {
  compareDailyPanchangV6Canary,
  compareYearlyVratV6Canary,
  compareMuhuratMonthV6Canary
} from "../lib/jpl-v6-crossfamily-canary";

const out=process.argv.find(x=>x.startsWith("--report="))?.slice(9)||
  "artifacts/wave3ag-v6-daily-vrat-muhurat-canary.json";
const table=getPinnedV6HalfTithiTable();
const dates=[
  ["patna","2027-01-31"],
  ["kanpur","2026-11-21"],
  ["delhi","2026-06-30"],
  ["lucknow","2027-09-17"],
  ["chennai","2026-12-09"],
  ["mumbai","2027-03-17"],
  ["kolkata","2027-10-25"],
  ["bengaluru","2028-01-31"]
] as const;
const daily=[];
for(const [slug,date] of dates){
  const r=await compareDailyPanchangV6Canary(date,cityBySlug(slug),table);
  daily.push(r);
  console.log("[3ag-daily] "+date+" "+slug+
    " Swiss="+r.v5.tithi+" JPL="+r.v6.paksha+" "+r.v6.tithi+
    " Karana="+r.v5.karana+"/"+r.v6.karana+
    " TithiEnd="+r.v5.tithiEnd+"/"+r.v6.tithiEnd+
    " modelFlip="+r.differences.tithi);
}
for(const [slug,date,expectedV5,expectedV6] of [
  ["patna","2027-01-31","Krishna Dashami","Krishna Navami"],
  ["kanpur","2026-11-21","Shukla Dwadashi","Shukla Ekadashi"],
  ["delhi","2026-06-30","Krishna Pratipada","Shukla Purnima"]
] as const){
  const item=daily.find(r=>r.city===slug&&r.date===date);
  if(!item||item.v5.tithi!==expectedV5||
    item.v6.paksha+" "+item.v6.tithi!==expectedV6)
    throw Error("Known third-ephemeris lunar conflict changed "+slug+" "+date);
}
const yearlyCases=[
  ["kanpur",2026],
  ["patna",2027],
  ["delhi",2026],
  ["mumbai",2027],
  ["chennai",2028]
] as const;
const vrat=[];
for(const [slug,year] of yearlyCases){
  const r=compareYearlyVratV6Canary(year,cityBySlug(slug),table);
  vrat.push(r);
  console.log("[3ag-vrat] "+slug+" "+year+" "+
    r.families.map(f=>f.slug+":old="+f.v5Total+",v6="+f.v6Total+
      ",lost="+f.v5Only.length+",new="+f.v6Only.length).join(" "));
}
const muhuratCases=[
  ["kanpur",2026,11],
  ["patna",2027,1],
  ["delhi",2026,6],
  ["lucknow",2027,9],
  ["mumbai",2027,3],
  ["chennai",2028,1]
] as const;
const muhurat=[];
for(const [slug,year,month] of muhuratCases){
  const r=await compareMuhuratMonthV6Canary(year,month,cityBySlug(slug),table);
  muhurat.push(r);
  console.log("[3ag-muhurat] "+slug+" "+year+"-"+month+
    " days="+r.days+" TithiChanged="+r.tithiChanged+
    " KaranaChanged="+r.karanaChanged+
    " TithiEndChanged="+r.tithiEndChanged+
    " KaranaEndChanged="+r.karanaEndChanged+
    " committed="+r.committedSnapshotPresent);
}
const byKey=(slug:string,y:number,m:number)=>
  muhurat.find(v=>v.city===slug&&v.year===y&&v.month===m);
for(const [slug,date,expectedV6] of [
  ["kanpur","2026-11-21","Ekadashi"],
  ["patna","2027-01-31","Navami"],
  ["delhi","2026-06-30","Purnima"]
] as const){
  const year=Number(date.slice(0,4)),month=Number(date.slice(5,7));
  const record=byKey(slug,year,month)?.details.find(d=>d.date===date);
  if(!record||record.v6.tithi!==expectedV6||!record.tithiChanged)
    throw Error("Muhurat canary failed to identify JPL Tithi flip "+slug+" "+date);
}
const noApprovals=[
  ...daily.map(r=>r.v6.productionChangeAllowed===false&&r.v6.ritualFastingCertified===false),
  ...vrat.map(r=>r.calendarSwitchAllowed===false&&r.families.every(f=>!f.traditionFastCertified&&!f.paranaCertified)),
  ...muhurat.map(r=>r.scoreOrWeddingValidityApproved===false&&r.canaryOnly===true),
];
if(noApprovals.some(v=>!v))throw Error("Research-only release safety boundary violated");
const report={
  wave:"3AG",
  source:"JPL DE440s numerically generated 6° phase transitions; committed SHA-pinned asset",
  kernelSha256:table.kernelSha256,
  transitionCount:table.halfTithiBoundaryCount,
  epoch:"UTC milliseconds",
  observers:"Existing Swiss apparent upper-limb rise at zero elevation, 1013.25 hPa / 25°C",
  sampledDailyCities:daily.length,
  daily,
  sampledVratCityYears:vrat.length,
  vrat,
  sampledMuhuratCityMonths:muhurat.length,
  muhurat,
  gates:{
    productionAstronomicalEngineStillV5:true,
    independentV6TithiKaranaAndPreviousNewMoonCanary:true,
    fullSiderealAndTraditionalRitualParityEstablished:false,
    pastAndFutureV5ShardsRegenerated:false,
    userFacingRitualDateSwitchApproved:false,
    independentGCalSmartaVaishnavaParanaApproval:false,
    nextAction:"Versioned V6 all-family canary with JPL table integrated into live computations, global period-dependent sidereal review, full V5 shard regeneration & zero-stale cache migration"
  }
};
mkdirSync("artifacts",{recursive:true});
writeFileSync(out,JSON.stringify(report,null,2)+"\n");
console.log("[3ag-summary] globalRoots="+table.halfTithiBoundaryCount+
  " daily="+daily.length+" vratCityYears="+vrat.length+
  " muhuratCityMonths="+muhurat.length+
  " report="+out+" productionUnchanged=true");
