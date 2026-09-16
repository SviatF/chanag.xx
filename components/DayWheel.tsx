"use client";

import { useEffect, useMemo, useState } from "react";
import {
  clockwiseWedgeForTimeInterval,
  minutesToDialAngle,
  parseClockMinutes,
} from "@/lib/day-wheel-geometry";
import type { Panchang, TimeWindow } from "@/lib/panchang";
import styles from "./DayWheel.module.css";

const SIZE=600;
const CX=300;
const CY=300;

const OUTER_R=244;
const INNER_R=112;
const CENTER_R=112;

const GOLD_RING_R=266;
const GOLD_RING_INNER_R=257;
const TICK_OUTER_R=255;
const TIME_RING_R=250;

const SECTOR_SPAN=45;
const SECTOR_HALF=SECTOR_SPAN/2;

type Tone=
  | "night"
  | "rahu"
  | "sunset"
  | "day"
  | "abhijit"
  | "sunrise"
  | "yamaganda"
  | "gulika";

type Sector={
  key:Tone;
  label:string;
  value?:string;
  start:number;
  end:number;
  icon?:string;
  muted?:boolean;
};

type TimingArc={
  key:Extract<Tone,"rahu"|"gulika"|"abhijit"|"yamaganda">;
  start:number;
  end:number;
  color:string;
};

type InstantMarker={
  point:{x:number;y:number};
  inner:{x:number;y:number};
  outer:{x:number;y:number};
};

const labelColors:Record<Tone,string>={
  night:"#f5ebd8",
  rahu:"#ffe0d5",
  sunset:"#f7e7c4",
  day:"#f3dfb5",
  abhijit:"#edf0bd",
  sunrise:"#fff0c8",
  yamaganda:"#efdbc8",
  gulika:"#ead9bd",
};

const timingColors:Record<TimingArc["key"],string>={
  rahu:"#ff8a78",
  gulika:"#e8c880",
  abhijit:"#b7ca66",
  yamaganda:"#db9276",
};

function formatClock12(value:string){
  const minutes=parseClockMinutes(value);
  if(minutes===null)return value;
  const hour24=Math.floor(minutes/60);
  const minute=minutes%60;
  const hour12=hour24%12||12;
  const suffix=hour24<12?"AM":"PM";
  return `${hour12}:${String(minute).padStart(2,"0")} ${suffix}`;
}

