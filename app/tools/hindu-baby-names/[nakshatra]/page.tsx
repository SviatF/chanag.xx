import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import {cities} from "@/lib/cities";
import {nakshatraBySlug,nakshatraNaming} from "@/lib/baby-names";

export const revalidate=604800;

export async function generateMetadata({params}:{params:Promise<{nakshatra:string}>}):Promise<Metadata>{
  const p=await params;
  const item=nakshatraBySlug(p.nakshatra);
  if(!item)return {title:"Nakshatra not found",robots:{index:false,follow:true}};
  return {
    title:`Hindu Baby Names for ${item.name} Nakshatra — Pada Sounds`,
    description:`${item.name} Nakshatra baby-name ideas by traditional Pada sounds: ${item.sounds.join(", ")}. Browse naming references across all 27 Nakshatras.`,
    alternates:{canonical:`/tools/hindu-baby-names/${item.slug}`}
  };
}

export default async function Page({params}:{params:Promise<{nakshatra:string}>}){
  const p=await params;
  const item=nakshatraBySlug(p.nakshatra);
  if(!item)notFound();

  const ld={"@context":"https://schema.org","@type":"WebPage","name":`${item.name} Nakshatra Baby Names`,"url":`https://panchvani.com/tools/hindu-baby-names/${item.slug}`,"description":`${item.name} naming sounds and baby-name ideas.`};

  return <main><Header city={cities[0]}/><div className="page-shell internal-visual internal-tools">
    <div className="breadcrumbs"><Link href="/tools">Tools</Link> / <Link href="/tools/hindu-baby-names">Baby Names by Nakshatra</Link> / {item.name}</div>
    <p className="page-kicker">BABY NAMES BY NAKSHATRA</p>
    <h1 className="page-title">{item.name}<br/>baby names</h1>
    <p className="page-subtitle">{item.note} If your family follows Janma Nakshatra naming, use the exact Nakshatra and Pada from a birth-time chart. Panchvani’s date-only Nakshatra Finder is an estimate, not an exact natal calculation.</p>

    <div className="data-grid">
      {item.sounds.map((sound,index)=><div className="data-card" key={sound}><small>Pada {index+1}</small><strong>{sound}</strong><small>Traditional starting sound</small></div>)}
    </div>

    <section className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>Name ideas</h2>
      <div className="city-directory">{item.names.map(name=><div className="data-card" key={name}><strong>{name}</strong><small>Matches a traditional sound group or a common transliteration family.</small></div>)}</div>
    </section>

    <div className="seo-copy"><h2>How Nakshatra naming works</h2><p>Traditional naming associates each Nakshatra with four Pada sounds. When a family follows this convention, the exact Moon position at birth determines the Janma Nakshatra and Pada used for the preferred starting sound. Transliteration varies across Indian languages, so the same sound may appear in several spellings.</p></div>

    <div className="pill-links">
      <Link href="/tools/hindu-baby-names">All 27 Nakshatras</Link>
      <Link href="/tools/nakshatra-finder">Date-only Nakshatra estimate</Link>
      {nakshatraNaming.slice(0,6).filter(n=>n.slug!==item.slug).map(n=><Link href={`/tools/hindu-baby-names/${n.slug}`} key={n.slug}>{n.name}</Link>)}
    </div>

    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
