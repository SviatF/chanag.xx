import Link from "next/link";
import { allFestivals } from "@/lib/festivals";
import { cityCandidates } from "@/lib/city-candidates";
import { coreCities, supportedCities } from "@/lib/cities";
import { muhuratRules } from "@/lib/muhurat";
import { phase1PriorityCities } from "@/lib/seo-policy";
import { getGscConnectionStatus } from "@/lib/gsc";

export const dynamic="force-dynamic";

export default function AdminOverview(){
  const gsc=getGscConnectionStatus();
  const cards=[
    ["Supported cities",supportedCities.length,"Runtime coverage"],
    ["Core cities",coreCities.length,"Curated public/navigation set"],
    ["Priority indexed",phase1PriorityCities.length,"Phase-1 allowlist"],
    ["Candidate pool",cityCandidates.length,"Demand activation candidates"],
    ["Festival records",allFestivals.length,"2026 + 2027"],
    ["Muhurat rules",Object.keys(muhuratRules).length,"Rule engine"],
  ];

  return <div className="admin-page">
    <header className="admin-page-head">
      <div><p className="admin-eyebrow">CONTROL PLANE</p><h1>Overview</h1><p>SEO coverage, indexability and demand monitoring for the Panchvani network.</p></div>
      <span className={gsc.configured?"admin-status live":"admin-status warn"}>{gsc.configured?"GSC connected":"GSC not connected"}</span>
    </header>

    <section className="admin-kpis">
      {cards.map(([label,value,meta])=><div className="admin-kpi" key={String(label)}>
        <small>{label}</small><strong>{value}</strong><span>{meta}</span>
      </div>)}
    </section>

    <section className="admin-grid-two">
      <div className="admin-panel">
        <div className="admin-panel-head"><div><small>SEO EXPANSION</small><h2>Demand activation</h2></div><Link href="/admin/traffic">Open monitor →</Link></div>
        <p>Priority cities remain indexable. The wider supported pool stays outside sitemap/index until traffic demand supports activation.</p>
        <div className="admin-flow">
          <span>SUPPORTED</span><b>→</b><span>DEMAND SIGNAL</span><b>→</b><span>ACTIVATE</span><b>→</b><span>SITEMAP</span>
        </div>
      </div>
      <div className="admin-panel">
        <div className="admin-panel-head"><div><small>DATA SOURCE</small><h2>Google Search Console</h2></div></div>
        {gsc.configured
          ? <><p>Live 28-day clicks, impressions, CTR, position, landing pages and city-level query demand are available.</p><code>{gsc.siteUrl}</code></>
          : <><p>Add Google OAuth secrets to Cloudflare to turn on live traffic intelligence.</p><div className="admin-secret-list"><code>GOOGLE_CLIENT_ID</code><code>GOOGLE_CLIENT_SECRET</code><code>GOOGLE_REFRESH_TOKEN</code><code>GSC_SITE_URL</code></div></>}
      </div>
    </section>
  </div>;
}
