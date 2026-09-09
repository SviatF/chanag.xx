"use client";

import { useEffect, useMemo, useState } from "react";
import type { Panchang, TimeWindow } from "@/lib/panchang";
import styles from "./DayWheel.module.css";

const SIZE = 600;
const CX = 300;
const CY = 300;
const OUTER_R = 246;
const INNER_R = 142;
const CENTER_R = 116;
const TICK_R = 274;

type ToneKey =
  | "night"
  | "rahu"
  | "sunset"
  | "day"
  | "abhijit"
  | "sunrise"
  | "yamaganda"
  | "gulika";

type Slice = {
  key: ToneKey;
  label: string;
  value?: string;
  start: number;
  end: number;
  muted?: boolean;
  glyph: string;
};

const tones: Record<ToneKey,{fill:string;stroke:string;text:string}> = {
  night:{fill:"#0b0f12",stroke:"#8f7439",text:"#f5ead8"},
  rahu:{fill:"#6f2e29",stroke:"#ce765f",text:"#ffd8cc"},
  sunset:{fill:"#6f5730",stroke:"#d3ad60",text:"#f6e7c7"},
  day:{fill:"#332a1b",stroke:"#b9904c",text:"#f3dfb5"},
  abhijit:{fill:"#59602a",stroke:"#b9b65b",text:"#eef0c6"},
  sunrise:{fill:"#8a6635",stroke:"#d7b56f",text:"#fff0c8"},
  yamaganda:{fill:"#5d4029",stroke:"#b9875d",text:"#f0ddc7"},
  gulika:{fill:"#4b3b27",stroke:"#a77f4d",text:"#ead8bd"},
};

function toMinutes(value:string){
  const [h,m]=value.split(":").map(Number);
  return h*60+m;
}

function formatWindow(value:TimeWindow|null){
  return value ? `${value.start} – ${value.end}` : "Not available today";
}

function indiaDateString(){
  return new Intl.DateTimeFormat("en-CA",{
    timeZone:"Asia/Kolkata",
    year:"numeric",
    month:"2-digit",
    day:"2-digit",
  }).format(new Date());
}

function indiaMinutes(){
  const parts=new Intl.DateTimeFormat("en-GB",{
    timeZone:"Asia/Kolkata",
    hour:"2-digit",
    minute:"2-digit",
    hourCycle:"h23",
  }).formatToParts(new Date());
  const get=(type:string)=>Number(parts.find(x=>x.type===type)?.value||0);
  return get("hour")*60+get("minute");
}

function polar(radius:number,angle:number){
  const radians=(angle-90)*Math.PI/180;
  return {
    x:CX+radius*Math.cos(radians),
    y:CY+radius*Math.sin(radians),
  };
}

function ringSegment(inner:number,outer:number,start:number,end:number){
  const outerStart=polar(outer,start);
  const outerEnd=polar(outer,end);
  const innerEnd=polar(inner,end);
  const innerStart=polar(inner,start);
  const large=end-start>180?1:0;
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outer} ${outer} 0 ${large} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${inner} ${inner} 0 ${large} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

function labelPoint(start:number,end:number,radius=194){
  return polar(radius,(start+end)/2);
}

function timeAngle(time:string){
  return toMinutes(time)/1440*360;
}

function inWindow(minutes:number,window:TimeWindow|null){
  if(!window)return false;
  const start=toMinutes(window.start);
  const end=toMinutes(window.end);
  return minutes>=start&&minutes<end;
}

