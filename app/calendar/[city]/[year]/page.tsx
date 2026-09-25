import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import {findCityBySlug} from "@/lib/cities";
import {buildYearlyCalendarQualityContent} from "@/lib/calendar-content-engine";
import {buildCalendarYearCityContext} from "@/lib/calendar-year-city-context";
import {buildCalendarYearSimilarityContext} from "@/lib/calendar-year-similarity-context";
import {buildCalendarYearHighSimilarityContext} from "@/lib/calendar-year-high-similarity-context";
import {festivalDateIsValidated} from "@/lib/festival-expansion";
import {festivalsForYear} from "@/lib/festivals";
import {getPanchang} from "@/lib/panchang";
import {isVratIndexable,isYearlyCalendarIndexable,isYearlyMuhuratIndexable,primaryMuhuratEvents,primaryVratTypes,robotsFor,yearlyIndexYears} from "@/lib/seo-policy";
import {parseRouteYear} from "@/lib/route-validation";
import {cityCalendarYearPath,hinduCalendarYearPath,muhuratYearPath,yearlyMonths} from "@/lib/yearly-expansion";
import {sitemapPriorityCities} from "@/lib/seo-sitemap";
import {cityCalendarYearSsgPriority} from "@/lib/static-seo-routes";

export const dynamicParams=true;
export const revalidate=86400;

export function generateStaticParams(){return cityCalendarYearSsgPriority;}

export async function generateMetadata({params}:{params:Promise<{city:string;year:string}>}):Promise<Metadata>{
  const p=await params;const city=findCityBySlug(p.city);const year=parseRouteYear(p.year);if(!city||!year)notFound();
  return {title:`Hindu Calendar ${year} in ${city.name} — Panchang by Month`,description:`Yearly Hindu calendar for ${city.name} in ${year} with 12 monthly Panchang pages, local Tithi/Nakshatra snapshots, festivals and lunar observances.`,alternates:{canonical:cityCalendarYearPath(city,year)},robots:robotsFor(isYearlyCalendarIndexable(year,city.slug))};
}

