import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import TopicalGraph from "@/components/TopicalGraph";
import {findCityBySlug} from "@/lib/cities";
import {parseRouteYear} from "@/lib/route-validation";
import {isVratIndexable,robotsFor} from "@/lib/seo-policy";
import {vratYearSsgPriority} from "@/lib/static-seo-routes";
import {calculateVratCalendar,findVratBySlug,vratCalendarSummary} from "@/lib/vrat";
import {buildVratQualityContent} from "@/lib/vrat-content-engine";
import {buildVratYearContext} from "@/lib/vrat-year-context";
import {buildVratTopicalGraph} from "@/lib/vrat-topical-links";

export const dynamicParams=true;
export const revalidate=604800;
const referenceCity=findCityBySlug("mumbai")!;
export function generateStaticParams(){return vratYearSsgPriority;}
function endLabel(date:string,time:string,endDate:string){return date===endDate?time:`${time} · ${endDate}`;}

export async function generateMetadata({params}:{params:Promise<{vrat:string;year:string}>}):Promise<Metadata>{
  const p=await params;const vrat=findVratBySlug(p.vrat);const year=parseRouteYear(p.year);if(!vrat||!year)notFound();
  return {title:`${vrat.name} ${year} Dates — Lunar Tithi Calendar Reference`,description:`${vrat.name} ${year}: local-sunrise Tithi dates, transition distribution and exact Panchang links from the Mumbai reference calculation.`,alternates:{canonical:`/vrat/${vrat.slug}/${year}`},robots:robotsFor(isVratIndexable(vrat.slug,year))};
}

export default async function VratYearPage({params}:{params:Promise<{vrat:string;year:string}>}){
  const p=await params;const vrat=findVratBySlug(p.vrat);const year=parseRouteYear(p.year);if(!vrat||!year)notFound();
  const rows=calculateVratCalendar(vrat.slug,year,referenceCity);
  const summary=vratCalendarSummary(rows);
  const quality=buildVratQualityContent(vrat,year,referenceCity,rows,"baseline");
  const yearContext=buildVratYearContext(vrat,year,rows);
  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"WebPage","name":`${vrat.name} ${year} lunar Tithi calendar reference`,"description":quality.directAnswer,"url":`https://panchvani.com/vrat/${vrat.slug}/${year}`},
    {"@type":"ItemList","name":`${vrat.name} ${year} sunrise observations`,"numberOfItems":rows.length,"itemListElement":rows.map((row,index)=>({"@type":"ListItem","position":index+1,"name":`${row.paksha} ${row.tithi} — ${row.date}`,"url":`https://panchvani.com/panchang/${referenceCity.slug}/${row.date}`}))}
  ]};

  return <main><Header city={referenceCity}/><div className="page-shell internal-visual internal-calendar">
    <div className="breadcrumbs"><Link href="/">Home</Link> / <Link href="/vrat">Vrat & Lunar Dates</Link> / {vrat.name} / {year}</div>
    <p className="page-kicker">YEARLY LUNAR REFERENCE · INDIA BASELINE</p>
    <h1 className="page-title">{vrat.name} {year}<br/>Tithi Dates</h1>
    <p className="page-subtitle">{quality.directAnswer}</p>

    <div className="data-grid"><div className="data-card"><small>Sunrise observations</small><strong>{summary.count}</strong><small>{summary.first??"—"} → {summary.last??"—"}</small></div>{quality.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}</div>

    <section className="wide-panel"><div className="seo-copy"><h2>{quality.fingerprintTitle}</h2><p>{quality.fingerprintBody}</p></div></section>

    <section className="wide-panel">
      <div className="seo-copy"><small>ANNUAL LUNAR RHYTHM · MUMBAI BASELINE</small><h2>{yearContext.title}</h2><p>{yearContext.body}</p></div>
      <div className="data-grid">{yearContext.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}</div>
    </section>
    <section className="wide-panel"><div className="seo-copy"><h2>{yearContext.calendarTitle}</h2><p>{yearContext.calendarBody}</p><h2>{yearContext.cadenceTitle}</h2><p>{yearContext.cadenceBody}</p></div></section>
    <section className="wide-panel"><div className="seo-copy"><h2>{yearContext.persistenceTitle}</h2><p>{yearContext.persistenceBody}</p><h2>{yearContext.observanceTitle}</h2><p>{yearContext.observanceBody}</p></div></section>

    <section className="wide-panel"><div className="seo-copy"><h2>{quality.distributionTitle}</h2><p>{quality.distributionBody}</p></div></section>
    <section className="wide-panel"><div className="seo-copy"><h2>{quality.transitionTitle}</h2><p>{quality.transitionBody}</p></div></section>
    <section className="wide-panel"><div className="seo-copy"><h2>{quality.observanceTitle}</h2><p>{quality.observanceBody}</p></div></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:34}}>{vrat.name} observations in {year}</h2><p className="page-subtitle">Each card opens the exact daily Panchang behind the local sunrise row.</p><div className="city-directory">{rows.map(row=><Link href={`/panchang/${referenceCity.slug}/${row.date}`} key={`${row.date}-${row.paksha}`}><small>{row.weekday} · {row.paksha} Paksha{row.repeatedAtSunrise?" · repeated at sunrise":""}</small><strong>{row.date}</strong><span>Sunrise {row.sunrise} · Tithi until {endLabel(row.date,row.tithiEnd,row.tithiEndDate)}</span></Link>)}</div></section>

    <TopicalGraph title={`Explore ${vrat.name} ${year}`} groups={buildVratTopicalGraph(referenceCity,vrat.slug,year,rows,"baseline")}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
