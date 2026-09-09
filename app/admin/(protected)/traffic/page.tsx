import { buildCityDemand } from "@/lib/demand-monitor";
import { getGscConnectionStatus, getGscTrafficSnapshot } from "@/lib/gsc";

export const dynamic="force-dynamic";

function delta(current:number,previous:number){
  if(!previous)return current?100:0;
  return ((current-previous)/previous)*100;
}
function pct(value:number){return (value*100).toFixed(2)+"%";}
function n(value:number){return Math.round(value).toLocaleString("en-IN");}
function d(value:number){const sign=value>0?"+":"";return sign+value.toFixed(1)+"%";}

export default async function TrafficMonitor(){
  const status=getGscConnectionStatus();

  if(!status.configured){
    return <div className="admin-page">
      <header className="admin-page-head"><div><p className="admin-eyebrow">TRAFFIC / DEMAND</p><h1>Search demand monitor</h1><p>No fake traffic data is shown. Connect Search Console to activate this screen.</p></div><span className="admin-status warn">NOT CONNECTED</span></header>
      <section className="admin-panel">
        <h2>Google Search Console connection</h2>
        <p>Add these secrets in Cloudflare Workers. The property defaults to <code>sc-domain:panchang.in</code>.</p>
        <div className="admin-secret-list">
          <code>GOOGLE_CLIENT_ID</code>
          <code>GOOGLE_CLIENT_SECRET</code>
          <code>GOOGLE_REFRESH_TOKEN</code>
          <code>GSC_SITE_URL</code>
        </div>
        <p className="admin-muted">The OAuth account must have access to the Search Console property. After secrets are present, this page automatically switches to live data.</p>
      </section>
    </div>;
  }

  try{
    const snapshot=await getGscTrafficSnapshot();
    const demand=buildCityDemand(snapshot);
    const actionable=demand.filter(row=>row.recommendation!=="HOLD").slice(0,60);
    const topQueries=snapshot.queries.slice(0,20);
    const topPages=snapshot.pages.slice(0,20);

    return <div className="admin-page">
      <header className="admin-page-head">
        <div><p className="admin-eyebrow">TRAFFIC / DEMAND</p><h1>Search demand monitor</h1><p>{snapshot.startDate} → {snapshot.endDate} · compared with previous 28 days</p></div>
        <span className="admin-status live">LIVE GSC</span>
      </header>

      <section className="admin-kpis">
        <div className="admin-kpi"><small>Clicks</small><strong>{n(snapshot.current.clicks)}</strong><span>{d(delta(snapshot.current.clicks,snapshot.previous.clicks))} vs previous</span></div>
        <div className="admin-kpi"><small>Impressions</small><strong>{n(snapshot.current.impressions)}</strong><span>{d(delta(snapshot.current.impressions,snapshot.previous.impressions))} vs previous</span></div>
        <div className="admin-kpi"><small>CTR</small><strong>{pct(snapshot.current.ctr)}</strong><span>{d(delta(snapshot.current.ctr,snapshot.previous.ctr))} vs previous</span></div>
        <div className="admin-kpi"><small>Avg position</small><strong>{snapshot.current.position.toFixed(1)}</strong><span>GSC average</span></div>
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
          <div className="admin-mini-list">{topPages.map((row,i)=><div key={i}><span>{(row.keys?.[0]??"—").replace("https://panchang.in","")}</span><b>{n(row.impressions)} impr.</b><small>{n(row.clicks)} clicks · CTR {pct(row.ctr)}</small></div>)}</div>
        </div>
      </section>
    </div>;
  }catch(error){
    return <div className="admin-page"><header className="admin-page-head"><div><p className="admin-eyebrow">TRAFFIC / DEMAND</p><h1>Search demand monitor</h1></div><span className="admin-status danger">API ERROR</span></header><div className="admin-alert danger">{error instanceof Error?error.message:"Unable to load Search Console data."}</div></div>;
  }
}