export default async function CityYearCalendar({params}:{params:Promise<{city:string;year:string}>}){
  const p=await params;const city=findCityBySlug(p.city);const year=parseRouteYear(p.year);if(!city||!year)notFound();
  const activeYears=yearlyIndexYears();
  const indexable=isYearlyCalendarIndexable(year,city.slug);
  const snapshots=await Promise.all(yearlyMonths.map(item=>getPanchang(new Date(Date.UTC(year,item.month-1,1,6)),city)));
  const festivals=festivalsForYear(year).filter(item=>festivalDateIsValidated(item.slug,year));
  const qualityContent=buildYearlyCalendarQualityContent(city,year,snapshots,festivals);
  const cityContext=buildCalendarYearCityContext(city,year,snapshots,festivals);
  const similarityContext=buildCalendarYearSimilarityContext(city,year,snapshots,festivals);
  const highSimilarityContext=buildCalendarYearHighSimilarityContext(city,year,snapshots,festivals);
  const peers=sitemapPriorityCities.filter(item=>item.slug!==city.slug).slice(0,6);
  const ld={"@context":"https://schema.org","@type":"CollectionPage","name":`Hindu Calendar ${year} in ${city.name}`,"url":`https://panchvani.com${cityCalendarYearPath(city,year)}`,"description":similarityContext.localityBody};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-calendar">
    <div className="breadcrumbs"><Link href={hinduCalendarYearPath(year)}>Hindu Calendar {year}</Link> / {city.name}</div>
    <p className="page-kicker">YEARLY CALENDAR · {city.state}</p>
    <h1 className="page-title">Hindu Calendar {year}<br/>in {city.name}</h1>
    <p className="page-subtitle">{qualityContent.directAnswer}</p>
    <p className="page-subtitle">The snapshot on each month card is the Tithi and Nakshatra active at local sunrise on the first day of that Gregorian month.</p>

    <section className="wide-panel"><div className="city-directory">{yearlyMonths.map((item,index)=>{const data=snapshots[index];return <Link href={`/calendar/${city.slug}/${year}/${item.slug}`} key={item.slug}><small>{item.name} 1 · sunrise {data.sunrise}</small><strong>{item.name}</strong><span>{data.tithi} · {data.nakshatra}</span></Link>;})}</div></section>

    <section className="wide-panel"><div className="seo-copy">
      <small>YEAR FINGERPRINT · {city.name.toUpperCase()}</small>
      <h2>{qualityContent.fingerprintTitle}</h2>
      <p>{qualityContent.fingerprintBody}</p>
    </div><div className="data-grid">{qualityContent.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}</div></section>

    <section className="wide-panel">
      <div className="seo-copy"><small>LOCAL YEAR SIGNATURE · {city.state.toUpperCase()}</small><h2>{cityContext.title}</h2><p>{cityContext.body}</p></div>
      <div className="data-grid">{cityContext.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}</div>
    </section>

    <section className="wide-panel">
      <div className="seo-copy"><small>ANNUAL LOCALITY LENS · {city.name.toUpperCase()}</small><h2>{similarityContext.title}</h2><p>{similarityContext.localityBody}</p><h2>{similarityContext.chronologyTitle}</h2><p>{similarityContext.chronologyBody}</p></div>
      <div className="data-grid">{similarityContext.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}</div>
    </section>

    {highSimilarityContext?<section className="wide-panel">
      <div className="seo-copy"><small>{highSimilarityContext.eyebrow}</small><h2>{highSimilarityContext.title}</h2><p>{highSimilarityContext.localityBody}</p><h2>{highSimilarityContext.solarTitle}</h2><p>{highSimilarityContext.solarBody}</p><h2>{highSimilarityContext.lunarTitle}</h2><p>{highSimilarityContext.lunarBody}</p><h2>{highSimilarityContext.festivalTitle}</h2><p>{highSimilarityContext.festivalBody}</p></div>
      <div className="data-grid">{highSimilarityContext.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}</div>
    </section>:null}

    <section className="wide-panel"><div className="seo-copy"><h2>{cityContext.seasonalTitle}</h2><p>{cityContext.seasonalBody}</p><h2>{cityContext.lunarTitle}</h2><p>{cityContext.lunarBody}</p></div></section>
    <section className="wide-panel"><div className="seo-copy"><h2>{qualityContent.seasonalTitle}</h2><p>{qualityContent.seasonalBody}</p><h2>{qualityContent.lunarTitle}</h2><p>{qualityContent.lunarBody}</p></div></section>
    <section className="wide-panel"><div className="seo-copy"><h2>{similarityContext.festivalTitle}</h2><p>{similarityContext.festivalBody}</p></div></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Yearly lunar observances</h2><div className="pill-links">{primaryVratTypes.filter(vrat=>isVratIndexable(vrat,year,city.slug)).map(vrat=><Link href={`/vrat/${vrat}/${year}/${city.slug}`} key={vrat}>{vrat.replaceAll("-"," ")} {year}</Link>)}</div></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Muhurat planning in {year}</h2><p className="page-subtitle">Annual India-baseline hubs summarize the year; drill into a month to open city-specific clean timing windows.</p><div className="pill-links">{primaryMuhuratEvents.filter(event=>isYearlyMuhuratIndexable(event,year)).map(event=><Link href={muhuratYearPath(event,year)} key={event}>{event.replaceAll("-"," ")} Muhurat {year}</Link>)}</div></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>{cityContext.festivalTitle}</h2><p className="page-subtitle">{cityContext.festivalBody}</p>{festivals.length?<div className="city-directory">{festivals.map(item=><Link href={`/festivals/${item.slug}/${year}/${city.slug}`} key={item.slug}><small>{item.date}</small><strong>{item.name}</strong><span>Open local Panchang context</span></Link>)}</div>:<p className="page-subtitle">No maintained festival record is stored for {year}.</p>}</section>

    {indexable?<section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Compare yearly calendars</h2><div className="pill-links">{peers.map(item=><Link href={cityCalendarYearPath(item,year)} key={item.slug}>{item.name}</Link>)}</div></section>:null}
    <div className="pill-links">{activeYears.includes(year-1)?<Link href={cityCalendarYearPath(city,year-1)}>← {year-1}</Link>:null}<Link href={hinduCalendarYearPath(year)}>India {year}</Link>{activeYears.includes(year+1)?<Link href={cityCalendarYearPath(city,year+1)}>{year+1} →</Link>:null}</div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
