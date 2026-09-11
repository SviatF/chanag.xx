import type {Metadata} from "next";
import Link from "next/link";
import Header from "@/components/Header";
import {cities} from "@/lib/cities";
import {nakshatraNaming} from "@/lib/baby-names";

export const revalidate=604800;

export const metadata:Metadata={
  title:"Hindu Baby Names by Nakshatra — 27 Nakshatra Guides",
  description:"Browse Hindu baby-name ideas by all 27 Nakshatras and traditional Pada starting sounds. Use an exact birth chart for a precise Janma Nakshatra and Pada.",
  alternates:{canonical:"/tools/hindu-baby-names"}
};

export default function BabyNamesHub(){
  const city=cities[0];
  const ld={"@context":"https://schema.org","@type":"CollectionPage","name":"Hindu Baby Names by Nakshatra","url":"https://panchvani.com/tools/hindu-baby-names","description":"Traditional baby-name starting sounds and name ideas across all 27 Nakshatras."};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-tools">
    <div className="breadcrumbs"><Link href="/tools">Tools</Link> / Baby Names by Nakshatra</div>
    <p className="page-kicker">BABY NAMES BY NAKSHATRA</p>
    <h1 className="page-title">Hindu baby names<br/>by Nakshatra</h1>
    <p className="page-subtitle">Choose a Nakshatra to see its four traditional Pada starting sounds and a curated set of name ideas. For precise Janma Nakshatra and Pada, use an exact birth-time chart rather than a date-only estimate.</p>

    <section className="wide-panel"><div className="city-directory">{nakshatraNaming.map(item=><Link href={`/tools/hindu-baby-names/${item.slug}`} key={item.slug}><small>{item.sounds.join(" · ")}</small><strong>{item.name}</strong><span>Traditional Pada sounds and name ideas</span></Link>)}</div></section>

    <div className="seo-copy"><h2>How Nakshatra naming works</h2><p>Traditional naming systems associate each Nakshatra with four Pada sounds. Families may use those sounds as a starting point for a child’s name, while spelling and pronunciation vary across Indian languages and regional traditions.</p><p>Panchvani’s date-only Nakshatra Finder is an estimate at the selected date and city. It should not be treated as an exact Janma Nakshatra calculation without birth time.</p></div>

    <div className="pill-links"><Link href="/tools/nakshatra-finder">Nakshatra date estimate</Link><Link href="/knowledge/nakshatra">What is Nakshatra?</Link><Link href="/tools">All Panchang tools</Link></div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
