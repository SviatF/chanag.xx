"use client";

import { useMemo } from "react";
import type { Panchang, TimeWindow } from "@/lib/panchang";
import styles from "./DayWheel.module.css";

const SIZE=600;
const CX=300;
const CY=300;
const OUTER_R=244;
const INNER_R=128;
const CENTER_R=128;
const OUTLINE_R=264;
const TICK_OUTER=258;

type Tone="night"|"rahu"|"sunset"|"day"|"abhijit"|"sunrise"|"yamaganda"|"gulika";
type Sector={
  key:Tone;
  label:string;
  value?:string;
  start:number;
  end:number;
  icon:string;
  muted?:boolean;
};

const colors:Record<Tone,{fill:string;stroke:string;label:string}>={
  night:{fill:"#090d0e",stroke:"#755f32",label:"#f7eddb"},
  rahu:{fill:"#7e302d",stroke:"#d77563",label:"#ffe3d8"},
  sunset:{fill:"#4c4023",stroke:"#ba9347",label:"#f6e4bd"},
  day:{fill:"#171711",stroke:"#8f7137",label:"#f5e3bd"},
  abhijit:{fill:"#333c16",stroke:"#9ba72d",label:"#eff1bd"},
  sunrise:{fill:"#76572a",stroke:"#d6aa55",label:"#ffedc5"},
  yamaganda:{fill:"#42291f",stroke:"#9f694c",label:"#f3dfcd"},
  gulika:{fill:"#18140e",stroke:"#816234",label:"#efe1c9"},
};

function formatWindow(value:TimeWindow|null){
  return value?`${value.start} – ${value.end}`:"Not available today";
}

function polar(radius:number,angle:number){
  const r=(angle-90)*Math.PI/180;
  return {x:CX+radius*Math.cos(r),y:CY+radius*Math.sin(r)};
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
    {key:"rahu",label:"Rahu Kalam",value:formatWindow(data.rahu),start:30,end:72,icon:""},
    {key:"sunset",label:"Sunset",value:data.sunset,start:72,end:112,icon:"☀"},
    {key:"day",label:"Day",start:112,end:150,icon:"☀"},
    {key:"abhijit",label:"Abhijit Muhurat",value:formatWindow(data.abhijit),start:150,end:210,icon:"",muted:!data.abhijit},
    {key:"sunrise",label:"Sunrise",value:data.sunrise,start:210,end:250,icon:"☀"},
    {key:"yamaganda",label:"Yamaganda",value:formatWindow(data.yamaganda),start:250,end:290,icon:""},
    {key:"gulika",label:"Gulika",value:formatWindow(data.gulika),start:290,end:330,icon:""},
  ];
}

function labelPoint(start:number,end:number,key:Tone){
  const mid=(start+end)/2;
  const customRadius:Partial<Record<Tone,number>>={
    night:188,
    rahu:190,
    sunset:189,
    day:188,
    abhijit:188,
    sunrise:188,
    yamaganda:188,
    gulika:188,
  };
  return polar(customRadius[key]??188,mid);
}

