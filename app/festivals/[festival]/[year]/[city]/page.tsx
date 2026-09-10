import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import TopicalGraph from "@/components/TopicalGraph";
import {findCityBySlug} from "@/lib/cities";
import {festivalBySlugYear,festivalPujaReference} from "@/lib/festivals";
import {festivalPageIsIndexable,festivalYearSiblings} from "@/lib/festival-expansion";
import {formatPanchangTime,getPanchang,formatWindow} from "@/lib/panchang";
import {isPriorityCity,robotsFor} from "@/lib/seo-policy";
import {parseRouteYear} from "@/lib/route-validation";
import {buildFestivalTopicalGraph} from "@/lib/topical-links";

export const revalidate=86400;

function vratSlugForTithi(tithi:string){
  if(tithi==="Ekadashi")return "ekadashi";
  if(tithi==="Purnima")return "purnima";
  if(tithi==="Amavasya")return "amavasya";
  return null;
}

export async function generateMetadata({params}:{params:Promise<{festival:string;year:string;city:string}>}):Promise<Metadata>{
  const p=await params;
  const city=findCityBySlug(p.city);
  const year=parseRouteYear(p.year);
  const f=year?festivalBySlugYear(p.festival,year):undefined;
  if(!city||!year||!f)notFound();
  return {
    title:`${f.name} ${year} in ${city.name} — Local Panchang Timing`,
    description:`${f.name} ${year} in ${city.name}: local Tithi, sunrise, sunset, Rahu Kalam and Panchang timing reference.`,
    alternates:{canonical:`/festivals/${f.slug}/${year}/${city.slug}`},
    robots:robotsFor(festivalPageIsIndexable(f.slug,year)&&isPriorityCity(city.slug))
  };
}

export default async function Page({params}:{params:Promise<{festival:string;year:string;city:string}>}){
  const p=await params;
  const city=findCityBySlug(p.city);
  const year=parseRouteYear(p.year);
  const f=year?festivalBySlugYear(p.festival,year):undefined;
  if(!city||!year||!f)notFound();

  const data=await getPanchang(new Date(f.date+"T06:00:00Z"),city);
  const referenceWindow=festivalPujaReference(data,f);
  const vrat=vratSlugForTithi(data.tithi);
  const siblingYears=festivalYearSiblings(f.slug,year);
  const tithiEnd=formatPanchangTime(data.tithiEnd,data.tithiEndDate,data.date);
  const nakshatraEnd=formatPanchangTime(data.nakshatraEnd,data.nakshatraEndDate,data.date);
  const moonrise=formatPanchangTime(data.moonrise,data.moonriseDate,data.date);

  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"Event","name":`${f.name} ${year} in ${city.name}`,"startDate":f.date,"location":{"@type":"Place","name":city.name,"address":{"@type":"PostalAddress","addressRegion":city.state,"addressCountry":"IN"}},"description":f.short},
    {"@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":"Festivals","item":"https://panchvani.com/festivals/"},
      {"@type":"ListItem","position":2,"name":`${f.name} ${year}`,"item":`https://panchvani.com/festivals/${f.slug}/${year}`},
      {"@type":"ListItem","position":3,"name":city.name}
    ]}
  ]};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-festival">
    <div className="breadcrumbs"><Link href="/festivals">Festivals</Link> / <Link href={`/festivals/${f.slug}/${year}`}>{f.name} {year}</Link> / {city.name}</div>
    <p className="page-kicker">LOCAL FESTIVAL PANCHANG · {city.state}</p>
    <h1 className="page-title">{f.name}<br/>{city.name}</h1>
    <p className="page-subtitle">{f.date} · Local Panchang calculated from {city.name} coordinates.</p>

    <div className="data-grid">
      <div className="data-card"><small>Date</small><strong>{f.date}</strong></div>
      <div className="data-card"><small>Tithi</small><strong>{data.tithi}</strong><small>{data.paksha} Paksha · until {tithiEnd}</small></div>
      <div className="data-card"><small>Nakshatra</small><strong>{data.nakshatra}</strong><small>until {nakshatraEnd}</small></div>
      <div className="data-card"><small>Sunrise / Sunset</small><strong>{data.sunrise} / {data.sunset}</strong></div>
      <div className="data-card"><small>Local timing reference</small><strong>{formatWindow(referenceWindow)}</strong><small>Broad solar/Panchang reference, not a festival-specific ritual Muhurat.</small></div>
      <div className="data-card"><small>Rahu Kalam</small><strong>{formatWindow(data.rahu)}</strong></div>
      <div className="data-card"><small>Moonrise</small><strong>{moonrise}</strong></div>
      <div className="data-card"><small>Regional names</small><strong>{f.regionalNames.join(" · ")}</strong></div>
    </div>

    <div className="seo-copy"><h2>How to use this local timing</h2><p>{f.meaning}</p><p>The timing reference above is a broad local solar/Panchang window derived from the festival category. It is intentionally not presented as the exact ritual Muhurat. Festivals can require specific Tithi, Pradosh, Nishita, Bhadra, Madhyahna, moonrise or other tradition-specific rules; use the precise convention followed by your tradition for ritual observance.</p></div>

    <div className="pill-links">
      <Link href={`/festivals/${f.slug}/${year}`}>Festival overview</Link>
      {vrat?<Link href={`/vrat/${vrat}/${year}/${city.slug}`}>{data.tithi} {year} in {city.name}</Link>:null}
      {siblingYears.map(item=><Link href={`/festivals/${item.slug}/${item.year}/${city.slug}`} key={item.year}>{item.name} {item.year}</Link>)}
    </div>
    <TopicalGraph title={`Explore ${f.name} in ${city.name}`} groups={buildFestivalTopicalGraph(city,f)}/>

    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
