/**
 * Wave 3V reproducibility: compare the original V4 precompute snapshots with
 * the regenerated V5 UT-correct ones. CI artifact is ONLY an audit report;
 * generated application data are committed as source, never uploaded as artifacts.
 */
import {readFileSync,readdirSync,mkdirSync,writeFileSync} from "node:fs";
import {gunzipSync} from "node:zlib";
const before=process.argv.find(x=>x.startsWith("--before="))?.slice(9);
const after=process.argv.find(x=>x.startsWith("--after="))?.slice(8);
if(!before||!after)throw Error("Need explicit --before and --after directories");
const shardFile=/^muhurat-panchang-shard-\d{4}-\d{2}\.ts$/;
const oldFiles=readdirSync(before).filter(x=>shardFile.test(x)).sort();
const newFiles=readdirSync(after).filter(x=>shardFile.test(x)).sort();
if(oldFiles.length!==48||JSON.stringify(oldFiles)!==JSON.stringify(newFiles))
  throw Error("Incomplete or mismatched precompute shard set");
const load=(dir,file)=>{
  const source=readFileSync(dir+"/"+file,"utf8");
  const match=source.match(/^export default (.+);\s*$/);
  if(!match)throw Error("Bad shard source "+file);
  return JSON.parse(gunzipSync(Buffer.from(JSON.parse(match[1]),"base64")).toString("utf8"));
};
const fields=[
  "date","tithi","tithiEnd","tithiEndDate","nakshatra","nakshatraEnd",
  "nakshatraEndDate","karana","karanaEnd","karanaEndDate",
  "rahu","yamaganda","gulika","abhijit","dayChoghadiya"
];
const solarOnly=new Set(["rahu","yamaganda","gulika","abhijit","dayChoghadiya"]);
const counts=Object.fromEntries(fields.map(x=>[x,0]));
let targets=0,rows=0,changedRows=0,changedTithiRows=0,solarDifferences=0;
const examples=[];
const tithiNameChanges=[];
const nakshatraNameChanges=[];
const karanaNameChanges=[];
const lunarEndDayChanges=[];
let versionMismatch=0;
for(const file of oldFiles){
  const old=load(before,file),next=load(after,file);
  if(old.version!==4||next.version!==5)versionMismatch++;
  if(old.shardId!==next.shardId||JSON.stringify(old.targets)!==JSON.stringify(next.targets))
    throw Error("Changed target selection "+file);
  for(const key of old.targets){
    const former=old.entries[key],fresh=next.entries[key];
    if(!Array.isArray(former)||!Array.isArray(fresh)||former.length!==fresh.length)
      throw Error("Dropped calendar dates in "+key);
    targets++;
    for(let d=0;d<former.length;d++){
      rows++;
      const a=former[d],b=fresh[d];
      const changes=fields.filter(field=>JSON.stringify(a[field])!==JSON.stringify(b[field]));
      if(changes.length){
        changedRows++;
        if(changes.includes("tithi")){
          changedTithiRows++;
          tithiNameChanges.push({cityMonth:key,date:a.date,before:a.tithi,after:b.tithi});
        }
        if(changes.includes("nakshatra"))nakshatraNameChanges.push({cityMonth:key,date:a.date,before:a.nakshatra,after:b.nakshatra});
        if(changes.includes("karana"))karanaNameChanges.push({cityMonth:key,date:a.date,before:a.karana,after:b.karana});
        if(changes.includes("tithiEndDate")||changes.includes("nakshatraEndDate"))lunarEndDayChanges.push({cityMonth:key,date:a.date,tithiEndDateBefore:a.tithiEndDate,tithiEndDateAfter:b.tithiEndDate,nakshatraEndDateBefore:a.nakshatraEndDate,nakshatraEndDateAfter:b.nakshatraEndDate});
        if(changes.some(field=>solarOnly.has(field)))solarDifferences++;
        for(const field of changes)counts[field]++;
        if(examples.length<50)examples.push({
          key,day:a.date,changedFields:changes,
          tithiBefore:a.tithi,tithiAfter:b.tithi,
          tithiEndBefore:a.tithiEnd,tithiEndAfter:b.tithiEnd,
          karanaBefore:a.karana,karanaAfter:b.karana
        });
      }
    }
  }
}
const report={
  wave:"3V",migration:"ET-as-UT to sweCalcUt",generatedAt:new Date().toISOString(),
  beforeSnapshotVersion:4,afterSnapshotVersion:5,
  shards:oldFiles.length,cityMonths:targets,sourceCalendarDays:rows,
  changedRows,changedTithiRows,unchangedRows:rows-changedRows,
  changedFieldCounts:counts,
  solarOnlyFieldDifferences:solarDifferences,
  stagedSourceChangesCommitted:false,
  sourceAstronomicalAccuracyEstablishedByCI:false,
  independentCeremonyEligibilityValidated:false,
  examples,tithiNameChanges,nakshatraNameChanges,karanaNameChanges,lunarEndDayChanges,verificationErrors:[]
};
mkdirSync("artifacts",{recursive:true});
writeFileSync("artifacts/wave3v-shard-migration-diff.json",JSON.stringify(report,null,2)+"\n");
console.log("[3v-migration] V4→V5 "+oldFiles.length+" shards / "+targets+
  " cityMonths / "+rows+" dates");
console.log("[3v-migration] changes="+changedRows+" TithiNames="+changedTithiRows+
  " solar-geometry-differences="+solarDifferences);
console.log("[3v-migration] fieldCounts="+JSON.stringify(counts));
console.log("[3v-migration] examples="+JSON.stringify(examples.slice(0,4)));
console.log("[3v-migration] TITHI NAME DIFFS="+JSON.stringify(tithiNameChanges));
console.log("[3v-migration] NAKSHATRA NAME DIFFS="+JSON.stringify(nakshatraNameChanges));
console.log("[3v-migration] KARANA NAME DIFFS="+JSON.stringify(karanaNameChanges));
if(versionMismatch||targets!==338||!changedRows||solarDifferences)
  throw Error("Precompute migration correctness gate failed; do NOT commit shards");
