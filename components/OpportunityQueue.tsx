"use client";

import {useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import type {SearchOpportunity} from "@/lib/search-opportunities";
import {
  lifecycleForOpportunity,
  nextOpportunityStages,
  opportunityContext,
  opportunityMetrics,
  type OpportunityLifecycleRecord,
  type OpportunityStage
} from "@/lib/opportunity-lifecycle";
import {latestOutcomeCheckpoint,nextOutcomeCheckpoint} from "@/lib/outcome-intelligence";

type Props={
  opportunities:SearchOpportunity[];
  records:Record<string,OpportunityLifecycleRecord>;
  storageConfigured:boolean;
  storageError?:string|null;
};

type Draft={owner:string;note:string};
type QueueRow={key:string;opportunity:SearchOpportunity|null;record:OpportunityLifecycleRecord};

const stageClass:Record<OpportunityStage,string>={
  DETECTED:"hold",REVIEW:"watch",APPROVED:"activate",BUILD:"activate",SHIPPED:"active",MEASURING:"watch",WON:"active",REJECTED:"hold"
};

function stageLabel(stage:OpportunityStage){return stage.replaceAll("_"," ");}
function n(value:number){return Math.round(value).toLocaleString("en-IN");}
function pct(value:number){return `${(value*100).toFixed(2)}%`;}
function signed(value:number,suffix=""){return `${value>0?"+":""}${value.toFixed(1)}${suffix}`;}
function percentChange(value:number|null){return value===null?"NEW":signed(value,"%");}
function outcomeClass(signal:"WINNING"|"MIXED"|"DOWN"|"NO_DATA"){
  if(signal==="WINNING")return "active";
  if(signal==="DOWN")return "hold";
  return "watch";
}

export default function OpportunityQueue({opportunities,records,storageConfigured,storageError}:Props){
  const router=useRouter();
  const [busy,setBusy]=useState<string|null>(null);
  const [error,setError]=useState<string|null>(storageError??null);
  const [drafts,setDrafts]=useState<Record<string,Draft>>(()=>Object.fromEntries(Object.entries(records).map(([key,row])=>[key,{owner:row.owner,note:row.note}])));

  const rows=useMemo(()=>{
    const current=new Map(opportunities.map(item=>[item.key,item]));
    const active:QueueRow[]=opportunities
      .filter(item=>item.status!=="COVERED"||Boolean(records[item.key]))
      .map(item=>({key:item.key,opportunity:item,record:lifecycleForOpportunity(item.key,records[item.key])}));
    for(const [key,record] of Object.entries(records)){
      if(current.has(key))continue;
      active.push({key,opportunity:null,record});
    }
    const order:Record<OpportunityStage,number>={REVIEW:0,APPROVED:1,BUILD:2,SHIPPED:3,MEASURING:4,DETECTED:5,WON:6,REJECTED:7};
    return active.sort((a,b)=>order[a.record.stage]-order[b.record.stage]||((b.opportunity?.score??0)-(a.opportunity?.score??0))||a.key.localeCompare(b.key));
  },[opportunities,records]);

  function draftFor(key:string,record:OpportunityLifecycleRecord){return drafts[key]??{owner:record.owner,note:record.note};}
  function setDraft(key:string,record:OpportunityLifecycleRecord,field:keyof Draft,value:string){
    setDrafts(current=>({...current,[key]:{...draftFor(key,record),[field]:value}}));
  }

  async function save(row:QueueRow,stage:OpportunityStage){
    if(!storageConfigured||busy)return;
    setBusy(row.key);setError(null);
    const draft=draftFor(row.key,row.record);
    const opportunity=row.opportunity;
    try{
      const response=await fetch("/api/admin/opportunities",{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({
          key:row.key,
          stage,
          owner:draft.owner,
          note:draft.note,
          expectedUpdatedAt:records[row.key]?.updatedAt,
          metrics:opportunity?opportunityMetrics(opportunity):undefined,
          context:opportunity?opportunityContext(opportunity):row.record.context
        })
      });
      const json=await response.json() as {error?:string};
      if(!response.ok)throw new Error(json.error??`Update failed (${response.status})`);
      router.refresh();
    }catch(err){setError(err instanceof Error?err.message:"Unable to update opportunity.");}
    finally{setBusy(null);}
  }

  const counts=rows.reduce((map,row)=>{map[row.record.stage]=(map[row.record.stage]??0)+1;return map;},{} as Partial<Record<OpportunityStage,number>>);
  const latestOutcomes=rows.map(row=>latestOutcomeCheckpoint(row.record)).filter(Boolean);
  const recommendedWins=latestOutcomes.filter(item=>item?.recommendation==="WON").length;
  const needsIteration=latestOutcomes.filter(item=>item?.recommendation==="ITERATE"||item?.recommendation==="REGRESSED").length;

  return <>
    {!storageConfigured?<div className="admin-alert warn"><strong>Lifecycle persistence is not connected.</strong> Add <code>SEO_OPPORTUNITY_KV_NAMESPACE_ID</code> and ensure the existing Cloudflare API token has Workers KV Storage read/write permission. Detected opportunities remain visible below, but status changes and exact outcome history are disabled until storage is connected.</div>:null}
    {error?<div className="admin-alert danger">{error}</div>:null}

    <section className="admin-kpis">
      <div className="admin-kpi"><small>Review</small><strong>{counts.REVIEW??0}</strong><span>Needs decision</span></div>
      <div className="admin-kpi"><small>Approved / Build</small><strong>{(counts.APPROVED??0)+(counts.BUILD??0)}</strong><span>Execution pipeline</span></div>
      <div className="admin-kpi"><small>Outcome wins</small><strong>{recommendedWins}</strong><span>Latest checkpoint recommends WON</span></div>
      <div className="admin-kpi"><small>Needs iteration</small><strong>{needsIteration}</strong><span>ITERATE or REGRESSED</span></div>
    </section>

    <section className="admin-panel">
      <div className="admin-panel-head"><div><small>SEO EXECUTION + OUTCOME INTELLIGENCE</small><h2>Opportunity lifecycle queue</h2></div><span>{rows.length} tracked / detected</span></div>
      <p className="admin-muted">Detected opportunities come from live GSC demand. After SHIPPED, Panchvani stores exact equal-length pre/post Search Console windows at 14, 28 and 56 days. A WON recommendation never changes lifecycle automatically; final closure remains a human decision.</p>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Opportunity</th><th>Demand</th><th>Lifecycle</th><th>Outcome intelligence</th><th>Owner / note</th><th>Next action</th></tr></thead><tbody>
        {rows.map(row=>{
          const item=row.opportunity;
          const context=item?opportunityContext(item):row.record.context;
          const outcome=latestOutcomeCheckpoint(row.record);
          const nextCheckpoint=nextOutcomeCheckpoint(row.record);
          const draft=draftFor(row.key,row.record);
          const next=nextOpportunityStages(row.record.stage);
          return <tr key={row.key}>
            <td><strong>{context?.label??row.key}</strong><small>{context?.topQuery?`“${context.topQuery}”`:"Outside current GSC window"}{context?.city?` · ${context.city}`:""}</small><code>{context?.recommendedPath??"—"}</code></td>
            <td>{item?<><b>{item.score}/100</b><small>{n(item.impressions)} impr. · {n(item.clicks)} clicks</small><small>pos {item.position.toFixed(1)} · CTR {pct(item.ctr)}</small></>:<small>No current 28-day discovery row</small>}</td>
            <td><span className={`admin-badge ${stageClass[row.record.stage]}`}>{stageLabel(row.record.stage)}</span><small>{row.record.updatedAt?new Date(row.record.updatedAt).toLocaleDateString("en-IN"):""}</small>{row.record.history.length?<small>{row.record.history.length} transition{row.record.history.length===1?"":"s"}</small>:null}</td>
            <td>{outcome?<>
              <span className={`admin-badge ${outcomeClass(outcome.signal)}`}>{outcome.days}D · {outcome.signal}</span>
              <b>{outcome.score}/100 · {outcome.recommendation.replaceAll("_"," ")}</b>
              <small>Landing {outcome.landingAligned?"aligned ✓":"misaligned"} · {outcome.post.startDate} → {outcome.post.endDate}</small>
              <small>Clicks {percentChange(outcome.clicksChangePct)} · Impr. {percentChange(outcome.impressionsChangePct)}</small>
              <small>CTR {signed(outcome.ctrDeltaPoints," pp")} · Position {outcome.positionImprovement===null?"—":signed(outcome.positionImprovement)}</small>
              <small>{outcome.reason}</small>
              {(row.record.outcomes?.length??0)>1?<small>History: {row.record.outcomes!.map(item=>`${item.days}d ${item.score}/100 ${item.signal}`).join(" · ")}</small>:null}
              {nextCheckpoint?<small>Next: {nextCheckpoint.days}d checkpoint {nextCheckpoint.due?"due now":`after ${nextCheckpoint.readyAt}`}</small>:<small>14/28/56d measurement cycle complete.</small>}
            </>:row.record.shippedAt&&nextCheckpoint?<>
              <span className="admin-badge watch">AWAITING {nextCheckpoint.days}D</span>
              <small>Exact post-launch window will be evaluated after {nextCheckpoint.readyAt}, including the GSC final-data lag.</small>
              <small>Launch: {row.record.shippedAt.slice(0,10)}</small>
            </>:row.record.baseline?<small>Launch baseline captured. Exact checkpoint schedule starts after SHIPPED.</small>:<small>Outcome tracking begins when this opportunity moves to SHIPPED.</small>}</td>
            <td><input value={draft.owner} onChange={event=>setDraft(row.key,row.record,"owner",event.target.value)} placeholder="Owner" disabled={!storageConfigured||busy===row.key}/><textarea value={draft.note} onChange={event=>setDraft(row.key,row.record,"note",event.target.value)} placeholder="Decision / build note" rows={2} disabled={!storageConfigured||busy===row.key}/><button type="button" className="admin-badge watch" disabled={!storageConfigured||busy===row.key} onClick={()=>save(row,row.record.stage)}>Save note</button></td>
            <td><div className="admin-mini-list">{next.map(stage=>{
              const recommendation=outcome?.recommendation;
              const hint=stage==="SHIPPED"?"Capture launch baseline and start exact checkpoints":stage==="MEASURING"?"Keep lifecycle in post-launch measurement":stage==="WON"?(recommendation==="WON"?"Outcome Intelligence recommends this closure":"Human override: close as validated win"):stage==="BUILD"&&(recommendation==="ITERATE"||recommendation==="REGRESSED")?"Outcome Intelligence recommends another iteration":"Move lifecycle";
              return <button type="button" key={stage} disabled={!storageConfigured||busy===row.key} onClick={()=>save(row,stage)}><b>{stageLabel(stage)}</b><small>{hint}</small></button>;
            })}</div></td>
          </tr>;
        })}
        {!rows.length?<tr><td colSpan={6}>No detected or persisted SEO opportunities yet.</td></tr>:null}
      </tbody></table></div>
    </section>
  </>;
}
