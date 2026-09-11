"use client";

import {useMemo,useState} from "react";
import Link from "next/link";
import {MapPinned} from "lucide-react";
import styles from "./GeoDemandMap.module.css";

export type GeoDemandMode="impressions"|"clicks"|"score"|"index";

export type GeoDemandCity={
  slug:string;
  name:string;
  state:string;
  lat:number;
  lng:number;
  impressions:number;
  clicks:number;
  queryImpressions:number;
  matchedQueries:number;
  position:number;
  score:number;
  recommendation:"ACTIVE"|"ACTIVATE"|"WATCH"|"HOLD";
  indexable:boolean;
};

const MODES:Array<{key:GeoDemandMode;label:string}>=[
  {key:"impressions",label:"Impressions"},
  {key:"clicks",label:"Clicks"},
  {key:"score",label:"Demand score"},
  {key:"index",label:"Index status"},
];

const INDIA_OUTLINE:[number,number][]=[
  [68.1,23.8],[68.7,24.5],[69.8,24.9],[70.9,24.5],[71.8,23.7],[72.5,22.2],[72.8,20.7],[72.6,18.9],
  [73.2,16.9],[73.8,15.0],[74.6,13.0],[75.3,11.1],[76.2,9.7],[77.5,8.1],[78.3,8.4],[79.3,9.2],
  [80.1,10.6],[80.3,12.4],[80.2,13.8],[80.6,15.1],[81.8,16.4],[83.1,17.6],[84.6,18.8],[86.1,20.0],
  [87.6,21.5],[88.3,22.6],[88.7,24.0],[89.2,25.3],[90.4,26.0],[91.8,26.2],[93.0,27.0],[94.5,27.6],
  [96.0,28.2],[97.3,28.4],[96.2,29.2],[94.7,29.4],[93.4,29.0],[92.4,28.0],[91.5,27.5],[90.8,27.9],
  [89.6,28.2],[88.4,27.8],[87.4,27.9],[86.0,27.4],[84.6,27.5],[83.1,27.5],[81.5,29.0],[80.0,30.5],
  [78.7,31.9],[77.4,33.0],[76.2,34.2],[74.6,36.0],[73.4,34.9],[72.7,33.2],[72.0,31.6],[71.0,29.7],
  [70.1,27.5],[69.3,26.0],[68.1,23.8]
];

const GEO={minLng:67.5,maxLng:97.8,minLat:6.5,maxLat:37.5,left:44,right:376,top:14,bottom:376};

function project(lng:number,lat:number){
  const x=GEO.left+((lng-GEO.minLng)/(GEO.maxLng-GEO.minLng))*(GEO.right-GEO.left);
  const y=GEO.top+((GEO.maxLat-lat)/(GEO.maxLat-GEO.minLat))*(GEO.bottom-GEO.top);
  return {x:Math.max(GEO.left,Math.min(GEO.right,x)),y:Math.max(GEO.top,Math.min(GEO.bottom,y))};
}

