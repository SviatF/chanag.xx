import Link from "next/link";
import {Activity, BarChart3, CheckCircle2, Eye, Gauge, Search, Users} from "lucide-react";
import {getGscConnectionStatus,getGscTrafficSnapshot,type GscTrafficSnapshot} from "@/lib/gsc";
import {getGa4ConnectionStatus,getGa4Snapshot,getGa4TodaySnapshot,type Ga4Snapshot,type Ga4TodaySnapshot} from "@/lib/ga4";
import {getCloudflareConnectionStatus,getCloudflareSnapshot,type CloudflareSnapshot} from "@/lib/cloudflare-analytics";
import {getLiveSitemapSnapshot,type LiveSitemapSnapshot} from "@/lib/sitemap-live";
import {getOpportunityStoreStatus} from "@/lib/opportunity-store";
import {readSeoIndexationState,type SeoIndexationRunState} from "@/lib/indexation-store";

export const dynamic="force-dynamic";

function n(value:number){return Math.round(value).toLocaleString("en-IN");}
function compact(value:number){return new Intl.NumberFormat("en-IN",{notation:"compact",maximumFractionDigits:1}).format(value);}
function pct(value:number){return `${(value*100).toFixed(2)}%`;}
function delta(current:number,previous:number){if(!previous)return current?100:0;return ((current-previous)/previous)*100;}
function deltaLabel(current:number,previous:number,inverse=false){
  const value=delta(current,previous);
  const good=inverse?value<0:value>0;
  const cls=value===0?"neutral":good?"up":"down";
  return <span className={`admin-delta ${cls}`}>{value>0?"+":""}{value.toFixed(1)}%</span>;
}
function sparkPoints(values:number[],width=540,height=150){
  if(values.length<2)return "";
  const max=Math.max(...values,1),min=Math.min(...values,0),span=Math.max(max-min,1);
  return values.map((v,i)=>`${((i/(values.length-1))*width).toFixed(1)},${(height-((v-min)/span)*(height-18)-9).toFixed(1)}`).join(" ");
}
function path(raw:string|undefined){if(!raw)return "—";try{return new URL(raw).pathname||"/";}catch{return raw;}}

