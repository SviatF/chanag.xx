import type {Metadata} from "next";
import Link from "next/link";
import Header from "@/components/Header";
import {cities} from "@/lib/cities";
import {todayInIndia} from "@/lib/dates";
import {muhuratRules} from "@/lib/muhurat";
import {muhuratExcludedFactors,muhuratScreeningStatement} from "@/lib/religious-integrity";
import {primaryMuhuratEvents} from "@/lib/seo-policy";

export const revalidate=86400;

export const metadata:Metadata={
  title:"Muhurat Planning — Wedding, Griha Pravesh & Vehicle Purchase",
  description:"Explore general Muhurat candidate dates for wedding, Griha Pravesh, vehicle purchase and other milestones, with city-local Panchang timing references and clear screening limits.",
  alternates:{canonical:"/muhurat"}
};

const descriptions:Record<string,string>={
  wedding:"General wedding-date screening using listed Tithi and Nakshatra criteria, followed by local timing windows.",
  "griha-pravesh":"General home-entry date screening with local Panchang timing references for the selected city.",
  "vehicle-purchase":"General vehicle-purchase date screening with city-local favorable and avoid-time references.",
  "naming-ceremony":"General naming-ceremony date candidates based on the current Panchvani screening profile.",
  "business-opening":"General business-opening date candidates with practical local timing windows.",
  "gold-purchase":"General gold-purchase date candidates with location-sensitive Panchang timing context."
};

export default function MuhuratHub(){
  const city=cities[0];
  const now=todayInIndia();
  const year=now.getUTCFullYear();
  const month=String(now.getUTCMonth()+1).padStart(2,"0");
  const entries=Object.entries(muhuratRules);
  const primary=new Set<string>(primaryMuhuratEvents);
  const ld={"@context":"https://schema.org","@type":"CollectionPage","name":"Muhurat Planning","url":"https://panchvani.com/muhurat","description":muhuratScreeningStatement};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-muhurat">
    <div className="breadcrumbs"><Link href="/">Home</Link> / Muhurat</div>
    <p className="page-kicker">MUHURAT PLANNING</p>
    <h1 className="page-title">General Muhurat candidates<br/>for important moments</h1>
    <p className="page-subtitle">Start with a milestone, then open a year, month and city to review screened dates and local timing windows. Panchvani is a planning reference, not a replacement for full Panchang Shuddhi or personalized horoscope review.</p>

    <section className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>Most-used Muhurat planning guides</h2>
      <div className="city-directory">{entries.filter(([slug])=>primary.has(slug)).map(([slug,rule])=><Link href={`/muhurat/${slug}/${year}`} key={slug}><small>{year} yearly overview</small><strong>{rule.title}</strong><span>{descriptions[slug]}</span></Link>)}</div>
    </section>

    <section className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>More milestone planning</h2>
      <div className="city-directory">{entries.filter(([slug])=>!primary.has(slug)).map(([slug,rule])=><Link href={`/muhurat/${slug}/${year}/${month}`} key={slug}><small>Current month reference</small><strong>{rule.title}</strong><span>{descriptions[slug]}</span></Link>)}</div>
    </section>

    <div className="seo-copy"><h2>What Panchvani screens — and what it does not</h2><p>{muhuratScreeningStatement}</p><p>The Planning Score measures practical availability of clean local timing windows. It is not a religious auspiciousness score.</p><ul>{muhuratExcludedFactors.slice(0,6).map(item=><li key={item}>{item}</li>)}</ul></div>

    <div className="pill-links"><Link href={`/panchang/${city.slug}`}>Today’s Panchang</Link><Link href="/methodology">Calculation methodology</Link><Link href="/disclaimer">Muhurat limitations</Link></div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
