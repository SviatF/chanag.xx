import Link from "next/link";
import {getGscConnectionStatus,getGscTrafficSnapshot,type GscTrafficSnapshot} from "@/lib/gsc";
import {buildSearchOpportunities,type SearchOpportunity} from "@/lib/search-opportunities";
import {getOpportunityStoreStatus,readOpportunityLifecycleMap} from "@/lib/opportunity-store";
import type {OpportunityLifecycleRecord} from "@/lib/opportunity-lifecycle";
import {readSeoIndexationState,type SeoIndexationRunState} from "@/lib/indexation-store";
import {readSeoAutopilotState,type SeoAutopilotRunState} from "@/lib/seo-autopilot-store";
import {buildSeoCommandCenter,type SeoCommandActionPriority,type SeoCommandHealth} from "@/lib/seo-command-center";

export const dynamic="force-dynamic";

function signed(value:number|null,suffix=""){return value===null?"NEW":`${value>0?"+":""}${value.toFixed(1)}${suffix}`;}
function healthClass(health:SeoCommandHealth){return health==="HEALTHY"?"live":health==="CRITICAL"?"danger":"warn";}
function priorityClass(priority:SeoCommandActionPriority){return priority==="P0"?"hold":priority==="P1"?"watch":priority==="P2"?"activate":"active";}

