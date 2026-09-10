import { Activity, BarChart3, Cloud, Search } from "lucide-react";
import { getGscConnectionStatus, getGscTrafficSnapshot } from "@/lib/gsc";
import { getGa4ConnectionStatus, getGa4Snapshot } from "@/lib/ga4";
import { getCloudflareConnectionStatus, getCloudflareSnapshot } from "@/lib/cloudflare-analytics";

export const dynamic="force-dynamic";

function compact(value:number){
  return new Intl.NumberFormat("en-IN",{notation:"compact",maximumFractionDigits:1}).format(value);
}
function pct(value:number){return `${(value*100).toFixed(1)}%`}
function duration(seconds:number){
  if(!seconds)return "0s";
  const m=Math.floor(seconds/60),s=Math.round(seconds%60);
  return m?`${m}m ${s}s`:`${s}s`;
}
function bytes(value:number){
  if(value<1024)return `${value} B`;
  const units=["KB","MB","GB","TB"];
  let n=value/1024,index=0;
  while(n>=1024&&index<units.length-1){n/=1024;index++}
  return `${n.toFixed(n>=100?0:n>=10?1:2)} ${units[index]}`;
}

export default async function Monitoring(){
  const gscStatus=getGscConnectionStatus();
  const ga4Status=getGa4ConnectionStatus();
  const cfStatus=getCloudflareConnectionStatus();

  const [gscResult,ga4Result,cfResult]=await Promise.allSettled([
    gscStatus.configured?getGscTrafficSnapshot():Promise.reject(new Error("Not configured")),
    ga4Status.configured?getGa4Snapshot():Promise.reject(new Error("Not configured")),
    cfStatus.configured?getCloudflareSnapshot():Promise.reject(new Error("Not configured")),
  ]);

  const gsc=gscResult.status==="fulfilled"?gscResult.value:null;
  const ga4=ga4Result.status==="fulfilled"?ga4Result.value:null;
  const cloudflare=cfResult.status==="fulfilled"?cfResult.value:null;

  const sourceCards=[
    {
      name:"Google Search Console",
      Icon:Search,
      live:Boolean(gsc),
      configured:gscStatus.configured,
      detail:gsc?`${compact(gsc.current.clicks)} clicks · ${compact(gsc.current.impressions)} impressions`:gscResult.status==="rejected"&&gscStatus.configured?gscResult.reason?.message:"Queries · pages · clicks · impressions · CTR · position",
    },
    {
      name:"Google Analytics 4",
      Icon:BarChart3,
      live:Boolean(ga4),
      configured:ga4Status.configured,
      detail:ga4?`${compact(ga4.current.activeUsers)} active users · ${compact(ga4.current.sessions)} sessions`:ga4Result.status==="rejected"&&ga4Status.configured?ga4Result.reason?.message:"Users · sessions · engagement · key events · landing pages",
    },
    {
      name:"Cloudflare Analytics",
      Icon:Cloud,
      live:Boolean(cloudflare),
      configured:cfStatus.configured,
      detail:cloudflare?`${compact(cloudflare.current.requests)} requests · ${compact(cloudflare.current.visits)} visits`:cfResult.status==="rejected"&&cfStatus.configured?cfResult.reason?.message:"Requests · visits · bandwidth · countries · paths · status codes",
    },
  ];

  return <div className="admin-page">
    <header className="admin-page-head">
      <div><p className="admin-eyebrow">OBSERVABILITY</p><h1>Monitoring</h1><p>Search, behavior and edge telemetry in one live control surface.</p></div>
      <span className={(gsc&&ga4&&cloudflare)?"admin-status live":"admin-status warn"}><i/>{[gsc,ga4,cloudflare].filter(Boolean).length}/3 live sources</span>
    </header>

    <section className="admin-source-cards">
      {sourceCards.map(({name,Icon,live,configured,detail})=><article className="admin-source-card" key={name}>
        <div className="admin-source-icon"><Icon size={20}/></div>
        <div><small>DATA SOURCE</small><h2>{name}</h2><p>{detail}</p></div>
        <span className={live?"admin-status live":configured?"admin-status danger":"admin-status warn"}><i/>{live?"LIVE":configured?"API ERROR":"NOT CONFIGURED"}</span>
      </article>)}
    </section>

    {ga4?<>
      <section className="admin-kpis">
        <div className="admin-kpi"><small>GA4 active users</small><strong>{compact(ga4.current.activeUsers)}</strong><span>Last 28 days</span></div>
        <div className="admin-kpi"><small>Sessions</small><strong>{compact(ga4.current.sessions)}</strong><span>{compact(ga4.current.engagedSessions)} engaged</span></div>
        <div className="admin-kpi"><small>Engagement rate</small><strong>{pct(ga4.current.engagementRate)}</strong><span>{duration(ga4.current.averageSessionDuration)} avg session</span></div>
        <div className="admin-kpi"><small>Key events</small><strong>{compact(ga4.current.keyEvents)}</strong><span>{compact(ga4.current.eventCount)} total events</span></div>
      </section>
      <section className="admin-grid-two">
        <article className="admin-panel">
          <div className="admin-panel-head"><div><small>GA4</small><h2>Top landing pages</h2></div><span>{ga4.startDate} → {ga4.endDate}</span></div>
          <table className="admin-compact-table"><thead><tr><th>#</th><th>Landing page</th><th>Sessions</th><th>Users</th><th>Engagement</th></tr></thead><tbody>
            {ga4.landingPages.slice(0,8).map((row,index)=><tr key={row.dimension}><td>{index+1}</td><td>{row.dimension}</td><td>{compact(row.metrics[0]??0)}</td><td>{compact(row.metrics[1]??0)}</td><td>{pct(row.metrics[2]??0)}</td></tr>)}
          </tbody></table>
        </article>
        <article className="admin-panel">
          <div className="admin-panel-head"><div><small>GA4</small><h2>Audience distribution</h2></div></div>
          <div className="admin-grid-two">
            <div><p className="admin-eyebrow">TOP COUNTRIES</p><div className="admin-mini-list">{ga4.countries.slice(0,7).map(row=><div key={row.dimension}><span>{row.dimension}</span><b>{compact(row.metrics[0]??0)} users</b><small>{compact(row.metrics[1]??0)} sessions</small></div>)}</div></div>
            <div><p className="admin-eyebrow">DEVICES</p><div className="admin-mini-list">{ga4.devices.map(row=><div key={row.dimension}><span>{row.dimension}</span><b>{compact(row.metrics[0]??0)} users</b><small>{compact(row.metrics[1]??0)} sessions</small></div>)}</div></div>
          </div>
        </article>
      </section>
    </>:null}

    {cloudflare?<>
      <section className="admin-kpis">
        <div className="admin-kpi"><small>Edge requests</small><strong>{compact(cloudflare.current.requests)}</strong><span>Real client requests · 28d</span></div>
        <div className="admin-kpi"><small>Cloudflare visits</small><strong>{compact(cloudflare.current.visits)}</strong><span>Referral/direct visit model</span></div>
        <div className="admin-kpi"><small>Data transfer</small><strong>{bytes(cloudflare.current.bytes)}</strong><span>Edge response bytes</span></div>
        <div className="admin-kpi"><small>Tracked status groups</small><strong>{cloudflare.statusCodes.length}</strong><span>HTTP response codes</span></div>
      </section>
      <section className="admin-grid-two">
        <article className="admin-panel">
          <div className="admin-panel-head"><div><small>CLOUDFLARE EDGE</small><h2>Top request paths</h2></div></div>
          <table className="admin-compact-table"><thead><tr><th>#</th><th>Path</th><th>Requests</th><th>Visits</th><th>Transfer</th></tr></thead><tbody>
            {cloudflare.paths.slice(0,10).map((row,index)=><tr key={row.dimension}><td>{index+1}</td><td>{row.dimension}</td><td>{compact(row.requests)}</td><td>{compact(row.visits)}</td><td>{bytes(row.bytes)}</td></tr>)}
          </tbody></table>
        </article>
        <article className="admin-panel">
          <div className="admin-panel-head"><div><small>CLOUDFLARE EDGE</small><h2>Countries & response health</h2></div></div>
          <div className="admin-grid-two">
            <div><p className="admin-eyebrow">TOP COUNTRIES</p><div className="admin-mini-list">{cloudflare.countries.slice(0,8).map(row=><div key={row.dimension}><span>{row.dimension}</span><b>{compact(row.requests)} req.</b><small>{compact(row.visits)} visits</small></div>)}</div></div>
            <div><p className="admin-eyebrow">STATUS CODES</p><div className="admin-mini-list">{cloudflare.statusCodes.slice(0,10).map(row=><div key={row.dimension}><span>HTTP {row.dimension}</span><b>{compact(row.requests)}</b><small>requests</small></div>)}</div></div>
          </div>
        </article>
      </section>
    </>:null}

    <section className="admin-panel">
      <div className="admin-panel-head"><div><small>UNIFIED HEALTH MODEL</small><h2>Cross-source observability</h2></div><Activity size={17}/></div>
      <p>Search Console measures organic discovery, GA4 measures on-site behavior, and Cloudflare measures edge delivery. The control plane now keeps these layers separate so a traffic drop can be diagnosed as demand, behavior, indexing, or infrastructure instead of being treated as one generic metric.</p>
    </section>
  </div>;
}
