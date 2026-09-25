import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import {cityBySlug} from "@/lib/cities";
import {festivalsForYear} from "@/lib/festivals";
import {festivalDateIsValidated,validateFestivalYear} from "@/lib/festival-expansion";
import {buildHinduCalendarYearContext} from "@/lib/hindu-calendar-year-context";
import {isVratIndexable,isYearlyCalendarIndexable,isYearlyMuhuratIndexable,primaryMuhuratEvents,primaryVratTypes,robotsFor,yearlyIndexYears} from "@/lib/seo-policy";
import {sitemapPriorityCities} from "@/lib/seo-sitemap";
import {hinduCalendarYearSsgPriority} from "@/lib/static-seo-routes";
import {parseRouteYear} from "@/lib/route-validation";
import {cityCalendarYearPath,hinduCalendarYearPath,muhuratYearPath,yearlyMonths} from "@/lib/yearly-expansion";

export const dynamicParams=true;
export const revalidate=86400;

export function generateStaticParams(){return hinduCalendarYearSsgPriority;}

export async function generateMetadata({params}:{params:Promise<{year:string}>}):Promise<Metadata>{
  const p=await params;const year=parseRouteYear(p.year);if(!year)notFound();
  return {title:`Hindu Calendar ${year} — Festivals, Vrat & Panchang`,description:`Hindu Calendar ${year} with monthly Panchang entry points, maintained festival dates, Ekadashi, Purnima, Amavasya and yearly Muhurat planning hubs.`,alternates:{canonical:hinduCalendarYearPath(year)},robots:robotsFor(isYearlyCalendarIndexable(year))};
}

export default async function HinduCalendarYear({params}:{params:Promise<{year:string}>}){
  const p=await params;const year=parseRouteYear(p.year);if(!year)notFound();
  const city=cityBySlug("mumbai");
  const activeYears=yearlyIndexYears();
  const indexable=isYearlyCalendarIndexable(year);
  const festivals=festivalsForYear(year).filter(item=>festivalDateIsValidated(item.slug,year));
  const coverage=validateFestivalYear(year);
  const vratLinks=primaryVratTypes.filter(vrat=>isVratIndexable(vrat,year)).map(vrat=>({href:`/vrat/${vrat}/${year}`,label:vrat.replaceAll("-"," ")}));
  const muhuratLinks=primaryMuhuratEvents.filter(event=>isYearlyMuhuratIndexable(event,year)).map(event=>({href:muhuratYearPath(event,year),label:event.replaceAll("-"," ")}));
  const yearContext=buildHinduCalendarYearContext(year,activeYears,festivals,{present:coverage.present,expected:coverage.expected},sitemapPriorityCities.length,vratLinks.length,muhuratLinks.length);
  const ld={"@context":"https://schema.org","@type":"CollectionPage","name":`Hindu Calendar ${year}`,"url":`https://panchvani.com${hinduCalendarYearPath(year)}`,"description":yearContext.directAnswer};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-calendar">
    <div className="breadcrumbs"><Link href="/">Home</Link> / Hindu Calendar / {year}</div>
    <p className="page-kicker">{yearContext.eyebrow}</p>
    <h1 className="page-title">Hindu Calendar<br/>{year}</h1>
    <p className="page-subtitle">{yearContext.directAnswer}</p>

    <section className="wide-panel"><div className="seo-copy"><small>YEAR CONTEXT</small><h2>{yearContext.title}</h2><p>{yearContext.body}</p></div><div className="data-grid">{yearContext.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}</div></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>12-month calendar</h2><p className="page-subtitle">{yearContext.monthBody}</p><div className="city-directory">{yearlyMonths.map(item=><Link href={`/calendar/${city.slug}/${year}/${item.slug}`} key={item.slug}><small>{year}</small><strong>{item.name}</strong><span>Monthly Panchang · Mumbai baseline</span></Link>)}</div></section>

    {indexable?<section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Hindu Calendar {year} by city</h2><p className="page-subtitle">Open a city year to compare twelve local month-start Panchang states, seasonal sunrise movement and linked observance pages.</p><div className="city-directory">{sitemapPriorityCities.map(item=><Link href={cityCalendarYearPath(item,year)} key={item.slug}><small>{item.state}</small><strong>{item.name}</strong><span>12 local monthly entry points</span></Link>)}</div></section>:null}

    <section className="wide-panel"><div className="seo-copy"><h2>{yearContext.planningTitle}</h2><p>{yearContext.planningBody}</p></div><div className="pill-links">{vratLinks.map(item=><Link href={item.href} key={item.href}>{item.label} {year}</Link>)}{muhuratLinks.map(item=><Link href={item.href} key={item.href}>{item.label} Muhurat {year}</Link>)}</div></section>

    <section className="wide-panel"><div className="seo-copy"><h2>{yearContext.festivalTitle}</h2><p>{yearContext.festivalBody}</p></div>{festivals.length?<div className="city-directory">{festivals.map(item=><Link href={`/festivals/${item.slug}/${year}`} key={item.slug}><small>{item.date}</small><strong>{item.name}</strong><span>{item.short}</span></Link>)}</div>:null}</section>

    <div className="pill-links">{activeYears.includes(year-1)?<Link href={hinduCalendarYearPath(year-1)}>← {year-1}</Link>:null}{activeYears.includes(year+1)?<Link href={hinduCalendarYearPath(year+1)}>{year+1} →</Link>:null}</div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
