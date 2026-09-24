import type {Metadata} from "next";
import Link from "next/link";
import Header from "@/components/Header";
import {cities} from "@/lib/cities";
import {todayInIndia} from "@/lib/dates";
import {muhuratRules} from "@/lib/muhurat";
import {primaryMuhuratEvents} from "@/lib/seo-policy";

export const revalidate=86400;
export const metadata:Metadata={title:"Muhurat Planning — Wedding, Griha Pravesh & Vehicle Purchase",description:"Explore Muhurat candidate dates for wedding, Griha Pravesh, vehicle purchase and other milestones, with city-local timing analysis and event-specific continuity metrics.",alternates:{canonical:"/muhurat"}};

const descriptions:Record<string,string>={
  wedding:"Wedding candidate dates with the longest continuity target in the current planning model.",
  "griha-pravesh":"Home-entry candidate dates with local clean-time continuity and lunar-match context.",
  "vehicle-purchase":"Vehicle-purchase candidates with compact local timing windows and city-level exclusions.",
  "naming-ceremony":"Naming-ceremony candidates ranked by local clean time and favorable timing-source coverage.",
  "business-opening":"Business-opening candidates with local continuity, clean minutes and source diversity.",
  "gold-purchase":"Gold-purchase timing candidates separated from the independent market-price dataset."
};

export default function MuhuratHub(){
  const city=cities[0];const now=todayInIndia();const year=now.getUTCFullYear();const month=String(now.getUTCMonth()+1).padStart(2,"0");
  const entries=Object.entries(muhuratRules);const primary=new Set<string>(primaryMuhuratEvents);
  const ld={"@context":"https://schema.org","@type":"CollectionPage","name":"Muhurat Planning","url":"https://panchvani.com/muhurat","description":"Event-specific candidate-date analysis with local timing windows and planning metrics."};
  return <main><Header city={city}/><div className="page-shell internal-visual internal-muhurat">
    <div className="breadcrumbs"><Link href="/">Home</Link> / Muhurat</div>
    <p className="page-kicker">MUHURAT PLANNING</p><h1 className="page-title">Muhurat candidates<br/>for important moments</h1>
    <p className="page-subtitle">Choose a milestone, then open a year, month and city to compare candidate density, local clean-time supply and event-specific continuity.</p>
    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Most-used Muhurat planning guides</h2><div className="city-directory">{entries.filter(([slug])=>primary.has(slug)).map(([slug,rule])=><Link href={`/muhurat/${slug}/${year}`} key={slug}><small>{year} yearly analysis</small><strong>{rule.title}</strong><span>{descriptions[slug]}</span></Link>)}</div></section>
    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>More milestone planning</h2><div className="city-directory">{entries.filter(([slug])=>!primary.has(slug)).map(([slug,rule])=><Link href={`/muhurat/${slug}/${year}/${month}`} key={slug}><small>Current month analysis</small><strong>{rule.title}</strong><span>{descriptions[slug]}</span></Link>)}</div></section>
    <div className="pill-links"><Link href={`/panchang/${city.slug}`}>Today’s Panchang</Link><Link href="/methodology">Calculation methodology</Link></div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
