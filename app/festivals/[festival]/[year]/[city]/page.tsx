import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import CalendarEvidenceNotice from "@/components/CalendarEvidenceNotice";
import TopicalGraph from "@/components/TopicalGraph";
import {findCityBySlug} from "@/lib/cities";
import {getLunarMonthConventions} from "@/lib/calendar-conventions";
import {buildFestivalCityQualityContent,chhathFollowingSunrise} from "@/lib/festival-content-engine";
import {buildFestivalCityContext} from "@/lib/festival-city-context";
import {buildFestivalCityHighSimilarityContext} from "@/lib/festival-city-high-similarity-context";
import {festivalBySlugYear} from "@/lib/festivals";
import {getFestivalSemantics} from "@/lib/festival-conventions";
import {festivalCityPageIsIndexable,festivalYearSiblings} from "@/lib/festival-expansion";
import {formatPanchangTime,getPanchang} from "@/lib/panchang";
import {addIsoDays,formatDatedTime} from "@/lib/india-time";
import {festivalNightEligibility} from "@/lib/festival-night-eligibility";
import {getFestivalLocalReference} from "@/lib/religious-integrity";
import {rakhiBhadraAtSunrise} from "@/lib/rakhi-bhadra-evidence";
import {getRegionalFestivalObservance} from "@/lib/festival-regional-observances";
import {robotsFor} from "@/lib/seo-policy";
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
    description:`${festival.name} ${year} is listed for ${festival.date}. Calculated ${city.name} sunrise ${data.sunrise}, sunset ${data.sunset}, ${data.tithi} Tithi and ${data.nakshatra} Nakshatra; local observance rules may differ.`,
    alternates:{canonical:`/festivals/${festival.slug}/${year}/${city.slug}`},
    robots:robotsFor(festivalCityPageIsIndexable(festival.slug,year,city.slug)),
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
  const nightKind=festival.slug==="janmashtami"||festival.slug==="diwali"?festival.slug:null;
  const nextNightDay=nightKind?await getPanchang(new Date(`${addIsoDays(festival.date,1)}T06:00:00Z`),city):null;
  const nightEvidence=nightKind&&nextNightDay?festivalNightEligibility(nightKind,data,nextNightDay):null;
  const lunar=getLunarMonthConventions(date,city,data);
  const semantics=getFestivalSemantics(festival);
  const localReference=getFestivalLocalReference(festival,data);
  const content=buildFestivalCityQualityContent(festival,city,data,lunar,localReference);
  const cityContext=buildFestivalCityContext(festival,city,data,localReference);
  const comparisonContext=buildFestivalCityHighSimilarityContext(festival,city,data);
  const vrat=vratSlugForTithi(data.tithi);
  const siblingYears=festivalYearSiblings(festival.slug,year);
  const moonrise=formatPanchangTime(data.moonrise,data.moonriseDate,data.date);
  const regionalObservance=getRegionalFestivalObservance(festival,city);
  const nextChhathSunrise=festival.slug==="chhath-puja"?chhathFollowingSunrise(data):null;
  const rakhiEvidence=festival.slug==="raksha-bandhan"?rakhiBhadraAtSunrise(data):null;

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
    <CalendarEvidenceNotice scope="maintained-festival-date" cityName={city.name} subject={festival.name} year={year}/>

    <div className="data-grid">
      {content.directFacts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}
      <div className="data-card"><small>Moonrise</small><strong>{moonrise}</strong></div>
      {regionalObservance?<div className="data-card"><small>{regionalObservance.label}</small><strong>{regionalObservance.date}</strong><small>Regional observance date</small></div>:null}
      {semantics.aliases.length?<div className="data-card"><small>Regional names</small><strong>{semantics.aliases.join(" · ")}</strong></div>:null}
      {semantics.relatedObservances.length?<div className="data-card"><small>Related observances</small><strong>{semantics.relatedObservances.join(" · ")}</strong></div>:null}
    </div>

    {regionalObservance?<section className="wide-panel"><div className="seo-copy">
      <small>SOURCE-REVIEWED REGIONAL OBSERVANCE · {city.name.toUpperCase()}</small>
      <h2>{regionalObservance.label} in {city.name}</h2>
      <p>{regionalObservance.message}</p>
    </div></section>:null}

    {rakhiEvidence?<section className="wide-panel"><div className="seo-copy">
      <small>RAKHI · LOCAL BHADRA SCREEN · {city.name.toUpperCase()}</small>
      <h2>Raksha Bandhan: Purnima and Bhadra in {city.name}</h2>
      <p>{rakhiEvidence.explanation}</p>
      {rakhiEvidence.status==="purnima-bhadra-cleared"
        ?<p>Rakhi planning reference for {festival.date}: {rakhiEvidence.start}–{rakhiEvidence.end}. This local interval is derived from sunrise, Purnima ending and Bava Karana; it is not a generic Choghadiya period or a substitute for full ritual eligibility checks.</p>
        :<p>The required Karana/Tithi evidence does not establish a Bhadra-free Rakhi interval for this date.</p>}
    </div></section>:null}

    {nightEvidence?<section className="wide-panel"><div className="seo-copy">
      <small>{nightEvidence.kind==="diwali"?"DIWALI · AMAVASYA / PRADOSH":"JANMASHTAMI · ASHTAMI / NISHITA"} · {city.name.toUpperCase()}</small>
      <h2>{nightEvidence.label} and {nightEvidence.tithiLabel} in {city.name}</h2>
      <div className="data-grid">
        <div className="data-card"><small>{nightEvidence.label}</small><strong>{formatDatedTime(nightEvidence.period.start,nightEvidence.period.startDate,festival.date)} – {formatDatedTime(nightEvidence.period.end,nightEvidence.period.endDate,festival.date)}</strong></div>
        <div className="data-card"><small>Relevant Tithi ends</small><strong>{nightEvidence.tithiEnd??"Not verified"}</strong></div>
        <div className="data-card"><small>Calculated Tithi overlap</small><strong>{nightEvidence.overlap?`${formatDatedTime(nightEvidence.overlap.start,nightEvidence.overlap.startDate,festival.date)} – ${formatDatedTime(nightEvidence.overlap.end,nightEvidence.overlap.endDate,festival.date)}`:nightEvidence.status==="none"?"No overlap":"Not established"}</strong></div>
      </div>
      <p>{nightEvidence.explanation}</p>
      {nightEvidence.kind==="janmashtami"&&nightEvidence.status==="none"
        ?<p>No calculated Ashtami/Nishita overlap can still coexist with a published Janmashtami date. This is not a rejection of that date: Smarta and Vaishnava rules, Rohini and Parana need separate review.</p>
        :null}
      <p>{nightEvidence.kind==="diwali"
        ?"This is the calculated Amavasya–Pradosh intersection, not an exact Lakshmi Puja Muhurat: Sthir Lagna is not yet evaluated."
        :"The Janmashtami observance date and fasting may depend on Smarta/Vaishnava rules and Rohini. Nishita alone is not a certified Puja Muhurat."}</p>
    </div></section>:null}

    {nextChhathSunrise?<section className="wide-panel"><div className="seo-copy">
      <small>CHHATH SOLAR OBSERVANCE · {city.name.toUpperCase()}</small>
      <h2>Sandhya Arghya and next-day Usha Arghya in {city.name}</h2>
      <p>Sandhya Arghya falls at local sunset, {data.sunset} on {festival.date}. The following Usha Arghya is at local sunrise, {nextChhathSunrise.time} on {nextChhathSunrise.date}. These are two different solar events on consecutive dates.</p>
    </div></section>:null}

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
