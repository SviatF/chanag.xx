import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import {findCityBySlug} from "@/lib/cities";
import {festivalDateIsValidated} from "@/lib/festival-expansion";
import {festivalsForYear} from "@/lib/festivals";
import {getPanchang} from "@/lib/panchang";
import {isVratIndexable,isYearlyCalendarIndexable,isYearlyMuhuratIndexable,primaryMuhuratEvents,primaryVratTypes,robotsFor} from "@/lib/seo-policy";
import {parseRouteYear} from "@/lib/route-validation";
import {cityCalendarYearPath,hinduCalendarYearPath,muhuratYearPath,yearlyMonths} from "@/lib/yearly-expansion";
import {sitemapPriorityCities} from "@/lib/seo-sitemap";

export const revalidate=86400;

export async function generateMetadata({params}:{params:Promise<{city:string;year:string}>}):Promise<Metadata>{
  const p=await params;const city=findCityBySlug(p.city);const year=parseRouteYear(p.year);if(!city||!year)notFound();
  return {title:`Hindu Calendar ${year} in ${city.name} — Panchang by Month`,description:`Yearly Hindu calendar for ${city.name} in ${year} with 12 monthly Panchang pages, local Tithi/Nakshatra snapshots, festivals and lunar observances.`,alternates:{canonical:cityCalendarYearPath(city,year)},robots:robotsFor(isYearlyCalendarIndexable(year,city.slug))};
}

export default async function CityYearCalendar({params}:{params:Promise<{city:string;year:string}>}){
  const p=await params;const city=findCityBySlug(p.city);const year=parseRouteYear(p.year);if(!city||!year)notFound();
  const snapshots=await Promise.all(yearlyMonths.map(item=>getPanchang(new Date(Date.UTC(year,item.month-1,1,6)),city)));
  const festivals=festivalsForYear(year).filter(item=>festivalDateIsValidated(item.slug,year));
  const peers=sitemapPriorityCities.filter(item=>item.slug!==city.slug).slice(0,6);
  const ld={"@context":"https://schema.org","@type":"CollectionPage","name":`Hindu Calendar ${year} in ${city.name}`,"url":`https://panchvani.com${cityCalendarYearPath(city,year)}`};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-calendar">
    <div className="breadcrumbs"><Link href={hinduCalendarYearPath(year)}>Hindu Calendar {year}</Link> / {city.name}</div>
    <p className="page-kicker">YEARLY CALENDAR · {city.state}</p>
    <h1 className="page-title">Hindu Calendar {year}<br/>in {city.name}</h1>
    <p className="page-subtitle">Twelve local monthly entry points using {city.name} coordinates. The snapshot on each card is the Tithi and Nakshatra active at local sunrise on the first day of that Gregorian month.</p>

    <section className="wide-panel"><div className="city-directory">{yearlyMonths.map((item,index)=>{const data=snapshots[index];return <Link href={`/calendar/${city.slug}/${year}/${item.slug}`} key={item.slug}><small>{item.name} 1 · sunrise {data.sunrise}</small><strong>{item.name}</strong><span>{data.tithi} · {data.nakshatra}</span></Link>;})}</div></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Yearly lunar observances</h2><div className="pill-links">{primaryVratTypes.filter(vrat=>isVratIndexable(vrat,year,city.slug)).map(vrat=><Link href={`/vrat/${vrat}/${year}/${city.slug}`} key={vrat}>{vrat.replaceAll("-"," ")} {year}</Link>)}</div></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Muhurat planning in {year}</h2><p className="page-subtitle">Annual India-baseline hubs summarize the year; drill into a month to open city-specific clean timing windows.</p><div className="pill-links">{primaryMuhuratEvents.filter(event=>isYearlyMuhuratIndexable(event,year)).map(event=><Link href={muhuratYearPath(event,year)} key={event}>{event.replaceAll("-"," ")} Muhurat {year}</Link>)}</div></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Festivals in {year}</h2>{festivals.length?<div className="city-directory">{festivals.map(item=><Link href={`/festivals/${item.slug}/${year}/${city.slug}`} key={item.slug}><small>{item.date}</small><strong>{item.name}</strong><span>Open local Panchang context</span></Link>)}</div>:<p className="page-subtitle">No validated festival records are currently stored for {year}; Panchvani does not synthesize missing festival dates.</p>}</section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Compare yearly calendars</h2><div className="pill-links">{peers.map(item=><Link href={cityCalendarYearPath(item,year)} key={item.slug}>{item.name}</Link>)}</div></section>
    <div className="pill-links"><Link href={cityCalendarYearPath(city,year-1)}>← {year-1}</Link><Link href={hinduCalendarYearPath(year)}>India {year}</Link><Link href={cityCalendarYearPath(city,year+1)}>{year+1} →</Link></div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}