import { buildCityDemand } from "@/lib/demand-monitor";
import { getGscConnectionStatus, getGscTrafficSnapshot } from "@/lib/gsc";
import { buildSearchOpportunities,type SearchOpportunityStatus } from "@/lib/search-opportunities";

export const dynamic="force-dynamic";

function delta(current:number,previous:number){
  if(!previous)return current?100:0;
  return ((current-previous)/previous)*100;
}
function pct(value:number){return (value*100).toFixed(2)+"%";}
function n(value:number){return Math.round(value).toLocaleString("en-IN");}
function d(value:number){const sign=value>0?"+":"";return sign+value.toFixed(1)+"%";}
function statusLabel(status:SearchOpportunityStatus){return status.replaceAll("_"," ");}
function statusClass(status:SearchOpportunityStatus){
  if(status==="NEW_CLUSTER"||status==="WRONG_LANDING")return "activate";
  if(status==="STRIKING_DISTANCE"||status==="LOW_CTR")return "watch";
  if(status==="COVERED")return "active";
  return "hold";
}

export default async function TrafficMonitor(){
  const status=getGscConnectionStatus();

  if(!status.configured){
    return <div className="admin-page">
      <header className="admin-page-head"><div><p className="admin-eyebrow">TRAFFIC / DEMAND</p><h1>Search demand monitor</h1><p>No fake traffic data is shown. Connect Search Console to activate this screen.</p></div><span className="admin-status warn">NOT CONNECTED</span></header>
      <section className="admin-panel">
        <h2>Google Search Console connection</h2>
        <p>Add these secrets in Cloudflare Workers. The property defaults to <code>sc-domain:panchvani.com</code>.</p>
        <div className="admin-secret-list">
          <code>GOOGLE_SERVICE_ACCOUNT_EMAIL</code>
          <code>GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY</code>
          <code>GSC_SITE_URL</code>
        </div>
        <p className="admin-muted">The service-account email must be added to the Search Console property. After the Worker sees these variables, this page automatically switches to live data.</p>
      </section>
    </div>;
  }

  try{
    const snapshot=await getGscTrafficSnapshot();
    const demand=buildCityDemand(snapshot);
    const opportunities=buildSearchOpportunities(snapshot);
    const backlog=opportunities.filter(row=>row.status!=="COVERED"&&row.impressions>=5).slice(0,60);
    const actionable=demand.filter(row=>row.recommendation!=="HOLD").slice(0,60);
    const topQueries=snapshot.queries.slice(0,20);
    const topPages=snapshot.pages.slice(0,20);
    const newClusters=backlog.filter(row=>row.status==="NEW_CLUSTER").length;
    const wrongLanding=backlog.filter(row=>row.status==="WRONG_LANDING").length;
    const quickWins=backlog.filter(row=>row.status==="STRIKING_DISTANCE"||row.status==="LOW_CTR").length;
    const highPriority=backlog.filter(row=>row.score>=70).length;

    return <div className="admin-page">
      <header className="admin-page-head">
        <div><p className="admin-eyebrow">TRAFFIC / DEMAND</p><h1>Search demand monitor</h1><p>{snapshot.startDate} → {snapshot.endDate} · compared with previous 28 days · query-to-page mapping enabled</p></div>
        <span className="admin-status live">LIVE GSC</span>
      </header>

      <section className="admin-kpis">
        <div className="admin-kpi"><small>Clicks</small><strong>{n(snapshot.current.clicks)}</strong><span>{d(delta(snapshot.current.clicks,snapshot.previous.clicks))} vs previous</span></div>
        <div className="admin-kpi"><small>Impressions</small><strong>{n(snapshot.current.impressions)}</strong><span>{d(delta(snapshot.current.impressions,snapshot.previous.impressions))} vs previous</span></div>
        <div className="admin-kpi"><small>CTR</small><strong>{pct(snapshot.current.ctr)}</strong><span>{d(delta(snapshot.current.ctr,snapshot.previous.ctr))} vs previous</span></div>
        <div className="admin-kpi"><small>Avg position</small><strong>{snapshot.current.position.toFixed(1)}</strong><span>GSC average</span></div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head"><div><small>SEARCH DEMAND EXPANSION</small><h2>SEO opportunity backlog</h2></div><span>{backlog.length} opportunities</span></div>
        <p className="admin-muted">Built from real GSC query + landing-page pairs. The engine recommends where demand should be served; it does not publish or index new pages automatically.</p>
        <section className="admin-kpis">
          <div className="admin-kpi"><small>High priority</small><strong>{highPriority}</strong><span>Opportunity score 70+</span></div>
          <div className="admin-kpi"><small>New clusters</small><strong>{newClusters}</strong><span>Demand without a current page family</span></div>
          <div className="admin-kpi"><small>Wrong landing</small><strong>{wrongLanding}</strong><span>Google ranks a mismatched page</span></div>
          <div className="admin-kpi"><small>Quick wins</small><strong>{quickWins}</strong><span>Striking distance or low CTR</span></div>
        </section>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Intent / top query</th><th>Status</th><th>Score</th><th>Demand</th><th>Current landing</th><th>Recommended</th><th>Action</th></tr></thead><tbody>
          {backlog.length?backlog.map(row=><tr key={row.key}>
            <td><strong>{row.label}</strong><small>“{row.topQuery}” · {row.queryCount} query{row.queryCount===1?"":"ies"}{row.city?` · ${row.city}`:""}</small></td>
            <td><span className={`admin-badge ${statusClass(row.status)}`}>{statusLabel(row.status)}</span></td>
            <td><b>{row.score}/100</b><small>pos {row.position.toFixed(1)} · CTR {pct(row.ctr)}</small></td>
            <td>{n(row.impressions)} impr.<small>{n(row.clicks)} clicks</small></td>
            <td><code>{row.currentLanding??"—"}</code></td>
            <td><code>{row.recommendedPath}</code><small>{row.template}</small></td>
            <td><strong>{row.action}</strong><small>{row.reason}</small></td>
          </tr>):<tr><td colSpan={7}>No actionable demand clusters yet. The backlog will populate automatically as Search Console accumulates query data.</td></tr>}
        </tbody></table></div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head"><div><small>PROGRAMMATIC SEO</small><h2>City activation queue</h2></div><span>{actionable.length} actionable</span></div>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>City</th><th>Status</th><th>Score</th><th>Impr.</th><th>Clicks</th><th>Queries</th><th>Position</th></tr></thead><tbody>
          {actionable.map(row=><tr key={row.slug}>
            <td><strong>{row.name}</strong><small>{row.state} · {row.slug}</small></td>
            <td><span className={`admin-badge ${row.recommendation.toLowerCase()}`}>{row.recommendation}</span></td>
            <td><b>{row.score}</b></td>
            <td>{n(row.queryImpressions+row.pageImpressions)}</td>
            <td>{n(row.queryClicks+row.pageClicks)}</td>
            <td>{row.matchedQueries}</td>
            <td>{row.averagePosition?row.averagePosition.toFixed(1):"—"}</td>
          </tr>)}
        </tbody></table></div>
      </section>

      <section className="admin-grid-two">
        <div className="admin-panel"><div className="admin-panel-head"><div><small>DISCOVERY</small><h2>Top queries</h2></div></div>
          <div className="admin-mini-list">{topQueries.map((row,i)=><div key={i}><span>{row.keys?.[0]??"—"}</span><b>{n(row.impressions)} impr.</b><small>{n(row.clicks)} clicks · pos {row.position.toFixed(1)}</small></div>)}</div>
        </div>
        <div className="admin-panel"><div className="admin-panel-head"><div><small>LANDING PAGES</small><h2>Top pages</h2></div></div>
          <div className="admin-mini-list">{topPages.map((row,i)=><div key={i}><span>{(row.keys?.[0]??"—").replace("https://panchvani.com","")}</span><b>{n(row.impressions)} impr.</b><small>{n(row.clicks)} clicks · CTR {pct(row.ctr)}</small></div>)}</div>
        </div>
      </section>
    </div>;
  }catch(error){
    return <div className="admin-page"><header className="admin-page-head"><div><p className="admin-eyebrow">TRAFFIC / DEMAND</p><h1>Search demand monitor</h1></div><span className="admin-status danger">API ERROR</span></header><div className="admin-alert danger">{error instanceof Error?error.message:"Unable to load Search Console data."}</div></div>;
  }
}
