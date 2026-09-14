"use client";

import {useEffect,useMemo,useState} from "react";
import {RefreshCw,Search} from "lucide-react";
import {loadSeoOperatingData,type SeoOsClientPayload} from "@/lib/admin-seo-data-client";
import {buildQueryIntelligence,type QueryIntelligence,type QueryStatus} from "@/lib/seo-operating-system";
import styles from "./SeoOperatingSystem.module.css";

type Filter="ALL"|"3PLUS"|"TOP3"|"TOP10"|"TOP20"|"TOP50"|"QUICK_WIN"|"GROWING"|"DECLINING"|"CANNIBALIZATION"|"DO_NOT_TOUCH";
const PAGE_SIZE=100;
const filters:[Filter,string][]=[["ALL","Усі"],["3PLUS","3+ показів"],["TOP3","TOP 3"],["TOP10","TOP 10"],["TOP20","TOP 20"],["TOP50","TOP 50"],["QUICK_WIN","Quick wins"],["GROWING","Ростуть"],["DECLINING","Падають"],["CANNIBALIZATION","Канібалізація"],["DO_NOT_TOUCH","Не чіпати"]];

function pct(value:number){return `${(value*100).toFixed(2)}%`;}
function trend(row:QueryIntelligence){if(row.trendPct===null)return "—";return `${row.trendPct>0?"+":""}${row.trendPct.toFixed(0)}%`;}
function statusClass(status:QueryStatus){if(status==="DECLINING"||status==="CANNIBALIZATION")return styles.danger;if(status==="QUICK_WIN"||status==="GROWING")return styles.good;if(status==="DO_NOT_TOUCH")return styles.warn;return styles.blue;}
function matchesFilter(row:QueryIntelligence,filter:Filter){if(filter==="ALL")return true;if(filter==="3PLUS")return row.impressions>=3;if(filter==="TOP3")return row.position<=3;if(filter==="TOP10")return row.position<=10;if(filter==="TOP20")return row.position<=20;if(filter==="TOP50")return row.position<=50;return row.statuses.includes(filter as QueryStatus);}

export default function SeoQueriesClient(){
  const [payload,setPayload]=useState<SeoOsClientPayload|null>(null);const [error,setError]=useState<string|null>(null);const [loading,setLoading]=useState(true);const [filter,setFilter]=useState<Filter>("ALL");const [search,setSearch]=useState("");const [page,setPage]=useState(1);
  async function load(force=false){setLoading(true);setError(null);try{setPayload(await loadSeoOperatingData(force));}catch(err){setError(err instanceof Error?err.message:"Unable to load SEO data.");}finally{setLoading(false);}}
  useEffect(()=>{void load(false);},[]);
  const rows=useMemo(()=>payload?buildQueryIntelligence(payload.dataset,payload.tasks):[],[payload]);
  const filtered=useMemo(()=>{const q=search.trim().toLowerCase();return rows.filter(row=>matchesFilter(row,filter)&&(!q||row.query.toLowerCase().includes(q)||(row.landingPage??"").toLowerCase().includes(q)));},[rows,filter,search]);
  const pages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE)),safePage=Math.min(page,pages),visible=filtered.slice((safePage-1)*PAGE_SIZE,safePage*PAGE_SIZE);
  function choose(next:Filter){setFilter(next);setPage(1);}
  if(loading&&!payload)return <div className={styles.loading}>Завантажую GSC queries…</div>;
  return <>
    {error?<div className={styles.error}>{error}</div>:null}
    <div className={styles.toolbar}><div className={styles.filters}>{filters.map(([value,label])=><button key={value} className={filter===value?styles.active:""} onClick={()=>choose(value)}>{label}</button>)}</div><button className={styles.refresh} title="Перечитує збережений daily snapshot; Google Search Console API тут не викликається." onClick={()=>void load(true)} disabled={loading}><RefreshCw size={14}/> {loading?"Оновлюю…":"Перечитати snapshot"}</button></div>
    <div className={styles.toolbar}><label className={styles.search}><Search size={14}/><input value={search} onChange={event=>{setSearch(event.target.value);setPage(1);}} placeholder="Пошук по query або URL…"/></label><span className={styles.note}>{payload?`GSC final data · ${payload.dataset.current28d.startDate} → ${payload.dataset.current28d.endDate} · daily snapshot ${new Date(payload.dataset.generatedAt).toLocaleString("uk-UA")} · browser cache 5 хв${payload.telemetry?` · ${payload.telemetry.apiCalls} GSC API · ${payload.telemetry.upstreamSubrequests} storage subreq · ${payload.telemetry.latencyMs} ms`:""}`:""}</span></div>
    <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Query</th><th>Landing page</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Position</th><th>7d trend</th><th>Status</th></tr></thead><tbody>{visible.map(row=><tr key={row.query}><td><strong>{row.query}</strong>{row.landingPages.length>1?<div className={styles.note}>{row.landingPages.length} landing pages · primary share {(row.primaryShare*100).toFixed(0)}%</div>:null}</td><td className={styles.url}>{row.landingPage?<a href={row.landingPage} target="_blank" rel="noreferrer">{row.landingPage}</a>:"—"}</td><td>{row.clicks.toLocaleString("en-IN")}</td><td>{row.impressions.toLocaleString("en-IN")}</td><td>{pct(row.ctr)}</td><td>{row.position.toFixed(1)}</td><td className={row.trendPct!==null&&row.trendPct>=40?styles.trendUp:row.trendPct!==null&&row.trendPct<=-40?styles.trendDown:""}>{trend(row)}{row.positionChange!==null?<div className={styles.note}>{row.positionChange>0?"+":""}{row.positionChange.toFixed(1)} pos</div>:null}</td><td><div className={styles.statusRow}>{row.statuses.slice(0,3).map(status=><span key={status} className={`${styles.badge} ${statusClass(status)}`}>{status.replaceAll("_"," ")}</span>)}</div>{row.cannibalizationRisk!=="NONE"?<div className={styles.note}>Cannibalization: {row.cannibalizationRisk}</div>:null}</td></tr>)}</tbody></table></div>
    {!visible.length?<div className={styles.empty}>Немає queries під поточний фільтр.</div>:null}
    <div className={styles.pagination}><span>{filtered.length.toLocaleString("en-IN")} queries</span><div><button disabled={safePage<=1} onClick={()=>setPage(value=>Math.max(1,value-1))}>←</button><span>{safePage} / {pages}</span><button disabled={safePage>=pages} onClick={()=>setPage(value=>Math.min(pages,value+1))}>→</button></div></div>
  </>;
}
