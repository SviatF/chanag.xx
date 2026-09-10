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
const referenceCity=findCityBySlug("mumbai")!;

function endLabel(date:string,time:string,endDate:string){return date===endDate?time:`${time} · ${endDate}`;}

export async function generateMetadata({params}:{params:Promise<{vrat:string;year:string}>}):Promise<Metadata>{
  const p=await params;
  const vrat=findVratBySlug(p.vrat);
  const year=parseRouteYear(p.year);
  if(!vrat||!year)notFound();
  return {
    title:`${vrat.name} ${year} Dates — Lunar Tithi Calendar Reference`,
    description:`${vrat.name} ${year}: sunrise-based ${vrat.name} Tithi dates with transition times, India reference and city-specific Panchang links.`,
    alternates:{canonical:`/vrat/${vrat.slug}/${year}`},
    robots:robotsFor(isVratIndexable(vrat.slug,year))
  };
}

export default async function VratYearPage({params}:{params:Promise<{vrat:string;year:string}>}){
  const p=await params;
  const vrat=findVratBySlug(p.vrat);
  const year=parseRouteYear(p.year);
  if(!vrat||!year)notFound();
  const rows=calculateVratCalendar(vrat.slug,year,referenceCity);
  const summary=vratCalendarSummary(rows);
  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"WebPage","name":`${vrat.name} ${year} lunar Tithi calendar reference`,"description":vrat.short,"url":`https://panchvani.com/vrat/${vrat.slug}/${year}`},
    {"@type":"ItemList","name":`${vrat.name} ${year} sunrise observations`,"numberOfItems":rows.length,"itemListElement":rows.map((row,index)=>({"@type":"ListItem","position":index+1,"name":`${row.paksha} ${row.tithi} — ${row.date}`,"url":`https://panchvani.com/panchang/${referenceCity.slug}/${row.date}`}))}
  ]};

  return <main><Header city={referenceCity}/><div className="page-shell internal-visual internal-calendar">
    <div className="breadcrumbs"><Link href="/">Home</Link> / <Link href="/vrat">Vrat & Lunar Dates</Link> / {vrat.name} / {year}</div>
    <p className="page-kicker">YEARLY LUNAR REFERENCE · INDIA BASELINE</p>
    <h1 className="page-title">{vrat.name} {year}<br/>Tithi Dates</h1>
    <p className="page-subtitle">{vrat.hindi} · Sunrise-based reference calculated for {referenceCity.name}. Select a city below when a Tithi transition occurs close to local sunrise.</p>

    <div className="data-grid">
      <div className="data-card"><small>Sunrise observations</small><strong>{summary.count}</strong><small>{summary.first??"—"} → {summary.last??"—"}</small></div>
      <div className="data-card"><small>Shukla Paksha</small><strong>{summary.shukla}</strong><small>Observations at sunrise</small></div>
      <div className="data-card"><small>Krishna Paksha</small><strong>{summary.krishna}</strong><small>Observations at sunrise</small></div>
      <div className="data-card"><small>Repeated at sunrise</small><strong>{summary.repeated}</strong><small>Cases where the same Tithi spans two consecutive local sunrises.</small></div>
      <div className="data-card"><small>Reference city</small><strong>{referenceCity.name}</strong><small>{referenceCity.state} · local sunrise sensitive</small></div>
      <div className="data-card"><small>Calculation basis</small><strong>Sun–Moon elongation</strong><small>Swiss Ephemeris · Moshier + local sunrise</small></div>
    </div>

    <section className="wide-panel">
      <h2 className="page-title" style={{fontSize:34}}>{vrat.name} observations in {year}</h2>
      <p className="page-subtitle">Each card opens the exact daily Panchang used as the broader local context.</p>
      <div className="city-directory">{rows.map(row=><Link href={`/panchang/${referenceCity.slug}/${row.date}`} key={`${row.date}-${row.paksha}`}>
        <small>{row.weekday} · {row.paksha} Paksha{row.repeatedAtSunrise?" · repeated at sunrise":""}</small>
        <strong>{row.date}</strong>
        <span>Sunrise {row.sunrise} · Tithi until {endLabel(row.date,row.tithiEnd,row.tithiEndDate)}</span>
      </Link>)}</div>
    </section>

    <div className="seo-copy"><h2>How Panchvani calculates this list</h2><p>{vrat.methodology}</p><p>{vrat.ritualCaution}</p><p>If the same Tithi is active at two consecutive sunrises, both observations are retained instead of silently selecting one ritual day. That decision requires rules beyond the basic lunar state.</p></div>

    <TopicalGraph title={`Explore ${vrat.name} ${year}`} groups={buildVratTopicalGraph(referenceCity,vrat.slug,year,rows,"baseline")}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}