export default async function AdminOverview(){
  const gscStatus=getGscConnectionStatus();
  const ga4Status=getGa4ConnectionStatus();
  const cloudflareStatus=getCloudflareConnectionStatus();
  const storage=getOpportunityStoreStatus();

  const [gscResult,todayResult,ga4Result,cloudflareResult,sitemapResult,indexationResult]=await Promise.allSettled([
    gscStatus.configured?getGscTrafficSnapshot():Promise.reject(new Error("Search Console not configured")),
    ga4Status.configured?getGa4TodaySnapshot():Promise.reject(new Error("GA4 not configured")),
    ga4Status.configured?getGa4Snapshot():Promise.reject(new Error("GA4 not configured")),
    cloudflareStatus.configured?getCloudflareSnapshot():Promise.reject(new Error("Cloudflare not configured")),
    getLiveSitemapSnapshot(),
    storage.configured?readSeoIndexationState():Promise.resolve(null),
  ]);

  const gsc:GscTrafficSnapshot|null=gscResult.status==="fulfilled"?gscResult.value:null;
  const today:Ga4TodaySnapshot|null=todayResult.status==="fulfilled"?todayResult.value:null;
  const ga4:Ga4Snapshot|null=ga4Result.status==="fulfilled"?ga4Result.value:null;
  const cloudflare:CloudflareSnapshot|null=cloudflareResult.status==="fulfilled"?cloudflareResult.value:null;
  const sitemap:LiveSitemapSnapshot|null=sitemapResult.status==="fulfilled"?sitemapResult.value:null;
  const indexation:SeoIndexationRunState|null=indexationResult.status==="fulfilled"?indexationResult.value:null;

  const gscError=gscResult.status==="rejected"&&gscStatus.configured?(gscResult.reason instanceof Error?gscResult.reason.message:"Search Console error"):null;
  const ga4Error=ga4Result.status==="rejected"&&ga4Status.configured?(ga4Result.reason instanceof Error?ga4Result.reason.message:"GA4 error"):null;
  const sitemapError=sitemapResult.status==="rejected"?(sitemapResult.reason instanceof Error?sitemapResult.reason.message:"Sitemap inventory error"):null;

  const impressions=gsc?.daily.map(row=>row.impressions)??[];
  const clicks=gsc?.daily.map(row=>row.clicks)??[];
  const impressionPoints=sparkPoints(impressions);
  const clickPoints=sparkPoints(clicks);

  const indexedSample=indexation?.summary.indexedPass??0;
  const inspected=indexation?.summary.inspected??0;
  const indexHealthyPct=inspected?indexedSample/inspected:0;
  const indexIssues=indexation?(indexation.summary.critical+indexation.summary.high+indexation.summary.fetchErrors):0;

  const actions:{tone:"critical"|"warning"|"info";title:string;detail:string;href:string}[]=[];
  if(gscError)actions.push({tone:"critical",title:"Search Console API needs attention",detail:gscError,href:"/admin/system"});
  if(ga4Error)actions.push({tone:"warning",title:"GA4 data source needs attention",detail:ga4Error,href:"/admin/monitoring"});
  if(sitemap?.failedFeeds)actions.push({tone:"warning",title:`${sitemap.failedFeeds} sitemap feed(s) unavailable`,detail:"Live sitemap inventory could not read every child feed.",href:"/admin/seo"});
  if(indexIssues)actions.push({tone:"warning",title:`${indexIssues} indexation issue(s) in inspected URLs`,detail:"Review canonical, crawl and fetch findings in SEO & Indexing.",href:"/admin/seo"});
  if(!actions.length)actions.push({tone:"info",title:"No urgent SEO actions",detail:"Traffic, sitemap inventory and inspected indexation sample are healthy.",href:"/admin/seo"});

  const topOrganicPages=(gsc?.pages??[]).slice().sort((a,b)=>b.clicks-a.clicks||b.impressions-a.impressions).slice(0,8);
  const topQueries=(gsc?.queries??[]).slice().sort((a,b)=>b.clicks-a.clicks||b.impressions-a.impressions).slice(0,8);

  return <div className="admin-page admin-overview">
    <header className="admin-page-head admin-overview-head">
      <div>
        <p className="admin-eyebrow">EXECUTIVE SEO DASHBOARD</p>
        <h1>Overview</h1>
        <p>Real traffic, organic visibility, sitemap footprint and Google indexation health.</p>
      </div>
      <div className="admin-head-meta">
        <span>LIVE OPERATING VIEW</span>
        <span className={gscError?"admin-status danger":gsc?"admin-status live":"admin-status warn"}><i/>{gscError?"GSC API error":gsc?"Search Console live":"Search Console awaiting data"}</span>
      </div>
    </header>

    <section className="admin-kpis admin-kpis-six">
      <article className="admin-kpi admin-kpi-rich"><div className="admin-kpi-icon"><Users size={19}/></div><div><small>Users today</small><strong>{today?n(today.summary.activeUsers):"—"}</strong><span>GA4 · today</span></div></article>
      <article className="admin-kpi admin-kpi-rich"><div className="admin-kpi-icon"><Activity size={19}/></div><div><small>Sessions today</small><strong>{today?n(today.summary.sessions):"—"}</strong><span>GA4 · today</span></div></article>
      <article className="admin-kpi admin-kpi-rich"><div className="admin-kpi-icon"><Eye size={19}/></div><div><small>Pageviews today</small><strong>{today?n(today.summary.screenPageViews):"—"}</strong><span>GA4 · today</span></div></article>
      <article className="admin-kpi admin-kpi-rich"><div className="admin-kpi-icon"><Search size={19}/></div><div><small>Organic clicks</small><strong>{gsc?compact(gsc.current.clicks):"—"}</strong><span>{gsc?`${gsc.startDate} → ${gsc.endDate}`:"GSC · 28d"}</span></div></article>
      <article className="admin-kpi admin-kpi-rich"><div className="admin-kpi-icon"><BarChart3 size={19}/></div><div><small>Search impressions</small><strong>{gsc?compact(gsc.current.impressions):"—"}</strong><span>GSC · last 28 available days</span></div></article>
      <article className="admin-kpi admin-kpi-rich"><div className="admin-kpi-icon"><CheckCircle2 size={19}/></div><div><small>Live sitemap URLs</small><strong>{sitemap?n(sitemap.totalUrls):"—"}</strong><span>{sitemap?`${sitemap.okFeeds}/${sitemap.feeds.length} feeds readable`:sitemapError??"Live inventory"}</span></div></article>
    </section>

    <section className="admin-kpis">
      <article className="admin-kpi"><small>Users · 28d</small><strong>{ga4?compact(ga4.current.activeUsers):"—"}</strong><span>{ga4?deltaLabel(ga4.current.activeUsers,ga4.previous.activeUsers):"GA4 unavailable"}</span></article>
      <article className="admin-kpi"><small>Sessions · 28d</small><strong>{ga4?compact(ga4.current.sessions):"—"}</strong><span>{ga4?deltaLabel(ga4.current.sessions,ga4.previous.sessions):"GA4 unavailable"}</span></article>
      <article className="admin-kpi"><small>Pageviews · 28d</small><strong>{ga4?compact(ga4.current.screenPageViews):"—"}</strong><span>{ga4?deltaLabel(ga4.current.screenPageViews,ga4.previous.screenPageViews):"GA4 unavailable"}</span></article>
      <article className="admin-kpi"><small>Edge visits · 28d</small><strong>{cloudflare?compact(cloudflare.current.visits):"—"}</strong><span>{cloudflare?deltaLabel(cloudflare.current.visits,cloudflare.previous.visits):"Cloudflare unavailable"}</span></article>
    </section>

    <section className="admin-grid-two">
      <article className="admin-panel">
        <div className="admin-panel-head"><div><small>TODAY · GA4</small><h2>Traffic today</h2><p>Actual on-site activity for the current day.</p></div><Link href="/admin/monitoring">Monitoring →</Link></div>
        {today?.pages.length?<table className="admin-compact-table"><thead><tr><th>#</th><th>Page</th><th>Views</th><th>Users</th><th>Sessions</th></tr></thead><tbody>{today.pages.slice(0,8).map((row,index)=><tr key={row.dimension}><td>{index+1}</td><td>{row.dimension}</td><td>{n(row.metrics[0]??0)}</td><td>{n(row.metrics[1]??0)}</td><td>{n(row.metrics[2]??0)}</td></tr>)}</tbody></table>:<div className="admin-empty-state"><Activity size={22}/><strong>No today traffic yet</strong><p>{todayResult.status==="rejected"?(todayResult.reason instanceof Error?todayResult.reason.message:"GA4 today error"):"GA4 has not recorded page traffic for today yet."}</p></div>}
      </article>

      <article className="admin-panel">
        <div className="admin-panel-head"><div><small>INDEXATION</small><h2>Google index health</h2><p>Full sitemap inventory plus the persisted URL Inspection sample.</p></div><Link href="/admin/seo">Full indexation →</Link></div>
        <section className="admin-kpis">
          <div className="admin-kpi"><small>Sitemap URLs</small><strong>{sitemap?n(sitemap.totalUrls):"—"}</strong><span>All current indexable feeds</span></div>
          <div className="admin-kpi"><small>Inspected</small><strong>{n(inspected)}</strong><span>Cached Google URL Inspection</span></div>
          <div className="admin-kpi"><small>Indexed PASS</small><strong>{n(indexedSample)}</strong><span>{inspected?pct(indexHealthyPct):"Awaiting inspection"}</span></div>
          <div className="admin-kpi"><small>Priority issues</small><strong>{n(indexIssues)}</strong><span>Critical/high/fetch</span></div>
        </section>
        <p className="admin-muted">The sitemap number is the full live URL inventory. Google URL Inspection is quota-limited, so indexed/not-indexed status is accumulated as a controlled sample instead of falsely claiming coverage for every sitemap URL.</p>
        {sitemap?<div className="admin-mini-list">{sitemap.feeds.map(feed=><div key={feed.name}><span>{feed.name}</span><b>{feed.ok?n(feed.urls):"ERROR"}</b><small>{feed.ok?"live URLs":feed.error}</small></div>)}</div>:null}
      </article>
    </section>

    <section className="admin-dashboard-primary">
      <article className="admin-panel admin-traffic-panel">
        <div className="admin-panel-head"><div><small>GOOGLE ORGANIC · 28D</small><h2>Search performance</h2><p>Clicks, impressions, CTR and average position.</p></div><span className="admin-period">{gsc?`${gsc.startDate} → ${gsc.endDate}`:"Awaiting GSC"}</span></div>
        {gsc?<div className="admin-traffic-body"><div className="admin-chart-wrap"><div className="admin-chart-grid"/><svg viewBox="0 0 540 150" preserveAspectRatio="none" aria-label="Google organic 28 day trend"><polyline className="admin-line impressions" points={impressionPoints}/><polyline className="admin-line clicks" points={clickPoints}/></svg><div className="admin-chart-legend"><span><i className="gold"/>Impressions</span><span><i className="green"/>Clicks</span></div></div><div className="admin-traffic-stats"><div><Search size={15}/><span><b>{compact(gsc.current.impressions)}</b><small>Impressions</small></span>{deltaLabel(gsc.current.impressions,gsc.previous.impressions)}</div><div><Gauge size={15}/><span><b>{compact(gsc.current.clicks)}</b><small>Clicks</small></span>{deltaLabel(gsc.current.clicks,gsc.previous.clicks)}</div><div><BarChart3 size={15}/><span><b>{pct(gsc.current.ctr)}</b><small>CTR</small></span>{deltaLabel(gsc.current.ctr,gsc.previous.ctr)}</div><div><Activity size={15}/><span><b>{gsc.current.position.toFixed(1)}</b><small>Avg position</small></span>{deltaLabel(gsc.current.position,gsc.previous.position,true)}</div></div></div>:<div className="admin-empty-state"><Search size={24}/><strong>Search Console data unavailable</strong><p>{gscError??"Connect Search Console to populate organic search metrics."}</p><Link href="/admin/monitoring">Open data sources →</Link></div>}
      </article>

      <article className="admin-panel admin-actions-panel">
        <div className="admin-panel-head"><div><small>ACTION CENTER</small><h2>What needs attention</h2></div><span className="admin-action-count">{actions.length}</span></div>
        <div className="admin-actions-list">{actions.slice(0,5).map((item,index)=><Link href={item.href} key={index}><span className={`admin-action-dot ${item.tone}`}>{item.tone==="info"?"i":"!"}</span><div><b>{item.title}</b><small>{item.detail}</small></div><span>→</span></Link>)}</div>
        <div className="admin-system-list">
          <div><CheckCircle2/><span>Search Console</span><b className={gsc?"ok":"missing"}>{gsc?"LIVE":"ATTENTION"}</b></div>
          <div><CheckCircle2/><span>GA4</span><b className={ga4&&today?"ok":"missing"}>{ga4&&today?"LIVE":"ATTENTION"}</b></div>
          <div><CheckCircle2/><span>Cloudflare</span><b className={cloudflare?"ok":"missing"}>{cloudflare?"LIVE":"ATTENTION"}</b></div>
          <div><CheckCircle2/><span>Sitemaps</span><b className={sitemap&&!sitemap.failedFeeds?"ok":"missing"}>{sitemap?`${sitemap.okFeeds}/${sitemap.feeds.length}`:"ATTENTION"}</b></div>
        </div>
      </article>
    </section>

    <section className="admin-grid-two">
      <article className="admin-panel"><div className="admin-panel-head"><div><small>ORGANIC LANDING PAGES</small><h2>Top pages from Google</h2></div><Link href="/admin/traffic">Traffic & Demand →</Link></div>{topOrganicPages.length?<table className="admin-compact-table"><thead><tr><th>#</th><th>Page</th><th>Clicks</th><th>Impr.</th><th>CTR</th><th>Pos.</th></tr></thead><tbody>{topOrganicPages.map((row,index)=><tr key={(row.keys?.[0]??"")+index}><td>{index+1}</td><td>{path(row.keys?.[0])}</td><td>{n(row.clicks)}</td><td>{n(row.impressions)}</td><td>{pct(row.ctr)}</td><td>{row.position.toFixed(1)}</td></tr>)}</tbody></table>:<p className="admin-muted">Organic landing page data will appear after Search Console starts returning traffic.</p>}</article>
      <article className="admin-panel"><div className="admin-panel-head"><div><small>SEARCH QUERIES</small><h2>Top queries</h2></div><Link href="/admin/traffic">All search data →</Link></div>{topQueries.length?<table className="admin-compact-table"><thead><tr><th>#</th><th>Query</th><th>Clicks</th><th>Impr.</th><th>CTR</th><th>Pos.</th></tr></thead><tbody>{topQueries.map((row,index)=><tr key={(row.keys?.[0]??"")+index}><td>{index+1}</td><td>{row.keys?.[0]??"—"}</td><td>{n(row.clicks)}</td><td>{n(row.impressions)}</td><td>{pct(row.ctr)}</td><td>{row.position.toFixed(1)}</td></tr>)}</tbody></table>:<p className="admin-muted">Query data will appear after Search Console starts returning impressions.</p>}</article>
    </section>
  </div>;
}
