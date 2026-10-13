import {mkdirSync,writeFileSync} from "node:fs";
import {MUHURAT_PANCHANG_SHARD_IDS} from "../generated/muhurat-panchang-shards";
import {findCityBySlug} from "../lib/cities";
import {loadMuhuratPrecomputedShard} from "../lib/muhurat-precomputed";
import {getMonthlyMuhurat,muhuratRules,buildRecommendedMuhuratWindows,type MuhuratRow} from "../lib/muhurat";
import {getMuhuratScoreEvidence} from "../lib/muhurat-score-evidence";
import {getVerifiedMuhuratClosure} from "../lib/verified-muhurat-closures";
import {hasCompleteMuhuratLunarBoundaries,boundMuhuratWindowsByLunarTransitions} from "../lib/muhurat-lunar-transitions";
const resultPath=process.argv.find(a=>a.startsWith("--report="))?.slice(9)??"artifacts/muhurat-truth-audit.json";
const asMinutes=(s:string)=>{const m=/^([01][0-9]|2[0-3]):([0-5][0-9])$/.exec(s);return m?Number(m[1])*60+Number(m[2]):null;};
const intersects=(a:{start:string,end:string},b:{start:string,end:string})=>{
  const a0=asMinutes(a.start),a1=asMinutes(a.end),b0=asMinutes(b.start),b1=asMinutes(b.end);
  return a0===null||a1===null||b0===null||b1===null?true:a0<b1&&b0<a1;
};
const failures:string[]=[];
const issues=(message:string)=>{failures.push(message);if(failures.length<=12)console.error("[muhurat-truth] FAIL "+message);};
let shards=0,datasets=0,screenedDates=0,windows=0,zeroWindowRows=0,grade100Rows=0,scoreEvidence=0;
let boundedRows=0,invalidSnapshotDays=0,lunarClippedWindows=0;
/** Keep independent ceremonial verification separate from engineering validity. */
const ritualCoverage={
  reviewedBlockedEventCityMonths:0,
  unreviewedEventCityMonths:0,
  unreviewedEventDateRows:0,
  unreviewedByEvent:{} as Record<string,{cityMonths:number;dateRows:number}>,
  riskExamples:[] as Array<{city:string;state:string;event:string;month:string;candidateCount:number;exampleDate:string;status:string}>,
  reviewedClosures:[] as Array<{city:string;month:string;reason:string;convention:string}>,
};
for(const event of Object.keys(muhuratRules))ritualCoverage.unreviewedByEvent[event]={cityMonths:0,dateRows:0};
const eventCounts:Record<string,{screened:number;withWindows:number;score100:number}>={};
for(const event of Object.keys(muhuratRules))eventCounts[event]={screened:0,withWindows:0,score100:0};
for(const id of MUHURAT_PANCHANG_SHARD_IDS){
  const shard=await loadMuhuratPrecomputedShard(id);
  if(!shard){issues(`Missing or undecodable shard ${id}`);continue;}
  shards++;
  const [year,month]=id.split("-").map(Number);
  for(const key of shard.targets){
    const slug=key.split("|")[0],city=findCityBySlug(slug);
    if(!city){issues(`Unknown city ${key}`);continue;}
    datasets++;
    for(const day of shard.entries[key]??[]){
      if(!hasCompleteMuhuratLunarBoundaries(day)){
        invalidSnapshotDays++;
        issues(key+" "+day.date+": invalid V3 Tithi/Nakshatra end");
      }
    }
    for(const event of Object.keys(muhuratRules)){
      const {rows}=await getMonthlyMuhurat(event,year,month,city);
      const rule=muhuratRules[event];
      const closure=getVerifiedMuhuratClosure(event,year,month,city);
      if(closure){
        ritualCoverage.reviewedBlockedEventCityMonths++;
        ritualCoverage.reviewedClosures.push({city:city.slug,month:id,reason:closure.reason,convention:closure.convention});
        if(rows.length)issues(key+" "+event+": reviewed ceremony closure still contains recommended dates");
      }else{
        ritualCoverage.unreviewedEventCityMonths++;
        ritualCoverage.unreviewedEventDateRows+=rows.length;
        ritualCoverage.unreviewedByEvent[event].cityMonths++;
        ritualCoverage.unreviewedByEvent[event].dateRows+=rows.length;
        if(event==="wedding"&&year===2026&&month>=8&&month<=10&&city.state==="Maharashtra"&&rows.length){
          ritualCoverage.riskExamples.push({
            city:city.slug,state:city.state,event,month:id,candidateCount:rows.length,
            exampleDate:rows[0].date,
            status:"Maharashtra customary Chaturmas review required; city-specific eligibility unverified"
          });
        }
      }
      let lastScore=Infinity;
      for(const row of rows){
        screenedDates++;eventCounts[event].screened++;
        if(row.lunarEvidenceStatus!=="lunar-bounded")
          issues(key+" "+event+" "+row.date+": lunar evidence not bounded: "+row.lunarEvidenceStatus);
        else boundedRows++;
        const originalWindows=buildRecommendedMuhuratWindows(row.data);
        const clipped=boundMuhuratWindowsByLunarTransitions(row.data,originalWindows);
        if(clipped.status!=="lunar-bounded"||JSON.stringify(clipped.windows)!==JSON.stringify(row.recommendedWindows))
          issues(key+" "+event+" "+row.date+": windows differ from lunar-clipped sources");
        lunarClippedWindows+=originalWindows.length-clipped.windows.length;
        if(!rule.goodTithi.includes(row.data.tithi)||!rule.goodNakshatra.includes(row.data.nakshatra))
          issues(`${key} ${event} ${row.date}: failed sunrise Tithi/Nakshatra eligibility`);
        if(row.planning.score>lastScore)issues(`${key} ${event} ${row.date}: ranking order broken`);
        lastScore=row.planning.score;
        let evidence;
        try{evidence=getMuhuratScoreEvidence(row);scoreEvidence++;}
        catch(e){issues(`${key} ${event} ${row.date}: ${String(e)}`);}
        if(evidence&&evidence.score>100)issues(`${key}: score over 100`);
        if(!row.recommendedWindows.length){
          zeroWindowRows++;
          if(row.planning.score!==0||row.planning.grade!=="Limited")
            issues(`${key} ${event} ${row.date}: positive score despite no windows`);
        }else eventCounts[event].withWindows++;
        if(row.planning.score===100){grade100Rows++;eventCounts[event].score100++;}
        for(const w of row.recommendedWindows){
          windows++;
          const st=asMinutes(w.start),end=asMinutes(w.end);
          if(clipped.limitMinutes===null||end===null||end>clipped.limitMinutes)
            issues(key+" "+event+" "+row.date+": clock window crosses lunar end");
          if(st===null||end===null||end-st<15||end<=st)issues(`${key} ${event} ${row.date}: invalid reference window ${w.start}-${w.end}`);
          for(const avoid of row.avoidWindows){
            if(intersects(w,avoid.window))issues(`${key} ${event} ${row.date}: window overlaps ${avoid.label}`);
          }
          for(const source of w.sources){
            const matchingSources=source==="Abhijit Muhurat"
              ?(row.data.abhijit?[row.data.abhijit]:[])
              :row.data.dayChoghadiya.filter(p=>`${p.name} Choghadiya`===source&&p.effect==="good");
            if(!matchingSources.length){issues(`${key} ${event} ${row.date}: unsupported source ${source}`);continue;}
            // The first and last daytime Choghadiya can share a name.
            // Match ANY actual occurrence; .find() can mistake a valid
            // evening Amrit/Labh period for an invalid morning extension.
            const contained=matchingSources.some(sourceWindow=>{
              const srcStart=asMinutes(sourceWindow.start),srcEnd=asMinutes(sourceWindow.end);
              return st!==null&&end!==null&&srcStart!==null&&srcEnd!==null&&st>=srcStart&&end<=srcEnd;
            });
            if(!contained)issues(`${key} ${event} ${row.date}: window exceeds all occurrences of source ${source}`);
          }
        }
      }
    }
  }
}
const report={createdAt:new Date().toISOString(),scope:"48 V3 shards × 338 city-months × 6 profiles: lunar ending dates, clock clipping, exclusions, scores and ranking",shards,datasets,screenedDates,boundedRows,invalidSnapshotDays,lunarClippedWindows,windows,zeroWindowRows,grade100Rows,scoreEvidence,eventCounts,ritualCoverage,failures:failures.slice(0,300),limitations:[
  "V3 stores explicit dated lunar transitions and clipped daytime windows, not fully certified ritual Muhurat.",
  "The 0–100 score measures planning-window availability, not a probability or complete Panchang Shuddhi.",
  "Full ritual eligibility still needs ceremony-specific Vedic exclusions, ascendant and local traditions.",
  "All event-city-months except explicitly reviewed closures remain UNVERIFIED for complete religious eligibility. Do not claim a complete external correctness audit."
]};
mkdirSync(resultPath.split("/").slice(0,-1).join("/")||".",{recursive:true});
writeFileSync(resultPath,JSON.stringify(report,null,2));
console.log(`[muhurat-truth] ${shards} shards; ${datasets} city-months; ${screenedDates} sunrise-screened event dates; ${windows} timing references; ${scoreEvidence} score reconstructions; ${zeroWindowRows} zero-window dates; ${grade100Rows} rows at score 100; issues=${failures.length}`);
console.log(`[muhurat-truth] eventCounts=${JSON.stringify(eventCounts)}`);
console.log(`[muhurat-truth] ritual coverage: reviewed=${ritualCoverage.reviewedBlockedEventCityMonths}; unreviewed city-month-events=${ritualCoverage.unreviewedEventCityMonths}; unreviewed date rows=${ritualCoverage.unreviewedEventDateRows}; Maharashtra candidate risk=${ritualCoverage.riskExamples.length}`);
console.log(`[muhurat-truth] report=${resultPath}`);
if(failures.length)process.exitCode=1;
