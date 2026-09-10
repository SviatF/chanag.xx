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
  return {title:topic.metaTitle,description:topic.description,alternates:{canonical:knowledgePagePath(topic.slug)}};
}

export default async function KnowledgePage({params}:{params:Promise<{topic:string}>}){
  const p=await params;const topic=knowledgeTopicBySlug(p.topic);if(!topic)notFound();
  const city=cities[0];
  const related=topic.related.map(slug=>knowledgeTopics[slug]);
  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://panchvani.com/"},{"@type":"ListItem","position":2,"name":"Panchang Knowledge","item":"https://panchvani.com/knowledge"},{"@type":"ListItem","position":3,"name":topic.label,"item":`https://panchvani.com${knowledgePagePath(topic.slug)}`}]},
    {"@type":"Article","headline":topic.title,"description":topic.description,"mainEntityOfPage":`https://panchvani.com${knowledgePagePath(topic.slug)}`,"about":{"@type":"Thing","name":topic.label},"author":{"@type":"Organization","name":"Panchvani"},"publisher":{"@type":"Organization","name":"Panchvani"}}
  ]};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-panchang">
    <div className="breadcrumbs"><Link href="/">Home</Link> / <Link href="/knowledge">Panchang Knowledge</Link> / {topic.label}</div>
    <p className="page-kicker">{topic.kicker}</p>
    <h1 className="page-title">{topic.title}</h1>
    <p className="page-subtitle">{topic.intro}</p>

    <section className="wide-panel">
      <div className="seo-copy"><small>CALCULATION MODEL</small><h2>{topic.formula}</h2><p>{topic.engineNote}</p></div>
    </section>

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