function formatWindow(value:TimeWindow|null){
  return value ? `${formatClock12(value.start)} – ${formatClock12(value.end)}` : "Not available today";
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
  const minutes=hour*60+minute;

  return {
    minutes,
    label:formatClock12(`${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}`),
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

function sectorPath(start:number,end:number){
  const a=polar(OUTER_R,start);
  const b=polar(OUTER_R,end);
  const c=polar(INNER_R,end);
  const d=polar(INNER_R,start);
  const large=end-start>180?1:0;

  return [
    `M ${a.x} ${a.y}`,
    `A ${OUTER_R} ${OUTER_R} 0 ${large} 1 ${b.x} ${b.y}`,
    `L ${c.x} ${c.y}`,
    `A ${INNER_R} ${INNER_R} 0 ${large} 0 ${d.x} ${d.y}`,
    "Z",
  ].join(" ");
}

function ringArcPath(radius:number,start:number,end:number){
  const a=polar(radius,start);
  const b=polar(radius,end);
  const large=end-start>180?1:0;
  return `M ${a.x} ${a.y} A ${radius} ${radius} 0 ${large} 1 ${b.x} ${b.y}`;
}

function equalSector(
  key:Tone,
  label:string,
  center:number,
  value?:string,
  icon?:string,
  muted=false,
):Sector{
  return {
    key,
    label,
    value,
    start:center-SECTOR_HALF,
    end:center+SECTOR_HALF,
    icon,
    muted,
  };
}

function sectors(data:Panchang):Sector[]{
  return [
    equalSector("night","Night",0,`${formatClock12(data.sunset)} – ${formatClock12(data.sunrise)}`,"☾"),
    equalSector("sunset","Sunset",45,formatClock12(data.sunset),"☀"),
    equalSector("day","Day",90,`${formatClock12(data.sunrise)} – ${formatClock12(data.sunset)}`,"☀"),
    equalSector("rahu","Rahu Kalam",135,formatWindow(data.rahu)),
    equalSector("gulika","Gulika",180,formatWindow(data.gulika)),
    equalSector("abhijit","Abhijit Muhurat",225,formatWindow(data.abhijit),undefined,!data.abhijit),
    equalSector("yamaganda","Yamaganda",270,formatWindow(data.yamaganda)),
    equalSector("sunrise","Sunrise",315,formatClock12(data.sunrise),"☀"),
  ];
}

function timingArc(
  key:TimingArc["key"],
  value:TimeWindow|null,
):TimingArc|null{
  const startMinutes=parseClockMinutes(value?.start);
  const endMinutes=parseClockMinutes(value?.end);
  if(startMinutes===null||endMinutes===null)return null;
  const wedge=clockwiseWedgeForTimeInterval(startMinutes,endMinutes);
  return {
    key,
    start:wedge.start,
    end:wedge.end,
    color:timingColors[key],
  };
}

function timingArcs(data:Panchang):TimingArc[]{
  return [
    timingArc("rahu",data.rahu),
    timingArc("gulika",data.gulika),
    timingArc("abhijit",data.abhijit),
    timingArc("yamaganda",data.yamaganda),
  ].filter((arc):arc is TimingArc=>arc!==null);
}

function instantMarker(value:string):InstantMarker|null{
  const minutes=parseClockMinutes(value);
  if(minutes===null)return null;
  const angle=minutesToDialAngle(minutes);
  return {
    point:polar(TIME_RING_R,angle),
    inner:polar(TIME_RING_R-6,angle),
    outer:polar(TIME_RING_R+6,angle),
  };
}

function labelPoint(start:number,end:number,key:Tone){
  const mid=(start+end)/2;
  const radius:Partial<Record<Tone,number>>={
    night:184,
    sunset:184,
    day:184,
    rahu:188,
    gulika:190,
    abhijit:184,
    yamaganda:188,
    sunrise:184,
  };

  return polar(radius[key]??184,mid);
}

function sectorFill(key:Tone,muted?:boolean){
  if(muted)return "url(#grad-abhijit-muted)";
  return `url(#grad-${key})`;
}

export default function DayWheel({data,placement="content"}:{data:Panchang;placement?:"hero"|"content"}){
  const wheelSectors=useMemo(()=>sectors(data),[data]);
  const exactTimingArcs=useMemo(()=>timingArcs(data),[data]);
  const sunriseMarker=useMemo(()=>instantMarker(data.sunrise),[data.sunrise]);
  const sunsetMarker=useMemo(()=>instantMarker(data.sunset),[data.sunset]);
  const [clock,setClock]=useState<{minutes:number;label:string}|null>(null);

  useEffect(()=>{
    const update=()=>setClock(indiaNow());
    update();
    const id=window.setInterval(update,60000);
    return ()=>window.clearInterval(id);
  },[]);

  const isToday=data.date===indiaDateKey();
  const handAngle=clock&&isToday?minutesToDialAngle(clock.minutes):null;
  const handStart=handAngle===null?null:polar(CENTER_R+14,handAngle);
  const handTip=handAngle===null?null:polar(GOLD_RING_INNER_R-18,handAngle);
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

        <radialGradient id="grad-rahu" gradientUnits="userSpaceOnUse" cx={CX} cy={CY} r={OUTER_R}>
          <stop offset="0%" stopColor="#b04e40"/>
          <stop offset="38%" stopColor="#8e3933"/>
          <stop offset="72%" stopColor="#632620"/>
          <stop offset="100%" stopColor="#2a1110"/>
        </radialGradient>

        <radialGradient id="grad-sunset" gradientUnits="userSpaceOnUse" cx={CX} cy={CY} r={OUTER_R}>
          <stop offset="0%" stopColor="#a77d3c"/>
          <stop offset="40%" stopColor="#74582d"/>
          <stop offset="76%" stopColor="#43351d"/>
          <stop offset="100%" stopColor="#17140e"/>
        </radialGradient>

        <radialGradient id="grad-day" gradientUnits="userSpaceOnUse" cx={CX} cy={CY} r={OUTER_R}>
          <stop offset="0%" stopColor="#6f5c2d"/>
          <stop offset="36%" stopColor="#45391f"/>
          <stop offset="72%" stopColor="#242017"/>
          <stop offset="100%" stopColor="#0c0d0a"/>
        </radialGradient>

        <radialGradient id="grad-abhijit" gradientUnits="userSpaceOnUse" cx={CX} cy={CY} r={OUTER_R}>
          <stop offset="0%" stopColor="#82913a"/>
          <stop offset="40%" stopColor="#566126"/>
          <stop offset="73%" stopColor="#334018"/>
          <stop offset="100%" stopColor="#111607"/>
        </radialGradient>

        <radialGradient id="grad-abhijit-muted" gradientUnits="userSpaceOnUse" cx={CX} cy={CY} r={OUTER_R}>
          <stop offset="0%" stopColor="#59622f"/>
          <stop offset="42%" stopColor="#3b4422"/>
          <stop offset="74%" stopColor="#252c17"/>
          <stop offset="100%" stopColor="#0d1108"/>
        </radialGradient>

        <radialGradient id="grad-sunrise" gradientUnits="userSpaceOnUse" cx={CX} cy={CY} r={OUTER_R}>
          <stop offset="0%" stopColor="#bd8b3d"/>
          <stop offset="38%" stopColor="#8c672f"/>
          <stop offset="74%" stopColor="#5b4020"/>
          <stop offset="100%" stopColor="#21150d"/>
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
        {wheelSectors.map(sector=><path
          key={sector.key}
          d={sectorPath(sector.start,sector.end)}
          fill={sectorFill(sector.key,sector.muted)}
          stroke="rgba(191,143,52,.52)"
          strokeWidth="1.15"
        />)}
      </g>

      <g aria-hidden="true">
        {exactTimingArcs.map(arc=><path
          key={`timing-${arc.key}`}
          d={ringArcPath(TIME_RING_R,arc.start,arc.end)}
          fill="none"
          stroke={arc.color}
          strokeWidth="3.4"
          strokeLinecap="round"
          opacity=".88"
        />)}
        {sunriseMarker?<>
          <line x1={sunriseMarker.inner.x} y1={sunriseMarker.inner.y} x2={sunriseMarker.outer.x} y2={sunriseMarker.outer.y} stroke="#ffd77f" strokeWidth="1.4" opacity=".78"/>
          <circle cx={sunriseMarker.point.x} cy={sunriseMarker.point.y} r="4.3" fill="#ffd77f" stroke="#39270c" strokeWidth="1"/>
          <circle cx={sunriseMarker.point.x} cy={sunriseMarker.point.y} r="6.8" fill="none" stroke="rgba(255,215,127,.24)" strokeWidth="1.2"/>
        </>:null}
        {sunsetMarker?<>
          <line x1={sunsetMarker.inner.x} y1={sunsetMarker.inner.y} x2={sunsetMarker.outer.x} y2={sunsetMarker.outer.y} stroke="#f0bd62" strokeWidth="1.4" opacity=".78"/>
          <circle cx={sunsetMarker.point.x} cy={sunsetMarker.point.y} r="4.3" fill="#f0bd62" stroke="#39270c" strokeWidth="1"/>
          <circle cx={sunsetMarker.point.x} cy={sunsetMarker.point.y} r="6.8" fill="none" stroke="rgba(240,189,98,.24)" strokeWidth="1.2"/>
        </>:null}
      </g>

      <circle
        cx={CX} cy={CY} r={OUTER_R-8}
        fill="none"
        stroke="rgba(240,198,103,.16)"
        strokeWidth="1"
      />
      <circle
        cx={CX} cy={CY} r={INNER_R+12}
        fill="none"
        stroke="rgba(230,183,82,.30)"
        strokeWidth="1"
      />

      {handAngle!==null&&handStart&&handTip&&handGlow?<>
        <line
          x1={handStart.x}
          y1={handStart.y}
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

      {wheelSectors.map(sector=>{
        const p=labelPoint(sector.start,sector.end,sector.key);
        const color=labelColors[sector.key];

        return <g key={"label-"+sector.key} transform={`translate(${p.x} ${p.y})`}>
          {sector.icon?<text y="-18" className={styles.sectorIcon} fill={color}>{sector.icon}</text>:null}
          <text
            y={sector.icon?2:-5}
            className={styles.sectorLabel}
            fill={sector.muted?"rgba(246,235,216,.60)":color}
          >
            {sector.label}
          </text>
          {sector.value?<text
            y={sector.icon?20:13}
            className={styles.sectorValue}
            fill={sector.muted?"rgba(246,235,216,.43)":"rgba(248,238,219,.80)"}
          >
            {sector.value}
          </text>:null}
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
        ["12 AM",0],
        ["6 AM",90],
        ["12 PM",180],
        ["6 PM",270],
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
