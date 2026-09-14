"use client";

import {useEffect,useMemo,useState} from "react";
import {RefreshCw} from "lucide-react";
import {clearSeoOperatingCache,loadSeoOperatingData,patchSeoTask,type SeoOsClientPayload} from "@/lib/admin-seo-data-client";
import {actionLabel,buildPageOpportunities,evaluateTask,type PageOpportunity,type SeoCommandAction,type SeoMetric} from "@/lib/seo-operating-system";
import type {SeoCommandTask,SeoTaskResult} from "@/lib/seo-task-store";
import styles from "./SeoOperatingSystem.module.css";

const actionOrder:SeoCommandAction[]=["DO_NOW","SCALE","FIX","ANALYZE_INTENT","WAIT","DO_NOT_TOUCH"];
function pct(value:number){return `${(value*100).toFixed(2)}%`;}
function fmtDate(value:string){return new Date(value).toLocaleDateString("uk-UA",{day:"2-digit",month:"2-digit",year:"numeric"});}
function actionTone(action:SeoCommandAction){if(action==="FIX")return styles.danger;if(action==="DO_NOW"||action==="SCALE")return styles.good;if(action==="ANALYZE_INTENT"||action==="WAIT")return styles.warn;return styles.blue;}
function baselineFor(page:PageOpportunity){return page.current7.impressions?page.current7:{impressions:page.impressions,clicks:page.clicks,ctr:page.ctr,position:page.position};}
function currentMetricForTask(task:SeoCommandTask,pages:PageOpportunity[]):SeoMetric|null{const row=pages.find(page=>page.url===task.url);return row?.current7??null;}

