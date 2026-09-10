import type {SeoIndexationRunState} from "@/lib/indexation-store";
import IndexationRefreshButton from "@/components/IndexationRefreshButton";

function statusClass(status:SeoIndexationRunState["status"]){return status==="SUCCESS"?"live":status==="PARTIAL"?"warn":"danger";}
function severityClass(severity:string){return severity==="CRITICAL"||severity==="HIGH"?"hold":severity==="HEALTHY"?"active":"watch";}
function path(raw:string){try{return new URL(raw).pathname||"/";}catch{return raw;}}

export default function IndexationIntelligencePanel({state,enabled,error}:{state:SeoIndexationRunState|null;enabled:boolean;error?:string|null}){
  return <section className="admin-panel">
    <div className="admin-panel-head"><div><small>GOOGLE INDEX INSPECTION · PRIORITY SAMPLE</small><h2>Indexation & crawl intelligence</h2></div><div>{state?<span className={`admin-status ${statusClass(state.status)}`}>{state.status}</span>:<span className="admin-status warn">AWAITING RUN</span>} <IndexationRefreshButton disabled={!enabled}/></div></div>
    <p className="admin-muted">Daily Autopilot inspects a controlled priority batch: attributed shipped URLs first, then actionable existing landing pages and top GSC traffic URLs. This is Google-index inspection data, not a live URL test. Missing sitemap reporting is treated only as informational because Search Console does not guarantee that field is exhaustive.</p>
    {error?<div className="admin-alert danger">{error}</div>:null}
    {!enabled?<div className="admin-alert warn">Search Console + KV persistence must be configured before automated or manual index inspection can run.</div>:null}
    {state?<>
      <section className="admin-kpis admin-kpis-six">
        <div className="admin-kpi"><small>Inspected</small><strong>{state.summary.inspected}</strong><span>{state.candidates} priority candidates</span></div>
        <div className="admin-kpi"><small>Healthy</small><strong>{state.summary.healthy}</strong><span>{state.summary.indexedPass} PASS verdicts</span></div>
        <div className="admin-kpi"><small>Critical / High</small><strong>{state.summary.critical+state.summary.high}</strong><span>{state.summary.critical} critical · {state.summary.high} high</span></div>
        <div className="admin-kpi"><small>Canonical</small><strong>{state.summary.canonicalMismatches}</strong><span>Google/user mismatch</span></div>
        <div className="admin-kpi"><small>Crawl blocks</small><strong>{state.summary.crawlBlocks}</strong><span>robots/noindex</span></div>
        <div className="admin-kpi"><small>Fetch errors</small><strong>{state.summary.fetchErrors}</strong><span>HTTP/crawl retrieval failures</span></div>
      </section>
      <p className="admin-muted">Last inspection: {new Date(state.completedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST · {state.inspected}/{state.candidates} completed.</p>
      {state.findings.length?<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>URL</th><th>Issue</th><th>Google state</th><th>Canonical / crawl</th><th>Action</th></tr></thead><tbody>
        {state.findings.map(item=><tr key={item.url}>
          <td><strong>{path(item.url)}</strong><small>{item.source}</small></td>
          <td><span className={`admin-badge ${severityClass(item.severity)}`}>{item.severity}</span><b>{item.issue.replaceAll("_"," ")}</b></td>
          <td><small>{item.verdict} · {item.coverageState}</small><small>Fetch: {item.pageFetchState}</small><small>Indexing: {item.indexingState} · robots: {item.robotsTxtState}</small></td>
          <td><small>Google: {item.googleCanonical?path(item.googleCanonical):"—"}</small><small>Declared: {item.userCanonical?path(item.userCanonical):"—"}</small><small>{item.crawlAgeDays===null?"No crawl timestamp":`Last crawl ${item.crawlAgeDays}d ago`} · {item.sitemapCount} sitemap signal(s)</small></td>
          <td><b>{item.action}</b><small>Evidence: {item.evidence}</small></td>
        </tr>)}
      </tbody></table></div>:<p className="admin-muted">No URL inspection rows stored yet.</p>}
      {state.errors.length?<div className="admin-alert warn">{state.errors.join(" · ")}</div>:null}
    </>:<p className="admin-muted">No persisted inspection snapshot yet. It will populate after the next daily Autopilot run or a manual priority inspection.</p>}
  </section>;
}
