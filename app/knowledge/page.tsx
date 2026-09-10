import type {Metadata} from "next";
import Link from "next/link";
import Header from "@/components/Header";
import {cities} from "@/lib/cities";
import {knowledgePagePath,knowledgeTopics,knowledgeTopicSlugs} from "@/lib/panchang-knowledge";

export const metadata:Metadata={
  title:"Panchang Knowledge — Tithi, Nakshatra, Yoga, Karana, Paksha & Hindu Months",
  description:"Learn the core Hindu Panchang concepts with calculation-first guides to Tithi, Nakshatra, Yoga, Karana, Paksha and Hindu lunar months.",
  alternates:{canonical:"/knowledge"}
};

export default function KnowledgeHub(){
  const city=cities[0];
  const ld={"@context":"https://schema.org","@type":"CollectionPage","name":"Panchang Knowledge","url":"https://panchvani.com/knowledge","description":"Calculation-first guides to the core components of Hindu Panchang."};
  return <main><Header city={city}/><div className="page-shell internal-visual internal-tools">
    <div className="breadcrumbs"><Link href="/">Home</Link> / Panchang Knowledge</div>
    <p className="page-kicker">PANCHANG KNOWLEDGE</p>
    <h1 className="page-title">Understand the calendar<br/>behind the daily result.</h1>
    <p className="page-subtitle">Seven evergreen guides explain what Panchang values mean, how Panchvani calculates them and where calendar convention ends and personalized astrology begins.</p>

    <section className="wide-panel">
      <div className="data-grid">
        <div className="data-card"><small>Canonical guides</small><strong>{knowledgeTopicSlugs.length}</strong><small>One owner per informational intent</small></div>
        <div className="data-card"><small>Calculation layer</small><strong>Transparent</strong><small>Formula and engine context on every guide</small></div>
        <div className="data-card"><small>Daily connection</small><strong>Live</strong><small>Guides link back to calculated Panchang</small></div>
        <div className="data-card"><small>Content model</small><strong>Evergreen</strong><small>No synthetic freshness or mass article generation</small></div>
      </div>
    </section>

    <section className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>Core Panchang guides</h2>
      <div className="city-directory">{knowledgeTopicSlugs.map(slug=>{const topic=knowledgeTopics[slug];return <Link href={knowledgePagePath(slug)} key={slug}><small>{topic.kicker}</small><strong>{topic.label}</strong><span>{topic.description}</span></Link>;})}</div>
    </section>

    <div className="seo-copy">
      <h2>Why Panchvani separates knowledge from daily results</h2>
      <p>Searches such as “what is Tithi?” and “Tithi today in Delhi” are different intents. The knowledge layer owns stable explanations and formulas; the Daily Panchang remains the owner for date-and-location answers. This keeps the site useful for readers while reducing internal keyword cannibalization.</p>
      <p>The guides describe the calculation model actually used by Panchvani. Where Hindu calendar conventions vary by region or tradition, the page states the convention instead of presenting one implementation as universal.</p>
    </div>

    <div className="pill-links"><Link href={`/panchang/${city.slug}`}>See today’s Panchang</Link><Link href="/methodology">Calculation methodology</Link><Link href="/accuracy">Accuracy & limitations</Link></div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
