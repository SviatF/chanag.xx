import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import {cities} from "@/lib/cities";
import {knowledgePagePath,knowledgeTopicBySlug,knowledgeTopics,knowledgeTopicSlugs,type KnowledgeFact,type KnowledgeSection,type KnowledgeTopic} from "@/lib/panchang-knowledge";

export const revalidate=604800;

export function generateStaticParams(){return knowledgeTopicSlugs.map(topic=>({topic}));}

function publicKnowledgeCopy(topic:KnowledgeTopic){
  let description=topic.description;
  let engineNote=topic.engineNote;
  let facts:KnowledgeFact[]=topic.facts;
  let sections:KnowledgeSection[]=topic.sections;

  if(topic.slug==="panchang"){
    description="Learn what a Hindu Panchang is, the five traditional limbs it combines, how Panchvani calculates them, and how daily Panchang differs from exact-time birth-chart calculations.";
    engineNote="Panchvani derives the lunar factors from Sun and Moon positions and calculates sunrise-dependent timings from the selected city coordinates. The result is a reproducible daily date-and-location reference; birth-chart calculations add an exact birth instant and a separate calculation model.";
    sections=topic.sections.map(section=>section.title==="Panchang versus personalized astrology"?{
      title:"Panchang and birth-chart calculations",
      paragraphs:["A city-and-date Panchang describes shared calendar factors such as Tithi, Nakshatra and local solar timing. Birth-chart calculations add an exact birth instant and derive Lagna, houses and birth-specific planetary placements, so the two page types use different input models."],
    }:section);
  }

  if(topic.slug==="tithi"){
    sections=topic.sections.map(section=>section.title==="Why Tithi matters in Panchang"?{
      ...section,
      paragraphs:["Tithi is used as a calendar marker for fasting observances, festivals and many Muhurat rule sets. Panchvani's Vrat layer uses sunrise-based date logic for selected observances, while Muhurat rules use Tithi as one explicit eligibility signal alongside the remaining event-specific rule layers."],
    }:section);
  }

  if(topic.slug==="nakshatra"){
    sections=topic.sections.map(section=>section.title==="How Nakshatra is used"?{
      ...section,
      paragraphs:["Nakshatra appears in daily Panchang, naming traditions, festival interpretation and many Muhurat systems. Panchvani uses selected Nakshatra lists as one explicit eligibility layer alongside the other event-specific factors used by the relevant planning screen."],
    }:section);
  }

  if(topic.slug==="yoga"){
    facts=topic.facts.map(fact=>fact.label==="Purpose here"?{...fact,note:"A Panchang limb derived from the combined sidereal longitudes"}:fact);
    sections=topic.sections.map(section=>section.title==="What the daily Yoga value does and does not mean"?{
      title:"How the daily Yoga value is used",
      paragraphs:["Yoga is one limb of Panchang and can be interpreted differently across traditions. Panchvani exposes the calculated sector beside Tithi, Nakshatra and Karana so the calendar state can be read as a set of independent astronomical factors."],
    }:section);
  }

  return {description,engineNote,facts,sections};
}

export async function generateMetadata({params}:{params:Promise<{topic:string}>}):Promise<Metadata>{
  const p=await params;const topic=knowledgeTopicBySlug(p.topic);if(!topic)notFound();
  if(topic.slug==="hindu-months")return {
    title:"Hindu Calendar Months — Amanta, Purnimanta & Adhika Maas Explained",
    description:"Understand the 12 Hindu lunar months, the difference between Amanta and Purnimanta month names, Adhika Maas and why regional calendars can label the same day differently.",
    alternates:{canonical:knowledgePagePath(topic.slug)}
  };
  const copy=publicKnowledgeCopy(topic);
  return {title:topic.metaTitle,description:copy.description,alternates:{canonical:knowledgePagePath(topic.slug)}};
}