function slices(data:Panchang):Slice[]{
  return [
    {key:"night",label:"Night",start:330,end:390,glyph:"☾"},
    {key:"rahu",label:"Rahu Kalam",value:formatWindow(data.rahu),start:30,end:75,glyph:"◌"},
    {key:"sunset",label:"Sunset",value:data.sunset,start:75,end:116,glyph:"☀"},
    {key:"day",label:"Day",start:116,end:160,glyph:"☀"},
    {key:"abhijit",label:"Abhijit Muhurat",value:formatWindow(data.abhijit),start:160,end:202,glyph:"✦",muted:!data.abhijit},
    {key:"sunrise",label:"Sunrise",value:data.sunrise,start:202,end:244,glyph:"☀"},
    {key:"yamaganda",label:"Yamaganda",value:formatWindow(data.yamaganda),start:244,end:288,glyph:"◌"},
    {key:"gulika",label:"Gulika",value:formatWindow(data.gulika),start:288,end:330,glyph:"◌"},
  ];
}

function currentState(data:Panchang,minutes:number|null,isToday:boolean){
  if(minutes===null||!isToday)return null;
  if(inWindow(minutes,data.rahu))return "Rahu Kalam";
  if(inWindow(minutes,data.abhijit))return "Abhijit Muhurat";

  const period=[...data.dayChoghadiya,...data.nightChoghadiya].find(item=>{
    let start=toMinutes(item.start)+item.startDayOffset*1440;
    let end=toMinutes(item.end)+item.endDayOffset*1440;
    let current=minutes;
    if(current<toMinutes(data.sunrise)&&start>=1440)current+=1440;
    return current>=start&&current<end;
  });

  return period ? `${period.name} Choghadiya` : "Current time";
}

