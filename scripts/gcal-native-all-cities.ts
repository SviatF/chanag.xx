import {spawnSync} from "node:child_process";
import {existsSync,readFileSync,unlinkSync,mkdirSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {supportedCities} from "../lib/cities";
import {calculateVratCalendar} from "../lib/vrat";
import {parseGcalNativeXml} from "../lib/gcal-native-xml.mjs";
const [indexStr,shardsStr]=process.argv.slice(2);
const shard=Number(indexStr),shards=Number(shardsStr);
if(!Number.isInteger(shard)||!Number.isInteger(shards)||shards!==8||shard<0||shard>=shards)throw Error("Bad shard index");
if(supportedCities.length<450||supportedCities.length!==new Set(supportedCities.map(c=>c.slug)).size)throw Error("Unexpected supported city registry");
const exe=resolve("original-gcal/gcal.exe"),dir=resolve("artifacts/gcal-native");
mkdirSync(dir,{recursive:true});
const pairs=[],errors=[];
function coord(v,latitude){
 const min=Math.round(Math.abs(v)*60),degrees=Math.floor(min/60),minute=min%60;
 return String(degrees)+(latitude?(v>=0?"N":"S"):(v>=0?"E":"W"))+String(minute).padStart(2,"0");
}
const local=supportedCities.filter((c,i)=>i%shards===shard);
for(const city of local){
 for(const year of [2026,2027]){
  const key=city.slug+"/"+year;
  try{
   const file=resolve(dir,"run-"+city.slug+"-"+year+".xml");
   const position=coord(city.lat,true)+";"+coord(city.lng,false);
   const executed=spawnSync(exe,["-R","calendar","-L",position,"-N",city.name,"-TZ","5:30",
     "-SG","1-1-"+year,"-EC","365","-O",file],{windowsHide:true,timeout:90000,stdio:"ignore"});
   if(executed.error)throw executed.error;
   if(!existsSync(file))throw Error("Native calendar not created; exit="+String(executed.status));
   const parsed=parseGcalNativeXml(readFileSync(file,"utf8"),{city:city.slug,year,lat:city.lat,lng:city.lng});
   unlinkSync(file);
   const sunrise=calculateVratCalendar("ekadashi",year,city).map(x=>x.date);
   const sourceFasts=parsed.days.filter(x=>x.fast).map(x=>x.date);
   const dawn=new Set(sunrise),real=new Set(sourceFasts);
   pairs.push({city:city.slug,year,coordinates:{input:[city.lat,city.lng],gcal:[parsed.source.lat,parsed.source.lng]},
     summary:parsed.summary,sunriseOnlyCount:sunrise.length,
     gcalFastNotSunriseOnly:sourceFasts.filter(x=>!dawn.has(x)),
     sunriseOnlyNotGcalFast:sunrise.filter(x=>!real.has(x)),
     special:parsed.days.filter(x=>x.fast||x.parana||x.mahadvadasi.length).map(x=>({
      date:x.date,tithi:x.tithi,arunodaya:x.arunodaya,fast:x.fast,
      mahadvadasi:x.mahadvadasi,parana:x.parana
     })),certifiedRitualDates:false});
  }catch(e){errors.push({city:city.slug,year,error:String(e)});}
 }
}
const result={source:"original-GCal-11c-Windows-executable",gitBlob:"1d20f6e0caf29b6293157d258d02287e4edf0481",
 sourceVersionParityWithBuild5Unverified:true,registryCities:supportedCities.length,shard,totalShards:shards,
 citiesInShard:local.length,expectedPairs:local.length*2,processedPairs:pairs.length,
 calendarDaysExpected:local.length*730,provenance:"coordinates rounded to nearest original GCal arcminute; timezone IST",
 researchOnly:true,fullMahadvadasiRuleEngineCertified:false,allHariVasaraRulesCertified:false,
 allParanaRulesCertified:false,errors,pairs};
writeFileSync(resolve(dir,"shard-"+shard+".json"),JSON.stringify(result,null,2)+"\n");
console.log("[gcal-original-binary] shard="+shard+" completed="+pairs.length+"/"+result.expectedPairs+" issues="+errors.length);
for(const e of errors.slice(0,30))console.error("[gcal-original-binary] "+JSON.stringify(e));
if(errors.length||pairs.length!==result.expectedPairs)process.exitCode=1;
