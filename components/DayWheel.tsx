"use client";

import {useEffect,useMemo,useState} from "react";
import {
  forwardSpanMinutes,
  midpointMinutes,
  minutesToDialAngle,
  parseClockMinutes,
} from "@/lib/day-wheel-geometry";
import type {Panchang,TimeWindow} from "@/lib/panchang";
import styles from "./DayWheel.module.css";

const SIZE=600;
const CX=300;
const CY=300;

const OUTER_R=244;
const WINDOW_INNER_R=148;
const INNER_R=112;
const CENTER_R=112;

const GOLD_RING_R=266;
const GOLD_RING_INNER_R=257;
const TICK_OUTER_R=255;

type ArcTone="night"|"day"|"rahu"|"abhijit"|"yamaganda"|"gulika";
type MarkerTone="sunrise"|"sunset";

type ArcSector={
  key:ArcTone;
  label:string;
  value?:string;
  start:number;
  end:number;
  icon?:string;
  layer:"base"|"window";
};

type InstantMarker={
  key:MarkerTone;
  label:string;
  value:string;
  minutes:number;
  icon:string;
};

const labelColors:Record<ArcTone|MarkerTone,string>={
  night:"#f5ebd8",
  day:"#f3dfb5",
  rahu:"#ffe0d5",
  abhijit:"#edf0bd",
  yamaganda:"#efdbc8",
  gulika:"#ead9bd",
  sunrise:"#fff0c8",
  sunset:"#f7e7c4",
};

function formatWindow(value:TimeWindow){
  return `${value.start} – ${value.end}`;
}

function indiaNow(){
  const parts=new Intl.DateTimeFormat("en-GB",{
    timeZone:"Asia/Kolkata",
    hour:"2-digit",
    minute:"2-digit",
    hourCycle:"h23",
  }).formatToParts(new Date());

  const hour=Number(parts.find(part=>part.type==="hour")?.value||0);
  const minute=Number(parts.find(part=>part.type==="minute")?.value||0);

  return {
    minutes:hour*60+minute,
    label:`${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}`,
  };
}

function indiaDateKey(){
  const parts=new Intl.DateTimeFormat("en-US",{
    timeZone:"Asia/Kolkata",
    year:"numeric",
    month:"2-digit",
    day:"2-digit",
  }).formatToParts(new Date());

  const year=parts.find(part=>part.type==="year")?.value??"";
  const month=parts.find(part=>part.type==="month")?.value??"";
  const day=parts.find(part=>part.type==="day")?.value??"";
  return `${year}-${month}-${day}`;
}

function polar(radius:number,angle:number){
  const radians=(angle-90)*Math.PI/180;
  return {
    x:CX+radius*Math.cos(radians),
    y:CY+radius*Math.sin(radians),
  };
}

/** Draw a forward clock interval counter-clockwise on the approved DayWheel. */
function timedSectorPath(startMinutes:number,endMinutes:number,innerRadius:number,outerRadius:number){
  const startAngle=minutesToDialAngle(startMinutes);
  const endAngle=minutesToDialAngle(endMinutes);
  const a=polar(outerRadius,startAngle);
  const b=polar(outerRadius,endAngle);
  const c=polar(innerRadius,endAngle);
  const d=polar(innerRadius,startAngle);
  const large=forwardSpanMinutes(startMinutes,endMinutes)>12*60?1:0;

  return [
    `M ${a.x} ${a.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${large} 0 ${b.x} ${b.y}`,
    `L ${c.x} ${c.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${large} 1 ${d.x} ${d.y}`,
    "Z",
  ].join(" ");
}

function windowArc(key:Extract<ArcTone,"rahu"|"abhijit"|"yamaganda"|"gulika">,label:string,value:TimeWindow|null){
  if(!value)return null;
  const start=parseClockMinutes(value.start);
  const end=parseClockMinutes(value.end);
  if(start===null||end===null)return null;

  return {
    key,
    label,
    value:formatWindow(value),
    start,
    end,
    layer:"window" as const,
  };
}

