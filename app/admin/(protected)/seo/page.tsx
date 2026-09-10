import Link from "next/link";
import {coreCities,supportedCities} from "@/lib/cities";
import {getIndexActivationSnapshot} from "@/lib/seo-policy";
import {getGscConnectionStatus} from "@/lib/gsc";
import {getOpportunityStoreStatus} from "@/lib/opportunity-store";
import {readSeoIndexationState,type SeoIndexationRunState} from "@/lib/indexation-store";
import IndexationIntelligencePanel from "@/components/IndexationIntelligencePanel";

export const dynamic="force-dynamic";

const sitemaps=[
  "sitemap-core.xml","sitemap-panchang-daily.xml","sitemap-panchang-monthly.xml","sitemap-festivals.xml","sitemap-vrat.xml",
  "sitemap-muhurat.xml","sitemap-regional.xml","sitemap-tools.xml"
];

export default async function SeoControl(){
  const activation=getIndexActivationSnapshot();
  const gsc=getGscConnectionStatus();
  const storage=getOpportunityStoreStatus();
  let indexation:SeoIndexationRunState|null=null;
  let indexationError:string|null=null;
  if(storage.configured){
    try{indexation=await readSeoIndexationState();}
    catch(error){indexationError=error instanceof Error?error.message:"Unable to load indexation intelligence.";}
  }

  return <div className="admin-page">
    <header className="admin-page-head"><div><p className="admin-eyebrow">SEO & INDEXING</p><h1>Search control</h1><p>Index policy, sitemap coverage, Google index inspection and programmatic SEO guardrails.</p></div></header>
    <section className="admin-kpis">
      <div className="admin-kpi"><small>Supported cities</small><strong>{supportedCities.length}</strong><span>Runtime coverage</span></div>
      <div className="admin-kpi"><small>Core cities</small><strong>{coreCities.length}</strong><span>Curated navigation</span></div>
      <div className="admin-kpi"><small>Indexable cities</small><strong>{activation.active.length}</strong><span>{activation.baseline.length} baseline + {activation.extra.length} activated</span></div>
      <div className="admin-kpi"><small>Default noindex</small><strong>{supportedCities.length-activation.active.length}</strong><span>Expansion guardrail</span></div>
    </section>
    <section className="admin-grid-two">
      <article className="admin-panel"><div className="admin-panel-head"><div><small>SITEMAPS</small><h2>Active sitemap feeds</h2></div><a href="/sitemap.xml" target="_blank">Open index →</a></div><div className="admin-source-list">{sitemaps.map(item=><a href={"/"+item} target="_blank" key={item}><span>{item}</span><b>LIVE ↗</b></a>)}</div></article>
      <article className="admin-panel"><div className="admin-panel-head"><div><small>INDEXABILITY</small><h2>Current policy</h2></div><Link href="/admin/cities">Cities →</Link></div><p>Only approved demand-backed cities are indexable. The 20-city launch baseline remains permanent; additional supported cities can be activated through <code>SEO_EXTRA_INDEX_CITIES</code> as a comma-separated allowlist after Search Console demand review.</p><div className="admin-flow"><span>SUPPORTED</span><b>→</b><span>DEMAND</span><b>→</b><span>APPROVE</span><b>→</b><span>SITEMAP</span></div></article>
    </section>
    <section className="admin-panel">
      <div className="admin-panel-head"><div><small>RUNTIME ACTIVATION</small><h2>Additional indexed cities</h2></div><span>{activation.extra.length} extra</span></div>
      <p>{activation.extra.length?activation.extra.join(" · "):"No additional cities activated yet. Keep the launch baseline stable until GSC produces reliable demand signals."}</p>
    </section>
    <IndexationIntelligencePanel state={indexation} enabled={gsc.configured&&storage.configured} error={indexationError}/>
  </div>;
}