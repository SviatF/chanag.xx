import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import {cities} from "@/lib/cities";
import {festivalBySlugYear} from "@/lib/festivals";
import {getFestivalSemantics} from "@/lib/festival-conventions";
import {festivalPageIsIndexable,festivalYearSiblings} from "@/lib/festival-expansion";
import {robotsFor} from "@/lib/seo-policy";
import {parseRouteYear} from "@/lib/route-validation";

export const revalidate=86400;

export async function generateMetadata({params}:{params:Promise<{festival:string;year:string}>}):Promise<Metadata>{
  const p=await params;
  const year=parseRouteYear(p.year);
  const f=year?festivalBySlugYear(p.festival,year):undefined;
  if(!year||!f)notFound();
  return {
    title:`${f.name} ${year} — Date, Meaning & Panchang`,
    description:`${f.name} ${year}: ${f.date}. ${f.short} Open a city page for local Panchang and timing context.`,
    alternates:{canonical:`/festivals/${f.slug}/${year}`},
    robots:robotsFor(festivalPageIsIndexable(f.slug,year))
  };
}

export default async function FestivalPage({params}:{params:Promise<{festival:string;year:string}>}){
  const p=await params;
  const year=parseRouteYear(p.year);
  const f=year?festivalBySlugYear(p.festival,year):undefined;
  if(!year||!f)notFound();

  const semantics=getFestivalSemantics(f);
  const month=String(Number(f.date.slice(5,7))).padStart(2,"0");
  const siblingYears=festivalYearSiblings(f.slug,year);
  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"WebPage","name":`${f.name} ${year}`,"url":`https://panchvani.com/festivals/${f.slug}/${year}`,"description":f.short,"about":{"@type":"Thing","name":f.name}},
    {"@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":"Home","item":"https://panchvani.com/"},
      {"@type":"ListItem","position":2,"name":"Festivals","item":"https://panchvani.com/festivals/"},
      {"@type":"ListItem","position":3,"name":`${f.name} ${year}`}
    ]}
  ]};

  return <main><Header city={cities[0]}/><div className="page-shell internal-visual internal-festival">
    <div className="breadcrumbs"><Link href="/">Home</Link> / <Link href="/festivals">Festivals</Link> / {f.name}</div>
    <p className="page-kicker">HINDU FESTIVAL · {year}</p>
    <h1 className="page-title">{f.name}<br/>{year}</h1>
    <p className="page-subtitle">{f.short}</p>

    <div className="data-grid">
      <div className="data-card"><small>Date</small><strong>{f.date}</strong></div>
      {semantics.aliases.length?<div className="data-card"><small>Also known as</small><strong>{semantics.aliases.join(" · ")}</strong></div>:null}
      {semantics.relatedObservances.length?<div className="data-card"><small>Related regional observances</small><strong>{semantics.relatedObservances.join(" · ")}</strong></div>:null}
      <div className="data-card"><small>Local context</small><strong>City-specific Panchang</strong><small>Open a city page for local sunrise, sunset, Tithi and timing context.</small></div>
    </div>

    <div className="seo-copy">
      <h2>Meaning and observance</h2>
      <p>{f.meaning}</p>
      {semantics.lunarConventionNote?<p><strong>Calendar convention:</strong> {semantics.lunarConventionNote}</p>:null}
      <p>The exact observance can vary by sampradaya, region and local Tithi boundaries. Panchvani separates the shared festival date reference from city-local Panchang calculations instead of treating every regional tradition as identical.</p>
    </div>

    <section className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>Common observances</h2>
      <div className="data-grid">{f.rituals.map(item=><div className="data-card" key={item}><small>Tradition</small><strong>{item}</strong></div>)}</div>
    </section>

    <section className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>Local Panchang by city</h2>
      <p className="page-subtitle">Choose a priority city to see Tithi, sunrise, sunset, Rahu Kalam and a broad local timing reference. Festival-specific ritual rules are explained separately where supported.</p>
      <div className="pill-links">{cities.slice(0,12).map(city=><Link href={`/festivals/${f.slug}/${year}/${city.slug}`} key={city.slug}>{city.name}</Link>)}</div>
    </section>

    <div className="pill-links">
      <Link href={`/festivals-calendar/${year}`}>All {year} festivals</Link>
      {siblingYears.map(item=><Link href={`/festivals/${item.slug}/${item.year}`} key={item.year}>{item.name} {item.year}</Link>)}
      {f.relatedMuhurat?<Link href={`/muhurat/${f.relatedMuhurat}/${year}/${month}`}>Related {f.relatedMuhurat.replaceAll("-"," ")} Muhurat →</Link>:null}
    </div>

    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