export default function DayWheel({data}:{data:Panchang}){
  const wheelSectors=useMemo(()=>sectors(data),[data]);

  return <div className={styles.root}>
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={styles.svg} role="img" aria-label="Panchang day wheel">
      <defs>
        <radialGradient id="dial-center" cx="50%" cy="38%" r="72%">
          <stop offset="0%" stopColor="#202018"/>
          <stop offset="68%" stopColor="#0b0e0d"/>
          <stop offset="100%" stopColor="#080a09"/>
        </radialGradient>

        <radialGradient id="dial-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(229,181,78,0)"/>
          <stop offset="82%" stopColor="rgba(229,181,78,.018)"/>
          <stop offset="100%" stopColor="rgba(229,181,78,.08)"/>
        </radialGradient>

        <linearGradient id="rahu-sheen" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#56221f"/>
          <stop offset="70%" stopColor="#8a3530"/>
          <stop offset="100%" stopColor="#9c443a"/>
        </linearGradient>

        <linearGradient id="abhijit-sheen" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#1d260d"/>
          <stop offset="65%" stopColor="#374518"/>
          <stop offset="100%" stopColor="#4c5b1e"/>
        </linearGradient>

        <linearGradient id="sunrise-sheen" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#4d3519"/>
          <stop offset="68%" stopColor="#80602e"/>
          <stop offset="100%" stopColor="#95703a"/>
        </linearGradient>
      </defs>

      <circle cx={CX} cy={CY} r="276" fill="url(#dial-glow)"/>

      <circle cx={CX} cy={CY} r={OUTLINE_R+6} fill="none" stroke="rgba(218,169,67,.27)" strokeWidth="1"/>
      <circle cx={CX} cy={CY} r={OUTLINE_R} fill="none" stroke="#bd8e35" strokeWidth="2"/>
      <circle cx={CX} cy={CY} r={OUTLINE_R-6} fill="none" stroke="rgba(230,185,83,.62)" strokeWidth="1"/>

      {Array.from({length:72},(_,index)=>{
        const angle=index*5;
        const major=index%6===0;
        const outer=polar(TICK_OUTER,angle);
        const inner=polar(TICK_OUTER-(major?10:5),angle);
        return <line
          key={index}
          x1={inner.x} y1={inner.y}
          x2={outer.x} y2={outer.y}
          stroke={major?"rgba(232,191,93,.62)":"rgba(232,191,93,.24)"}
          strokeWidth={major?1.5:1}
        />;
      })}

      {wheelSectors.map(sector=>{
        const tone=colors[sector.key];
        const fill=
          sector.key==="rahu"?"url(#rahu-sheen)":
          sector.key==="abhijit"?"url(#abhijit-sheen)":
          sector.key==="sunrise"?"url(#sunrise-sheen)":
          sector.muted?"#1c2113":
          tone.fill;

        return <path
          key={sector.key}
          d={sectorPath(sector.start,sector.end)}
          fill={fill}
          stroke={tone.stroke}
          strokeWidth="1.25"
        />;
      })}

      <circle cx={CX} cy={CY} r={CENTER_R} fill="url(#dial-center)" stroke="#97702c" strokeWidth="1.6"/>
      <circle cx={CX} cy={CY} r={CENTER_R-9} fill="none" stroke="rgba(225,179,75,.12)" strokeWidth="1"/>

      {wheelSectors.map(sector=>{
        const p=labelPoint(sector.start,sector.end,sector.key);
        const tone=colors[sector.key];
        return <g key={"label-"+sector.key} transform={`translate(${p.x} ${p.y})`}>
          {sector.icon?<text y="-17" className={styles.sectorIcon} fill={tone.label}>{sector.icon}</text>:null}
          <text y={sector.icon?2:-5} className={styles.sectorLabel} fill={sector.muted?"rgba(245,235,218,.56)":tone.label}>{sector.label}</text>
          {sector.value?<text y={sector.icon?20:13} className={styles.sectorValue} fill={sector.muted?"rgba(245,235,218,.42)":"rgba(247,237,219,.82)"}>{sector.value}</text>:null}
        </g>;
      })}

      <text x={CX} y={CY-55} className={styles.centerSun}>☀</text>
      <text x={CX} y={CY-14} className={styles.centerDay}>{data.weekday}</text>
      <text x={CX} y={CY+16} className={styles.centerDate}>{new Date(data.date+"T00:00:00Z").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric",timeZone:"Asia/Kolkata"})}</text>
      <text x={CX} y={CY+48} className={styles.centerMessage}>A mindful day</text>
      <text x={CX} y={CY+66} className={styles.centerMessage}>creates a brighter</text>
      <text x={CX} y={CY+84} className={styles.centerMessage}>tomorrow</text>

      {[
        ["24:00",0],
        ["18:00",90],
        ["12:00",180],
        ["06:00",270],
      ].map(([label,angle])=>{
        const p=polar(286,Number(angle));
        return <text key={String(label)} x={p.x} y={p.y} className={styles.cardinal}>{label}</text>;
      })}
    </svg>
  </div>;
}