export default function DayWheel({data}:{data:Panchang}){
  const [nowMinutes,setNowMinutes]=useState<number|null>(null);

  useEffect(()=>{
    const update=()=>setNowMinutes(indiaMinutes());
    update();
    const id=window.setInterval(update,60000);
    return ()=>window.clearInterval(id);
  },[]);

  const isToday=data.date===indiaDateString();
  const state=useMemo(
    ()=>currentState(data,nowMinutes,isToday),
    [data,nowMinutes,isToday]
  );
  const wheelSlices=useMemo(()=>slices(data),[data]);

  const liveAngle=nowMinutes===null?null:nowMinutes/1440*360;
  const liveInner=liveAngle===null?null:polar(CENTER_R+8,liveAngle);
  const liveOuter=liveAngle===null?null:polar(OUTER_R-5,liveAngle);

  const sunriseMarker=polar(OUTER_R,timeAngle(data.sunrise));
  const sunsetMarker=polar(OUTER_R,timeAngle(data.sunset));

  const weekdayDate=new Intl.DateTimeFormat("en-IN",{
    day:"numeric",
    month:"short",
    year:"numeric",
    timeZone:"Asia/Kolkata",
  }).format(new Date(data.date+"T00:00:00Z"));

  return <div className={styles.root} aria-label="Panchang day wheel">
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={styles.svg} role="img">
      <defs>
        <radialGradient id="dw2-center" cx="50%" cy="35%" r="72%">
          <stop offset="0%" stopColor="#252319"/>
          <stop offset="68%" stopColor="#0a0d0c"/>
          <stop offset="100%" stopColor="#070908"/>
        </radialGradient>
        <radialGradient id="dw2-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(223,177,75,0)"/>
          <stop offset="82%" stopColor="rgba(223,177,75,.025)"/>
          <stop offset="100%" stopColor="rgba(223,177,75,.10)"/>
        </radialGradient>
        <filter id="dw2-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4"/>
        </filter>
      </defs>

      <circle cx={CX} cy={CY} r="282" fill="url(#dw2-halo)"/>
      <circle cx={CX} cy={CY} r="276" fill="none" stroke="rgba(218,174,76,.72)" strokeWidth="1.4"/>
      <circle cx={CX} cy={CY} r="264" fill="none" stroke="rgba(218,174,76,.22)" strokeWidth="1"/>

      {Array.from({length:48},(_,index)=>{
        const angle=index/48*360;
        const outer=polar(TICK_R,angle);
        const inner=polar(TICK_R-(index%2===0?10:6),angle);
        return <line
          key={"tick-"+index}
          x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
          stroke={index%2===0?"rgba(225,183,90,.48)":"rgba(225,183,90,.20)"}
          strokeWidth={index%2===0?1.3:1}
        />;
      })}

      {[
        ["00",0],
        ["06",90],
        ["12",180],
        ["18",270],
      ].map(([label,angle])=>{
        const point=polar(292,Number(angle));
        return <text key={String(label)} x={point.x} y={point.y} className={styles.hourLabel}>{label}</text>;
      })}

      {wheelSlices.map(slice=>{
        const tone=tones[slice.key];
        return <path
          key={slice.key}
          d={ringSegment(INNER_R,OUTER_R,slice.start,slice.end)}
          fill={slice.muted?"rgba(74,76,43,.34)":tone.fill}
          stroke={tone.stroke}
          strokeWidth="1.15"
        />;
      })}

      <circle cx={CX} cy={CY} r="207" fill="none" stroke="rgba(224,179,82,.18)" strokeWidth="1"/>
      <circle cx={CX} cy={CY} r="170" fill="none" stroke="rgba(224,179,82,.24)" strokeWidth="1"/>

      {wheelSlices.map(slice=>{
        const point=labelPoint(slice.start,slice.end);
        const tone=tones[slice.key];
        return <g key={"label-"+slice.key} transform={`translate(${point.x} ${point.y})`}>
          <text className={styles.glyph} fill={tone.text}>{slice.glyph}</text>
          <text y="18" className={styles.sliceLabel} fill={slice.muted?"rgba(245,234,216,.62)":tone.text}>{slice.label}</text>
          {slice.value?<text y="34" className={styles.sliceValue} fill={slice.muted?"rgba(245,234,216,.44)":"rgba(245,234,216,.78)"}>{slice.value}</text>:null}
        </g>;
      })}

      <circle cx={CX} cy={CY} r={CENTER_R} fill="url(#dw2-center)" stroke="#a27b35" strokeWidth="1.5"/>
      <circle cx={CX} cy={CY} r={CENTER_R-18} fill="none" stroke="rgba(223,177,75,.10)" strokeWidth="1"/>

      <text x={CX} y={CY-44} className={styles.centerGlyph}>☀</text>
      <text x={CX} y={CY-5} className={styles.centerDay}>{data.weekday}</text>
      <text x={CX} y={CY+23} className={styles.centerDate}>{weekdayDate}</text>
      <text x={CX} y={CY+47} className={styles.centerMeta}>{data.paksha} Paksha · {data.tithi}</text>
      <text x={CX} y={CY+66} className={styles.centerMeta}>{data.moonIllumination}% moon illumination</text>

      {state?<g>
        <rect x={CX-70} y={CY+79} width="140" height="29" rx="14.5" fill="rgba(9,13,11,.96)" stroke="#b18439" strokeWidth="1"/>
        <text x={CX} y={CY+98} className={styles.nowText}>Now · {state}</text>
      </g>:null}

      {[sunriseMarker,sunsetMarker].map((point,index)=><g key={index}>
        <circle cx={point.x} cy={point.y} r="12" fill="#0b0e0c" stroke="#b98a38" strokeWidth="1.2"/>
        <circle cx={point.x} cy={point.y} r="2.5" fill="#edc86f"/>
      </g>)}

      {isToday&&liveAngle!==null&&liveInner&&liveOuter?<g>
        <line
          x1={liveInner.x} y1={liveInner.y}
          x2={liveOuter.x} y2={liveOuter.y}
          stroke="rgba(239,210,133,.48)"
          strokeWidth="1.6"
        />
        <circle cx={liveOuter.x} cy={liveOuter.y} r="11" fill="rgba(239,210,133,.12)" filter="url(#dw2-glow)"/>
        <circle cx={liveOuter.x} cy={liveOuter.y} r="6" fill="#efd285"/>
      </g>:null}
    </svg>
  </div>;
}
