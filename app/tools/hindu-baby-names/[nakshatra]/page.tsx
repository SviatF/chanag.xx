import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import MethodologyNote from "@/components/MethodologyNote";
import {cities} from "@/lib/cities";
import {nakshatraBySlug,nakshatraNaming} from "@/lib/baby-names";
import {buildNakshatraNamingQuality} from "@/lib/baby-name-quality";

export const revalidate=604800;

export async function generateMetadata({params}:{params:Promise<{nakshatra:string}>}):Promise<Metadata>{
  const p=await params;
  const item=nakshatraBySlug(p.nakshatra);
  if(!item)return {title:"Nakshatra not found",robots:{index:false,follow:true}};
  return {
    title:`Hindu Baby Names for ${item.name} Nakshatra — 4 Pada Sounds`,
    description:`${item.name} Nakshatra baby-name reference with four Pada sounds (${item.sounds.join(", ")}), transliteration guidance, example names and a birth-time Pada workflow.`,
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
      <div className="seo-copy"><h2>{item.name} Pada-by-Pada naming sounds</h2><p>{item.note} The four cards below keep the Pada order explicit so the sound sequence is not confused with a general list of initials.</p></div>
      <div className="data-grid">
        {quality.padaGuides.map(guide=><div className="data-card" key={guide.pada}><small>Pada {guide.pada}</small><strong>{guide.sound}</strong><h3>{guide.title}</h3><p>{guide.body}</p></div>)}
      </div>
    </section>

    <section className="wide-panel"><div className="seo-copy"><h2>{quality.transliterationTitle}</h2><p>{quality.transliterationBody}</p></div></section>

    <section className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>Name ideas for {item.name}</h2>
      <div className="city-directory">{item.names.map(name=><div className="data-card" key={name}><strong>{name}</strong><small>Example from Panchvani's maintained {item.name} reference set; compare the spoken opening syllable with the relevant Pada sound.</small></div>)}</div>
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

    <MethodologyNote title={`${item.name} naming methodology`}><p>This page uses Panchvani's maintained four-Pada sound reference and example-name dataset. It does not infer a child's natal Pada from a name. If your family follows Janma Nakshatra naming, the exact Nakshatra and Pada come from the Moon's position at birth. Panchvani's date-only finder is an estimate; exact natal calculation requires birth time and birthplace. Roman spellings are treated as pronunciation references because transliteration varies across Indian languages and family conventions.</p></MethodologyNote>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