export default function SeoCommandCenterClient(){
  const [payload,setPayload]=useState<SeoOsClientPayload|null>(null);const [error,setError]=useState<string|null>(null);const [loading,setLoading]=useState(true);const [selected,setSelected]=useState<PageOpportunity|null>(null);const [note,setNote]=useState("");const [commitSha,setCommitSha]=useState("");const [saving,setSaving]=useState(false);const [refreshingGsc,setRefreshingGsc]=useState(false);
  async function load(force=false){setLoading(true);setError(null);try{setPayload(await loadSeoOperatingData(force));}catch(err){setError(err instanceof Error?err.message:"Unable to load SEO data.");}finally{setLoading(false);}}
  useEffect(()=>{void load(false);},[]);
  const pages=useMemo(()=>payload?buildPageOpportunities(payload.dataset,payload.tasks):[],[payload]);
  const counts=useMemo(()=>Object.fromEntries(actionOrder.map(action=>[action,pages.filter(page=>page.action===action).length])) as Record<SeoCommandAction,number>,[pages]);
  const prioritized=pages.filter(page=>page.action!=="WAIT"&&page.action!=="DO_NOT_TOUCH").slice(0,30);
  const observationTasks=payload?Object.values(payload.tasks).filter(task=>task.status!=="closed"):[];
  const restorable=payload?Object.values(payload.tasks).filter(task=>task.status==="closed"&&task.closedAt&&Date.now()-new Date(task.closedAt).getTime()<=12*60*60*1000):[];

  async function postTask(body:Record<string,unknown>){const response=await fetch("/api/admin/seo-tasks",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});const json=await response.json() as {task?:SeoCommandTask;error?:string};if(!response.ok||!json.task)throw new Error(json.error??`Task update failed (${response.status})`);patchSeoTask(json.task);setPayload(current=>current?{...current,tasks:{...current.tasks,[json.task!.id]:json.task!}}:current);return json.task;}
  async function confirmObservation(){if(!selected||saving)return;setSaving(true);setError(null);try{await postTask({action:"observe",url:selected.url,query:selected.topQuery,actionType:selected.action,recommendation:selected.concreteAction,baseline:baselineFor(selected),reviewerNote:note,commitSha});setSelected(null);setNote("");setCommitSha("");}catch(err){setError(err instanceof Error?err.message:"Unable to start observation.");}finally{setSaving(false);}}
  async function closeTask(task:SeoCommandTask,result:SeoTaskResult){if(saving)return;setSaving(true);try{await postTask({action:"close",id:task.id,result});}catch(err){setError(err instanceof Error?err.message:"Unable to close task.");}finally{setSaving(false);}}
  async function restoreTask(task:SeoCommandTask){if(saving)return;setSaving(true);try{await postTask({action:"restore",id:task.id});}catch(err){setError(err instanceof Error?err.message:"Unable to restore task.");}finally{setSaving(false);}}
  async function refreshGscNow(){
    if(refreshingGsc)return;
    setRefreshingGsc(true);setError(null);
    try{
      const response=await fetch("/api/admin/gsc-refresh",{method:"POST",cache:"no-store"});
      const json=await response.json() as {error?:string};
      if(!response.ok)throw new Error(json.error??`GSC refresh failed (${response.status})`);
      clearSeoOperatingCache();
      await load(true);
    }catch(err){setError(err instanceof Error?err.message:"Unable to refresh GSC snapshot.");}
    finally{setRefreshingGsc(false);}
  }

  if(loading&&!payload)return <div className={styles.loading}>Завантажую SEO Command Center…</div>;
  return <>
    {error?<div className={styles.error}>{error}</div>:null}
    <div className={styles.toolbar}><div><strong>Що робити прямо зараз</strong><div className={styles.note}>Daily GSC snapshot · 7d + 28d · 0 GSC API calls при відкритті · локальні scoring/trends/cannibalization · без polling · scheduled refresh 00:00 Europe/Kyiv</div></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button className={styles.actionButton} title="Разово викликає production GSC refresh і перезаписує daily snapshot. Подальші оновлення залишаються за розкладом 00:00 Europe/Kyiv." onClick={()=>void refreshGscNow()} disabled={refreshingGsc||loading}><RefreshCw size={14}/> {refreshingGsc?"Стягую GSC…":"Оновити GSC зараз"}</button><button className={styles.refresh} title="Перечитує збережений snapshot із KV; Google Search Console API не викликається." onClick={()=>void load(true)} disabled={loading||refreshingGsc}><RefreshCw size={14}/> {loading?"Оновлюю…":"Перечитати snapshot"}</button></div></div>

    <section className={styles.summaryGrid}>{actionOrder.map(action=><div className={styles.summaryCard} key={action}><small>{actionLabel(action)}</small><strong>{counts[action]}</strong></div>)}</section>

    <div className={styles.sectionTitle}><h2>ПРІОРИТЕТ №1 — роби ці задачі зверху вниз</h2><span>{prioritized.length} активних</span></div>
    <div className={styles.taskList}>{prioritized.length?prioritized.map((page,index)=><article className={styles.taskCard} key={page.url}>
      <div className={styles.taskHead}><div><div className={styles.rank}>#{index+1} · {page.priority} · SCORE {page.score}/100</div><div className={`${styles.action} ${actionTone(page.action)}`}>{actionLabel(page.action)}</div><div className={styles.taskUrl}>{page.url}</div><div className={styles.query}>Query: {page.topQuery}</div></div><span className={`${styles.badge} ${page.cannibalizationRisk!=="NONE"?styles.warn:styles.blue}`}>Cannibalization {page.cannibalizationRisk}</span></div>
      <div className={styles.metrics}><div className={styles.metric}><small>Impressions</small><b>{page.impressions.toLocaleString("en-IN")}</b></div><div className={styles.metric}><small>Position</small><b>{page.position.toFixed(1)}</b></div><div className={styles.metric}><small>CTR</small><b>{pct(page.ctr)}</b></div><div className={styles.metric}><small>7d trend</small><b>{page.trendPct===null?"—":`${page.trendPct>0?"+":""}${page.trendPct.toFixed(0)}%`}</b></div><div className={styles.metric}><small>Queries</small><b>{page.queryCount}</b></div></div>
      <div className={styles.why}><b>ЧОМУ</b><p>{page.why}</p></div><div className={styles.do}><b>ЗРОБИТИ</b><p>{page.concreteAction}</p></div>{page.internalLinkCandidates.length?<div className={styles.links}>Internal-link candidates: {page.internalLinkCandidates.join(" · ")} · перед додаванням перевір, що link ще не існує.</div>:null}
      <div className={styles.taskActions}><button className={styles.actionButton} onClick={()=>setSelected(page)}>Я ВЖЕ РЕАЛІЗУВАВ ЦЕ → почати спостереження</button></div>
    </article>):<div className={styles.empty}>Немає задач, які зараз мають достатньо evidence для активної SEO-зміни.</div>}</div>

    <div className={styles.sectionTitle}><h2>Observation / НЕ ЧІПАТИ</h2><span>{observationTasks.length}</span></div>
    <div className={styles.taskList}>{observationTasks.length?observationTasks.map(task=>{const current=currentMetricForTask(task,pages);const ready=new Date(task.verifyAt).getTime()<=Date.now();const verdict=ready?evaluateTask(task,current):null;return <article className={`${styles.taskCard} ${ready?styles.review:styles.observation}`} key={task.id}><div className={styles.taskHead}><div><div className={styles.action}>{ready?"ГОТОВО ДО REVIEW":"НЕ ЧІПАТИ"}</div><div className={styles.taskUrl}>{task.url}</div><div className={styles.query}>Query: {task.query}</div></div><span className={`${styles.badge} ${ready?styles.warn:styles.blue}`}>{ready?(verdict??"low_data").replaceAll("_"," ").toUpperCase():`до ${fmtDate(task.verifyAt)}`}</span></div><div className={styles.why}><b>BASELINE</b><p>{task.baseline.impressions} impressions · {task.baseline.clicks} clicks · {pct(task.baseline.ctr)} CTR · position {task.baseline.position.toFixed(1)}</p></div><div className={styles.do}><b>ЗМІНА</b><p>{task.recommendation}</p></div>{task.commitSha?<div className={styles.note}>Commit: {task.commitSha}</div>:null}{ready?<div className={styles.taskActions}><button className={styles.actionButton} onClick={()=>void closeTask(task,verdict??"low_data")}>Закрити цикл → дозволити нову задачу</button></div>:null}</article>;}):<div className={styles.empty}>Активних observation tasks немає.</div>}</div>

    {restorable.length?<><div className={styles.sectionTitle}><h2>Restore recent completed tasks</h2><span>останні 12 годин</span></div><div className={styles.taskList}>{restorable.map(task=><article className={styles.taskCard} key={task.id}><div className={styles.taskHead}><div><div className={styles.taskUrl}>{task.url}</div><div className={styles.query}>{task.query}</div></div><button className={styles.secondaryButton} onClick={()=>void restoreTask(task)}>Повернути в active</button></div></article>)}</div></>:null}

    {selected?<div className={styles.modalBackdrop} onMouseDown={event=>{if(event.currentTarget===event.target&&!saving)setSelected(null);}}><div className={styles.modal}><h3>Ти вже реально реалізував цю зміну на сайті?</h3><p>Ця кнопка НЕ реалізує SEO-зміну. Натискай Confirm тільки після того, як зміна реально внесена в код/контент і задеплоєна. Після цього сторінку 10 днів не чіпаємо.</p><label>Reviewer note<textarea value={note} onChange={event=>setNote(event.target.value)} placeholder="Що саме змінив?"/></label><label>Commit SHA (optional)<input value={commitSha} onChange={event=>setCommitSha(event.target.value)} placeholder="abc123…"/></label><div className={styles.modalActions}><button className={styles.secondaryButton} disabled={saving} onClick={()=>setSelected(null)}>Cancel</button><button className={styles.actionButton} disabled={saving} onClick={()=>void confirmObservation()}>{saving?"Зберігаю…":"Confirm → почати 10 днів observation"}</button></div></div></div>:null}
  </>;
}
