import {mkdirSync,writeFileSync} from "node:fs";
import {MUHURAT_PANCHANG_SHARD_IDS} from "../generated/muhurat-panchang-shards";
import {findCityBySlug} from "../lib/cities";
import {loadMuhuratPrecomputedShard} from "../lib/muhurat-precomputed";
import {getMonthlyMuhurat,muhuratRules,type MuhuratRow} from "../lib/muhurat";
import {getMuhuratScoreEvidence} from "../lib/muhurat-score-evidence";
const resultPath=process.argv.find(a=>a.startsWith("--report="))?.slice(9)??"artifacts/muhurat-truth-audit.json";
const asMinutes=(s:string)=>{const m=/^([01][0-9]|2[0-3]):([0-5][0-9])$/.exec(s);return m?Number(m[1])*60+Number(m[2]):null;};
const intersects=(a:{start:string,end:string},b:{start:string,end:string})=>{
  const a0=asMinutes(a.start),a1=asMinutes(a.end),b0=asMinutes(b.start),b1=asMinutes(b.end);
  return a0===null||a1===null||b0===null||b1===null?true:a0<b1&&b0<a1;
};
const failures:string[]=[];
const issues=(message:string)=>{failures.push(message);if(failures.length<=12)console.error("[muhurat-truth] FAIL "+message);};
let shards=0,datasets=0,screenedDates=0,windows=0,zeroWindowRows=0,grade100Rows=0,scoreEvidence=0;
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
    for(const event of Object.keys(muhuratRules)){
      const {rows}=await getMonthlyMuhurat(event,year,month,city);
      const rule=muhuratRules[event];
      let lastScore=Infinity;
      for(const row of rows){
        screenedDates++;eventCounts[event].screened++;
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
          if(st===null||end===null||end-st<15||end<=st)issues(`${key} ${event} ${row.date}: invalid reference window ${w.start}-${w.end}`);
          for(const avoid of row.avoidWindows){
            if(intersects(w,avoid.window))issues(`${key} ${event} ${row.date}: window overlaps ${avoid.label}`);
          }
          for(const source of w.sources){
            const sourceWindow=source==="Abhijit Muhurat"?row.data.abhijit:row.data.dayChoghadiya.find(p=>`${p.name} Choghadiya`===source&&p.effect==="good");
            if(!sourceWindow){issues(`${key} ${event} ${row.date}: unsupported source ${source}`);continue;}
            const srcStart=asMinutes(sourceWindow.start),srcEnd=asMinutes(sourceWindow.end);
            if(st===null||end===null||srcStart===null||srcEnd===null||st<srcStart||end>srcEnd)
              issues(`${key} ${event} ${row.date}: window exceeds source ${source}`);
          }
        }
      }
    }
  }
}
const report={createdAt:new Date().toISOString(),scope:"all committed 48 month shards × 338 city-month targets × 6 event profiles; checks sunrise lunar eligibility + daytime source/block exclusions + score consistency",shards,datasets,screenedDates,windows,zeroWindowRows,grade100Rows,scoreEvidence,eventCounts,failures:failures.slice(0,300),limitations:[
  "Snapshot version 2 includes sunrise Tithi and Nakshatra but not their ending time.",
  "Passing daytime exclusion checks does not certify Tithi/Nakshatra remain active during a suggested window.",
  "The 0–100 score measures planning-window availability, not a probability or complete Panchang Shuddhi.",
  "Full ritual eligibility needs ceremony-specific Vedic exclusions, ascendant, local traditions and lunar transitions."
]};
mkdirSync(resultPath.split("/").slice(0,-1).join("/")||".",{recursive:true});
writeFileSync(resultPath,JSON.stringify(report,null,2));
console.log(`[muhurat-truth] ${shards} shards; ${datasets} city-months; ${screenedDates} sunrise-screened event dates; ${windows} timing references; ${scoreEvidence} score reconstructions; ${zeroWindowRows} zero-window dates; ${grade100Rows} rows at score 100; issues=${failures.length}`);
console.log(`[muhurat-truth] eventCounts=${JSON.stringify(eventCounts)}`);
console.log(`[muhurat-truth] report=${resultPath}`);
if(failures.length)process.exitCode=1;
