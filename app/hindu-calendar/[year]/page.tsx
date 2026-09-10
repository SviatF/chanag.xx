import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import {cityBySlug} from "@/lib/cities";
import {festivalsForYear} from "@/lib/festivals";
import {festivalDateIsValidated,validateFestivalYear} from "@/lib/festival-expansion";
import {isVratIndexable,isYearlyCalendarIndexable,isYearlyMuhuratIndexable,primaryMuhuratEvents,primaryVratTypes,robotsFor} from "@/lib/seo-policy";
import {sitemapPriorityCities} from "@/lib/seo-sitemap";
import {parseRouteYear} from "@/lib/route-validation";
import {cityCalendarYearPath,hinduCalendarYearPath,muhuratYearPath,yearlyMonths} from "@/lib/yearly-expansion";

export const revalidate=86400;

export async function generateMetadata({params}:{params:Promise<{year:string}>}):Promise<Metadata>{
  const p=await params;const year=parseRouteYear(p.year);if(!year)notFound();
  return {title:`Hindu Calendar ${year} — Festivals, Vrat & Panchang`,description:`Hindu Calendar ${year} with monthly Panchang entry points, validated festival dates, Ekadashi, Purnima, Amavasya and yearly Muhurat planning hubs.`,alternates:{canonical:hinduCalendarYearPath(year)},robots:robotsFor(isYearlyCalendarIndexable(year))};
}

export default async function HinduCalendarYear({params}:{params:Promise<{year:string}>}){
  const p=await params;const year=parseRouteYear(p.year);if(!year)notFound();
  const city=cityBySlug("mumbai");
  const festivals=festivalsForYear(year).filter(item=>festivalDateIsValidated(item.slug,year));
  const coverage=validateFestivalYear(year);
  const vratLinks=primaryVratTypes.filter(vrat=>isVratIndexable(vrat,year)).map(vrat=>({href:`/vrat/${vrat}/${year}`,label:vrat.replaceAll("-"," ")}));
  const muhuratLinks=primaryMuhuratEvents.filter(event=>isYearlyMuhuratIndexable(event,year)).map(event=>({href:muhuratYearPath(event,year),label:event.replaceAll("-"," ")}));
  const ld={"@context":"https://schema.org","@type":"CollectionPage","name":`Hindu Calendar ${year}`,"url":`https://panchvani.com${hinduCalendarYearPath(year)}`,"description":`Yearly Hindu calendar hub for ${year} with Panchang, lunar observances, festivals and Muhurat planning.`};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-calendar">
    <div className="breadcrumbs"><Link href="/">Home</Link> / Hindu Calendar / {year}</div>
    <p className="page-kicker">YEARLY HINDU CALENDAR · INDIA</p>
    <h1 className="page-title">Hindu Calendar<br/>{year}</h1>
    <p className="page-subtitle">A yearly discovery hub for month-by-month Panchang, sunrise-based lunar observances, validated festival records and the primary Panchvani Muhurat planning families. Mumbai is used only as the default monthly entry point; city yearly calendars recalculate location-sensitive values.</p>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>12-month calendar</h2><div className="city-directory">{yearlyMonths.map(item=><Link href={`/calendar/${city.slug}/${year}/${item.slug}`} key={item.slug}><small>{year}</small><strong>{item.name}</strong><span>Monthly Panchang · Mumbai baseline</span></Link>)}</div></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Hindu Calendar {year} by city</h2><p className="page-subtitle">Year pages are exposed only for cities active under the current SEO city policy.</p><div className="city-directory">{sitemapPriorityCities.map(item=><Link href={cityCalendarYearPath(item,year)} key={item.slug}><small>{item.state}</small><strong>{item.name}</strong><span>12 local monthly entry points</span></Link>)}</div></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Lunar observances & Muhurat</h2><div className="pill-links">{vratLinks.map(item=><Link href={item.href} key={item.href}>{item.label} {year}</Link>)}{muhuratLinks.map(item=><Link href={item.href} key={item.href}>{item.label} Muhurat {year}</Link>)}</div></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Validated festivals in {year}</h2>{festivals.length?<div className="city-directory">{festivals.map(item=><Link href={`/festivals/${item.slug}/${year}`} key={item.slug}><small>{item.date}</small><strong>{item.name}</strong><span>{item.short}</span></Link>)}</div>:<p className="page-subtitle">No validated festival records are stored for this year yet.</p>}{coverage.present?<p className="page-subtitle">Festival dataset coverage: {coverage.present}/{coverage.expected} records ({coverage.coveragePct}%). {coverage.missing.length?"Missing records are not synthesized or guessed.":"The maintained catalog is structurally complete for this year."}</p>:null}</section>

    <div className="pill-links"><Link href={hinduCalendarYearPath(year-1)}>← {year-1}</Link><Link href={hinduCalendarYearPath(year+1)}>{year+1} →</Link></div>
    <div className="seo-copy"><h2>What this yearly page does</h2><p>This page is an indexable annual owner only inside Panchvani's rolling year policy. It consolidates the search intent around “Hindu Calendar {year}” without replacing the more precise city/month/day pages. Festival dates appear only when the curated festival dataset contains a validated record for {year}.</p></div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}