import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import TopicalGraph from "@/components/TopicalGraph";
import {findCityBySlug} from "@/lib/cities";
import {parseRouteYear} from "@/lib/route-validation";
import {isVratIndexable,robotsFor} from "@/lib/seo-policy";
import {calculateVratCalendar,findVratBySlug,vratCalendarSummary} from "@/lib/vrat";
import {buildVratTopicalGraph} from "@/lib/vrat-topical-links";

export const revalidate=604800;

function endLabel(date:string,time:string,endDate:string){return date===endDate?time:`${time} · ${endDate}`;}

export async function generateMetadata({params}:{params:Promise<{vrat:string;year:string;city:string}>}):Promise<Metadata>{
  const p=await params;
  const vrat=findVratBySlug(p.vrat);
  const year=parseRouteYear(p.year);
  const city=findCityBySlug(p.city);
  if(!vrat||!year||!city)notFound();
  return {
    title:`${vrat.name} ${year} in ${city.name} — Local Tithi Dates`,
    description:`${vrat.name} ${year} in ${city.name}: sunrise-based lunar Tithi dates, transition times and links to the exact local Panchang.`,
    alternates:{canonical:`/vrat/${vrat.slug}/${year}/${city.slug}`},
    robots:robotsFor(isVratIndexable(vrat.slug,year,city.slug))
  };
}

export default async function VratCityPage({params}:{params:Promise<{vrat:string;year:string;city:string}>}){
  const p=await params;
  const vrat=findVratBySlug(p.vrat);
  const year=parseRouteYear(p.year);
  const city=findCityBySlug(p.city);
  if(!vrat||!year||!city)notFound();

  const rows=calculateVratCalendar(vrat.slug,year,city);
  const summary=vratCalendarSummary(rows);
  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"WebPage","name":`${vrat.name} ${year} in ${city.name}`,"description":vrat.short,"url":`https://panchvani.com/vrat/${vrat.slug}/${year}/${city.slug}`},
    {"@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":"Vrat & Lunar Dates","item":"https://panchvani.com/vrat"},
      {"@type":"ListItem","position":2,"name":`${vrat.name} ${year}`,"item":`https://panchvani.com/vrat/${vrat.slug}/${year}`},
      {"@type":"ListItem","position":3,"name":city.name}
    ]},
    {"@type":"ItemList","name":`${vrat.name} ${year} in ${city.name}","numberOfItems":rows.length,"itemListElement":rows.map((row,index)=>({"@type":"ListItem","position":index+1,"name":`${row.paksha} ${row.tithi} — ${row.date}`,"url":`https://panchvani.com/panchang/${city.slug}/${row.date}`}))}
  ]};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-calendar">
    <div className="breadcrumbs"><Link href="/vrat">Vrat & Lunar Dates</Link> / <Link href={`/vrat/${vrat.slug}/${year}`}>{vrat.name} {year}</Link> / {city.name}</div>
    <p className="page-kicker">LOCAL LUNAR REFERENCE · {city.state}</p>
    <h1 className="page-title">{vrat.name} {year}<br/>{city.name}</h1>
    <p className="page-subtitle">{vrat.hindi} · Tithi active at local sunrise for {city.name}. Local coordinates matter when a lunar transition happens close to sunrise.</p>

    <div className="data-grid">
      <div className="data-card"><small>Sunrise observations</small><strong>{summary.count}</strong><small>{summary.first??"—"} → {summary.last??"—"}</small></div>
      <div className="data-card"><small>Shukla Paksha</small><strong>{summary.shukla}</strong><small>Observed at {city.name} sunrise</small></div>
      <div className="data-card"><small>Krishna Paksha</small><strong>{summary.krishna}</strong><small>Observed at {city.name} sunrise</small></div>
      <div className="data-card"><small>Repeated cases</small><strong>{summary.repeated}</strong><small>Same Tithi active at two consecutive sunrises</small></div>
      <div className="data-card"><small>Location</small><strong>{city.name}</strong><small>{city.state} · {city.lat.toFixed(3)}, {city.lng.toFixed(3)}</small></div>
      <div className="data-card"><small>Engine</small><strong>Swiss Ephemeris</strong><small>Moshier · local sunrise reference</small></div>
    </div>

    <section className="wide-panel">
      <h2 className="page-title" style={{fontSize:34}}>{vrat.name} dates for {city.name}</h2>
      <div className="city-directory">{rows.map(row=><Link href={`/panchang/${city.slug}/${row.date}`} key={`${row.date}-${row.paksha}`}>
        <small>{row.weekday} · {row.paksha} Paksha{row.repeatedAtSunrise?" · repeated at sunrise":""}</small>
        <strong>{row.date}</strong>
        <span>Sunrise {row.sunrise} · Tithi until {endLabel(row.date,row.tithiEnd,row.tithiEndDate)}</span>
      </Link>)}</div>
    </section>

    <div className="seo-copy"><h2>Why {city.name} can differ from another city</h2><p>{vrat.methodology}</p><p>A Tithi is an angular relationship between the Moon and Sun, while this list assigns it to a civil date using local sunrise. If the Tithi changes between the sunrise times of two cities, their yearly lists can differ by a day.</p><p>{vrat.ritualCaution}</p></div>

    <div className="pill-links"><Link href={`/vrat/${vrat.slug}/${year}`}>India reference</Link><Link href={`/calendar/${city.slug}/${year}/${String(new Date().getUTCMonth()+1).padStart(2,"0")}`}>{city.name} monthly calendar</Link></div>
    <TopicalGraph title={`Explore ${vrat.name} in ${city.name}`} groups={buildVratTopicalGraph(city,vrat.slug,year,rows,"city")}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}