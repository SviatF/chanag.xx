import Link from "next/link";
import type { CSSProperties } from "react";
import {
  Activity, AlertTriangle, BarChart3, CalendarDays, CheckCircle2,
  Database, FileText, Gauge, Layers3, MapPin, Search, ShieldCheck, Sparkles
} from "lucide-react";
import { allFestivals } from "@/lib/festivals";
import { cityCandidates } from "@/lib/city-candidates";
import { coreCities, supportedCities } from "@/lib/cities";
import { muhuratRules } from "@/lib/muhurat";
import { phase1PriorityCities } from "@/lib/seo-policy";
import { getGscConnectionStatus, getGscTrafficSnapshot, type GscTrafficSnapshot } from "@/lib/gsc";
import { buildCityDemand } from "@/lib/demand-monitor";
import { getDataSourceStatus } from "@/lib/data-sources";

export const dynamic="force-dynamic";

function n(value:number){
  return Math.round(value).toLocaleString("en-IN");
}
function compact(value:number){
  return new Intl.NumberFormat("en-IN",{notation:"compact",maximumFractionDigits:1}).format(value);
}
function pct(value:number){
  return (value*100).toFixed(2)+"%";
}
function delta(current:number,previous:number){
  if(!previous)return current?100:0;
  return ((current-previous)/previous)*100;
}
function deltaLabel(current:number,previous:number,inverse=false){
  const value=delta(current,previous);
  const good=inverse?value<0:value>0;
  const cls=value===0?"neutral":good?"up":"down";
  return <span className={`admin-delta ${cls}`}>{value>0?"+":""}{value.toFixed(1)}%</span>;
}
function sparkPoints(values:number[],width=540,height=150){
  if(values.length<2)return "";
  const max=Math.max(...values,1);
  const min=Math.min(...values,0);
  const span=Math.max(max-min,1);
  return values.map((v,i)=>{
    const x=(i/(values.length-1))*width;
    const y=height-((v-min)/span)*(height-18)-9;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

export default async function AdminOverview(){
  const gsc=getGscConnectionStatus();
  const sources=getDataSourceStatus();
  let snapshot:GscTrafficSnapshot|null=null;
  let gscError:string|null=null;

  if(gsc.configured){
    try{ snapshot=await getGscTrafficSnapshot(); }
    catch(error){ gscError=error instanceof Error?error.message:"Unable to read Search Console."; }
  }

  const demand=snapshot?buildCityDemand(snapshot):[];
  const opportunity=demand.filter(row=>row.recommendation==="ACTIVATE"||row.recommendation==="WATCH");
  const topCities=demand.filter(row=>row.queryImpressions+row.pageImpressions>0).slice(0,8);
  const cityMap=new Map(supportedCities.map(city=>[city.slug,city]));
  const priorityPercent=Math.round((phase1PriorityCities.length/supportedCities.length)*100);
  const latestFestival=allFestivals
    .filter(item=>item.date>=new Date().toISOString().slice(0,10))
    .sort((a,b)=>a.date.localeCompare(b.date))
    .slice(0,3);

  const kpis=[
    {label:"Supported Cities",value:supportedCities.length,meta:"Live runtime coverage",Icon:BarChart3},
    {label:"Core Cities",value:coreCities.length,meta:"Curated navigation",Icon:MapPin},
    {label:"Priority Indexed",value:phase1PriorityCities.length,meta:"Phase-1 allowlist",Icon:Database},
    {label:"Candidate Pool",value:cityCandidates.length,meta:"Demand activation candidates",Icon:Layers3},
    {label:"Festival Records",value:allFestivals.length,meta:"2026–2027 database",Icon:CalendarDays},
    {label:"Muhurat Rules",value:Object.keys(muhuratRules).length,meta:"Rule engine active",Icon:FileText},
  ];

  const impressions=snapshot?.daily.map(row=>row.impressions)??[];
  const clicks=snapshot?.daily.map(row=>row.clicks)??[];
  const impressionPoints=sparkPoints(impressions);
  const clickPoints=sparkPoints(clicks);

  const actions:{tone:"critical"|"warning"|"info";title:string;detail:string;href:string}[]=[];
  if(gscError)actions.push({tone:"critical",title:"Search Console API needs attention",detail:gscError,href:"/admin/system"});
  if(!gsc.configured)actions.push({tone:"critical",title:"Connect Google Search Console",detail:"Live traffic and demand scoring are unavailable.",href:"/admin/monitoring"});
  if(opportunity.length)actions.push({tone:"warning",title:`${opportunity.length} cities show search opportunity`,detail:"Review demand score before expanding the priority index set.",href:"/admin/traffic"});
  if(!sources.ga4.configured)actions.push({tone:"info",title:"Connect GA4 behavioral analytics",detail:"Sessions, engagement, conversions and user journeys are not yet available.",href:"/admin/monitoring"});
  if(!sources.cloudflare.configured)actions.push({tone:"info",title:"Connect Cloudflare Analytics",detail:"Edge traffic, cache, bots, errors and request health are not yet available.",href:"/admin/monitoring"});
  if(!actions.length)actions.push({tone:"info",title:"No critical control-plane actions",detail:"Core data sources are configured.",href:"/admin/system"});

  return <div className="admin-page admin-overview">
    <header className="admin-page-head admin-overview-head">
      <div>
        <p className="admin-eyebrow">CONTROL PLANE</p>
        <h1>Overview</h1>
        <p>Real-time insights, search demand and system health for the Panchvani network.</p>
      </div>
      <div className="admin-head-meta">
        <span>DHARMA · DATA · A BRIGHTER TOMORROW</span>
        <span className={gscError?"admin-status danger":gsc.configured?"admin-status live":"admin-status warn"}>
          <i/>{gscError?"GSC API error":gsc.configured?"Search Console connected":"Search Console awaiting connection"}
        </span>
      </div>
    </header>

    <section className="admin-kpis admin-kpis-six">
      {kpis.map(({label,value,meta,Icon})=><article className="admin-kpi admin-kpi-rich" key={label}>
        <div className="admin-kpi-icon"><Icon size={19} strokeWidth={1.5}/></div>
        <div><small>{label}</small><strong>{n(value)}</strong><span>{meta}</span></div>
      </article>)}
    </section>

    <section className="admin-dashboard-primary">
      <article className="admin-panel admin-traffic-panel">
        <div className="admin-panel-head">
          <div><small>SEARCH INTELLIGENCE</small><h2>Search Demand & Traffic</h2><p>Organic search performance across Panchvani pages.</p></div>
          <span className="admin-period">Last 28 days</span>
        </div>
        {snapshot?<div className="admin-traffic-body">
          <div className="admin-chart-wrap">
            <div className="admin-chart-grid"/>
            <svg viewBox="0 0 540 150" preserveAspectRatio="none" aria-label="Search Console 28 day trend">
              <polyline className="admin-line impressions" points={impressionPoints}/>
              <polyline className="admin-line clicks" points={clickPoints}/>
            </svg>
            <div className="admin-chart-legend"><span><i className="gold"/>Impressions</span><span><i className="green"/>Clicks</span></div>
          </div>
          <div className="admin-traffic-stats">
            <div><Search size={15}/><span><b>{compact(snapshot.current.impressions)}</b><small>Total impressions</small></span>{deltaLabel(snapshot.current.impressions,snapshot.previous.impressions)}</div>
            <div><Gauge size={15}/><span><b>{compact(snapshot.current.clicks)}</b><small>Total clicks</small></span>{deltaLabel(snapshot.current.clicks,snapshot.previous.clicks)}</div>
            <div><BarChart3 size={15}/><span><b>{pct(snapshot.current.ctr)}</b><small>Average CTR</small></span>{deltaLabel(snapshot.current.ctr,snapshot.previous.ctr)}</div>
            <div><Activity size={15}/><span><b>{snapshot.current.position.toFixed(1)}</b><small>Avg. position</small></span>{deltaLabel(snapshot.current.position,snapshot.previous.position,true)}</div>
          </div>
        </div>:<div className="admin-empty-state">
          <Search size={24}/><strong>{gscError?"Search Console returned an error":"Search Console data awaiting connection"}</strong>
          <p>{gscError??"Once the service account can read the property, this panel becomes a live 28-day trend."}</p>
          <Link href="/admin/monitoring">Open data sources →</Link>
        </div>}
      </article>

      <article className="admin-panel admin-map-panel">
        <div className="admin-panel-head"><div><small>PROGRAMMATIC SEO</small><h2>City Opportunity Map</h2><p>Search demand across supported India cities.</p></div><Link href="/admin/traffic">Demand score →</Link></div>
        <div className="admin-india-map">
          <svg viewBox="0 0 420 390" aria-hidden="true">
            <path className="admin-india-outline" d="M136 26 180 21 204 41 229 39 255 63 273 87 302 94 327 123 314 145 328 165 307 184 293 214 270 228 255 259 235 277 226 312 208 354 190 330 181 300 161 280 146 252 128 228 105 211 90 181 73 157 80 126 103 109 112 79Z"/>
            <path className="admin-india-inner" d="M115 90 160 105 202 87 251 119 289 145M103 153 155 163 200 145 251 170 293 205M128 221 176 206 229 226 255 259M160 280 193 259 226 312"/>
          </svg>
          {topCities.map((row,index)=>{
            const city=cityMap.get(row.slug);
            if(!city)return null;
            const left=Math.min(90,Math.max(8,((city.lng-68)/29.5)*100));
            const top=Math.min(90,Math.max(5,((37.5-city.lat)/31)*100));
            return <span
              key={row.slug}
              className={`admin-map-dot ${index<3?"hot":""}`}
              style={{left:`${left}%`,top:`${top}%`}}
              title={`${city.name}: demand score ${row.score}`}
            ><i/></span>;
          })}
          {!topCities.length?<div className="admin-map-empty">Demand points appear when GSC records city-level signals.</div>:null}
        </div>
        <div className="admin-opportunity-list">
          <div className="admin-opportunity-title"><span>Top Opportunity Cities</span><b>Score</b></div>
          {(topCities.length?topCities.slice(0,6):supportedCities.slice(0,6).map(city=>({slug:city.slug,name:city.name,score:0}))).map((row,index)=>
            <div key={row.slug}><span><em>{index+1}</em>{row.name}</span><b>{row.score||"—"}</b></div>
          )}
        </div>
      </article>
    </section>

    <section className="admin-dashboard-middle">
      <article className="admin-panel admin-coverage-panel">
        <div className="admin-panel-head"><div><small>SEO CONTROL</small><h2>SEO Coverage</h2></div><Link href="/admin/seo">View details →</Link></div>
        <div className="admin-coverage-body">
          <div className="admin-ring" style={{"--coverage":`${priorityPercent}%`} as CSSProperties}><span><b>{priorityPercent}%</b><small>priority</small></span></div>
          <div className="admin-coverage-list">
            <div><i className="priority"/><span>Supported cities</span><b>{supportedCities.length}</b></div>
            <div><i/><span>Core cities</span><b>{coreCities.length}</b></div>
            <div><i className="gold"/><span>Priority indexed</span><b>{phase1PriorityCities.length}</b></div>
            <div><i className="muted"/><span>Default noindex</span><b>{supportedCities.length-phase1PriorityCities.length}</b></div>
          </div>
        </div>
      </article>

      <article className="admin-panel admin-content-panel">
        <div className="admin-panel-head"><div><small>CONTENT ENGINE</small><h2>Content & Festivals</h2></div><Link href="/admin/content">Content health →</Link></div>
        <div className="admin-content-count"><CalendarDays size={22}/><strong>{allFestivals.length}</strong><span>festival records<small>2026–2027 database</small></span></div>
        <div className="admin-festival-strip">
          {latestFestival.length?latestFestival.map(item=><div key={item.slug+item.year}><i/><b>{item.name}</b><small>{item.date}</small></div>):<span className="admin-muted">No upcoming festival record in the loaded range.</span>}
        </div>
      </article>

      <article className="admin-panel admin-system-panel">
        <div className="admin-panel-head"><div><small>CORE SERVICES</small><h2>System Health</h2></div><Link href="/admin/system">System status →</Link></div>
        <div className="admin-system-list">
          <div><CheckCircle2/><span>Search Console</span><b className={gsc.configured&&!gscError?"ok":"missing"}>{gsc.configured&&!gscError?"Connected":"Attention"}</b></div>
          <div><CheckCircle2/><span>Index policy</span><b className="ok">Active</b></div>
          <div><CheckCircle2/><span>Muhurat rule engine</span><b className="ok">Running</b></div>
          <div><CheckCircle2/><span>GA4 behavior</span><b className={sources.ga4.configured?"ok":"missing"}>{sources.ga4.configured?"Configured":"Awaiting"}</b></div>
          <div><CheckCircle2/><span>Cloudflare edge</span><b className={sources.cloudflare.configured?"ok":"missing"}>{sources.cloudflare.configured?"Configured":"Awaiting"}</b></div>
        </div>
      </article>

      <article className="admin-panel admin-actions-panel">
        <div className="admin-panel-head"><div><small>PRIORITY QUEUE</small><h2>What needs action now</h2></div><span className="admin-action-count">{actions.length}</span></div>
        <div className="admin-actions-list">
          {actions.slice(0,4).map((item,index)=><Link href={item.href} key={index}>
            <span className={`admin-action-dot ${item.tone}`}>{item.tone==="critical"?"!":item.tone==="warning"?"!":"i"}</span>
            <div><b>{item.title}</b><small>{item.detail}</small></div><span>→</span>
          </Link>)}
        </div>
      </article>
    </section>

    <section className="admin-dashboard-bottom">
      <article className="admin-panel">
        <div className="admin-panel-head"><div><small>SEARCH DEMAND</small><h2>Top Cities</h2></div><Link href="/admin/traffic">All cities →</Link></div>
        <table className="admin-compact-table"><thead><tr><th>#</th><th>City</th><th>Impressions</th><th>Clicks</th><th>Position</th></tr></thead><tbody>
          {(topCities.length?topCities.slice(0,5):supportedCities.slice(0,5).map(city=>({name:city.name,queryImpressions:0,pageImpressions:0,queryClicks:0,pageClicks:0,averagePosition:0}))).map((row,index)=><tr key={row.name}>
            <td>{index+1}</td><td>{row.name}</td><td>{snapshot?compact(("queryImpressions" in row?row.queryImpressions+row.pageImpressions:0)):"—"}</td><td>{snapshot?compact(("queryClicks" in row?row.queryClicks+row.pageClicks:0)):"—"}</td><td>{snapshot&&"averagePosition" in row&&row.averagePosition?row.averagePosition.toFixed(1):"—"}</td>
          </tr>)}
        </tbody></table>
      </article>

      <article className="admin-panel">
        <div className="admin-panel-head"><div><small>LANDING PAGES</small><h2>Top Pages</h2></div><Link href="/admin/traffic">All pages →</Link></div>
        <table className="admin-compact-table"><thead><tr><th>#</th><th>Page</th><th>Clicks</th><th>Impressions</th><th>CTR</th></tr></thead><tbody>
          {snapshot?.pages.slice(0,5).map((row,index)=><tr key={row.keys?.[0]??index}>
            <td>{index+1}</td><td>{(row.keys?.[0]??"—").replace("https://panchvani.com","")}</td><td>{compact(row.clicks)}</td><td>{compact(row.impressions)}</td><td>{pct(row.ctr)}</td>
          </tr>)??<tr><td colSpan={5} className="admin-table-empty">Search Console page data awaiting connection.</td></tr>}
        </tbody></table>
      </article>

      <article className="admin-panel admin-index-panel">
        <div className="admin-panel-head"><div><small>INDEX POLICY</small><h2>Indexing & Crawler</h2></div><Link href="/admin/seo">View SEO →</Link></div>
        <div className="admin-index-list">
          <div><span>Priority cities</span><b>{phase1PriorityCities.length}</b></div>
          <div><span>Supported noindex</span><b>{supportedCities.length-phase1PriorityCities.length}</b></div>
          <div><span>Sitemap feeds</span><b>7</b></div>
          <div><span>URL Inspection</span><b className="awaiting">Not connected</b></div>
        </div>
      </article>

      <article className="admin-panel admin-build-panel">
        <div className="admin-panel-head"><div><small>INFRASTRUCTURE</small><h2>Build & Deploy</h2></div><Link href="/admin/deployments">Details →</Link></div>
        <div className="admin-production"><ShieldCheck size={18}/><span><b>Production architecture</b><small>Next.js · vinext · Cloudflare Workers</small></span></div>
        <div className="admin-build-list">
          <div><span>Quality pipeline</span><b>Enabled</b></div>
          <div><span>Regression tests</span><b>Enabled</b></div>
          <div><span>Cloudflare analytics</span><b className={sources.cloudflare.configured?"ok":"awaiting"}>{sources.cloudflare.configured?"Configured":"Awaiting API"}</b></div>
        </div>
      </article>
    </section>

    <footer className="admin-dashboard-footer">
      <span>Panchvani Control Plane</span><i>✦</i><span>Knowledge for a kinder, brighter tomorrow.</span>
    </footer>
  </div>;
}
