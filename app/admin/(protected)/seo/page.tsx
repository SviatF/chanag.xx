import Link from "next/link";
import { coreCities, supportedCities } from "@/lib/cities";
import { phase1PriorityCities } from "@/lib/seo-policy";

const sitemaps=[
  "sitemap-panchang-daily.xml","sitemap-panchang-monthly.xml","sitemap-festivals.xml",
  "sitemap-muhurat.xml","sitemap-regional.xml","sitemap-tools.xml","sitemap-blog.xml"
];

export default function SeoControl(){
  return <div className="admin-page">
    <header className="admin-page-head"><div><p className="admin-eyebrow">SEO & INDEXING</p><h1>Search control</h1><p>Index policy, sitemap coverage and programmatic SEO guardrails.</p></div></header>
    <section className="admin-kpis">
      <div className="admin-kpi"><small>Supported cities</small><strong>{supportedCities.length}</strong><span>Runtime coverage</span></div>
      <div className="admin-kpi"><small>Core cities</small><strong>{coreCities.length}</strong><span>Curated navigation</span></div>
      <div className="admin-kpi"><small>Priority indexed</small><strong>{phase1PriorityCities.length}</strong><span>Phase-1 allowlist</span></div>
      <div className="admin-kpi"><small>Default noindex</small><strong>{supportedCities.length-phase1PriorityCities.length}</strong><span>Expansion guardrail</span></div>
    </section>
    <section className="admin-grid-two">
      <article className="admin-panel"><div className="admin-panel-head"><div><small>SITEMAPS</small><h2>Active sitemap feeds</h2></div><a href="/sitemap.xml" target="_blank">Open index →</a></div><div className="admin-source-list">{sitemaps.map(item=><a href={"/"+item} target="_blank" key={item}><span>{item}</span><b>LIVE ↗</b></a>)}</div></article>
      <article className="admin-panel"><div className="admin-panel-head"><div><small>INDEXABILITY</small><h2>Current policy</h2></div><Link href="/admin/cities">Cities →</Link></div><p>Only demand-backed priority cities are indexable. Wider runtime coverage stays noindex and outside expansion sitemaps until manually or automatically activated.</p><div className="admin-flow"><span>SUPPORTED</span><b>→</b><span>DEMAND</span><b>→</b><span>PRIORITY</span><b>→</b><span>SITEMAP</span></div></article>
    </section>
  </div>;
}
