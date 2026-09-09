"use client";

import { useEffect, useMemo, useState } from "react";
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

function formatWindow(value:TimeWindow|null){
  return value ? `${value.start} – ${value.end}` : "Not available today";
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
  return new Intl.DateTimeFormat("en-CA",{
    timeZone:"Asia/Kolkata",
    year:"numeric",
    month:"2-digit",
    day:"2-digit",
  }).format(new Date());
}

function liveAngle(minutes:number){
  // The approved concept runs counter-clockwise:
  // 24:00 top, 06:00 left, 12:00 bottom, 18:00 right.
  return (360-(minutes/1440)*360)%360;
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

function sectors(data:Panchang):Sector[]{
  return [
    {key:"night",label:"Night",start:330,end:390,icon:"☾"},
    {key:"rahu",label:"Rahu Kalam",value:formatWindow(data.rahu),start:30,end:72},
    {key:"sunset",label:"Sunset",value:data.sunset,start:72,end:112,icon:"☀"},
    {key:"day",label:"Day",start:112,end:150,icon:"☀"},
    {
      key:"abhijit",
      label:"Abhijit Muhurat",
      value:formatWindow(data.abhijit),
      start:150,
      end:210,
      muted:!data.abhijit,
    },
    {key:"sunrise",label:"Sunrise",value:data.sunrise,start:210,end:250,icon:"☀"},
    {key:"yamaganda",label:"Yamaganda",value:formatWindow(data.yamaganda),start:250,end:290},
    {key:"gulika",label:"Gulika",value:formatWindow(data.gulika),start:290,end:330},
  ];
}

function labelPoint(start:number,end:number,key:Tone){
  const mid=(start+end)/2;
  const radius:Partial<Record<Tone,number>>={
    night:186,
    rahu:187,
    sunset:185,
    day:183,
    abhijit:184,
    sunrise:185,
    yamaganda:186,
    gulika:186,
  };
  return polar(radius[key]??185,mid);
}

function sectorFill(key:Tone,muted?:boolean){
  if(muted)return "url(#grad-abhijit-muted)";
  return `url(#grad-${key})`;
}

export default function DayWheel({data}:{data:Panchang}){
  const wheelSectors=useMemo(()=>sectors(data),[data]);
  const [clock,setClock]=useState<{minutes:number;label:string}|null>(null);

  useEffect(()=>{
    const update=()=>setClock(indiaNow());
    update();
    const id=window.setInterval(update,60000);
    return ()=>window.clearInterval(id);
  },[]);

  const isToday=data.date===indiaDateKey();
  const handAngle=clock&&isToday?liveAngle(clock.minutes):null;
  const handTip=handAngle===null?null:polar(GOLD_RING_INNER_R-13,handAngle);
  const handGlow=handAngle===null?null:polar(GOLD_RING_R-2,handAngle);
  const handLabel=handAngle===null?null:polar(GOLD_RING_R+20,handAngle);

  const displayDate=new Date(data.date+"T00:00:00Z").toLocaleDateString(
    "en-IN",
    {day:"numeric",month:"short",year:"numeric",timeZone:"Asia/Kolkata"}
  );

  return <div className={styles.root}>
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
      </defs>

      <circle cx={CX} cy={CY} r="282" fill="url(#outer-halo)"/>

      {/* full premium golden outer ring */}
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

      {/* gold ticks sit inside the complete ring */}
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

      {/* deep gradient sectors */}
      <g filter="url(#soft-shadow)">
        {wheelSectors.map(sector=><path
          key={sector.key}
          d={sectorPath(sector.start,sector.end)}
          fill={sectorFill(sector.key,sector.muted)}
          stroke="rgba(191,143,52,.52)"
          strokeWidth="1.15"
        />)}
      </g>

      {/* subtle depth lines */}
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

      {/* live IST hand — visible only for today's Panchang */}
      {handAngle!==null&&handTip&&handGlow?<>
        <line
          x1={CX}
          y1={CY}
          x2={handTip.x}
          y2={handTip.y}
          stroke="url(#hand-gold)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity=".88"
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

      {/* center */}
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

      {/* sector labels */}
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

      {/* center content */}
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

      {/* cardinal clock labels */}
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
