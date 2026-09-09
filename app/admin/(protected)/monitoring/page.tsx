import { Activity, BarChart3, Cloud, Search } from "lucide-react";
import { getGscConnectionStatus } from "@/lib/gsc";
import { getDataSourceStatus } from "@/lib/data-sources";

export default function Monitoring(){
  const gsc=getGscConnectionStatus();
  const sources=getDataSourceStatus();
  const cards=[
    {name:"Google Search Console",configured:gsc.configured,Icon:Search,detail:"Queries · pages · clicks · impressions · CTR · position"},
    {name:"Google Analytics 4",configured:sources.ga4.configured,Icon:BarChart3,detail:"Users · sessions · engagement · conversions · journeys"},
    {name:"Cloudflare Analytics",configured:sources.cloudflare.configured,Icon:Cloud,detail:"Requests · cache · bots · errors · countries · edge health"},
  ];
  return <div className="admin-page">
    <header className="admin-page-head"><div><p className="admin-eyebrow">OBSERVABILITY</p><h1>Monitoring</h1><p>One place for search, behavior and infrastructure telemetry.</p></div></header>
    <section className="admin-source-cards">
      {cards.map(({name,configured,Icon,detail})=><article className="admin-source-card" key={name}>
        <div className="admin-source-icon"><Icon size={20}/></div>
        <div><small>DATA SOURCE</small><h2>{name}</h2><p>{detail}</p></div>
        <span className={configured?"admin-status live":"admin-status warn"}><i/>{configured?"Configured":"Awaiting connection"}</span>
      </article>)}
    </section>
    <section className="admin-panel"><div className="admin-panel-head"><div><small>NEXT OBSERVABILITY LAYER</small><h2>Unified health model</h2></div><Activity size={17}/></div><p>When all three sources are connected, the control plane can correlate search demand with on-site behavior and Cloudflare edge delivery instead of treating SEO, product analytics and infrastructure as separate dashboards.</p></section>
  </div>;
}
