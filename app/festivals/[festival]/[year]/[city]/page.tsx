import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import MethodologyNote from "@/components/MethodologyNote";
import TopicalGraph from "@/components/TopicalGraph";
import {findCityBySlug} from "@/lib/cities";
import {festivalBySlugYear} from "@/lib/festivals";
import {getFestivalSemantics} from "@/lib/festival-conventions";
import {festivalPageIsIndexable,festivalYearSiblings} from "@/lib/festival-expansion";
import {getCachedDailyPanchangData} from "@/lib/panchang-cache";
import {formatPanchangTime,formatWindow} from "@/lib/panchang-display";
import {getFestivalLocalReference,getFestivalRuleProfile} from "@/lib/religious-integrity";
import {isPriorityCity,robotsFor} from "@/lib/seo-policy";
import {parseRouteYear} from "@/lib/route-validation";
import {buildFestivalTopicalGraph} from "@/lib/topical-links";

export const revalidate=86400;
export const dynamicParams=true;

// Current GSC winners are pre-rendered at build time so these SEO-critical URLs
// are served as assets instead of requiring a cold Worker + Swiss Ephemeris render.
// Keep dynamicParams=true so the rest of the long-tail route continues to work.
export function generateStaticParams(){
  return [
    {festival:"ganesh-chaturthi",year:"2026",city:"ahmedabad"},
    {festival:"ganesh-chaturthi",year:"2026",city:"delhi"},
    {festival:"ganesh-chaturthi",year:"2026",city:"hyderabad"},
    {festival:"dussehra",year:"2026",city:"hyderabad"},
    {festival:"dussehra",year:"2026",city:"chennai"},
    {festival:"dussehra",year:"2026",city:"kolkata"},
    {festival:"shardiya-navratri",year:"2026",city:"hyderabad"},
    {festival:"shardiya-navratri",year:"2026",city:"chennai"},
    {festival:"shardiya-navratri",year:"2026",city:"kolkata"},
  ];
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
  const f=year?festivalBySlugYear(p.festival,year):undefined;
  if(!city||!year||!f)notFound();
  return {
    title:`${f.name} ${year} in ${city.name} — Local Panchang & Rule Context`,
    description:`${f.name} ${year} in ${city.name}: local Tithi, lunar-month conventions, sunrise, sunset and festival-specific rule context without overstating ritual Muhurat accuracy.`,
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

  const date=new Date(f.date+"T06:00:00Z");
  const {data,lunar}=await getCachedDailyPanchangData(date,city);
  const semantics=getFestivalSemantics(f);
  const ruleProfile=getFestivalRuleProfile(f);
  const localReference=getFestivalLocalReference(f,data);
  const vrat=vratSlugForTithi(data.tithi);
  const siblingYears=festivalYearSiblings(f.slug,year);
  const tithiEnd=formatPanchangTime(data.tithiEnd,data.tithiEndDate,data.date);
  const nakshatraEnd=formatPanchangTime(data.nakshatraEnd,data.nakshatraEndDate,data.date);
  const moonrise=formatPanchangTime(data.moonrise,data.moonriseDate,data.date);
  const isGaneshAhmedabad=f.slug==="ganesh-chaturthi"&&year===2026&&city.slug==="ahmedabad";
  const isDussehraHyderabad=f.slug==="dussehra"&&year===2026&&city.slug==="hyderabad";
  const ganeshPeerCities=f.slug==="ganesh-chaturthi"&&year===2026
    ? [
        {slug:"ahmedabad",name:"Ahmedabad"},
        {slug:"delhi",name:"Delhi"},
        {slug:"hyderabad",name:"Hyderabad"},
      ].filter(item=>item.slug!==city.slug)
    : [];

  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"WebPage","name":`${f.name} ${year} in ${city.name}`,"url":`https://panchvani.com/festivals/${f.slug}/${year}/${city.slug}`,"description":semantics.displayShort,"about":{"@type":"Thing","name":f.name}},
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
    <p className="page-subtitle">{f.date} · {semantics.displayShort}</p>

    <div className="data-grid">
      <div className="data-card"><small>Date</small><strong>{f.date}</strong></div>
      <div className="data-card"><small>Tithi</small><strong>{data.tithi}</strong><small>{data.paksha} Paksha · until {tithiEnd}</small></div>
      <div className="data-card"><small>Amanta month</small><strong>{lunar.amantaLabel}</strong></div>
      <div className="data-card"><small>Purnimanta month</small><strong>{lunar.purnimantaLabel}</strong></div>
      <div className="data-card"><small>Nakshatra</small><strong>{data.nakshatra}</strong><small>until {nakshatraEnd}</small></div>
      <div className="data-card"><small>Sunrise / Sunset</small><strong>{data.sunrise} / {data.sunset}</strong></div>
      {localReference?<div className="data-card"><small>{localReference.label}</small><strong>{localReference.value}</strong></div>:<div className="data-card"><small>Festival timing reference</small><strong>Local Panchang context</strong></div>}
      <div className="data-card"><small>Rahu Kalam</small><strong>{formatWindow(data.rahu)}</strong></div>
      <div className="data-card"><small>Moonrise</small><strong>{moonrise}</strong></div>
      {semantics.aliases.length?<div className="data-card"><small>Also known as</small><strong>{semantics.aliases.join(" · ")}</strong></div>:null}
      {semantics.relatedObservances.length?<div className="data-card"><small>Related regional observances</small><strong>{semantics.relatedObservances.join(" · ")}</strong></div>:null}
    </div>

    <div className="seo-copy"><h2>How to read this festival Panchang</h2><p>{f.meaning}</p>{semantics.lunarConventionNote?<p><strong>Calendar convention:</strong> {semantics.lunarConventionNote}</p>:null}</div>

    {isGaneshAhmedabad?<div className="seo-copy">
      <h2>Ganesh Chaturthi 2026 timing in Ahmedabad</h2>
      <p>For Ahmedabad, {f.name} falls on {f.date}. The local Panchang on this page shows {data.tithi} until {tithiEnd}, sunrise at {data.sunrise}{localReference?`, and ${localReference.label.toLowerCase()} ${localReference.value}`:""}. These are the city-specific timing values relevant when checking Ganesh Chaturthi 2026 muhurat time in Ahmedabad.</p>
      <p>The same festival date can have different local Panchang timing inputs by city, so compare the corresponding Delhi and Hyderabad pages rather than copying Ahmedabad timings across locations.</p>
    </div>:null}

    {isDussehraHyderabad?<div className="seo-copy">
      <h2>Dasara 2026 date in Telangana</h2>
      <p>For Hyderabad and Telangana, Panchvani&apos;s maintained 2026 festival calendar places {f.name} on {f.date}. This Hyderabad page then applies local Panchang values such as sunrise at {data.sunrise}, {data.tithi} until {tithiEnd}, and the local lunar-month context shown above.</p>
      <p>Use this section for the Telangana date answer, and the city-level Panchang cards above for the local timing context.</p>
    </div>:null}

    <div className="pill-links">
      <Link href={`/festivals/${f.slug}/${year}`}>Festival overview</Link>
      {vrat?<Link href={`/vrat/${vrat}/${year}/${city.slug}`}>{data.tithi} {year} in {city.name}</Link>:null}
      {siblingYears.map(item=><Link href={`/festivals/${item.slug}/${item.year}/${city.slug}`} key={item.year}>{item.name} {item.year}</Link>)}
      {ganeshPeerCities.map(item=><Link href={`/festivals/ganesh-chaturthi/${year}/${item.slug}`} key={item.slug}>Ganesh Chaturthi {year} in {item.name}</Link>)}
    </div>
    <TopicalGraph title={`Explore ${f.name} in ${city.name}`} groups={buildFestivalTopicalGraph(city,f)}/>
    <MethodologyNote title="Festival calculation and observance scope"><p>{ruleProfile.ruleSummary}</p><ul>{ruleProfile.criteria.map(item=><li key={item}>{item}</li>)}</ul><p>{ruleProfile.localReference}</p>{localReference?<p>{localReference.note}</p>:null}{ruleProfile.limitations.length?<ul>{ruleProfile.limitations.map(item=><li key={item}>{item}</li>)}</ul>:null}<p>A ritual rule can require conditions beyond the astronomical values shown here, including tradition-specific Tithi overlap, Bhadra, Lagna, Rohini, Madhyahna or fasting/parana rules.</p>{ruleProfile.sources.length?<p><strong>Reference methodology:</strong> {ruleProfile.sources.map((source,index)=><span key={source.label}>{index?" · ":""}{source.label}</span>)}</p>:null}</MethodologyNote>

    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}