export default async function SeoGrowthCommandCenter(){
  const gsc=getGscConnectionStatus();
  const storage=getOpportunityStoreStatus();
  let records:Record<string,OpportunityLifecycleRecord>={};
  let snapshot:GscTrafficSnapshot|null=null;
  let opportunities:SearchOpportunity[]=[];
  let indexation:SeoIndexationRunState|null=null;
  let autopilot:SeoAutopilotRunState|null=null;
  const errors:string[]=[];

  const tasks:Promise<void>[]=[];
  if(storage.configured)tasks.push((async()=>{
    try{records=await readOpportunityLifecycleMap();}catch(error){errors.push(error instanceof Error?error.message:"Lifecycle load failed.");}
  })(),(async()=>{
    try{indexation=await readSeoIndexationState();}catch(error){errors.push(error instanceof Error?error.message:"Indexation state load failed.");}
  })(),(async()=>{
    try{autopilot=await readSeoAutopilotState();}catch(error){errors.push(error instanceof Error?error.message:"Autopilot state load failed.");}
  })());
  if(gsc.configured)tasks.push((async()=>{
    try{snapshot=await getGscTrafficSnapshot();opportunities=buildSearchOpportunities(snapshot);}catch(error){errors.push(error instanceof Error?error.message:"GSC snapshot load failed.");}
  })());
  await Promise.all(tasks);

  const model=buildSeoCommandCenter({snapshot,opportunities,records,indexation,autopilot});

  return <div className="admin-page">
    <header className="admin-page-head">
      <div><p className="admin-eyebrow">SEO / COMMAND CENTER</p><h1>Organic growth control room</h1><p>One executive view across Search Console demand, execution lifecycle, attributed implementations, outcome learning, Google index health and city expansion.</p></div>
      <span className={`admin-status ${healthClass(model.health)}`}>{model.health}</span>
    </header>

    <div className={`admin-alert ${model.health==="CRITICAL"?"danger":model.health==="ATTENTION"?"warn":""}`}><strong>{model.health}.</strong> {model.healthReason}</div>
    {errors.length?<div className="admin-alert warn"><strong>Partial data.</strong> {errors.join(" · ")}</div>:null}

    <section className="admin-kpis admin-kpis-six">
      <div className="admin-kpi"><small>Organic clicks</small><strong>{model.traffic.available?Math.round(model.traffic.clicks).toLocaleString("en-IN"):"—"}</strong><span>{model.traffic.available?`${signed(model.traffic.clicksChangePct,"%")} vs previous 28d`:"GSC unavailable"}</span></div>
      <div className="admin-kpi"><small>Impressions</small><strong>{model.traffic.available?Math.round(model.traffic.impressions).toLocaleString("en-IN"):"—"}</strong><span>{model.traffic.available?`${signed(model.traffic.impressionsChangePct,"%")} vs previous 28d`:"GSC unavailable"}</span></div>
      <div className="admin-kpi"><small>Actionable demand</small><strong>{model.opportunities.actionable}</strong><span>{model.opportunities.p0} P0 · {model.opportunities.p1} P1</span></div>
      <div className="admin-kpi"><small>Attributed launches</small><strong>{model.implementations.attributedLaunches}</strong><span>{model.implementations.unattributedLaunches} legacy/unattributed</span></div>
      <div className="admin-kpi"><small>Measured wins</small><strong>{model.outcomes.wins}</strong><span>{model.outcomes.iterations} iterate · {model.outcomes.regressions} regressed</span></div>
      <div className="admin-kpi"><small>Index health</small><strong>{model.indexation.available?`${model.indexation.healthy}/${model.indexation.inspected}`:"—"}</strong><span>{model.indexation.critical} critical · {model.indexation.high} high</span></div>
    </section>

    <section className="admin-grid-two">
      <article className="admin-panel">
        <div className="admin-panel-head"><div><small>TRAFFIC MOMENTUM</small><h2>28-day organic movement</h2></div><Link href="/admin/traffic">Traffic →</Link></div>
        {model.traffic.available?<div className="admin-mini-list">
          <div><span>Clicks</span><b>{Math.round(model.traffic.clicks).toLocaleString("en-IN")}</b><small>{signed(model.traffic.clicksChangePct,"%")} vs previous period</small></div>
          <div><span>Impressions</span><b>{Math.round(model.traffic.impressions).toLocaleString("en-IN")}</b><small>{signed(model.traffic.impressionsChangePct,"%")} vs previous period</small></div>
          <div><span>CTR</span><b>{(model.traffic.ctr*100).toFixed(2)}%</b><small>{signed(model.traffic.ctrDeltaPoints," pp")}</small></div>
          <div><span>Average position</span><b>{model.traffic.position.toFixed(1)}</b><small>{signed(model.traffic.positionImprovement)} positions improvement</small></div>
          <div><span>Window</span><b>{model.traffic.period}</b></div>
        </div>:<p className="admin-muted">Connect Search Console to populate current and previous 28-day organic movement.</p>}
      </article>

      <article className="admin-panel">
        <div className="admin-panel-head"><div><small>EXECUTION PIPELINE</small><h2>From demand to measured outcome</h2></div><Link href="/admin/opportunities">Queue →</Link></div>
        <div className="admin-flow"><span>DETECTED {model.pipeline.detected}</span><b>→</b><span>REVIEW {model.pipeline.review}</span><b>→</b><span>BUILD {model.pipeline.approved+model.pipeline.build}</span><b>→</b><span>MEASURE {model.pipeline.shipped+model.pipeline.measuring}</span><b>→</b><span>WON {model.pipeline.won}</span></div>
        <div className="admin-mini-list">
          <div><span>Total persisted</span><b>{model.pipeline.total}</b></div>
          <div><span>Outcome recommendations</span><b>{model.outcomes.wins} WON · {model.outcomes.iterations} ITERATE · {model.outcomes.regressions} REGRESSED</b></div>
          <div><span>Historical learning</span><b>{model.learning.measuredImplementations} measured implementations</b><small>{model.learning.proven} proven · {model.learning.promising} promising · {model.learning.negative} negative patterns</small></div>
          <div><span>Learning-adjusted opportunities</span><b>{model.opportunities.learningAdjusted}</b><small>Only mature historical evidence can alter ordering.</small></div>
        </div>
      </article>
    </section>

    <section className="admin-grid-two">
      <article className="admin-panel">
        <div className="admin-panel-head"><div><small>GOOGLE INDEX HEALTH</small><h2>Crawl & canonical risk</h2></div><Link href="/admin/seo">SEO control →</Link></div>
        {model.indexation.available?<div className="admin-mini-list">
          <div><span>Critical / high</span><b>{model.indexation.critical} / {model.indexation.high}</b></div>
          <div><span>Canonical mismatches</span><b>{model.indexation.canonicalMismatches}</b></div>
          <div><span>Robots / noindex blocks</span><b>{model.indexation.crawlBlocks}</b></div>
          <div><span>Fetch errors</span><b>{model.indexation.fetchErrors}</b></div>
          <div><span>Last inspection</span><b>{model.indexation.lastRun?new Date(model.indexation.lastRun).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})+" IST":"—"}</b></div>
        </div>:<p className="admin-muted">No persisted URL Inspection batch yet. The daily Autopilot or manual priority inspection will populate this block.</p>}
      </article>

      <article className="admin-panel">
        <div className="admin-panel-head"><div><small>AUTOPILOT</small><h2>Background operating state</h2></div><Link href="/admin/opportunities">Details →</Link></div>
        <div className="admin-mini-list">
          <div><span>Status</span><b>{model.autopilot.status??"AWAITING FIRST RUN"}</b></div>
          <div><span>Last completed</span><b>{model.autopilot.completedAt?new Date(model.autopilot.completedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})+" IST":"—"}</b></div>
          <div><span>Errors</span><b>{model.autopilot.errors}</b></div>
          <div><span>Scope</span><b>Demand → queue → outcomes → index inspection → learning</b><small>No automatic approval, publishing or WON closure.</small></div>
        </div>
      </article>
    </section>

    <section className="admin-panel">
      <div className="admin-panel-head"><div><small>EXECUTIVE NEXT ACTIONS</small><h2>What should be done next</h2></div><span>{model.nextActions.length} prioritized</span></div>
      {model.nextActions.length?<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Priority</th><th>Type</th><th>Action</th><th>Evidence / next move</th><th>Target</th></tr></thead><tbody>
        {model.nextActions.map(action=><tr key={action.id}><td><span className={`admin-badge ${priorityClass(action.priority)}`}>{action.priority}</span></td><td><small>{action.type.replaceAll("_"," ")}</small></td><td><strong>{action.title}</strong></td><td><small>{action.detail}</small></td><td>{action.target?<code>{action.target}</code>:"—"}</td></tr>)}
      </tbody></table></div>:<p className="admin-muted">No priority actions are currently supported by the available evidence.</p>}
    </section>

    <section className="admin-panel">
      <div className="admin-panel-head"><div><small>CONTROLLED EXPANSION</small><h2>City demand candidates</h2></div><Link href="/admin/cities">City policy →</Link></div>
      <p className="admin-muted">These cities are supported in runtime but are not currently active index cities. This table is evidence for review, not automatic activation.</p>
      {model.cityExpansion.length?<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>City</th><th>Demand</th><th>Clusters</th><th>Max opportunity</th><th>Signals</th></tr></thead><tbody>
        {model.cityExpansion.map(city=><tr key={city.slug}><td><strong>{city.city}</strong><code>{city.slug}</code></td><td><b>{Math.round(city.impressions).toLocaleString("en-IN")} impr.</b><small>{Math.round(city.clicks).toLocaleString("en-IN")} clicks</small></td><td>{city.opportunities}</td><td>{city.maxScore}/100</td><td><small>{city.statuses.join(" · ")}</small></td></tr>)}
      </tbody></table></div>:<p className="admin-muted">No non-indexed city currently has an actionable classified GSC cluster.</p>}
    </section>
  </div>;
}