function geometry(data:Panchang){
  const sunrise=parseClockMinutes(data.sunrise)??6*60;
  const sunset=parseClockMinutes(data.sunset)??18*60;

  const base:ArcSector[]=[
    {key:"day",label:"Day",start:sunrise,end:sunset,icon:"☀",layer:"base"},
    {key:"night",label:"Night",start:sunset,end:sunrise,icon:"☾",layer:"base"},
  ];

  const windows=[
    windowArc("rahu","Rahu Kalam",data.rahu),
    windowArc("abhijit","Abhijit Muhurat",data.abhijit),
    windowArc("yamaganda","Yamaganda",data.yamaganda),
    windowArc("gulika","Gulika",data.gulika),
  ].filter((sector):sector is NonNullable<typeof sector>=>sector!==null);

  const markers:InstantMarker[]=[
    {key:"sunrise",label:"Sunrise",value:data.sunrise,minutes:sunrise,icon:"☀"},
    {key:"sunset",label:"Sunset",value:data.sunset,minutes:sunset,icon:"☀"},
  ];

  return {base,windows,markers};
}

function labelPoint(sector:ArcSector){
  const angle=minutesToDialAngle(midpointMinutes(sector.start,sector.end));
  const radius=sector.layer==="window"?194:132;
  return polar(radius,angle);
}

function sectorFill(key:ArcTone){
  return `url(#grad-${key})`;
}

