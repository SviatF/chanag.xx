import type {City} from "./cities";
import type {ChoghadiyaPeriod,Panchang,TimeWindow} from "./panchang";

type Fact={label:string;value:string;note?:string};

export type ChoghadiyaQualityContent={
  directAnswer:string;
  facts:Fact[];
  fingerprintTitle:string;
  fingerprintBody:string;
  daytimeTitle:string;
  daytimeBody:string;
  nightTitle:string;
  nightBody:string;
  rahuTitle:string;
  rahuBody:string;
};

function clockMinutes(value:string){
  const [h,m]=value.split(":").map(Number);
  return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:0;
}

function periodMinutes(period:ChoghadiyaPeriod){
  const start=clockMinutes(period.start)+period.startDayOffset*1440;
  const end=clockMinutes(period.end)+period.endDayOffset*1440;
  return Math.max(0,end-start);
}

function windowRange(window:TimeWindow){return {start:clockMinutes(window.start),end:clockMinutes(window.end)};}
function periodRange(period:ChoghadiyaPeriod){return {start:clockMinutes(period.start)+period.startDayOffset*1440,end:clockMinutes(period.end)+period.endDayOffset*1440};}
function overlapMinutes(a:{start:number;end:number},b:{start:number;end:number}){return Math.max(0,Math.min(a.end,b.end)-Math.max(a.start,b.start));}
function effectCounts(periods:readonly ChoghadiyaPeriod[]){
  return {
    good:periods.filter(p=>p.effect==="good").length,
    neutral:periods.filter(p=>p.effect==="neutral").length,
    bad:periods.filter(p=>p.effect==="bad").length,
  };
}
function sequence(periods:readonly ChoghadiyaPeriod[]){return periods.map(p=>`${p.name} ${p.start}–${p.end}`).join(" · ");}
function favorable(periods:readonly ChoghadiyaPeriod[]){return periods.filter(p=>p.effect==="good");}

export function buildChoghadiyaQualityContent(data:Panchang,city:City):ChoghadiyaQualityContent{
  const day=effectCounts(data.dayChoghadiya);
  const night=effectCounts(data.nightChoghadiya);
  const dayGood=favorable(data.dayChoghadiya);
  const nightGood=favorable(data.nightChoghadiya);
  const dayMinutes=Math.max(0,clockMinutes(data.sunset)-clockMinutes(data.sunrise));
  const avgDaySegment=data.dayChoghadiya.length?Math.round(data.dayChoghadiya.reduce((sum,p)=>sum+periodMinutes(p),0)/data.dayChoghadiya.length):0;
  const avgNightSegment=data.nightChoghadiya.length?Math.round(data.nightChoghadiya.reduce((sum,p)=>sum+periodMinutes(p),0)/data.nightChoghadiya.length):0;
  const rahu=windowRange(data.rahu);
  const rahuGoodOverlap=data.dayChoghadiya.filter(p=>p.effect==="good").reduce((sum,p)=>sum+overlapMinutes(rahu,periodRange(p)),0);
  const rahuStartOffset=Math.max(0,rahu.start-clockMinutes(data.sunrise));
  const rahuDayShare=dayMinutes?Math.round((rahuStartOffset/dayMinutes)*100):0;
  const firstGood=dayGood[0];
  const lastGood=dayGood[dayGood.length-1];
  const firstNightGood=nightGood[0];

  return {
    directAnswer:`On ${data.date}, ${city.name} has ${day.good} favorable daytime Choghadiya periods between sunrise ${data.sunrise} and sunset ${data.sunset}. The first favorable period is ${firstGood?`${firstGood.name} ${firstGood.start}–${firstGood.end}`:"not present"}; Rahu Kalam is ${data.rahu.start}–${data.rahu.end}.`,
    facts:[
      {label:"Day sequence",value:`${day.good} good · ${day.neutral} neutral · ${day.bad} difficult`,note:`8 periods · ~${avgDaySegment} min each`},
      {label:"Night sequence",value:`${night.good} good · ${night.neutral} neutral · ${night.bad} difficult`,note:`8 periods · ~${avgNightSegment} min each`},
      {label:"First favorable day period",value:firstGood?`${firstGood.name} ${firstGood.start}–${firstGood.end}`:"—"},
      {label:"Last favorable day period",value:lastGood?`${lastGood.name} ${lastGood.start}–${lastGood.end}`:"—"},
      {label:"Rahu overlap with favorable label",value:`${rahuGoodOverlap} min`,note:`Rahu ${data.rahu.start}–${data.rahu.end}`},
      {label:"Rahu position in daylight",value:`${rahuDayShare}% after sunrise`,note:`${rahuStartOffset} min from sunrise`},
    ],
    fingerprintTitle:`${city.name} Choghadiya fingerprint for ${data.date}`,
    fingerprintBody:`The exact daytime order is ${sequence(data.dayChoghadiya)}. That order is weekday-driven, while every clock boundary is rebuilt from ${city.name}'s ${data.sunrise} sunrise and ${data.sunset} sunset. Today's resulting profile contains ${day.good} favorable, ${day.neutral} neutral and ${day.bad} difficult daytime labels.`,
    daytimeTitle:`How today's daytime sequence is distributed`,
    daytimeBody:`The ${dayMinutes}-minute solar day is divided into eight local periods averaging about ${avgDaySegment} minutes. ${firstGood&&lastGood?`Favorable labels begin with ${firstGood.name} at ${firstGood.start} and the last favorable daytime label is ${lastGood.name}, ending ${lastGood.end}.`:`The calculated daytime sequence has no favorable-labelled period.`}`,
    nightTitle:`Night Choghadiya after ${city.name} sunset`,
    nightBody:`The night sequence is ${sequence(data.nightChoghadiya)}. It contains ${night.good} favorable, ${night.neutral} neutral and ${night.bad} difficult labels; ${firstNightGood?`the first favorable night period is ${firstNightGood.name} at ${firstNightGood.start}–${firstNightGood.end}.`:"no favorable night label appears in the calculated sequence."}`,
    rahuTitle:"Rahu Kalam against the Choghadiya grid",
    rahuBody:`Rahu Kalam runs ${data.rahu.start}–${data.rahu.end}, beginning ${rahuStartOffset} minutes after local sunrise. It overlaps ${rahuGoodOverlap} minutes of periods that otherwise carry a favorable Choghadiya label, which is why the Rahu interval and the Choghadiya table should be read together rather than as independent fixed-time lists.`,
  };
}
