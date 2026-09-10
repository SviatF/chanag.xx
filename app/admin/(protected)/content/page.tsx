import Link from "next/link";
import { BookOpen, CalendarDays, FileText, Sparkles } from "lucide-react";
import { allFestivals } from "@/lib/festivals";
import { muhuratRules } from "@/lib/muhurat";
import { supportedCities } from "@/lib/cities";
import {knowledgeTopics,knowledgeTopicSlugs} from "@/lib/panchang-knowledge";

export default function ContentControl(){
  return <div className="admin-page">
    <header className="admin-page-head"><div><p className="admin-eyebrow">CONTENT ENGINE</p><h1>Content</h1><p>Coverage, records and scalable content modules across Panchvani.</p></div></header>
    <section className="admin-kpis">
      <div className="admin-kpi admin-kpi-rich"><div className="admin-kpi-icon"><CalendarDays size={18}/></div><div><small>Festival records</small><strong>{allFestivals.length}</strong><span>Maintained year datasets</span></div></div>
      <div className="admin-kpi admin-kpi-rich"><div className="admin-kpi-icon"><Sparkles size={18}/></div><div><small>Muhurat rules</small><strong>{Object.keys(muhuratRules).length}</strong><span>Deterministic rule profiles</span></div></div>
      <div className="admin-kpi admin-kpi-rich"><div className="admin-kpi-icon"><BookOpen size={18}/></div><div><small>Knowledge guides</small><strong>{knowledgeTopicSlugs.length}</strong><span>Canonical evergreen intent owners</span></div></div>
      <div className="admin-kpi admin-kpi-rich"><div className="admin-kpi-icon"><FileText size={18}/></div><div><small>City coverage</small><strong>{supportedCities.length}</strong><span>Programmatic content surface</span></div></div>
    </section>
    <section className="admin-grid-two">
      <article className="admin-panel"><div className="admin-panel-head"><div><small>FESTIVAL DATABASE</small><h2>Festival content</h2></div><Link href="/admin/festivals">Manage records →</Link></div><p>Dates, regional names, meaning, observances, Puja reference and city-level festival routes.</p></article>
      <article className="admin-panel"><div className="admin-panel-head"><div><small>KNOWLEDGE AUTHORITY</small><h2>Panchang concept owners</h2></div><Link href="/knowledge">Open hub →</Link></div><p>Calculation-first evergreen guides own informational intent without competing with date-and-city Panchang pages.</p><div className="admin-source-list">{knowledgeTopicSlugs.map(slug=><div className="admin-source-row" key={slug}><span><strong>{knowledgeTopics[slug].label}</strong> · /knowledge/{slug}</span><b>INDEXABLE</b></div>)}</div></article>
    </section>
    <section className="admin-panel"><div className="admin-panel-head"><div><small>EDITORIAL ROADMAP</small><h2>Demand-led expansion only</h2></div></div><p>The evergreen knowledge foundation is now live. Future guides should be opened from real GSC query clusters or clear product utility, not synthetic freshness scoring or mass article generation.</p><div className="admin-flow"><span>GSC INTENT</span><b>→</b><span>OWNER CHECK</span><b>→</b><span>CONTENT GAP</span><b>→</b><span>BUILD</span></div></section>
  </div>;
}