export default function DayWheel({data,placement="content"}:{data:Panchang;placement?:"hero"|"content"}){
  const wheel=useMemo(()=>geometry(data),[data]);
  const [clock,setClock]=useState<{minutes:number;label:string}|null>(null);

  useEffect(()=>{
    const update=()=>setClock(indiaNow());
    update();
    const id=window.setInterval(update,60000);
    return ()=>window.clearInterval(id);
  },[]);

  const isToday=data.date===indiaDateKey();
  const handAngle=clock&&isToday?minutesToDialAngle(clock.minutes):null;
  const handTip=handAngle===null?null:polar(GOLD_RING_INNER_R-13,handAngle);
  const handGlow=handAngle===null?null:polar(GOLD_RING_R-2,handAngle);
  const handLabel=handAngle===null?null:polar(GOLD_RING_R+20,handAngle);

  const displayDate=new Date(data.date+"T00:00:00Z").toLocaleDateString(
    "en-IN",
    {day:"numeric",month:"short",year:"numeric",timeZone:"Asia/Kolkata"}
  );

  return <div className={`${styles.root} ${placement==="hero"?styles.heroPlacement:styles.contentPlacement}`}>
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={styles.svg}
      role="img"
      aria-label="Panchang day wheel"
    >
      <defs>
        <radialGradient id="center-core" gradientUnits="userSpaceOnUse" cx={CX} cy={CY-22} r="150">
          <stop offset="0%" stopColor="#282619"/>
          <stop offset="42%" stopColor="#12140f"/>
          <stop offset="78%" stopColor="#090b0a"/>
          <stop offset="100%" stopColor="#050706"/>
        </radialGradient>

        <radialGradient id="outer-halo" gradientUnits="userSpaceOnUse" cx={CX} cy={CY} r="286">
          <stop offset="72%" stopColor="rgba(226,177,71,0)"/>
          <stop offset="89%" stopColor="rgba(226,177,71,.04)"/>
          <stop offset="100%" stopColor="rgba(226,177,71,.17)"/>
        </radialGradient>

        <radialGradient id="grad-night" gradientUnits="userSpaceOnUse" cx={CX} cy={CY} r={OUTER_R}>
          <stop offset="0%" stopColor="#1b1c15"/>
          <stop offset="45%" stopColor="#0d110f"/>
          <stop offset="77%" stopColor="#080c0d"/>
          <stop offset="100%" stopColor="#030606"/>
        </radialGradient>

        <radialGradient id="grad-day" gradientUnits="userSpaceOnUse" cx={CX} cy={CY} r={OUTER_R}>
          <stop offset="0%" stopColor="#6f5c2d"/>
          <stop offset="36%" stopColor="#45391f"/>
          <stop offset="72%" stopColor="#242017"/>
          <stop offset="100%" stopColor="#0c0d0a"/>
        </radialGradient>

        <radialGradient id="grad-rahu" gradientUnits="userSpaceOnUse" cx={CX} cy={CY} r={OUTER_R}>
          <stop offset="0%" stopColor="#b04e40"/>
          <stop offset="38%" stopColor="#8e3933"/>
          <stop offset="72%" stopColor="#632620"/>
          <stop offset="100%" stopColor="#2a1110"/>
        </radialGradient>

        <radialGradient id="grad-abhijit" gradientUnits="userSpaceOnUse" cx={CX} cy={CY} r={OUTER_R}>
          <stop offset="0%" stopColor="#82913a"/>
          <stop offset="40%" stopColor="#566126"/>
          <stop offset="73%" stopColor="#334018"/>
          <stop offset="100%" stopColor="#111607"/>
        </radialGradient>

        <radialGradient id="grad-yamaganda" gradientUnits="userSpaceOnUse" cx={CX} cy={CY} r={OUTER_R}>
          <stop offset="0%" stopColor="#8e553f"/>
          <stop offset="40%" stopColor="#65402f"/>
          <stop offset="74%" stopColor="#3e2a22"/>
          <stop offset="100%" stopColor="#160f0d"/>
        </radialGradient>

        <radialGradient id="grad-gulika" gradientUnits="userSpaceOnUse" cx={CX} cy={CY} r={OUTER_R}>
          <stop offset="0%" stopColor="#5e4b28"/>
          <stop offset="40%" stopColor="#3d301b"/>
          <stop offset="74%" stopColor="#211b12"/>
          <stop offset="100%" stopColor="#070908"/>
        </radialGradient>

        <linearGradient id="outer-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8f6420"/>
          <stop offset="28%" stopColor="#f1cb72"/>
          <stop offset="52%" stopColor="#b17a24"/>
          <stop offset="76%" stopColor="#f0c369"/>
          <stop offset="100%" stopColor="#755018"/>
        </linearGradient>

        <filter id="gold-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.4" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        <filter id="soft-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#000" floodOpacity=".34"/>
        </filter>

        <filter id="hand-glow" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="3.2" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        <linearGradient id="hand-gold" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(235,191,89,.18)"/>
          <stop offset="52%" stopColor="#e7bd63"/>
          <stop offset="100%" stopColor="#f4d98c"/>
        </linearGradient>

        <marker id="hand-arrow" viewBox="0 0 10 10" refX="8.2" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#f1ce78"/>
        </marker>
      </defs>

      <circle cx={CX} cy={CY} r="282" fill="url(#outer-halo)"/>

      <circle
        cx={CX} cy={CY} r={GOLD_RING_R+4}
        fill="none"
        stroke="rgba(205,153,51,.18)"
        strokeWidth="10"
        filter="url(#gold-glow)"
      />
      <circle
        cx={CX} cy={CY} r={GOLD_RING_R}
        fill="none"
        stroke="url(#outer-gold)"
        strokeWidth="2.8"
      />
      <circle
        cx={CX} cy={CY} r={GOLD_RING_INNER_R}
        fill="none"
        stroke="rgba(239,196,99,.70)"
        strokeWidth="1.1"
      />
      <circle
        cx={CX} cy={CY} r={GOLD_RING_INNER_R-7}
        fill="none"
        stroke="rgba(190,137,45,.27)"
        strokeWidth=".8"
      />

      {Array.from({length:72},(_,index)=>{
        const angle=index*5;
        const major=index%6===0;
        const outer=polar(TICK_OUTER_R,angle);
        const inner=polar(TICK_OUTER_R-(major?12:6),angle);

        return <line
          key={index}
          x1={inner.x}
          y1={inner.y}
          x2={outer.x}
          y2={outer.y}
          stroke={major?"rgba(244,204,111,.82)":"rgba(224,176,79,.33)"}
          strokeWidth={major?1.45:.8}
        />;
      })}

      <g filter="url(#soft-shadow)">
        {wheel.base.map(sector=><path
          key={sector.key}
          d={timedSectorPath(sector.start,sector.end,INNER_R,OUTER_R)}
          fill={sectorFill(sector.key)}
          stroke="rgba(191,143,52,.42)"
          strokeWidth="1"
        />)}
        {wheel.windows.map(sector=><path
          key={sector.key}
          d={timedSectorPath(sector.start,sector.end,WINDOW_INNER_R,OUTER_R)}
          fill={sectorFill(sector.key)}
          stroke="rgba(236,205,143,.62)"
          strokeWidth="1.15"
        />)}
      </g>

      <circle
        cx={CX} cy={CY} r={OUTER_R-8}
        fill="none"
        stroke="rgba(240,198,103,.16)"
        strokeWidth="1"
      />
      <circle
        cx={CX} cy={CY} r={WINDOW_INNER_R}
        fill="none"
        stroke="rgba(230,183,82,.25)"
        strokeWidth="1"
      />
      <circle
        cx={CX} cy={CY} r={INNER_R+8}
        fill="none"
        stroke="rgba(230,183,82,.22)"
        strokeWidth="1"
      />

      {wheel.markers.map(marker=>{
        const angle=minutesToDialAngle(marker.minutes);
        const start=polar(INNER_R+9,angle);
        const end=polar(OUTER_R-4,angle);
        const dot=polar(OUTER_R+1,angle);
        const point=polar(176,angle);
        const color=labelColors[marker.key];

        return <g key={marker.key} aria-label={`${marker.label} ${marker.value}`}>
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={color}
            strokeWidth="1.45"
            strokeDasharray="3 4"
            opacity=".78"
          />
          <circle cx={dot.x} cy={dot.y} r="3.2" fill={color} stroke="#4d381b" strokeWidth=".8"/>
          <g transform={`translate(${point.x} ${point.y})`}>
            <text y="-18" className={styles.sectorIcon} fill={color}>{marker.icon}</text>
            <text y="2" className={styles.sectorLabel} fill={color}>{marker.label}</text>
            <text y="20" className={styles.sectorValue} fill="rgba(248,238,219,.88)">{marker.value}</text>
          </g>
        </g>;
      })}

      {handAngle!==null&&handTip&&handGlow?<>
        <line
          x1={CX}
          y1={CY}
          x2={handTip.x}
          y2={handTip.y}
          stroke="url(#hand-gold)"
          strokeWidth="2.2"
          strokeLinecap="round"
          markerEnd="url(#hand-arrow)"
          opacity=".96"
        />
        <circle
          cx={handGlow.x}
          cy={handGlow.y}
          r="10"
          fill="rgba(241,202,111,.10)"
          filter="url(#hand-glow)"
        />
        <circle
          cx={handGlow.x}
          cy={handGlow.y}
          r="4.8"
          fill="#f1ce78"
          stroke="#5f441b"
          strokeWidth="1"
        />
      </>:null}

      <circle
        cx={CX} cy={CY} r={CENTER_R+3}
        fill="rgba(5,7,6,.86)"
        stroke="rgba(226,178,73,.40)"
        strokeWidth="1"
      />
      <circle
        cx={CX} cy={CY} r={CENTER_R}
        fill="url(#center-core)"
        stroke="#b1812f"
        strokeWidth="1.55"
      />
      <circle
        cx={CX} cy={CY} r={CENTER_R-10}
        fill="none"
        stroke="rgba(237,194,93,.10)"
        strokeWidth="1"
      />

      {wheel.base.map(sector=>{
        const p=labelPoint(sector);
        const color=labelColors[sector.key];
        return <g key={`label-${sector.key}`} transform={`translate(${p.x} ${p.y})`}>
          {sector.icon?<text y="-7" className={styles.sectorIcon} fill={color}>{sector.icon}</text>:null}
          <text y="13" className={styles.sectorLabel} fill={color}>{sector.label}</text>
        </g>;
      })}

      {wheel.windows.map(sector=>{
        const p=labelPoint(sector);
        const color=labelColors[sector.key];
        return <g key={`label-${sector.key}`} transform={`translate(${p.x} ${p.y})`}>
          <text y="-5" className={styles.sectorLabel} fill={color}>{sector.label}</text>
          <text y="13" className={styles.sectorValue} fill="rgba(248,238,219,.84)">{sector.value}</text>
        </g>;
      })}

      <text x={CX} y={CY-54} className={styles.centerSun}>☀</text>
      <text x={CX} y={CY-13} className={styles.centerDay}>{data.weekday}</text>
      <text x={CX} y={CY+18} className={styles.centerDate}>{displayDate}</text>
      <text x={CX} y={CY+50} className={styles.centerMessage}>A mindful day</text>
      <text x={CX} y={CY+68} className={styles.centerMessage}>creates a brighter</text>
      <text x={CX} y={CY+86} className={styles.centerMessage}>tomorrow</text>

      {handAngle!==null&&handLabel&&clock?<text
        x={handLabel.x}
        y={handLabel.y}
        className={styles.nowLabel}
      >
        NOW · {clock.label}
      </text>:null}

      {[
        ["24:00",0],
        ["18:00",90],
        ["12:00",180],
        ["06:00",270],
      ].map(([label,angle])=>{
        const p=polar(287,Number(angle));
        return <text
          key={String(label)}
          x={p.x}
          y={p.y}
          className={styles.cardinal}
        >
          {label}
        </text>;
      })}
    </svg>
  </div>;
}
