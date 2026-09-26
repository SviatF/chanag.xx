import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import MethodologyNote from "@/components/MethodologyNote";
import {cities} from "@/lib/cities";
import {nakshatraBySlug,nakshatraNaming} from "@/lib/baby-names";
import {buildNakshatraNamingQuality} from "@/lib/baby-name-quality";

export const revalidate=604800;
const accuracyCopy="For this convention, exact Nakshatra and Pada come from the Moon's position at birth; exact natal calculation requires birth time and birthplace.";

export async function generateMetadata({params}:{params:Promise<{nakshatra:string}>}):Promise<Metadata>{
  const p=await params;
  const item=nakshatraBySlug(p.nakshatra);
  if(!item)return {title:"Nakshatra not found",robots:{index:false,follow:true}};
  return {
    title:`Hindu Baby Names for ${item.name} Nakshatra — 4 Pada Sounds`,
    description:`${item.name} Nakshatra baby-name reference with four Pada sounds (${item.sounds.join(", ")}), Roman sound profile, example names and birth-time Pada workflow.`,
    alternates:{canonical:`/tools/hindu-baby-names/${item.slug}`}
  };
}

export default async function Page({params}:{params:Promise<{nakshatra:string}>}){
  const p=await params;
  const item=nakshatraBySlug(p.nakshatra);
  if(!item)notFound();
  const quality=buildNakshatraNamingQuality(item,nakshatraNaming);

  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"WebPage","name":`${item.name} Nakshatra Baby Names`,"url":`https://panchvani.com/tools/hindu-baby-names/${item.slug}`,"description":quality.directAnswer},
    {"@type":"FAQPage","mainEntity":quality.faqs.map(faq=>({"@type":"Question","name":faq.question,"acceptedAnswer":{"@type":"Answer","text":faq.answer}}))}
  ]};

  return <main><Header city={cities[0]}/><div className="page-shell internal-visual internal-tools">
    <div className="breadcrumbs"><Link href="/tools">Tools</Link> / <Link href="/tools/hindu-baby-names">Baby Names by Nakshatra</Link> / {item.name}</div>
    <p className="page-kicker">BABY NAMES BY NAKSHATRA · 4 PADA SOUNDS</p>
    <h1 className="page-title">{item.name}<br/>baby names</h1>
    <p className="page-subtitle">{quality.directAnswer}</p>

    <div className="data-grid">
      {quality.facts.map(fact=><div className="data-card" key={fact.label}><small>{fact.label}</small><strong>{fact.value}</strong>{fact.note?<small>{fact.note}</small>:null}</div>)}
    </div>

    <section className="wide-panel">
      <div className="seo-copy"><h2>{item.name} Pada-by-Pada sounds</h2><p>{item.note}</p></div>
      <div className="data-grid">
        {quality.padaGuides.map(guide=><div className="data-card" key={guide.pada}><small>Pada {guide.pada}</small><strong>{guide.sound}</strong><h3>{guide.title}</h3><p>{guide.body}</p></div>)}
      </div>
    </section>

    <section className="wide-panel"><div className="seo-copy"><h2>{quality.transliterationTitle}</h2><p>{quality.transliterationBody}</p></div></section>

    <section className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>Name examples for {item.name}</h2>
      <div className="city-directory">{item.names.map(name=><div className="data-card" key={name}><strong>{name}</strong></div>)}</div>
      <div className="seo-copy"><h2>{quality.examplesTitle}</h2><p>{quality.examplesBody}</p></div>
    </section>

    <section className="wide-panel"><div className="seo-copy"><h2>{quality.workflowTitle}</h2><p>{quality.workflowBody}</p></div></section>
    <section className="wide-panel"><div className="seo-copy"><h2>{quality.sequenceTitle}</h2><p>{quality.sequenceBody}</p></div></section>

    <section className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>{item.name} naming FAQs</h2>
      <div className="seo-copy">{quality.faqs.map(faq=><div key={faq.question}><h3>{faq.question}</h3><p>{faq.answer}</p></div>)}</div>
    </section>

    <div className="pill-links">
      <Link href="/tools/hindu-baby-names">All 27 Nakshatras</Link>
      <Link href="/tools/nakshatra-finder">Date-only Nakshatra estimate</Link>
      {nakshatraNaming.slice(0,8).filter(n=>n.slug!==item.slug).map(n=><Link href={`/tools/hindu-baby-names/${n.slug}`} key={n.slug}>{n.name}</Link>)}
    </div>

    <MethodologyNote title={`${item.name} reference method`}><p>The page uses the maintained {item.name} four-Pada sequence ({item.sounds.join(", ")}) and its stored example-name list. {accuracyCopy} Roman spellings are compared by opening pronunciation because transliteration can vary.</p></MethodologyNote>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
