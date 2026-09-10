import { City } from "./cities";
import { getPanchang, Panchang, TimeWindow } from "./panchang";

export type MuhuratEvent="wedding"|"griha-pravesh"|"vehicle-purchase"|"naming-ceremony"|"business-opening"|"gold-purchase";
type Rule={title:string;goodTithi:string[];goodNakshatra:string[];note:string};

export type RecommendedMuhuratWindow={
  start:string;
  end:string;
  sources:string[];
};

export type MuhuratRow={
  date:string;
  data:Panchang;
  recommendedWindows:RecommendedMuhuratWindow[];
  avoidWindows:{label:string;window:TimeWindow}[];
  reasons:string[];
};

export const muhuratRules:Record<string,Rule>={
  "wedding":{title:"Wedding Muhurat",goodTithi:["Dvitiya","Tritiya","Panchami","Saptami","Ekadashi","Trayodashi"],goodNakshatra:["Rohini","Mrigashirsha","Magha","Uttara Phalguni","Hasta","Swati","Anuradha","Mula","Uttara Ashadha","Uttara Bhadrapada","Revati"],note:"Candidate dates combine traditionally preferred Tithi and Nakshatra. Recommended local reference windows use favorable Panchang periods with Rahu Kalam, Yamaganda and Gulika removed."},
  "griha-pravesh":{title:"Griha Pravesh Muhurat",goodTithi:["Dvitiya","Tritiya","Panchami","Saptami","Dashami","Ekadashi","Trayodashi"],goodNakshatra:["Rohini","Mrigashirsha","Uttara Phalguni","Chitra","Anuradha","Uttara Ashadha","Dhanishta","Shatabhisha","Uttara Bhadrapada","Revati"],note:"Home-entry candidates prioritize stable Tithi and Nakshatra combinations. Recommended local reference windows exclude Rahu Kalam, Yamaganda and Gulika."},
  "vehicle-purchase":{title:"Vehicle Purchase Muhurat",goodTithi:["Dvitiya","Tritiya","Panchami","Saptami","Dashami","Ekadashi","Trayodashi"],goodNakshatra:["Ashwini","Rohini","Mrigashirsha","Punarvasu","Pushya","Hasta","Chitra","Swati","Anuradha","Shravana","Dhanishta","Revati"],note:"Vehicle-purchase candidates emphasize travel-friendly Nakshatras. Recommended local reference windows exclude Rahu Kalam, Yamaganda and Gulika."},
  "naming-ceremony":{title:"Naming Ceremony Muhurat",goodTithi:["Dvitiya","Tritiya","Panchami","Saptami","Dashami","Ekadashi","Trayodashi"],goodNakshatra:["Ashwini","Rohini","Mrigashirsha","Punarvasu","Pushya","Hasta","Chitra","Swati","Anuradha","Shravana","Revati"],note:"Naming candidates use traditionally favorable lunar combinations. Recommended local reference windows use favorable Panchang periods after local inauspicious periods are removed."},
  "business-opening":{title:"Business Opening Muhurat",goodTithi:["Dvitiya","Tritiya","Panchami","Saptami","Dashami","Ekadashi","Trayodashi"],goodNakshatra:["Ashwini","Rohini","Mrigashirsha","Pushya","Hasta","Chitra","Swati","Anuradha","Shravana","Dhanishta","Revati"],note:"Business-opening candidates favor initiation-oriented combinations. Recommended local reference windows exclude Rahu Kalam, Yamaganda and Gulika."},
  "gold-purchase":{title:"Gold Purchase Muhurat",goodTithi:["Dvitiya","Tritiya","Panchami","Saptami","Dashami","Ekadashi","Trayodashi"],goodNakshatra:["Rohini","Mrigashirsha","Pushya","Hasta","Chitra","Swati","Anuradha","Shravana","Dhanishta","Revati"],note:"Gold-purchase candidates emphasize prosperity-oriented combinations. Recommended local reference windows use favorable Panchang periods after local inauspicious periods are removed."}
};

