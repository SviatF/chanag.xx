import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import TopicalGraph from "@/components/TopicalGraph";
import {findCityBySlug} from "@/lib/cities";
import {parseRouteYear} from "@/lib/route-validation";
import {isVratIndexable,robotsFor} from "@/lib/seo-policy";
import {vratCitySsgPriority} from "@/lib/static-seo-routes";
import {calculateVratCalendar,findVratBySlug,vratCalendarSummary} from "@/lib/vrat";
import {buildVratQualityContent} from "@/lib/vrat-content-engine";
import {buildVratCityContext} from "@/lib/vrat-city-context";
import {buildVratTopicalGraph} from "@/lib/vrat-topical-links";

export const dynamicParams=true;
export const revalidate=604800;

export function generateStaticParams(){return vratCitySsgPriority;}
function endLabel(date:string,time:string,endDate:string){return date===endDate?time:`${time} · ${endDate}`;}

export async function generateMetadata({params}:{params:Promise<{vrat:string;year:string;city:string}>}):Promise<Metadata>{
  const p=await params;
  const vrat=findVratBySlug(p.vrat);const year=parseRouteYear(p.year);const city=findCityBySlug(p.city);
  if(!vrat||!year||!city)notFound();
  return {title:`${vrat.name} ${year} in ${city.name} — Local Tithi Dates`,description:`${vrat.name} ${year} in ${city.name}: local-sunrise Tithi dates, transition times, repeated sunrise states and exact Panchang links.`,alternates:{canonical:`/vrat/${vrat.slug}/${year}/${city.slug}`},robots:robotsFor(isVratIndexable(vrat.slug,year,city.slug))};
}

export default async function VratCityPage({params}:{params:Promise<{vrat:string;year:string;city:string}>}){
  const p=await params;
  const vrat=findVratBySlug(p.vrat);const year=parseRouteYear(p.year);const city=findCityBySlug(p.city);
  if(!vrat||!year||!city)notFound();
  const rows=calculateVratCalendar(vrat.slug,year,city);
  const summary=vratCalendarSummary(rows);
  const quality=buildVratQualityContent(vrat,year,city,rows,"city");
  const cityContext=buildVratCityContext(vrat,year,city,rows);
  const firstMonth=rows[0]?.date.slice(5,7)??"01";
  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"WebPage","name":`${vrat.name} ${year} in ${city.name}`,"description":quality.directAnswer,"url":`https://panchvani.com/vrat/${vrat.slug}/${year}/${city.slug}`},
    {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Vrat & Lunar Dates","item":"https://panchvani.com/vrat"},{"@type":"ListItem","position":2,"name":`${vrat.name} ${year}`,"item":`https://panchvani.com/vrat/${vrat.slug}/${year}`},{"@type":"ListItem","position":3,"name":city.name}]},
    {"@type":"ItemList","name":`${vrat.name} ${year} in ${city.name}`,"numberOfItems":rows.length,"itemListElement":rows.map((row,index)=>({"@type":"ListItem","position":index+1,"name":`${row.paksha} ${row.tithi} — ${row.date}`,"url":`https://panchvani.com/panchang/${city.slug}/${row.date}`}))}
  ]};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-calendar">
    <div className="breadcrumbs"><Link href="/vrat">Vrat & Lunar Dates</Link> / <Link href={`/vrat/${vrat.slug}/${year}`}>{vrat.name} {year}</Link> / {city.name}</div>
    <p className="page-kicker">LOCAL LUNAR REFERENCE · {city.state}</p>
    <h1 className="page-title">{vrat.name} {year}<br/>{city.name}</h1>
    <p className="page-subtitle">{quality.directAnswer}</p>

    <div className="data-grid">
      <div className="data-card"><small>Sunrise observations</small><strong>{summary.count}</strong><small>{summary.first??"—"} → {summary.last??"—"}</small></div>
      {quality.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}
    </div>

    <section className="wide-panel"><div className="seo-copy"><h2>{cityContext.focusTitle}</h2><p>{cityContext.focusBody}</p></div></section>

    <section className="wide-panel">
      <div className="seo-copy"><small>LOCAL CITY SIGNATURE · {city.state.toUpperCase()}</small><h2>{cityContext.title}</h2><p>{cityContext.body}</p><p>{cityContext.secondaryBody}</p></div>
      <div className="data-grid">{cityContext.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}</div>
    </section>

    <section className="wide-panel"><div className="seo-copy"><h2>{quality.fingerprintTitle}</h2><p>{quality.fingerprintBody}</p></div></section>
    <section className="wide-panel"><div className="seo-copy"><h2>{quality.distributionTitle}</h2><p>{quality.distributionBody}</p></div></section>
    <section className="wide-panel"><div className="seo-copy"><h2>{quality.transitionTitle}</h2><p>{quality.transitionBody}</p></div></section>
    <section className="wide-panel"><div className="seo-copy"><h2>{quality.observanceTitle}</h2><p>{quality.observanceBody}</p></div></section>

    <section className="wide-panel">
      <h2 className="page-title" style={{fontSize:34}}>{vrat.name} dates for {city.name}</h2>
      <div className="city-directory">{rows.map(row=><Link href={`/panchang/${city.slug}/${row.date}`} key={`${row.date}-${row.paksha}`}><small>{row.weekday} · {row.paksha} Paksha{row.repeatedAtSunrise?" · repeated at sunrise":""}</small><strong>{row.date}</strong><span>Sunrise {row.sunrise} · Tithi until {endLabel(row.date,row.tithiEnd,row.tithiEndDate)}</span></Link>)}</div>
    </section>

    <div className="pill-links"><Link href={`/vrat/${vrat.slug}/${year}`}>India reference</Link><Link href={`/calendar/${city.slug}/${year}/${firstMonth}`}>{city.name} monthly calendar</Link></div>
    <TopicalGraph title={`Explore ${vrat.name} in ${city.name}`} groups={buildVratTopicalGraph(city,vrat.slug,year,rows,"city")}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
