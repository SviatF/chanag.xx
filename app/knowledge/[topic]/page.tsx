import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import {cities} from "@/lib/cities";
import {knowledgePagePath,knowledgeTopicBySlug,knowledgeTopics,knowledgeTopicSlugs} from "@/lib/panchang-knowledge";

export const revalidate=604800;

export function generateStaticParams(){return knowledgeTopicSlugs.map(topic=>({topic}));}

export async function generateMetadata({params}:{params:Promise<{topic:string}>}):Promise<Metadata>{
  const p=await params;const topic=knowledgeTopicBySlug(p.topic);if(!topic)notFound();
  if(topic.slug==="hindu-months")return {
    title:"Hindu Calendar Months — Amanta, Purnimanta & Adhika Maas Explained",
    description:"Understand the 12 Hindu lunar months, the difference between Amanta and Purnimanta month names, Adhika Maas and why regional calendars can label the same day differently.",
    alternates:{canonical:knowledgePagePath(topic.slug)}
  };
  return {title:topic.metaTitle,description:topic.description,alternates:{canonical:knowledgePagePath(topic.slug)}};
}

export default async function KnowledgePage({params}:{params:Promise<{topic:string}>}){
  const p=await params;const topic=knowledgeTopicBySlug(p.topic);if(!topic)notFound();
  const city=cities[0];
  const related=topic.related.map(slug=>knowledgeTopics[slug]);
  const isHinduMonths=topic.slug==="hindu-months";
  const headline=isHinduMonths?"Hindu calendar months: Amanta, Purnimanta & Adhika Maas":topic.title;
  const intro=isHinduMonths
    ?"Hindu lunar month names are not assigned by one universal convention across India. Amanta months end at Amavasya, Purnimanta months end at Purnima, and an Adhika Maas occurs when a lunar month contains no sidereal solar ingress. Panchvani shows these conventions explicitly so different valid month labels are not mistaken for contradictory astronomy."
    :topic.intro;
  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://panchvani.com/"},{"@type":"ListItem","position":2,"name":"Panchang Knowledge","item":"https://panchvani.com/knowledge"},{"@type":"ListItem","position":3,"name":topic.label,"item":`https://panchvani.com${knowledgePagePath(topic.slug)}`}]},
    {"@type":"Article","headline":headline,"description":isHinduMonths?"Amanta, Purnimanta and Adhika Maas conventions in the Hindu lunar calendar.":topic.description,"mainEntityOfPage":`https://panchvani.com${knowledgePagePath(topic.slug)}`,"about":{"@type":"Thing","name":topic.label},"author":{"@type":"Organization","name":"Panchvani"},"publisher":{"@type":"Organization","name":"Panchvani"}}
  ]};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-panchang">
    <div className="breadcrumbs"><Link href="/">Home</Link> / <Link href="/knowledge">Panchang Knowledge</Link> / {topic.label}</div>
    <p className="page-kicker">{topic.kicker}</p>
    <h1 className="page-title">{headline}</h1>
    <p className="page-subtitle">{intro}</p>

    <section className="wide-panel">
      <div className="seo-copy"><small>CALCULATION MODEL</small><h2>{topic.formula}</h2><p>{topic.engineNote}</p></div>
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

    <section className="data-grid">{topic.facts.map(fact=><div className="data-card" key={fact.label}><small>{fact.label}</small><strong>{fact.value}</strong><small>{fact.note}</small></div>)}</section>

    {topic.sections.map(section=><section className="wide-panel" key={section.title}>
      <div className="seo-copy"><h2>{section.title}</h2>{section.paragraphs.map((paragraph,index)=><p key={index}>{paragraph}</p>)}{section.items?.length?<ul>{section.items.map(item=><li key={item}>{item}</li>)}</ul>:null}</div>
    </section>)}

    <section className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>See the concept in a live Panchang</h2>
      <p className="page-subtitle">Open today’s calculated city page to see this factor beside the other Panchang limbs and location-sensitive timings.</p>
      <div className="pill-links"><Link href={`/panchang/${city.slug}`}>Today’s Panchang in {city.name}</Link><Link href="/methodology">Full calculation methodology</Link><Link href="/accuracy">Accuracy & limitations</Link></div>
    </section>

    <nav className="wide-panel" aria-label={`Related ${topic.label} guides`}>
      <h2 className="page-title" style={{fontSize:32}}>Related Panchang concepts</h2>
      <div className="city-directory">{related.map(item=><Link href={knowledgePagePath(item.slug)} key={item.slug}><small>{item.kicker}</small><strong>{item.label}</strong><span>{item.description}</span></Link>)}</div>
    </nav>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Frequently asked questions</h2>{topic.faq.map(item=><div className="seo-copy" key={item.q}><strong>{item.q}</strong><p>{item.a}</p></div>)}</section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