function toMinutes(value:string){
  const [hours,minutes]=value.split(":").map(Number);
  return hours*60+minutes;
}

function formatMinutes(value:number){
  const minutes=((Math.round(value)%1440)+1440)%1440;
  return `${String(Math.floor(minutes/60)).padStart(2,"0")}:${String(minutes%60).padStart(2,"0")}`;
}

type Range={start:number;end:number};

function mergeRanges(ranges:Range[]){
  const sorted=ranges
    .filter(range=>Number.isFinite(range.start)&&Number.isFinite(range.end)&&range.end>range.start)
    .sort((a,b)=>a.start-b.start);
  const merged:Range[]=[];
  for(const range of sorted){
    const last=merged[merged.length-1];
    if(last&&range.start<=last.end)last.end=Math.max(last.end,range.end);
    else merged.push({...range});
  }
  return merged;
}

function subtractRanges(source:Range,blocked:Range[]){
  let chunks=[source];
  for(const block of blocked){
    const next:Range[]=[];
    for(const chunk of chunks){
      if(block.end<=chunk.start||block.start>=chunk.end){
        next.push(chunk);
        continue;
      }
      if(block.start>chunk.start)next.push({start:chunk.start,end:Math.min(block.start,chunk.end)});
      if(block.end<chunk.end)next.push({start:Math.max(block.end,chunk.start),end:chunk.end});
    }
    chunks=next;
  }
  return chunks.filter(chunk=>chunk.end-chunk.start>=15);
}

export function buildRecommendedMuhuratWindows(data:Panchang):RecommendedMuhuratWindow[]{
  const blocked=mergeRanges([data.rahu,data.yamaganda,data.gulika].map(window=>({start:toMinutes(window.start),end:toMinutes(window.end)})));
  const candidates:{range:Range;source:string}[]=[];

  if(data.abhijit){
    candidates.push({range:{start:toMinutes(data.abhijit.start),end:toMinutes(data.abhijit.end)},source:"Abhijit Muhurat"});
  }

  for(const period of data.dayChoghadiya){
    if(period.effect!=="good")continue;
    candidates.push({range:{start:toMinutes(period.start),end:toMinutes(period.end)},source:`${period.name} Choghadiya`});
  }

  const windows:{range:Range;source:string}[]=[];
  for(const candidate of candidates){
    for(const range of subtractRanges(candidate.range,blocked))windows.push({range,source:candidate.source});
  }

  const grouped=new Map<string,RecommendedMuhuratWindow>();
  for(const item of windows){
    const start=formatMinutes(item.range.start),end=formatMinutes(item.range.end);
    const key=`${start}-${end}`;
    const existing=grouped.get(key);
    if(existing){
      if(!existing.sources.includes(item.source))existing.sources.push(item.source);
    }else grouped.set(key,{start,end,sources:[item.source]});
  }

  return [...grouped.values()].sort((a,b)=>toMinutes(a.start)-toMinutes(b.start));
}

export async function getMonthlyMuhurat(event:string,year:number,month:number,city:City){
  const rule=muhuratRules[event];
  if(!rule)throw new Error(`Unsupported Muhurat event: ${event}`);
  const days=new Date(Date.UTC(year,month,0)).getUTCDate();
  const rows:MuhuratRow[]=[];
  for(let d=1;d<=days;d++){
    const date=new Date(Date.UTC(year,month-1,d,6));
    const data=await getPanchang(date,city);
    if(!rule.goodTithi.includes(data.tithi)||!rule.goodNakshatra.includes(data.nakshatra))continue;
    rows.push({
      date:data.date,
      data,
      recommendedWindows:buildRecommendedMuhuratWindows(data),
      avoidWindows:[
        {label:"Rahu Kalam",window:data.rahu},
        {label:"Yamaganda",window:data.yamaganda},
        {label:"Gulika",window:data.gulika}
      ],
      reasons:[`${data.tithi} Tithi`,`${data.nakshatra} Nakshatra`]
    });
  }
  return {rule,rows};
}
