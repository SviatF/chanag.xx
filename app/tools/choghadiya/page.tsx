import type {Metadata} from "next";
import Link from "next/link";
import Header from "@/components/Header";
import ChoghadiyaTable from "@/components/ChoghadiyaTable";
import MethodologyNote from "@/components/MethodologyNote";
import {cities} from "@/lib/cities";
import {todayInIndia} from "@/lib/dates";
import {getPanchang} from "@/lib/panchang";
import {sitemapPriorityCities} from "@/lib/seo-sitemap";

export const revalidate=3600;

export const metadata:Metadata={
  title:"Today's Choghadiya — Day & Night Timings by City",
  description:"Check today's Choghadiya using local sunrise, sunset and next sunrise. Choose an Indian city for 8 daytime and 8 nighttime periods.",
  alternates:{canonical:"/tools/choghadiya"}
};

export default async function ChoghadiyaHub(){
  const city=cities[0];
  const date=todayInIndia();
  const data=await getPanchang(date,city);
  const ld={"@context":"https://schema.org","@type":"WebApplication","name":"Today's Choghadiya by City","applicationCategory":"LifestyleApplication","operatingSystem":"Web","url":"https://panchvani.com/tools/choghadiya","description":"Location-sensitive day and night Choghadiya based on local solar timing."};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-tools">
    <div className="breadcrumbs"><Link href="/tools">Tools</Link> / Choghadiya</div>
    <p className="page-kicker">TODAY'S CHOGHADIYA</p>
    <h1 className="page-title">Day & night Choghadiya<br/>for your city</h1>
    <p className="page-subtitle">Choose a city to see today's local day and night Choghadiya sequence.</p>

    <section className="wide-panel"><div className="data-grid">
      <div className="data-card"><small>Reference city</small><strong>Mumbai</strong><small>{data.date}</small></div>
      <div className="data-card"><small>Sunrise</small><strong>{data.sunrise}</strong></div>
      <div className="data-card"><small>Sunset</small><strong>{data.sunset}</strong></div>
      <div className="data-card"><small>Rahu Kalam</small><strong>{data.rahu.start} — {data.rahu.end}</strong></div>
    </div></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Mumbai example for today</h2><ChoghadiyaTable day={data.dayChoghadiya} night={data.nightChoghadiya}/></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Choose a city</h2><p className="page-subtitle">Open a city page for its local 16-period sequence.</p><div className="city-directory">{sitemapPriorityCities.map(item=><Link href={`/tools/choghadiya/${item.slug}`} key={item.slug}><small>{item.state}</small><strong>{item.name}</strong><span>Today's local Choghadiya</span></Link>)}</div></section>

    <div className="pill-links"><Link href="/tools/rahu-kalam-calculator">Rahu Kalam Calculator</Link><Link href={`/panchang/${city.slug}`}>Today’s Panchang</Link><Link href="/tools">All Panchang tools</Link></div>
    <MethodologyNote><p>Daytime runs from local sunrise to sunset and is divided into eight equal periods; nighttime runs from sunset to the next local sunrise and is divided into eight more. The weekday determines the sequence, so clock times vary by location.</p></MethodologyNote>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
