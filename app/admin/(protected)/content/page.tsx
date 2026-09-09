import Link from "next/link";
import { CalendarDays, FileText, Sparkles } from "lucide-react";
import { allFestivals } from "@/lib/festivals";
import { muhuratRules } from "@/lib/muhurat";
import { supportedCities } from "@/lib/cities";

export default function ContentControl(){
  return <div className="admin-page">
    <header className="admin-page-head"><div><p className="admin-eyebrow">CONTENT ENGINE</p><h1>Content</h1><p>Coverage, records and scalable content modules across Panchvani.</p></div></header>
    <section className="admin-kpis">
      <div className="admin-kpi admin-kpi-rich"><div className="admin-kpi-icon"><CalendarDays size={18}/></div><div><small>Festival records</small><strong>{allFestivals.length}</strong><span>2026–2027</span></div></div>
      <div className="admin-kpi admin-kpi-rich"><div className="admin-kpi-icon"><Sparkles size={18}/></div><div><small>Muhurat rules</small><strong>{Object.keys(muhuratRules).length}</strong><span>Deterministic rule profiles</span></div></div>
      <div className="admin-kpi admin-kpi-rich"><div className="admin-kpi-icon"><FileText size={18}/></div><div><small>City coverage</small><strong>{supportedCities.length}</strong><span>Programmatic content surface</span></div></div>
    </section>
    <section className="admin-grid-two">
      <article className="admin-panel"><div className="admin-panel-head"><div><small>FESTIVAL DATABASE</small><h2>Festival content</h2></div><Link href="/admin/festivals">Manage records →</Link></div><p>Dates, regional names, meaning, observances, Puja reference and city-level festival routes.</p></article>
      <article className="admin-panel"><div className="admin-panel-head"><div><small>EDITORIAL ROADMAP</small><h2>Guides & freshness</h2></div></div><p>Freshness monitoring, blog/editorial inventory and content decay scoring are prepared for the next data layer. No synthetic freshness score is shown yet.</p></article>
    </section>
  </div>;
}
