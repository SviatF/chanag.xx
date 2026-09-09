import { getGscConnectionStatus } from "@/lib/gsc";
import { coreCities, supportedCities } from "@/lib/cities";
import { phase1PriorityCities } from "@/lib/seo-policy";

export default function SystemHealth(){
  const gsc=getGscConnectionStatus();
  const checks=[
    ["Admin authentication",Boolean(process.env.ADMIN_PASSWORD),"ADMIN_PASSWORD"],
    ["Admin session secret",Boolean(process.env.ADMIN_SESSION_SECRET),"ADMIN_SESSION_SECRET (recommended)"],
    ["GSC service account email",gsc.required.GOOGLE_SERVICE_ACCOUNT_EMAIL,"GOOGLE_SERVICE_ACCOUNT_EMAIL"],
    ["GSC private key",gsc.required.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,"GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"],
    ["GSC property",gsc.required.GSC_SITE_URL,"GSC_SITE_URL"],
  ] as const;

  return <div className="admin-page">
    <header className="admin-page-head"><div><p className="admin-eyebrow">SYSTEM HEALTH</p><h1>Production readiness</h1><p>Configuration and SEO control-plane status.</p></div></header>

    <section className="admin-grid-two">
      <div className="admin-panel"><h2>Environment</h2><div className="admin-health-list">{checks.map(([label,ok,key])=><div key={label}><span>{label}<small>{key}</small></span><b className={ok?"ok":"missing"}>{ok?"READY":"MISSING"}</b></div>)}</div></div>
      <div className="admin-panel"><h2>SEO coverage</h2><div className="admin-health-list">
        <div><span>Supported cities<small>Runtime coverage</small></span><b className="ok">{supportedCities.length}</b></div>
        <div><span>Core cities<small>Curated navigation</small></span><b className="ok">{coreCities.length}</b></div>
        <div><span>Priority cities<small>Index allowlist</small></span><b className="ok">{phase1PriorityCities.length}</b></div>
        <div><span>Non-priority supported<small>Default noindex</small></span><b>{supportedCities.length-phase1PriorityCities.length}</b></div>
      </div></div>
    </section>

    <section className="admin-panel"><h2>Traffic monitor contract</h2><p>Search Console is read live on demand. No synthetic analytics are stored. City activation recommendations are derived from real query/page clicks, impressions, average position, matched city queries and population as a secondary signal.</p><code>{gsc.siteUrl}</code></section>
  </div>;
}
