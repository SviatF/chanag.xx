import type {Metadata} from "next";
import Link from "next/link";
import Header from "@/components/Header";
import {cities} from "@/lib/cities";
import {knowledgePagePath,knowledgeTopics,knowledgeTopicSlugs} from "@/lib/panchang-knowledge";

export const metadata:Metadata={
  title:"Panchang Guide — Tithi, Nakshatra, Yoga, Karana, Paksha & Hindu Months",
  description:"Understand Tithi, Nakshatra, Yoga, Karana, Paksha and Hindu lunar months with clear explanations of what each Panchang value means and how it is calculated.",
  alternates:{canonical:"/knowledge"}
};

export default function KnowledgeHub(){
  const city=cities[0];
  const ld={"@context":"https://schema.org","@type":"CollectionPage","name":"Panchang Guide","url":"https://panchvani.com/knowledge","description":"Clear guides to the core components of Hindu Panchang and the calculations behind them."};
  return <main><Header city={city}/><div className="page-shell internal-visual internal-tools">
    <div className="breadcrumbs"><Link href="/">Home</Link> / Panchang Guide</div>
    <p className="page-kicker">LEARN PANCHANG</p>
    <h1 className="page-title">Understand the calendar<br/>behind today’s Panchang</h1>
    <p className="page-subtitle">Learn what each Panchang value means, how it is calculated and where regional calendar conventions or personal astrology can change the interpretation.</p>

    <section className="wide-panel">
      <div className="data-grid">
        <div className="data-card"><small>Core topics</small><strong>{knowledgeTopicSlugs.length}</strong><small>Panchang, Tithi, Nakshatra and more</small></div>
        <div className="data-card"><small>Calculation details</small><strong>Explained</strong><small>Formulas and astronomical context</small></div>
        <div className="data-card"><small>Practical examples</small><strong>Connected</strong><small>Open today’s local Panchang alongside the guides</small></div>
        <div className="data-card"><small>Calendar differences</small><strong>Stated clearly</strong><small>Regional and lunar-month conventions are identified</small></div>
      </div>
    </section>

    <section className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>Core Panchang guides</h2>
      <div className="city-directory">{knowledgeTopicSlugs.map(slug=>{const topic=knowledgeTopics[slug];return <Link href={knowledgePagePath(slug)} key={slug}><small>{topic.kicker}</small><strong>{topic.label}</strong><span>{topic.description}</span></Link>;})}</div>
    </section>

    <div className="seo-copy">
      <h2>Learn the concept, then see it in today’s calculation</h2>
      <p>A concept such as Tithi or Nakshatra is easier to understand when you can compare the definition with a real local Panchang. Each guide explains the stable concept, while the daily pages show the value for a specific city and date.</p>
      <p>Where Hindu calendar practice differs by region or tradition, Panchvani states the convention being used instead of presenting one regional system as universal.</p>
    </div>

    <div className="pill-links"><Link href={`/panchang/${city.slug}`}>See today’s Panchang</Link><Link href="/methodology">Calculation methodology</Link><Link href="/accuracy">Accuracy & limitations</Link></div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