function outlinePath(){
  return INDIA_OUTLINE.map(([lng,lat],index)=>{const p=project(lng,lat);return `${index?"L":"M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;}).join(" ")+" Z";
}

function compact(value:number){return new Intl.NumberFormat("en-IN",{notation:"compact",maximumFractionDigits:1}).format(value);}
function metricValue(city:GeoDemandCity,mode:GeoDemandMode){if(mode==="impressions")return city.impressions;if(mode==="clicks")return city.clicks;if(mode==="score")return city.score;return city.indexable?1:0;}
function metricLabel(city:GeoDemandCity,mode:GeoDemandMode){if(mode==="impressions")return `${compact(city.impressions)} impressions`;if(mode==="clicks")return `${compact(city.clicks)} clicks`;if(mode==="score")return `${city.score}/100`;return city.indexable?"INDEXABLE":"NOINDEX";}

export default function GeoDemandMap({cities}:{cities:GeoDemandCity[]}){
  const [mode,setMode]=useState<GeoDemandMode>("impressions");
  const [hovered,setHovered]=useState<string|null>(null);

  const sorted=useMemo(()=>[...cities].sort((a,b)=>{
    if(mode==="index")return Number(b.indexable)-Number(a.indexable)||b.score-a.score||b.impressions-a.impressions;
    return metricValue(b,mode)-metricValue(a,mode)||b.score-a.score;
  }),[cities,mode]);

  const ranking=sorted.slice(0,6);
  const max=Math.max(1,...cities.map(city=>metricValue(city,mode)));
  const activeCount=cities.filter(city=>city.indexable).length;
  const signaledCount=cities.filter(city=>city.impressions>0||city.clicks>0||city.queryImpressions>0).length;
  const activeCity=hovered?cities.find(city=>city.slug===hovered)??null:null;
  const activePoint=activeCity?project(activeCity.lng,activeCity.lat):null;
  const indiaPath=useMemo(()=>outlinePath(),[]);

  const visible=useMemo(()=>{
    if(mode==="index")return cities;
    const signaled=sorted.filter(city=>metricValue(city,mode)>0||city.indexable);
    return signaled.slice(0,140);
  },[cities,mode,sorted]);

  return <section className={`admin-panel ${styles.shell}`}>
    <div className={`admin-panel-head ${styles.header}`}>
      <div><small>GEO DEMAND INTELLIGENCE</small><h2>India city search map</h2><p>Google Search Console visibility across city-targeted Panchvani pages, with demand and indexability overlays.</p></div>
      <div className={styles.modeSwitch} aria-label="Geo map metric">{MODES.map(item=><button type="button" key={item.key} className={mode===item.key?styles.activeMode:""} onClick={()=>setMode(item.key)}>{item.label}</button>)}</div>
    </div>

    <div className={styles.layout}>
      <div className={styles.mapCard}>
        <div className={styles.mapMeta}><span><i className={styles.liveDot}/>{signaledCount} cities with GSC signal</span><span>{activeCount} indexable cities</span></div>
        <div className={styles.mapStage}>
          <svg className={styles.map} viewBox="0 0 420 390" role="img" aria-label={`India city map by ${mode}`}>
            <defs>
              <filter id="geo-demand-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              <linearGradient id="geo-demand-land" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="rgba(27,31,39,.92)"/><stop offset="1" stopColor="rgba(8,10,14,.96)"/></linearGradient>
            </defs>
            <path className={styles.indiaOutline} d={indiaPath}/>
            <circle className={styles.indiaIsland} cx={project(72.7,10.6).x} cy={project(72.7,10.6).y} r="2.2"/>
            <circle className={styles.indiaIsland} cx={project(92.8,13.1).x} cy={project(92.8,13.1).y} r="2.1"/>
            <circle className={styles.indiaIsland} cx={project(93.0,11.5).x} cy={project(93.0,11.5).y} r="1.6"/>

            {visible.map((city,index)=>{
              const value=metricValue(city,mode);
              const ratio=mode==="index"?(city.indexable?1:.12):Math.log1p(value)/Math.log1p(max);
              const radius=mode==="index"?(city.indexable?5:1.7):(2.5+ratio*7.5);
              const pos=project(city.lng,city.lat);
              const hot=index<3&&value>0;
              const className=[styles.point,city.indexable?styles.indexed:styles.unindexed,city.recommendation==="ACTIVATE"?styles.activate:"",hot?styles.hot:""].filter(Boolean).join(" ");
              return <g key={city.slug} className={className} transform={`translate(${pos.x} ${pos.y})`} onMouseEnter={()=>setHovered(city.slug)} onMouseLeave={()=>setHovered(null)} onFocus={()=>setHovered(city.slug)} onBlur={()=>setHovered(null)} tabIndex={0} role="button" aria-label={`${city.name}: ${metricLabel(city,mode)}`}>
                <circle className={styles.pointHalo} r={Math.max(5,radius*2.5)} style={{opacity:.08+ratio*.22}}/><circle className={styles.pointCore} r={radius} style={{opacity:.36+ratio*.64}}/>
              </g>;
            })}
          </svg>

          {activeCity&&activePoint?<div className={styles.tooltip} style={{left:`${(activePoint.x/420)*100}%`,top:`${(activePoint.y/390)*100}%`}}>
            <div className={styles.tooltipTitle}><span>{activeCity.name}</span><b>{activeCity.state}</b></div><strong>{metricLabel(activeCity,mode)}</strong>
            <div className={styles.tooltipGrid}><span>Clicks <b>{compact(activeCity.clicks)}</b></span><span>Impressions <b>{compact(activeCity.impressions)}</b></span><span>Avg position <b>{activeCity.position?activeCity.position.toFixed(1):"—"}</b></span><span>Demand score <b>{activeCity.score}</b></span></div>
            <div className={styles.tooltipFooter}><span className={activeCity.indexable?styles.goodStatus:styles.mutedStatus}>{activeCity.indexable?"INDEXABLE":"NOINDEX"}</span><span>{activeCity.recommendation}</span></div>
          </div>:null}
        </div>
        <div className={styles.legend}><span><i className={styles.legendActive}/>Indexable / stronger signal</span><span><i className={styles.legendMuted}/>Noindex / weak signal</span><span>Dot size = {mode==="score"?"demand":mode==="index"?"index state":mode}</span><span>Lat/lng projected to the same India coordinate system</span></div>
      </div>

      <aside className={styles.ranking}>
        <div className={styles.rankingHead}><div><small>{mode==="index"?"INDEX COVERAGE":"TOP CITY SIGNALS"}</small><h3>{mode==="impressions"?"By impressions":mode==="clicks"?"By clicks":mode==="score"?"By demand score":"Indexable cities"}</h3></div><MapPinned size={18}/></div>
        <div className={styles.rows}>{ranking.map((city,index)=><button type="button" key={city.slug} className={hovered===city.slug?styles.activeRow:""} onMouseEnter={()=>setHovered(city.slug)} onMouseLeave={()=>setHovered(null)} onFocus={()=>setHovered(city.slug)} onBlur={()=>setHovered(null)}><em>{String(index+1).padStart(2,"0")}</em><span><b>{city.name}</b><small>{city.state} · {city.recommendation}</small></span><strong>{metricLabel(city,mode)}</strong></button>)}</div>
        <div className={styles.insight}><small>READING THE MAP</small><p><b>Traffic modes</b> use GSC page-level city URL data. <b>Demand score</b> also considers matched city queries and population. The map now uses one geographic projection for both the India outline and every city coordinate.</p></div>
        <Link className={styles.openTraffic} href="/admin/traffic">Open full Traffic & Demand →</Link>
      </aside>
    </div>
  </section>;
}
