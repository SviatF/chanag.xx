"use client";

import {useEffect,useMemo,useState,type CSSProperties} from "react";
import {AlertTriangle,ArrowUpRight,CheckCircle2,Clock3,Gauge,Link2,RefreshCw,Search,ShieldCheck,Sparkles,Target,TrendingUp} from "lucide-react";
import {clearSeoOperatingCache,loadSeoOperatingData,patchSeoTask,type SeoOsClientPayload} from "@/lib/admin-seo-data-client";
import {actionLabel,buildPageOpportunities,evaluateTask,type PageOpportunity,type SeoCommandAction,type SeoMetric} from "@/lib/seo-operating-system";
import type {SeoCommandTask,SeoTaskResult} from "@/lib/seo-task-store";
import styles from "./SeoCommandCenter.module.css";

const actionOrder:SeoCommandAction[]=["DO_NOW","SCALE","FIX","ANALYZE_INTENT","WAIT","DO_NOT_TOUCH"];
type ActionFilter="ALL"|SeoCommandAction;
const activeFilters:ActionFilter[]=["ALL","FIX","DO_NOW","SCALE","ANALYZE_INTENT"];

function pct(value:number){return `${(value*100).toFixed(2)}%`;}
function fmtDate(value:string){return new Date(value).toLocaleDateString("uk-UA",{day:"2-digit",month:"2-digit",year:"numeric"});}
function fmtDateTime(value:string){return new Date(value).toLocaleString("uk-UA",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});}
function pathOnly(value:string){try{return new URL(value).pathname||"/";}catch{return value;}}
function baselineFor(page:PageOpportunity){return page.current7.impressions?page.current7:{impressions:page.impressions,clicks:page.clicks,ctr:page.ctr,position:page.position};}
function currentMetricForTask(task:SeoCommandTask,pages:PageOpportunity[]):SeoMetric|null{const row=pages.find(page=>page.url===task.url);return row?.current7??null;}
function actionTone(action:SeoCommandAction){if(action==="FIX")return styles.actionDanger;if(action==="DO_NOW"||action==="SCALE")return styles.actionGood;if(action==="ANALYZE_INTENT"||action==="WAIT")return styles.actionWarn;return styles.actionBlue;}
function accentTone(action:SeoCommandAction){if(action==="FIX")return styles.taskAccentDanger;if(action==="DO_NOW"||action==="SCALE")return styles.taskAccentGood;if(action==="ANALYZE_INTENT")return styles.taskAccentWarn;return "";}
function filterLabel(action:ActionFilter){if(action==="ALL")return "Усі активні";return actionLabel(action);}
function trendClass(value:number|null){if(value===null||value===0)return "";return value>0?styles.trendPositive:styles.trendNegative;}

