import type {Panchang} from "./panchang";
import {addIsoDays,formatDatedTime} from "./india-time";

/**
 * Astronomical Tithi overlap ONLY. This does not independently calculate
 * a ceremonial Lagna, Vaishnava/Smarta fasting preference or Puja Shuddhi.
 * Uses two consecutive local sunrise records, so a first post-sunrise
 * transition is never presumed to last through an entire evening.
 */
export type FestivalNightKind="janmashtami"|"diwali";
export type TithiOverlapStatus="full"|"partial"|"none"|"unverified";
export type FestivalNightEvidence={
  kind:FestivalNightKind;
  label:string;
  period:{start:string;end:string;startDate:string;endDate:string};
  tithiLabel:string;
  tithiEnd:string|null;
  overlap:{start:string;end:string;startDate:string;endDate:string}|null;
  status:TithiOverlapStatus;
  explanation:string;
};
type Interval={start:number;end:number};
type DatedInterval={start:string;end:string;startDate:string;endDate:string};
const clock=(value:string):number|null=>{
  const m=/^([01][0-9]|2[0-3]):([0-5][0-9])$/.exec(value);
  return m?Number(m[1])*60+Number(m[2]):null;
};
function minutes(value:string,eventDate:string|null|undefined,baseDate:string):number|null{
  const time=clock(value);
  if(time===null||!eventDate||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(eventDate))return null;
  const days=(Date.parse(eventDate+"T00:00:00Z")-Date.parse(baseDate+"T00:00:00Z"))/86400000;
  if(!Number.isInteger(days)||days<0||days>2)return null;
  return days*1440+time;
}
function instant(value:number,baseDate:string):{time:string;date:string}{
  const whole=Math.round(value);
  const d=Math.floor(whole/1440);
  const m=((whole%1440)+1440)%1440;
  const time=`${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`;
  return {time,date:addIsoDays(baseDate,d)};
}
function readable(interval:Interval,baseDate:string):DatedInterval{
  const a=instant(interval.start,baseDate),b=instant(interval.end,baseDate);
  return {start:a.time,end:b.time,startDate:a.date,endDate:b.date};
}
const tithiByKind:Record<FestivalNightKind,{paksha:"Krishna";tithi:"Ashtami"}|{paksha:"Krishna";tithi:"Amavasya"}>={
  janmashtami:{paksha:"Krishna",tithi:"Ashtami"},
  diwali:{paksha:"Krishna",tithi:"Amavasya"}
};
function targetActive(data:Panchang,kind:FestivalNightKind):boolean{
  const target=tithiByKind[kind];
  return data.paksha===target.paksha&&data.tithi===target.tithi;
}
function immediatelyBefore(data:Panchang,kind:FestivalNightKind):boolean{
  return kind==="janmashtami"
    ?data.paksha==="Krishna"&&data.tithi==="Saptami"
    :data.paksha==="Krishna"&&data.tithi==="Chaturdashi";
}
function lunarSpan(kind:FestivalNightKind,data:Panchang,next:Panchang):Interval|null{
  const sunrise=clock(data.sunrise);
  if(sunrise===null)return null;
  if(targetActive(data,kind)){
    const end=minutes(data.tithiEnd,data.tithiEndDate,data.date);
    return end!==null&&end>sunrise?{start:sunrise,end}:null;
  }
  if(!immediatelyBefore(data,kind)||!targetActive(next,kind)||next.date!==addIsoDays(data.date,1))
    return null;
  const start=minutes(data.tithiEnd,data.tithiEndDate,data.date);
  const end=minutes(next.tithiEnd,next.tithiEndDate,data.date);
  return start!==null&&end!==null&&end>start&&start<1440?{start,end}:null;
}
function nightWindow(kind:FestivalNightKind,data:Panchang):Interval|null{
  const sunset=clock(data.sunset);
  const last=data.nightChoghadiya.at(-1);
  const nextRise=last&&last.endDayOffset===1?clock(last.end):null;
  if(sunset===null||nextRise===null||data.nightChoghadiya.length!==8||data.nightChoghadiya[0].start!==data.sunset)return null;
  const end=1440+nextRise;
  const length=end-sunset;
  if(length<480||length>960)return null;
  if(kind==="diwali")return {start:sunset,end:sunset+length/5};
  const center=(sunset+end)/2;
  const muhurta=length/15;
  return {start:center-muhurta/2,end:center+muhurta/2};
}
export function festivalNightEligibility(kind:FestivalNightKind,data:Panchang,next:Panchang):FestivalNightEvidence|null{
  if(next.date!==addIsoDays(data.date,1))return null;
  const window=nightWindow(kind,data);
  if(!window)return null;
  const period=readable(window,data.date);
  const lunar=lunarSpan(kind,data,next);
  const tithiLabel=kind==="diwali"?"Krishna Amavasya":"Krishna Ashtami";
  const label=kind==="diwali"?"Pradosh Kaal":"Nishita Kaal";
  if(!lunar){
    return {kind,label,period,tithiLabel,tithiEnd:null,overlap:null,status:"unverified",
      explanation:`${label} is ${formatDatedTime(period.start,period.startDate,data.date)}–${formatDatedTime(period.end,period.endDate,data.date)}. The exact ${tithiLabel} interval could not be established from the two sunrise records.`};
  }
  const endClock=instant(lunar.end,data.date);
  const tithiEnd=formatDatedTime(endClock.time,endClock.date,data.date);
  const intersection:Interval={start:Math.max(window.start,lunar.start),end:Math.min(window.end,lunar.end)};
  const overlap=intersection.end>intersection.start?readable(intersection,data.date):null;
  const status:TithiOverlapStatus=!overlap?"none":intersection.start<=window.start&&intersection.end>=window.end?"full":"partial";
  const context=`${label} runs from ${formatDatedTime(period.start,period.startDate,data.date)} to ${formatDatedTime(period.end,period.endDate,data.date)}; ${tithiLabel} ends at ${tithiEnd}.`;
  const result=status==="full"
    ?` ${tithiLabel} covers the entire calculated ${label}.`
    :status==="partial"&&overlap
      ?` Their confirmed overlap is ${formatDatedTime(overlap.start,overlap.startDate,data.date)}–${formatDatedTime(overlap.end,overlap.endDate,data.date)}.`
      :` ${tithiLabel} does not overlap this ${label}.`;
  return {kind,label,period,tithiLabel,tithiEnd,overlap,status,explanation:context+result};
}