export default async function KnowledgePage({params}:{params:Promise<{topic:string}>}){
  const p=await params;const topic=knowledgeTopicBySlug(p.topic);if(!topic)notFound();
  const city=cities[0];
  const copy=publicKnowledgeCopy(topic);
  const related=topic.related.map(slug=>knowledgeTopics[slug]);
  const isHinduMonths=topic.slug==="hindu-months";
  const headline=isHinduMonths?"Hindu calendar months: Amanta, Purnimanta & Adhika Maas":topic.title;
  const intro=isHinduMonths
    ?"Hindu lunar month names are not assigned by one universal convention across India. Amanta months end at Amavasya, Purnimanta months end at Purnima, and an Adhika Maas occurs when a lunar month contains no sidereal solar ingress. Panchvani shows these conventions explicitly so different valid month labels are not mistaken for contradictory astronomy."
    :topic.intro;
  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://panchvani.com/"},{"@type":"ListItem","position":2,"name":"Panchang Knowledge","item":"https://panchvani.com/knowledge"},{"@type":"ListItem","position":3,"name":topic.label,"item":`https://panchvani.com${knowledgePagePath(topic.slug)}`}]},
    {"@type":"Article","headline":headline,"description":isHinduMonths?"Amanta, Purnimanta and Adhika Maas conventions in the Hindu lunar calendar.":copy.description,"mainEntityOfPage":`https://panchvani.com${knowledgePagePath(topic.slug)}`,"about":{"@type":"Thing","name":topic.label},"author":{"@type":"Organization","name":"Panchvani"},"publisher":{"@type":"Organization","name":"Panchvani"}}
  ]};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-panchang">
    <div className="breadcrumbs"><Link href="/">Home</Link> / <Link href="/knowledge">Panchang Knowledge</Link> / {topic.label}</div>
    <p className="page-kicker">{topic.kicker}</p>
    <h1 className="page-title">{headline}</h1>
    <p className="page-subtitle">{intro}</p>

    <section className="wide-panel">
      <div className="seo-copy"><small>CALCULATION MODEL</small><h2>{topic.formula}</h2><p>{copy.engineNote}</p></div>
    </section>

    {isHinduMonths?<section className="wide-panel">
      <div className="seo-copy">
        <h2>Amanta vs Purnimanta</h2>
        <p>Amanta months run from one new-moon boundary to the next and end at Amavasya. Purnimanta months run around the full-moon boundary and end at Purnima. During a regular Krishna Paksha, the same astronomical day therefore commonly carries the following month name in Purnimanta reckoning compared with Amanta reckoning.</p>
        <p>Panchvani keeps both labels visible on daily Panchang and Hindu Month Finder results instead of choosing one system and presenting it as universal across India.</p>
        <h2>How Adhika Maas is identified</h2>
        <p>A normal lunar month contains a sidereal solar ingress, or Sankranti. When the Sun remains in the same sidereal Rashi across the two new moons that bound a lunar month, there is no Sankranti within that month. Panchvani marks that month as Adhika Maas and keeps the Adhika identity explicit in both displayed lunar-month conventions.</p>
        <h2>Regional calendars are a separate layer</h2>
        <p>Tamil, Malayalam and Bengali solar calendars assign solar ingress to a civil day using their own boundary rules. Gujarati Panchang uses Amanta lunar months but its Samvat year changes at Kartika Shukla Pratipada after Diwali, not at the Chaitra boundary used by the generic Chaitradi Vikram Samvat. Those are calendar-convention differences, not errors in the underlying Sun or Moon positions.</p>
      </div>
    </section>:null}

    <section className="data-grid">{copy.facts.map(fact=><div className="data-card" key={fact.label}><small>{fact.label}</small><strong>{fact.value}</strong><small>{fact.note}</small></div>)}</section>

    {copy.sections.map(section=><section className="wide-panel" key={section.title}>
      <div className="seo-copy"><h2>{section.title}</h2>{section.paragraphs.map((paragraph,index)=><p key={index}>{paragraph}</p>)}{section.items?.length?<ul>{section.items.map(item=><li key={item}>{item}</li>)}</ul>:null}</div>
    </section>)}

    <section className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>See the concept in a live Panchang</h2>
      <p className="page-subtitle">Open today’s calculated city page to see this factor beside the other Panchang limbs and location-sensitive timings.</p>
      <div className="pill-links"><Link href={`/panchang/${city.slug}`}>Today’s Panchang in {city.name}</Link><Link href="/methodology">Full calculation methodology</Link><Link href="/accuracy">Accuracy &amp; validation</Link></div>
    </section>

    <nav className="wide-panel" aria-label={`Related ${topic.label} guides`}>
      <h2 className="page-title" style={{fontSize:32}}>Related Panchang concepts</h2>
      <div className="city-directory">{related.map(item=><Link href={knowledgePagePath(item.slug)} key={item.slug}><small>{item.kicker}</small><strong>{item.label}</strong><span>{item.description}</span></Link>)}</div>
    </nav>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Frequently asked questions</h2>{topic.faq.map(item=><div className="seo-copy" key={item.q}><strong>{item.q}</strong><p>{item.a}</p></div>)}</section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
