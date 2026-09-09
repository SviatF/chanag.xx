import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import {cityBySlug} from "@/lib/cities";
import {festivalBySlugYear,festivalPujaReference} from "@/lib/festivals";
import {getPanchang,formatWindow} from "@/lib/panchang";

export const revalidate=86400;

export async function generateMetadata({params}:{params:Promise<{festival:string;year:string;city:string}>}):Promise<Metadata>{
  const p=await params;
  const city=cityBySlug(p.city);
  const year=Number(p.year);
  const f=festivalBySlugYear(p.festival,year);
  if(!f)return {title:"Festival not found",robots:{index:false,follow:true}};
  return {
    title:`${f.name} ${year} in ${city.name} — Local Panchang Timing`,
    description:`${f.name} ${year} in ${city.name}: local Tithi, sunrise, sunset, Rahu Kalam and Puja timing reference.`,
    alternates:{canonical:`/festivals/${f.slug}/${year}/${city.slug}`}
  };
}

export default async function Page({params}:{params:Promise<{festival:string;year:string;city:string}>}){
  const p=await params;
  const city=cityBySlug(p.city);
  const year=Number(p.year);
  const f=festivalBySlugYear(p.festival,year);
  if(!f)notFound();

  const data=await getPanchang(new Date(f.date+"T06:00:00Z"),city);
  const puja=festivalPujaReference(data,f);
  const month=f.date.slice(5,7);

  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"Event","name":`${f.name} ${year} in ${city.name}`,"startDate":f.date,"location":{"@type":"Place","name":city.name,"address":{"@type":"PostalAddress","addressRegion":city.state,"addressCountry":"IN"}},"description":f.short},
    {"@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":"Festivals","item":"https://panchang.in/festivals/"},
      {"@type":"ListItem","position":2,"name":`${f.name} ${year}`,"item":`https://panchang.in/festivals/${f.slug}/${year}`},
      {"@type":"ListItem","position":3,"name":city.name}
    ]}
  ]};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-festival">
    <div className="breadcrumbs"><Link href="/festivals">Festivals</Link> / <Link href={`/festivals/${f.slug}/${year}`}>{f.name} {year}</Link> / {city.name}</div>
    <p className="page-kicker">LOCAL FESTIVAL PANCHANG · {city.state}</p>
    <h1 className="page-title">{f.name}<br/>{city.name}</h1>
    <p className="page-subtitle">{f.date} · Local timing calculated from {city.name} coordinates.</p>

    <div className="data-grid">
      <div className="data-card"><small>Date</small><strong>{f.date}</strong></div>
      <div className="data-card"><small>Tithi</small><strong>{data.tithi}</strong><small>{data.paksha} Paksha · until {data.tithiEnd}</small></div>
      <div className="data-card"><small>Nakshatra</small><strong>{data.nakshatra}</strong><small>until {data.nakshatraEnd}</small></div>
      <div className="data-card"><small>Sunrise / Sunset</small><strong>{data.sunrise} / {data.sunset}</strong></div>
      <div className="data-card"><small>Local Puja reference</small><strong>{formatWindow(puja)}</strong><small>Solar/Panchang reference; exact ritual rules vary by tradition.</small></div>
      <div className="data-card"><small>Rahu Kalam</small><strong>{formatWindow(data.rahu)}</strong></div>
      <div className="data-card"><small>Moonrise</small><strong>{data.moonrise}</strong></div>
      <div className="data-card"><small>Regional names</small><strong>{f.regionalNames.join(" · ")}</strong></div>
    </div>

    <div className="seo-copy"><h2>How to use this local timing</h2><p>{f.meaning}</p><p>The local Puja reference above is derived from the festival's broad timing category and {city.name}'s solar Panchang. For a sampradaya-specific vrata, sankalpa or priest-led ceremony, use the precise ritual rule followed by that tradition.</p></div>

    <div className="pill-links">
      <Link href={`/panchang/${city.slug}/${f.date}`}>Full Panchang for {f.date}</Link>
      <Link href={`/festivals/${f.slug}/${year}`}>Festival overview</Link>
      {f.relatedMuhurat?<Link href={`/muhurat/${f.relatedMuhurat}/${year}/${month}/${city.slug}`}>Related Muhurat →</Link>:null}
    </div>

    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
