import {readFileSync,writeFileSync} from "node:fs";
import {parseGcalNativeXml} from "../lib/gcal-native-xml.mjs";
const [file,city,year]=process.argv.slice(2);
const r=parseGcalNativeXml(readFileSync(file,"utf8"),{city,year:Number(year),lat:28.6139,lng:77.209});
writeFileSync("artifacts/gcal-native/validated-"+city+"-"+year+".json",JSON.stringify({
 source:r.source,summary:r.summary,
 landmarks:r.days.filter(x=>["2027-01-19","2027-01-20","2027-03-03","2027-03-04","2027-03-05"].includes(x.date))
},null,2));
console.log("[gcal-native] ",JSON.stringify(r.summary));
if(!r.days.find(x=>x.date==="2027-01-19"&&x.fast&&x.mahadvadasi.some(z=>z.includes("Trisprsa"))))throw Error("Known GCal Mahadvadasi missing");
