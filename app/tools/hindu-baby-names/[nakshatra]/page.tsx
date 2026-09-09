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
    title:`Hindu Baby Names for ${item.name} Nakshatra — Starting Sounds`,
    description:`${item.name} baby names by traditional Pada sounds: ${item.sounds.join(", ")}. Name ideas and links to all 27 Nakshatra naming pages.`,
    alternates:{canonical:`/tools/hindu-baby-names/${item.slug}`}
  };
}

export default async function Page({params}:{params:Promise<{nakshatra:string}>}){
  const p=await params;
  const item=nakshatraBySlug(p.nakshatra);
  if(!item)notFound();

  const ld={"@context":"https://schema.org","@type":"WebApplication","name":`${item.name} Nakshatra Baby Names`,"applicationCategory":"LifestyleApplication","operatingSystem":"Web","url":`https://panchvani.com/tools/hindu-baby-names/${item.slug}`};

  return <main><Header city={cities[0]}/><div className="page-shell internal-visual internal-tools">
    <div className="breadcrumbs"><Link href="/tools">Tools</Link> / Baby Names / {item.name}</div>
    <p className="page-kicker">BABY NAMES BY NAKSHATRA</p>
    <h1 className="page-title">{item.name}<br/>baby names</h1>
    <p className="page-subtitle">{item.note} The exact Pada is determined from the Moon's position at birth, so use the Nakshatra Finder first if you do not know it.</p>

    <div className="data-grid">
      {item.sounds.map((sound,index)=><div className="data-card" key={sound}><small>Pada {index+1}</small><strong>{sound}</strong><small>Traditional starting sound</small></div>)}
    </div>

    <section className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>Name ideas</h2>
      <div className="city-directory">{item.names.map(name=><div className="data-card" key={name}><strong>{name}</strong><small>Matches one of the traditional sound groups or common transliteration families.</small></div>)}</div>
    </section>

    <div className="seo-copy"><h2>How Nakshatra naming works</h2><p>Traditional naming associates each Nakshatra with four Pada sounds. The Moon's exact Nakshatra and Pada at birth determines the preferred starting sound. Transliteration varies between Indian languages, so spellings such as long vowels may appear in several forms.</p></div>

    <div className="pill-links">
      <Link href="/tools/nakshatra-finder">Find birth Nakshatra</Link>
      {nakshatraNaming.map(n=><Link href={`/tools/hindu-baby-names/${n.slug}`} key={n.slug}>{n.name}</Link>)}
    </div>

    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
