"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Moon, Sun } from "lucide-react";
import { Panchang, TimeWindow, formatWindow } from "@/lib/panchang";

function toMinutes(value:string){
  const [h,m]=value.split(":").map(Number);
  return h*60+m;
}
function angleFromTime(value:string){return toMinutes(value)/1440*360;}
function segmentStyle(window:TimeWindow|null,color:string):CSSProperties{
  if(!window) return {};
  const start=angleFromTime(window.start);
  const end=angleFromTime(window.end);
  return {background:`conic-gradient(transparent 0deg ${start}deg, ${color} ${start}deg ${end}deg, transparent ${end}deg 360deg)`};
}
function markerStyle(value:string):CSSProperties{
  return {"--marker-angle":`${angleFromTime(value)}deg`} as CSSProperties;
}
function indiaDateString(){
  return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
}
function indiaMinutes(){
  const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date());
  const get=(type:string)=>Number(parts.find(x=>x.type===type)?.value||0);
  return get("hour")*60+get("minute");
}
function inWindow(minutes:number,window:TimeWindow|null){
  if(!window)return false;
  const start=toMinutes(window.start),end=toMinutes(window.end);
  return minutes>=start&&minutes<end;
}

export default function DayWheel({data}:{data:Panchang}) {
  const [nowMinutes,setNowMinutes]=useState<number|null>(null);
  useEffect(()=>{
    const update=()=>setNowMinutes(indiaMinutes());
    update();
    const id=window.setInterval(update,60000);
    return ()=>window.clearInterval(id);
  },[]);

  const isToday=data.date===indiaDateString();
  const dayBg=useMemo(()=>{
    const sunrise=angleFromTime(data.sunrise),sunset=angleFromTime(data.sunset);
    return `conic-gradient(#0e1010 0deg ${sunrise}deg,#2a2115 ${sunrise}deg ${sunset}deg,#0d0f10 ${sunset}deg 360deg)`;
  },[data.sunrise,data.sunset]);

  const active=useMemo(()=>{
    if(nowMinutes===null||!isToday)return null;
    const chog=[...data.dayChoghadiya,...data.nightChoghadiya].find(p=>{
      let start=toMinutes(p.start)+p.startDayOffset*1440;
      let end=toMinutes(p.end)+p.endDayOffset*1440;
      let current=nowMinutes;
      if(current<toMinutes(data.sunrise)&&start>=1440) current+=1440;
      return current>=start&&current<end;
    });
    if(inWindow(nowMinutes,data.rahu)) return {label:"Rahu Kalam",tone:"bad"};
    if(inWindow(nowMinutes,data.abhijit)) return {label:"Abhijit Muhurat",tone:"good"};
    if(chog) return {label:`${chog.name} Choghadiya`,tone:chog.effect};
    return {label:"Current time",tone:"neutral"};
  },[nowMinutes,isToday,data]);

  return <div className="wheel-wrap" aria-label="Live visual day timeline">
    <div className="wheel" style={{background:dayBg}}>
      <div className="wheel-ring ring-a"/>
      <div className="wheel-ring ring-b"/>
      <div className="wheel-segment seg-yama" style={segmentStyle(data.yamaganda,"rgba(117,84,47,.72)")}/>
      <div className="wheel-segment seg-gulika" style={segmentStyle(data.gulika,"rgba(113,82,42,.50)")}/>
      <div className="wheel-segment seg-rahu" style={segmentStyle(data.rahu,"rgba(166,65,49,.86)")}/>
      {data.abhijit ? <div className="wheel-segment seg-abhijit" style={segmentStyle(data.abhijit,"rgba(209,177,77,.88)")}/> : null}

      <div className="wheel-marker sunrise-marker" style={markerStyle(data.sunrise)} title={"Sunrise "+data.sunrise}><span><Sun size={12}/></span></div>
      <div className="wheel-marker sunset-marker" style={markerStyle(data.sunset)} title={"Sunset "+data.sunset}><span><Sun size={12}/></span></div>

      {isToday&&nowMinutes!==null?<div className="now-hand" style={{"--now-angle":`${nowMinutes/1440*360}deg`} as CSSProperties}><i/></div>:null}

      <div className="wheel-label top"><Moon size={16}/><span>Night</span></div>
      <div className="wheel-label right danger"><span>Rahu Kalam</span><small>{formatWindow(data.rahu)}</small></div>
      <div className="wheel-label bottom good"><span>{data.abhijit?"Abhijit Muhurat":"No Abhijit today"}</span><small>{formatWindow(data.abhijit)}</small></div>
      <div className="wheel-label left"><span>Sunrise</span><small>{data.sunrise}</small></div>

      <div className="wheel-center">
        <div className="moon-phase" style={{"--illumination":`${data.moonIllumination}%`} as CSSProperties}><Moon size={26}/></div>
        <strong>{data.weekday}</strong>
        <span>{data.date}</span>
        <small>{data.paksha} Paksha · {data.tithi}</small>
        <em>{data.moonIllumination}% moon illumination</em>
        {active?<b className={"now-state "+active.tone}>Now · {active.label}</b>:null}
      </div>

      <span className="clock t00">00</span><span className="clock t06">06</span><span className="clock t12">12</span><span className="clock t18">18</span>
    </div>
  </div>;
}
