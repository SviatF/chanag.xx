import type {Metadata} from "next";
import GoldRateValidationForm from "@/components/GoldRateValidationForm";
import {getGoldRateIndexingReadiness} from "@/lib/gold-rate-readiness";

export const metadata:Metadata={title:"Gold Rate Readiness"};
export const dynamic="force-dynamic";

function money(value:number|null|undefined){return value==null?"—":new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(value);}
function pct(value:number|null|undefined){return value==null?"—":`${value.toFixed(2)}%`;}
function stamp(value:string|null|undefined){return value?new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(value)):"—";}
function check(ok:boolean,label:string,detail:string){return <div style={{display:"grid",gridTemplateColumns:"24px 1fr",gap:10,alignItems:"start",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,.08)"}}><b>{ok?"✓":"○"}</b><div><strong>{label}</strong><div className="admin-muted">{detail}</div></div></div>;}

export default async function GoldRateValidationLogPage(){
  const readiness=await getGoldRateIndexingReadiness();
  const validation=readiness.validation;
  const probe=readiness.dataProbe;
  const externalProbeDetail=probe.mode==="external-override"
    ?`${probe.endpointHost??"invalid URL"} · ${probe.reachable&&probe.validDataset?"reachable + valid dataset":probe.error??"not verified"}`
    :"Native KV mode is active; GOLD_RATE_DATA_URL external override is not configured.";

  return <div className="admin-page">
    <header className="admin-page-head">
      <div><p className="admin-eyebrow">GOLD RATE · PRE-INDEX QA</p><h1>Gold Rate validation & indexing readiness</h1><p>One screen for the 14-day IBJA accuracy log, production pipeline evidence and demand-approved city gate.</p></div>
      <div className="admin-head-meta"><span className={readiness.safety.indexingExplicitlyFalse?"admin-status live":"admin-status danger"}><i/>{readiness.safety.indexingExplicitlyFalse?"INDEXING OFF · SAFE":"CHECK INDEXING FLAG"}</span></div>
    </header>

    <section className="admin-kpis">
      <article className="admin-kpi"><small>Validation days</small><strong>{validation.elapsedDays}/{validation.minDays}</strong><span>{validation.observations} manual benchmark checks</span></article>
      <article className="admin-kpi"><small>Average deviation</small><strong>{pct(validation.averageDifferencePct)}</strong><span>target ≤ {validation.averageThresholdPct}%</span></article>
      <article className="admin-kpi"><small>Max daily deviation</small><strong>{pct(validation.maxDifferencePct)}</strong><span>hard cap ≤ {validation.singleDayThresholdPct}%</span></article>
      <article className="admin-kpi"><small>Demand-approved cities</small><strong>{readiness.demandApproval.approvedCount}</strong><span>{readiness.demandApproval.candidateCount} candidates</span></article>
    </section>

    <section className="admin-grid-two">
      <article className="admin-panel">
        <div className="admin-panel-head"><div><small>PRODUCTION CHECK</small><h2>Infrastructure evidence</h2><p>Repository/runtime checks are automatic here; Cloudflare dashboard log review remains a manual production confirmation.</p></div></div>
        {check(readiness.safety.transportReady,"Data transport",externalProbeDetail)}
        {check(readiness.kv.configured,"Cloudflare KV",readiness.kv.configured?`Namespace configured${readiness.kv.usingSharedSeoNamespace?" · shared SEO namespace with isolated key":" · dedicated Gold Rate namespace"}`:"KV account/token/namespace is incomplete")}
        {check(readiness.cronEvidence.hasThreeRuns,"Hourly cron evidence",`${readiness.cronEvidence.recentRunsObserved} persisted recent run(s). Requirement: verify 3–5 matching :17 executions in Cloudflare production logs.`)}
        {check(readiness.safety.indexingExplicitlyFalse,"Indexing safety flag",`GOLD_RATE_INDEXING_ENABLED=${readiness.safety.indexingRawValue??"(unset)"}. It must stay explicitly false until final approval.`)}
        <p className="admin-muted" style={{marginTop:12}}>Fallback behavior has regression coverage in code, but the required forced-primary-outage staging exercise must still be recorded manually before the 14-day clock is treated as production-valid.</p>
      </article>

      <article className="admin-panel">
        <div className="admin-panel-head"><div><small>PIPELINE</small><h2>Last-known execution state</h2><p>Persisted observations are operational evidence; they are not a substitute for the Cloudflare log check.</p></div></div>
        <div className="admin-mini-list">
          <div><span>Started</span><b>{stamp(readiness.pipeline.startedAt)}</b><small>pipeline state</small></div>
          <div><span>Last attempt</span><b>{stamp(readiness.pipeline.lastAttemptAt)}</b><small>scheduled/manual run</small></div>
          <div><span>Last success</span><b>{stamp(readiness.pipeline.lastSuccessAt)}</b><small>valid observation persisted</small></div>
          <div><span>Hourly observations</span><b>{readiness.pipeline.hourlyObservations}</b><small>31-day rolling store</small></div>
        </div>
        {readiness.pipeline.lastError?<p className="admin-muted">Last error: {readiness.pipeline.lastError}</p>:null}
      </article>
    </section>

    <GoldRateValidationForm/>

    <section className="admin-panel">
      <div className="admin-panel-head"><div><small>14-DAY ACCURACY LOG</small><h2>IBJA validation history</h2><p>{readiness.comparableBasis.confirmation}. GST is not mixed into the benchmark comparison.</p></div><span>{validation.passed?"PASS":"NOT READY"}</span></div>
      <div style={{overflowX:"auto"}}><table className="admin-compact-table"><thead><tr><th>Date</th><th>Calculated 24K · pre-GST / g</th><th>IBJA 999 / g</th><th>IBJA 999 / 10g</th><th>Deviation</th><th>Basis</th><th>Note</th></tr></thead><tbody>{readiness.entries.length?readiness.entries.map(entry=><tr key={entry.date}><td>{entry.date}</td><td>{money(entry.calculatedPreGst24kPerGram)}</td><td>{money(entry.ibja999PerGram)}</td><td>{money(entry.ibja999Per10g)}</td><td>{pct(entry.differencePct)}</td><td>pre-GST ↔ GST-exclusive</td><td>{entry.note}</td></tr>):<tr><td colSpan={7}>No manual IBJA validation entries yet.</td></tr>}</tbody></table></div>
    </section>

    <section className="admin-grid-two">
      <article className="admin-panel">
        <div className="admin-panel-head"><div><small>RECENT RUNS</small><h2>Last five persisted observations</h2></div></div>
        <div style={{overflowX:"auto"}}><table className="admin-compact-table"><thead><tr><th>Run time · IST</th><th>Spot source</th><th>FX source</th><th>Pre-GST 24K / g</th><th>Domestic 24K / g</th></tr></thead><tbody>{readiness.cronEvidence.runs.length?readiness.cronEvidence.runs.map(run=><tr key={run.at}><td>{stamp(run.at)}</td><td>{run.spotSource}</td><td>{run.fxSource}</td><td>{money(run.calculatedPreGst24kPerGram)}</td><td>{money(run.domestic24kPerGram)}</td></tr>):<tr><td colSpan={5}>No persisted observations yet.</td></tr>}</tbody></table></div>
      </article>

      <article className="admin-panel">
        <div className="admin-panel-head"><div><small>DEMAND GATE</small><h2>Approved city registry</h2><p>Google Trends review is intentionally manual. Population alone never approves a city.</p></div></div>
        {check(readiness.demandApproval.approvedCount>0,"At least one city approved",`${readiness.demandApproval.approvedCount}/${readiness.demandApproval.candidateCount} candidates approved`)}
        {check(readiness.demandApproval.ready,"Configured index cities are approved",readiness.demandApproval.unapprovedConfigured.length?`Unapproved in GOLD_RATE_INDEX_CITIES: ${readiness.demandApproval.unapprovedConfigured.join(", ")}`:readiness.demandApproval.configuredIndexCities.length?`${readiness.demandApproval.configuredIndexCities.length} configured cities all have approval evidence`:"GOLD_RATE_INDEX_CITIES is still empty")}
        <pre style={{whiteSpace:"pre-wrap",fontSize:12}}>{readiness.demandApproval.generatedEnv}</pre>
        <p className="admin-muted">Workflow: <code>node scripts/approve-gold-rate-cities.mjs approve mumbai --reason "high search demand" --evidence "Google Trends IN · comparison/date"</code></p>
      </article>
    </section>
  </div>;
}
