import { getGscConnectionStatus } from "@/lib/gsc";
import { getDataSourceStatus } from "@/lib/data-sources";
import { coreCities, supportedCities } from "@/lib/cities";
import { phase1PriorityCities } from "@/lib/seo-policy";
import { Activity, Cloud, Database, Search, ShieldCheck } from "lucide-react";

export default function SystemHealth(){
  const gsc=getGscConnectionStatus();
  const sources=getDataSourceStatus();
  const checks=[
    ["Admin authentication",Boolean(process.env.ADMIN_PASSWORD),"ADMIN_PASSWORD"],
    ["Admin session secret",Boolean(process.env.ADMIN_SESSION_SECRET),"ADMIN_SESSION_SECRET"],
    ["GSC service account email",gsc.required.GOOGLE_SERVICE_ACCOUNT_EMAIL,"GOOGLE_SERVICE_ACCOUNT_EMAIL"],
    ["GSC private key",gsc.required.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,"GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"],
    ["GSC property",gsc.required.GSC_SITE_URL,"GSC_SITE_URL"],
    ["GA4 property",sources.ga4.configured,"GA4_PROPERTY_ID"],
    ["Cloudflare account",Boolean(process.env.CLOUDFLARE_ACCOUNT_ID),"CLOUDFLARE_ACCOUNT_ID"],
    ["Cloudflare zone",Boolean(process.env.CLOUDFLARE_ZONE_ID),"CLOUDFLARE_ZONE_ID"],
    ["Cloudflare API token",Boolean(process.env.CLOUDFLARE_API_TOKEN),"CLOUDFLARE_API_TOKEN"],
  ] as const;

  return <div className="admin-page">
    <header className="admin-page-head">
      <div><p className="admin-eyebrow">SYSTEM HEALTH</p><h1>Production readiness</h1><p>Credentials, data sources, SEO policy and runtime coverage.</p></div>
    </header>

    <section className="admin-kpis">
      <div className="admin-kpi admin-kpi-rich"><div className="admin-kpi-icon"><Search size={18}/></div><div><small>Search Console</small><strong>{gsc.configured?"ON":"OFF"}</strong><span>{gsc.siteUrl}</span></div></div>
      <div className="admin-kpi admin-kpi-rich"><div className="admin-kpi-icon"><Activity size={18}/></div><div><small>GA4</small><strong>{sources.ga4.configured?"ON":"OFF"}</strong><span>Behavior analytics</span></div></div>
      <div className="admin-kpi admin-kpi-rich"><div className="admin-kpi-icon"><Cloud size={18}/></div><div><small>Cloudflare</small><strong>{sources.cloudflare.configured?"ON":"OFF"}</strong><span>Edge telemetry</span></div></div>
      <div className="admin-kpi admin-kpi-rich"><div className="admin-kpi-icon"><ShieldCheck size={18}/></div><div><small>Priority cities</small><strong>{phase1PriorityCities.length}</strong><span>Index allowlist</span></div></div>
    </section>

    <section className="admin-grid-two">
      <article className="admin-panel">
        <div className="admin-panel-head"><div><small>ENVIRONMENT</small><h2>Runtime configuration</h2></div></div>
        <div className="admin-health-list">{checks.map(([label,ok,key])=><div key={label}><span>{label}<small>{key}</small></span><b className={ok?"ok":"missing"}>{ok?"READY":"MISSING"}</b></div>)}</div>
      </article>

      <article className="admin-panel">
        <div className="admin-panel-head"><div><small>SEO COVERAGE</small><h2>Programmatic network</h2></div><Database size={17}/></div>
        <div className="admin-health-list">
          <div><span>Supported cities<small>Runtime coverage</small></span><b className="ok">{supportedCities.length}</b></div>
          <div><span>Core cities<small>Curated navigation</small></span><b className="ok">{coreCities.length}</b></div>
          <div><span>Priority cities<small>Index allowlist</small></span><b className="ok">{phase1PriorityCities.length}</b></div>
          <div><span>Non-priority supported<small>Default noindex</small></span><b>{supportedCities.length-phase1PriorityCities.length}</b></div>
          <div><span>Sitemap feeds<small>Specialized XML maps</small></span><b className="ok">7</b></div>
        </div>
      </article>
    </section>

    <section className="admin-panel">
      <div className="admin-panel-head"><div><small>OBSERVABILITY CONTRACT</small><h2>Unified monitoring</h2></div></div>
      <p>Search Console supplies organic search demand. GA4 will add sessions, engagement and conversions. Cloudflare Analytics will add edge requests, cache, bot, geography, error and delivery telemetry. No synthetic values are used when a source is not connected.</p>
    </section>
  </div>;
}
