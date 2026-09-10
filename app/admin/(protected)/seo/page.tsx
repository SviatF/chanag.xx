import Link from "next/link";
import {coreCities,supportedCities} from "@/lib/cities";
import {getIndexActivationSnapshot} from "@/lib/seo-policy";
import {getGscConnectionStatus} from "@/lib/gsc";
import {getOpportunityStoreStatus} from "@/lib/opportunity-store";
import {readSeoIndexationState,type SeoIndexationRunState} from "@/lib/indexation-store";
import {festivalCoverageSnapshot,festivalIndexYears} from "@/lib/festival-expansion";
import {regionalIntentActivationSnapshot,regionalLanguageSlugs} from "@/lib/regional-seo";
import {expandedTools,expandedToolSlugs} from "@/lib/tool-expansion";
import IndexationIntelligencePanel from "@/components/IndexationIntelligencePanel";

export const dynamic="force-dynamic";

const sitemaps=[
  "sitemap-core.xml","sitemap-panchang-daily.xml","sitemap-panchang-monthly.xml","sitemap-festivals.xml","sitemap-vrat.xml",
  "sitemap-muhurat.xml","sitemap-regional.xml","sitemap-tools.xml"
];

export default async function SeoControl(){
  const activation=getIndexActivationSnapshot();
  const regionalActivation=regionalIntentActivationSnapshot();
  const gsc=getGscConnectionStatus();
  const storage=getOpportunityStoreStatus();
  const festivalCoverage=festivalCoverageSnapshot();
  const festivalIndexedYears=new Set(festivalIndexYears());
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
      <div className="admin-kpi"><small>Regional intents</small><strong>{regionalActivation.active.length}</strong><span>{regionalActivation.baseline.length} baseline + {regionalActivation.extra.length} demand-approved</span></div>
      <div className="admin-kpi"><small>Evergreen tools</small><strong>{expandedToolSlugs.length}</strong><span>Dedicated search-intent owners</span></div>
    </section>
    <section className="admin-grid-two">
      <article className="admin-panel"><div className="admin-panel-head"><div><small>SITEMAPS</small><h2>Active sitemap feeds</h2></div><a href="/sitemap.xml" target="_blank">Open index →</a></div><div className="admin-source-list">{sitemaps.map(item=><a href={"/"+item} target="_blank" key={item}><span>{item}</span><b>LIVE ↗</b></a>)}</div></article>
      <article className="admin-panel"><div className="admin-panel-head"><div><small>INDEXABILITY</small><h2>Current policy</h2></div><Link href="/admin/cities">Cities →</Link></div><p>Only approved demand-backed cities are indexable. The 20-city launch baseline remains permanent; additional supported cities can be activated through <code>SEO_EXTRA_INDEX_CITIES</code> as a comma-separated allowlist after Search Console demand review.</p><div className="admin-flow"><span>SUPPORTED</span><b>→</b><span>DEMAND</span><b>→</b><span>APPROVE</span><b>→</b><span>SITEMAP</span></div></article>
    </section>
    <section className="admin-panel">
      <div className="admin-panel-head"><div><small>TOOLS EXPANSION</small><h2>Evergreen search magnets</h2></div><Link href="/tools">Open tools →</Link></div>
      <p>These are single canonical calculators with city/date inputs, not city × date programmatic page explosions. Search Opportunity Intelligence routes focused GSC queries to these intent owners before generic Daily Panchang matching.</p>
      <div className="admin-source-list">{expandedToolSlugs.map(slug=><div className="admin-source-row" key={slug}><span><strong>{expandedTools[slug].name}</strong> · /tools/{slug}</span><b>INDEXABLE</b></div>)}</div>
      <div className="admin-flow"><span>QUERY</span><b>→</b><span>TOOL INTENT</span><b>→</b><span>CANONICAL TOOL</span><b>→</b><span>OUTCOME</span></div>
    </section>
    <section className="admin-panel">
      <div className="admin-panel-head"><div><small>REGIONAL SEO SCALE</small><h2>Language × city × intent activation</h2></div><span>{regionalLanguageSlugs.length} languages · {regionalActivation.active.length} intent pages</span></div>
      <p>Regional city hubs stay governed by city + language relevance. More specific timing routes exist as useful noindex pages until GSC demand justifies explicit activation through <code>SEO_EXTRA_REGIONAL_INTENTS</code>.</p>
      <div className="admin-flow"><span>LANGUAGE HUB</span><b>→</b><span>CITY HUB</span><b>→</b><span>DEMAND</span><b>→</b><span>INTENT ACTIVATE</span></div>
      <div className="admin-source-list">
        <div className="admin-source-row"><span><strong>Baseline</strong> · curated regional intent combinations</span><b>{regionalActivation.baseline.length}</b></div>
        <div className="admin-source-row"><span><strong>Extra approvals</strong> · runtime allowlist</span><b>{regionalActivation.extra.length}</b></div>
        <div className="admin-source-row"><span><strong>Env format</strong> · language:city:intent</span><b>SEO_EXTRA_REGIONAL_INTENTS</b></div>
      </div>
      {regionalActivation.extra.length?<p><strong>Activated:</strong> {regionalActivation.extra.join(" · ")}</p>:<p>No demand-approved regional intent expansions beyond the curated baseline yet.</p>}
    </section>
    <section className="admin-panel">
      <div className="admin-panel-head"><div><small>FESTIVAL DATASET</small><h2>Demand-led year coverage</h2></div><span>{festivalIndexedYears.size} index years</span></div>
      <p>Festival years enter the sitemap only when their stored dates pass structural validation and fall inside the rolling index window. Missing future dates are never synthesized from search demand.</p>
      <div className="admin-source-list">{festivalCoverage.map(item=><div key={item.year} className="admin-source-row"><span><strong>{item.year}</strong> · {item.present}/{item.expected} records · {item.coveragePct}%{item.missing.length?` · ${item.missing.length} missing`:""}</span><b>{item.issues.length?"REVIEW":festivalIndexedYears.has(item.year)?"INDEXABLE":"VALID"}</b></div>)}</div>
    </section>
    <section className="admin-panel">
      <div className="admin-panel-head"><div><small>RUNTIME ACTIVATION</small><h2>Additional indexed cities</h2></div><span>{activation.extra.length} extra</span></div>
      <p>{activation.extra.length?activation.extra.join(" · "):"No additional cities activated yet. Keep the launch baseline stable until GSC produces reliable demand signals."}</p>
    </section>
    <IndexationIntelligencePanel state={indexation} enabled={gsc.configured&&storage.configured} error={indexationError}/>
  </div>;
}