export default function SeoCommandCenterClient(){
  const [payload,setPayload]=useState<SeoOsClientPayload|null>(null);
  const [error,setError]=useState<string|null>(null);
  const [loading,setLoading]=useState(true);
  const [selected,setSelected]=useState<PageOpportunity|null>(null);
  const [note,setNote]=useState("");
  const [commitSha,setCommitSha]=useState("");
  const [saving,setSaving]=useState(false);
  const [refreshingGsc,setRefreshingGsc]=useState(false);
  const [activeFilter,setActiveFilter]=useState<ActionFilter>("ALL");
  const [searchTerm,setSearchTerm]=useState("");

  async function load(force=false){setLoading(true);setError(null);try{setPayload(await loadSeoOperatingData(force));}catch(err){setError(err instanceof Error?err.message:"Unable to load SEO data.");}finally{setLoading(false);}}
  useEffect(()=>{void load(false);},[]);

  const pages=useMemo(()=>payload?buildPageOpportunities(payload.dataset,payload.tasks):[],[payload]);
  const counts=useMemo(()=>Object.fromEntries(actionOrder.map(action=>[action,pages.filter(page=>page.action===action).length])) as Record<SeoCommandAction,number>,[pages]);
  const prioritized=useMemo(()=>pages.filter(page=>page.action!=="WAIT"&&page.action!=="DO_NOT_TOUCH").slice(0,30),[pages]);
  const observationTasks=useMemo(()=>payload?Object.values(payload.tasks).filter(task=>task.status!=="closed"):[],[payload]);
  const restorable=useMemo(()=>payload?Object.values(payload.tasks).filter(task=>task.status==="closed"&&task.closedAt&&Date.now()-new Date(task.closedAt).getTime()<=12*60*60*1000):[],[payload]);
  const visiblePrioritized=useMemo(()=>{
    const needle=searchTerm.trim().toLowerCase();
    return prioritized.filter(page=>{
      if(activeFilter!=="ALL"&&page.action!==activeFilter)return false;
      if(!needle)return true;
      return page.url.toLowerCase().includes(needle)||page.topQuery.toLowerCase().includes(needle)||page.why.toLowerCase().includes(needle);
    });
  },[prioritized,activeFilter,searchTerm]);
  const nextAction=prioritized[0]??null;

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
  if(!payload)return <div className={styles.error}>{error??"SEO dataset unavailable."}</div>;

  const generatedAt=fmtDateTime(payload.dataset.generatedAt);
  const range=`${payload.dataset.current28d.startDate} → ${payload.dataset.current28d.endDate}`;
  const telemetry=payload.telemetry;

  return <div className={styles.shell}>
    {error?<div className={styles.error}>{error}</div>:null}

    <section className={styles.hero}>
      <div className={styles.heroMain}>
        <div className={styles.snapshotLine}><span className={styles.liveDot}/><span className={styles.snapshotLabel}>Daily snapshot ready</span><span className={styles.snapshotMeta}>оновлено {generatedAt}</span></div>
        <h2>{prioritized.length?`${prioritized.length} SEO-рішень потребують уваги`:`Активних SEO-рішень зараз немає`}</h2>
        <p className={styles.heroText}>Один екран для рішення: що міняти, чому саме зараз, який сигнал це підтверджує і коли після зміни перестати торкатися сторінки.</p>
        <div className={styles.systemMeta}>
          <span className={styles.systemPill}><ShieldCheck size={12}/><strong>0 GSC calls</strong> при відкритті</span>
          <span className={styles.systemPill}><Clock3 size={12}/><strong>00:00 Kyiv</strong> daily refresh</span>
          <span className={styles.systemPill}><Gauge size={12}/><strong>{telemetry?.cache??"HIT"}</strong> admin cache</span>
          <span className={styles.systemPill}><Target size={12}/><strong>28d</strong> {range}</span>
        </div>
      </div>
      <div className={styles.heroActions}>
        <button className={styles.primaryButton} title="Разово оновлює production GSC snapshot. Подальша робота лишається за розкладом 00:00 Europe/Kyiv." onClick={()=>void refreshGscNow()} disabled={refreshingGsc||loading}><RefreshCw size={14}/>{refreshingGsc?"Стягую GSC…":"Оновити GSC зараз"}</button>
        <button className={styles.ghostButton} title="Перечитує KV snapshot без звернення до Google Search Console API." onClick={()=>void load(true)} disabled={loading||refreshingGsc}><RefreshCw size={14}/>{loading?"Оновлюю…":"Перечитати snapshot"}</button>
      </div>
    </section>

    <section className={styles.overview}>
      <article className={styles.focusCard}>
        <div className={styles.focusTop}>
          <div>
            <div className={styles.eyebrow}>Наступний крок</div>
            <div className={styles.focusTitle}>{nextAction?pathOnly(nextAction.url):"Немає задач із достатнім evidence"}</div>
            <div className={styles.focusQuery}>{nextAction?`Query: ${nextAction.topQuery}`:"Система накопичує сигнал без зайвих змін."}</div>
          </div>
          {nextAction?<div className={styles.scoreRing} style={{"--score":`${nextAction.score}%`} as CSSProperties}><span>{nextAction.score}</span></div>:<CheckCircle2 size={34} color="#70dfa7"/>}
        </div>
        <div className={styles.focusReason}><Sparkles size={15}/><span>{nextAction?nextAction.concreteAction:"Не оптимізуй сторінки без достатнього GSC evidence. Наступний snapshot буде оновлено автоматично."}</span></div>
      </article>
      <article className={styles.kpiCard}><div className={styles.kpiIcon}><span>Виправити</span><AlertTriangle size={15}/></div><div><div className={styles.kpiValue}>{counts.FIX}</div><div className={styles.kpiNote}>канібалізація або негативний сигнал</div></div></article>
      <article className={styles.kpiCard}><div className={styles.kpiIcon}><span>Ріст</span><TrendingUp size={15}/></div><div><div className={styles.kpiValue}>{counts.DO_NOW+counts.SCALE}</div><div className={styles.kpiNote}>quick wins + сторінки, які вже варто масштабувати</div></div></article>
      <article className={styles.kpiCard}><div className={styles.kpiIcon}><span>Observation</span><ShieldCheck size={15}/></div><div><div className={styles.kpiValue}>{observationTasks.length}</div><div className={styles.kpiNote}>сторінки під lock — не чіпати до review</div></div></article>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleBlock}><h3>Активна черга рішень</h3><p>Відсортовано за priority score. Фільтри та пошук працюють локально — без API refetch.</p></div>
        <div className={styles.sectionCount}>Показано {visiblePrioritized.length} із {prioritized.length}</div>
      </div>
      <div className={styles.filterBar}>
        <div className={styles.filterChips}>{activeFilters.map(filter=><button key={filter} className={`${styles.filterChip} ${activeFilter===filter?styles.filterChipActive:""}`} onClick={()=>setActiveFilter(filter)}>{filterLabel(filter)}{filter!=="ALL"?` · ${counts[filter]}`:""}</button>)}</div>
        <label className={styles.localSearch}><Search size={13}/><input value={searchTerm} onChange={event=>setSearchTerm(event.target.value)} placeholder="URL, query або причина…"/></label>
      </div>

      <div className={styles.taskList}>{visiblePrioritized.length?visiblePrioritized.map(page=>{const globalIndex=prioritized.findIndex(item=>item.url===page.url);return <article className={styles.taskCard} key={page.url}>
        <div className={`${styles.taskAccent} ${accentTone(page.action)}`}/>
        <div className={styles.taskInner}>
          <div className={styles.taskTop}>
            <div className={styles.taskIdentity}>
              <div className={styles.taskLabels}><span className={styles.rankPill}>#{globalIndex+1} · {page.priority} · score {page.score}</span><span className={`${styles.actionPill} ${actionTone(page.action)}`}>{actionLabel(page.action)}</span>{page.cannibalizationRisk!=="NONE"?<span className={styles.riskPill}>Cannibalization {page.cannibalizationRisk}</span>:null}</div>
              <div className={styles.taskUrl}><a href={page.url} target="_blank" rel="noreferrer">{pathOnly(page.url)}</a><ArrowUpRight size={13}/></div>
              <div className={styles.taskQuery}>Головний query: <strong>{page.topQuery}</strong></div>
            </div>
            <div className={styles.metrics}>
              <div className={styles.metric}><span>Impressions</span><strong>{page.impressions.toLocaleString("en-IN")}</strong></div>
              <div className={styles.metric}><span>Position</span><strong>{page.position.toFixed(1)}</strong></div>
              <div className={styles.metric}><span>CTR</span><strong>{pct(page.ctr)}</strong></div>
              <div className={styles.metric}><span>7d trend</span><strong className={trendClass(page.trendPct)}>{page.trendPct===null?"—":`${page.trendPct>0?"+":""}${page.trendPct.toFixed(0)}%`}</strong></div>
              <div className={styles.metric}><span>Queries</span><strong>{page.queryCount}</strong></div>
            </div>
          </div>

          <div className={styles.decisionGrid}>
            <div className={styles.decision}><div className={styles.decisionHeader}><AlertTriangle size={12}/>Чому це в черзі</div><p>{page.why}</p></div>
            <div className={`${styles.decision} ${styles.decisionAction}`}><div className={styles.decisionHeader}><Target size={12}/>Що конкретно зробити</div><p>{page.concreteAction}</p></div>
          </div>

          {page.internalLinkCandidates.length?<div className={styles.linkCandidates}><Link2 size={12}/><span><strong>Internal-link candidates:</strong> {page.internalLinkCandidates.join(" · ")} · перед додаванням перевір, що link ще не існує.</span></div>:null}
          <div className={styles.taskFooter}><div className={styles.evidence}><span>28d evidence</span><span>{page.priority}</span><span>{page.cannibalizationRisk==="NONE"?"no cannibalization":"intent conflict"}</span></div><button className={styles.observeButton} onClick={()=>setSelected(page)}><CheckCircle2 size={13}/>Зміну реалізовано → observation</button></div>
        </div>
      </article>;}):<div className={styles.empty}>{prioritized.length?"За цим фільтром нічого немає.":"Немає задач, які зараз мають достатньо evidence для активної SEO-зміни."}</div>}</div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHeader}><div className={styles.sectionTitleBlock}><h3>Observation lock</h3><p>Ці сторінки вже змінили. До verify date не накладаємо нові SEO-гіпотези поверх попередньої.</p></div><div className={styles.sectionCount}>{observationTasks.length} active</div></div>
      {observationTasks.length?<div className={styles.observationGrid}>{observationTasks.map(task=>{const current=currentMetricForTask(task,pages);const ready=new Date(task.verifyAt).getTime()<=Date.now();const verdict=ready?evaluateTask(task,current):null;return <article className={`${styles.observationCard} ${ready?styles.observationReady:""}`} key={task.id}>
        <div className={styles.observationTop}><div><div className={styles.observationUrl}>{pathOnly(task.url)}</div><div className={styles.observationQuery}>Query: {task.query}</div></div><span className={styles.lockPill}>{ready?(verdict??"low_data").replaceAll("_"," ").toUpperCase():`lock до ${fmtDate(task.verifyAt)}`}</span></div>
        <div className={styles.observationBody}><div className={styles.observationMini}><span>Baseline</span><p>{task.baseline.impressions} imp · {task.baseline.clicks} clicks · {pct(task.baseline.ctr)} CTR · pos {task.baseline.position.toFixed(1)}</p></div><div className={styles.observationMini}><span>Зміна</span><p>{task.recommendation}</p></div></div>
        <div className={styles.observationFooter}><div className={styles.commit}>{task.commitSha?`Commit ${task.commitSha}`:"10-day observation cycle"}</div>{ready?<button className={styles.observeButton} onClick={()=>void closeTask(task,verdict??"low_data")}>Закрити цикл</button>:<span className={styles.lockPill}><Clock3 size={11}/>не чіпати</span>}</div>
      </article>;})}</div>:<div className={styles.empty}>Активних observation tasks немає.</div>}
    </section>

    {restorable.length?<section className={styles.section}><div className={styles.sectionHeader}><div className={styles.sectionTitleBlock}><h3>Нещодавно завершені</h3><p>Вікно відновлення задачі — 12 годин після закриття.</p></div><div className={styles.sectionCount}>{restorable.length}</div></div><div className={styles.observationGrid}>{restorable.map(task=><article className={styles.observationCard} key={task.id}><div className={styles.observationTop}><div><div className={styles.observationUrl}>{pathOnly(task.url)}</div><div className={styles.observationQuery}>{task.query}</div></div><button className={styles.restoreButton} onClick={()=>void restoreTask(task)}>Повернути в active</button></div></article>)}</div></section>:null}

    {selected?<div className={styles.modalBackdrop} onMouseDown={event=>{if(event.currentTarget===event.target&&!saving)setSelected(null);}}><div className={styles.modal}><h3>Підтвердити observation lock</h3><p>Ця дія не змінює сайт. Вона фіксує, що SEO-зміна вже реально задеплоєна, і ставить сторінку на 10 днів observation без нових втручань.</p><label>Що саме змінив?<textarea value={note} onChange={event=>setNote(event.target.value)} placeholder="Наприклад: додав 3 contextual internal links + supporting section"/></label><label>Commit SHA (optional)<input value={commitSha} onChange={event=>setCommitSha(event.target.value)} placeholder="abc123…"/></label><div className={styles.modalActions}><button className={styles.secondaryButton} disabled={saving} onClick={()=>setSelected(null)}>Скасувати</button><button className={styles.primaryButton} disabled={saving} onClick={()=>void confirmObservation()}>{saving?"Зберігаю…":"Підтвердити → 10 днів observation"}</button></div></div></div>:null}
  </div>;
}
