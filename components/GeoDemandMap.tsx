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

const MODES:Array<{key:GeoDemandMode;label:string;short:string}>=[
  {key:"impressions",label:"Impressions",short:"impr."},
  {key:"clicks",label:"Clicks",short:"clicks"},
  {key:"score",label:"Demand score",short:"score"},
  {key:"index",label:"Index status",short:"status"},
];

function compact(value:number){
  return new Intl.NumberFormat("en-IN",{notation:"compact",maximumFractionDigits:1}).format(value);
}

function metricValue(city:GeoDemandCity,mode:GeoDemandMode){
  if(mode==="impressions")return city.impressions;
  if(mode==="clicks")return city.clicks;
  if(mode==="score")return city.score;
  return city.indexable?1:0;
}

function metricLabel(city:GeoDemandCity,mode:GeoDemandMode){
  if(mode==="impressions")return `${compact(city.impressions)} impressions`;
  if(mode==="clicks")return `${compact(city.clicks)} clicks`;
  if(mode==="score")return `${city.score}/100`;
  return city.indexable?"INDEXABLE":"NOINDEX";
}

function point(city:GeoDemandCity){
  const x=70+((city.lng-68)/29.5)*270;
  const y=20+((37.5-city.lat)/31)*340;
  return {
    x:Math.max(46,Math.min(364,x)),
    y:Math.max(18,Math.min(372,y)),
  };
}

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
  const activePoint=activeCity?point(activeCity):null;

  const visible=useMemo(()=>{
    if(mode==="index")return cities;
    const signaled=sorted.filter(city=>metricValue(city,mode)>0||city.indexable);
    return signaled.slice(0,140);
  },[cities,mode,sorted]);

  return <section className={`admin-panel ${styles.shell}`}>
    <div className={`admin-panel-head ${styles.header}`}>
      <div>
        <small>GEO DEMAND INTELLIGENCE</small>
        <h2>India city search map</h2>
        <p>Google Search Console visibility across city-targeted Panchvani pages, with demand and indexability overlays.</p>
      </div>
      <div className={styles.modeSwitch} aria-label="Geo map metric">
        {MODES.map(item=><button
          type="button"
          key={item.key}
          className={mode===item.key?styles.activeMode:""}
          onClick={()=>setMode(item.key)}
        >{item.label}</button>)}
      </div>
    </div>

    <div className={styles.layout}>
      <div className={styles.mapCard}>
        <div className={styles.mapMeta}>
          <span><i className={styles.liveDot}/>{signaledCount} cities with GSC signal</span>
          <span>{activeCount} indexable cities</span>
        </div>

        <div className={styles.mapStage}>
          <svg className={styles.map} viewBox="0 0 420 390" role="img" aria-label={`India city map by ${mode}`}>
            <defs>
              <filter id="geo-demand-glow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <linearGradient id="geo-demand-land" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="rgba(27,31,39,.92)"/>
                <stop offset="1" stopColor="rgba(8,10,14,.96)"/>
              </linearGradient>
            </defs>

            <path className={styles.indiaOutline} d="M136 26 180 21 204 41 229 39 255 63 273 87 302 94 327 123 314 145 328 165 307 184 293 214 270 228 255 259 235 277 226 312 208 354 190 330 181 300 161 280 146 252 128 228 105 211 90 181 73 157 80 126 103 109 112 79Z"/>
            <path className={styles.indiaInner} d="M115 90 160 105 202 87 251 119 289 145M103 153 155 163 200 145 251 170 293 205M128 221 176 206 229 226 255 259M160 280 193 259 226 312"/>

            {visible.map((city,index)=>{
              const value=metricValue(city,mode);
              const ratio=mode==="index"?(city.indexable?1:.12):Math.log1p(value)/Math.log1p(max);
              const radius=mode==="index"?(city.indexable?5:1.7):(2.5+ratio*7.5);
              const pos=point(city);
              const hot=index<3&&value>0;
              const className=[styles.point,city.indexable?styles.indexed:styles.unindexed,city.recommendation==="ACTIVATE"?styles.activate:"",hot?styles.hot:""].filter(Boolean).join(" ");
              return <g
                key={city.slug}
                className={className}
                transform={`translate(${pos.x} ${pos.y})`}
                onMouseEnter={()=>setHovered(city.slug)}
                onMouseLeave={()=>setHovered(null)}
                onFocus={()=>setHovered(city.slug)}
                onBlur={()=>setHovered(null)}
                tabIndex={0}
                role="button"
                aria-label={`${city.name}: ${metricLabel(city,mode)}`}
              >
                <circle className={styles.pointHalo} r={Math.max(5,radius*2.5)} style={{opacity:.08+ratio*.22}}/>
                <circle className={styles.pointCore} r={radius} style={{opacity:.36+ratio*.64}}/>
              </g>;
            })}
          </svg>

          {activeCity&&activePoint?<div
            className={styles.tooltip}
            style={{left:`${(activePoint.x/420)*100}%`,top:`${(activePoint.y/390)*100}%`}}
          >
            <div className={styles.tooltipTitle}><span>{activeCity.name}</span><b>{activeCity.state}</b></div>
            <strong>{metricLabel(activeCity,mode)}</strong>
            <div className={styles.tooltipGrid}>
              <span>Clicks <b>{compact(activeCity.clicks)}</b></span>
              <span>Impressions <b>{compact(activeCity.impressions)}</b></span>
              <span>Avg position <b>{activeCity.position?activeCity.position.toFixed(1):"—"}</b></span>
              <span>Demand score <b>{activeCity.score}</b></span>
            </div>
            <div className={styles.tooltipFooter}>
              <span className={activeCity.indexable?styles.goodStatus:styles.mutedStatus}>{activeCity.indexable?"INDEXABLE":"NOINDEX"}</span>
              <span>{activeCity.recommendation}</span>
            </div>
          </div>:null}
        </div>

        <div className={styles.legend}>
          <span><i className={styles.legendActive}/>Indexable / stronger signal</span>
          <span><i className={styles.legendMuted}/>Noindex / weak signal</span>
          <span>Dot size = {mode==="score"?"demand":mode==="index"?"index state":mode}</span>
        </div>
      </div>

      <aside className={styles.ranking}>
        <div className={styles.rankingHead}>
          <div><small>{mode==="index"?"INDEX COVERAGE":"TOP CITY SIGNALS"}</small><h3>{mode==="impressions"?"By impressions":mode==="clicks"?"By clicks":mode==="score"?"By demand score":"Indexable cities"}</h3></div>
          <MapPinned size={18}/>
        </div>

        <div className={styles.rows}>
          {ranking.map((city,index)=><button
            type="button"
            key={city.slug}
            className={hovered===city.slug?styles.activeRow:""}
            onMouseEnter={()=>setHovered(city.slug)}
            onMouseLeave={()=>setHovered(null)}
            onFocus={()=>setHovered(city.slug)}
            onBlur={()=>setHovered(null)}
          >
            <em>{String(index+1).padStart(2,"0")}</em>
            <span><b>{city.name}</b><small>{city.state} · {city.recommendation}</small></span>
            <strong>{metricLabel(city,mode)}</strong>
          </button>)}
        </div>

        <div className={styles.insight}>
          <small>READING THE MAP</small>
          <p><b>Traffic modes</b> use GSC page-level city URL data. <b>Demand score</b> also considers matched city queries and population. This avoids presenting search-intent signals as visitor geolocation.</p>
        </div>

        <Link className={styles.openTraffic} href="/admin/traffic">Open full Traffic & Demand →</Link>
      </aside>
    </div>
  </section>;
}
