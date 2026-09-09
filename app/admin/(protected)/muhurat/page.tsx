import { muhuratRules } from "@/lib/muhurat";

export default function MuhuratManager(){
  const rows=Object.entries(muhuratRules);
  return <div className="admin-page">
    <header className="admin-page-head"><div><p className="admin-eyebrow">MUHURAT RULE ENGINE</p><h1>Rule profiles</h1><p>Deterministic Tithi + Nakshatra candidate rules used by programmatic Muhurat pages.</p></div></header>
    <section className="admin-rule-grid">
      {rows.map(([slug,rule])=><article className="admin-rule-card" key={slug}>
        <small>{slug}</small><h2>{rule.title}</h2><p>{rule.note}</p>
        <div><b>Good Tithi</b><span>{rule.goodTithi.join(" · ")}</span></div>
        <div><b>Good Nakshatra</b><span>{rule.goodNakshatra.join(" · ")}</span></div>
      </article>)}
    </section>
  </div>;
}
