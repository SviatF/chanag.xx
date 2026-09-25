import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import TopicalGraph from "@/components/TopicalGraph";
import {findCityBySlug} from "@/lib/cities";
import {getLunarMonthConventions} from "@/lib/calendar-conventions";
import {buildFestivalCityQualityContent} from "@/lib/festival-content-engine";
import {buildFestivalCityContext} from "@/lib/festival-city-context";
import {buildFestivalCityHighSimilarityContext} from "@/lib/festival-city-high-similarity-context";
import {festivalBySlugYear} from "@/lib/festivals";
import {getFestivalSemantics} from "@/lib/festival-conventions";
import {festivalPageIsIndexable,festivalYearSiblings} from "@/lib/festival-expansion";
import {formatPanchangTime,getPanchang} from "@/lib/panchang";
import {getFestivalLocalReference} from "@/lib/religious-integrity";
import {isPriorityCity,robotsFor} from "@/lib/seo-policy";
import {parseRouteYear} from "@/lib/route-validation";
import {buildFestivalTopicalGraph} from "@/lib/topical-links";
import {festivalCitySsgPilot} from "@/lib/static-seo-routes";

export const dynamicParams=true;
export const revalidate=86400;

export function generateStaticParams(){
  return festivalCitySsgPilot;
}

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
  const festival=year?festivalBySlugYear(p.festival,year):undefined;
  if(!city||!year||!festival)notFound();
  const data=await getPanchang(new Date(`${festival.date}T06:00:00Z`),city);
  return {
    title:`${festival.name} ${year} in ${city.name} — ${festival.date} Panchang`,
    description:`${festival.name} ${year} in ${city.name} falls on ${festival.date}. Local sunrise ${data.sunrise}, sunset ${data.sunset}, ${data.tithi} Tithi and ${data.nakshatra} Nakshatra.`,
    alternates:{canonical:`/festivals/${festival.slug}/${year}/${city.slug}`},
    robots:robotsFor(festivalPageIsIndexable(festival.slug,year)&&isPriorityCity(city.slug)),
  };
}

export default async function Page({params}:{params:Promise<{festival:string;year:string;city:string}>}){
  const p=await params;
  const city=findCityBySlug(p.city);
  const year=parseRouteYear(p.year);
  const festival=year?festivalBySlugYear(p.festival,year):undefined;
  if(!city||!year||!festival)notFound();

  const date=new Date(`${festival.date}T06:00:00Z`);
  const data=await getPanchang(date,city);
  const lunar=getLunarMonthConventions(date,city,data);
  const semantics=getFestivalSemantics(festival);
  const localReference=getFestivalLocalReference(festival,data);
  const content=buildFestivalCityQualityContent(festival,city,data,lunar,localReference);
  const cityContext=buildFestivalCityContext(festival,city,data,localReference);
  const comparisonContext=buildFestivalCityHighSimilarityContext(festival,city,data);
  const vrat=vratSlugForTithi(data.tithi);
  const siblingYears=festivalYearSiblings(festival.slug,year);
  const moonrise=formatPanchangTime(data.moonrise,data.moonriseDate,data.date);

  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"WebPage","name":`${festival.name} ${year} in ${city.name}`,"url":`https://panchvani.com/festivals/${festival.slug}/${year}/${city.slug}`,"description":content.directAnswer,"about":{"@type":"Thing","name":festival.name}},
    {"@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":"Festivals","item":"https://panchvani.com/festivals/"},
      {"@type":"ListItem","position":2,"name":`${festival.name} ${year}`,"item":`https://panchvani.com/festivals/${festival.slug}/${year}`},
      {"@type":"ListItem","position":3,"name":city.name},
    ]},
  ]};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-festival">
    <div className="breadcrumbs"><Link href="/festivals">Festivals</Link> / <Link href={`/festivals/${festival.slug}/${year}`}>{festival.name} {year}</Link> / {city.name}</div>
    <p className="page-kicker">LOCAL FESTIVAL PANCHANG · {city.state}</p>
    <h1 className="page-title">{festival.name} {year}<br/>in {city.name}</h1>
    <p className="page-subtitle">{content.directAnswer}</p>

    <div className="data-grid">
      {content.directFacts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}
      <div className="data-card"><small>Moonrise</small><strong>{moonrise}</strong></div>
      {semantics.aliases.length?<div className="data-card"><small>Regional names</small><strong>{semantics.aliases.join(" · ")}</strong></div>:null}
      {semantics.relatedObservances.length?<div className="data-card"><small>Related observances</small><strong>{semantics.relatedObservances.join(" · ")}</strong></div>:null}
    </div>

    <section className="wide-panel"><div className="seo-copy">
      <h2>{cityContext.focusTitle}</h2>
      <p>{cityContext.focusBody}</p>
    </div></section>

    <section className="wide-panel">
      <div className="seo-copy"><small>LOCAL CITY SIGNATURE · {city.state.toUpperCase()}</small><h2>{cityContext.title}</h2><p>{cityContext.body}</p><p>{cityContext.secondaryBody}</p></div>
      <div className="data-grid">{cityContext.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}</div>
    </section>

    <section className="wide-panel"><div className="seo-copy">
      <small>FESTIVAL LOCALITY LENS · {city.name.toUpperCase()}</small>
      <h2>{cityContext.localityTitle}</h2>
      <p>{cityContext.localityBody}</p>
      <h2>{cityContext.chronologyTitle}</h2>
      <p>{cityContext.chronologyBody}</p>
      <h2>{cityContext.observanceTitle}</h2>
      <p>{cityContext.observanceBody}</p>
    </div></section>

    <section className="wide-panel">
      <div className="seo-copy">
        <small>FESTIVAL CITY COMPARISON LENS · {city.state.toUpperCase()}</small>
        <h2>{comparisonContext.title}</h2>
        <p>{comparisonContext.localityBody}</p>
        <h2>{comparisonContext.timingTitle}</h2>
        <p>{comparisonContext.timingBody}</p>
      </div>
      <div className="data-grid">{comparisonContext.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}</div>
    </section>

    {content.regionalBody?<section className="wide-panel"><div className="seo-copy">
      <h2>{content.regionalTitle}</h2>
      <p>{content.regionalBody}</p>
    </div></section>:null}

    <section className="wide-panel"><div className="seo-copy">
      <h2>Local observance signals</h2>
      <p>{festival.rituals.join(" · ")}. The city calculation above supplies the local clock and lunar-state inputs for {city.name}; the shared festival overview carries the broader festival background.</p>
      <p>{content.comparisonPrompt}</p>
    </div></section>

    <div className="pill-links">
      <Link href={`/festivals/${festival.slug}/${year}`}>{festival.name} {year} overview</Link>
      <Link href={`/panchang/${city.slug}/${festival.date}`}>{city.name} Panchang · {festival.date}</Link>
      {vrat?<Link href={`/vrat/${vrat}/${year}/${city.slug}`}>{data.tithi} {year} in {city.name}</Link>:null}
      {siblingYears.map(item=><Link href={`/festivals/${item.slug}/${item.year}/${city.slug}`} key={item.year}>{item.name} {item.year} in {city.name}</Link>)}
    </div>

    <TopicalGraph title={`Explore ${festival.name} in ${city.name}`} groups={buildFestivalTopicalGraph(city,festival)}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
