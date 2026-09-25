import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import TopicalGraph from "@/components/TopicalGraph";
import {findCityBySlug} from "@/lib/cities";
import {buildMonthlyCalendarQualityContent} from "@/lib/calendar-content-engine";
import {buildCalendarMonthCityContext} from "@/lib/calendar-month-city-context";
import {buildCalendarMonthSimilarityContext} from "@/lib/calendar-month-similarity-context";
import {buildCalendarMonthHighSimilarityContext} from "@/lib/calendar-month-high-similarity-context";
import {getPrecomputedMuhuratPanchangMonth} from "@/lib/muhurat-precomputed";
import {getPanchang} from "@/lib/panchang";
import {festivalsForYear} from "@/lib/festivals";
import {isMonthlyIndexable,robotsFor} from "@/lib/seo-policy";
import {parseRouteMonth,parseRouteYear} from "@/lib/route-validation";
import {calendarMonthSsgPriority} from "@/lib/static-seo-routes";
import {buildCalendarTopicalGraph} from "@/lib/topical-links";
import {vratYearLinks} from "@/lib/vrat-topical-links";
import {cityCalendarYearPath} from "@/lib/yearly-expansion";

export const dynamicParams=true;
export const revalidate=86400;

export function generateStaticParams(){
  return calendarMonthSsgPriority;
}

function monthLabel(year:number,month:number){return new Intl.DateTimeFormat("en-IN",{month:"long",timeZone:"Asia/Kolkata"}).format(new Date(Date.UTC(year,month-1,1)));}

export async function generateMetadata({params}:{params:Promise<{city:string;year:string;month:string}>}):Promise<Metadata>{
  const p=await params;
  const city=findCityBySlug(p.city);
  const y=parseRouteYear(p.year),m=parseRouteMonth(p.month);
  if(!city||!y||!m)notFound();
  const name=monthLabel(y,m);
  return {
    title:`${name} ${y} Hindu Calendar for ${city.name} — Tithi & Festivals`,
    description:`${name} ${y} Hindu calendar for ${city.name} with daily Tithi, Nakshatra, Ekadashi, Purnima, Amavasya and maintained festival dates.`,
    alternates:{canonical:`/calendar/${city.slug}/${p.year}/${p.month}`},
    robots:robotsFor(isMonthlyIndexable(city.slug,y,m))
  };
}

export default async function CalendarPage({params}:{params:Promise<{city:string;year:string;month:string}>}){
  const p=await params;
  const city=findCityBySlug(p.city);
  const y=parseRouteYear(p.year),m=parseRouteMonth(p.month);
  if(!city||!y||!m)notFound();
  const count=new Date(Date.UTC(y,m,0)).getUTCDate();
  const first=new Date(Date.UTC(y,m-1,1)).getUTCDay();
  const precomputed=await getPrecomputedMuhuratPanchangMonth(y,m,city);
  const entries=precomputed??await Promise.all(Array.from({length:count},(_,i)=>getPanchang(new Date(Date.UTC(y,m-1,i+1,6)),city)));

  const monthFestivals=festivalsForYear(y).filter(f=>Number(f.date.slice(5,7))===m);
  const festivalByDate=new Map(monthFestivals.map(f=>[f.date,f]));
  const qualityContent=buildMonthlyCalendarQualityContent(city,y,m,entries,monthFestivals);
  const cityContext=buildCalendarMonthCityContext(city,y,m,entries,monthFestivals);
  const similarityContext=buildCalendarMonthSimilarityContext(city,y,m,entries);
  const highSimilarityContext=buildCalendarMonthHighSimilarityContext(city,y,m,entries);
  const monthName=monthLabel(y,m);
  const prev=new Date(Date.UTC(y,m-2,1));
  const next=new Date(Date.UTC(y,m,1));
  const prevMonth=String(prev.getUTCMonth()+1).padStart(2,"0");
  const nextMonth=String(next.getUTCMonth()+1).padStart(2,"0");
  const keyDates=entries.filter(entry=>["Ekadashi","Purnima","Amavasya"].includes(entry.tithi)).map(entry=>({date:entry.date,tithi:entry.tithi}));
  const topicalGroups=buildCalendarTopicalGraph(city,y,m,keyDates);
  const lunarLinks=vratYearLinks(city,y);
  if(lunarLinks.length)topicalGroups.splice(1,0,{title:"Yearly lunar observances",description:"Open sunrise-based Ekadashi, Purnima and Amavasya references for this city and year.",links:lunarLinks});

  return <main><Header city={city}/><div className="page-shell internal-visual internal-calendar">
    <div className="breadcrumbs"><Link href="/">Home</Link> / <Link href={`/panchang/${city.slug}`}>{city.name}</Link> / <Link href={cityCalendarYearPath(city,y)}>{y}</Link> / Calendar</div>
    <p className="page-kicker">MONTHLY HINDU CALENDAR</p>
    <h1 className="page-title">{monthName} {y}<br/>Hindu Calendar for {city.name}</h1>
    <p className="page-subtitle">{qualityContent.directAnswer}</p>
    <p className="page-subtitle">Open any day for its local Panchang. Ekadashi, Purnima, Amavasya and maintained festival dates are highlighted directly in the month.</p>

    <div className="pill-links">
      <Link href={`/calendar/${city.slug}/${prev.getUTCFullYear()}/${prevMonth}`}>← Previous month</Link>
      <Link href={cityCalendarYearPath(city,y)}>Full {y} calendar</Link>
      <Link href={`/panchang/${city.slug}`}>Today in {city.name}</Link>
      <Link href={`/calendar/${city.slug}/${next.getUTCFullYear()}/${nextMonth}`}>Next month →</Link>
    </div>

    <div className="month-grid">
      {Array.from({length:first}).map((_,i)=><div key={`blank-${i}`}/>)}
      {entries.map((x,i)=>{
        const festival=festivalByDate.get(x.date);
        const lunarMarker=x.tithi==="Ekadashi"?"Ekadashi":x.tithi==="Purnima"?"Purnima":x.tithi==="Amavasya"?"Amavasya":null;
        return <Link href={`/panchang/${city.slug}/${x.date}`} key={x.date} className={festival?"has-festival":lunarMarker?"has-lunar-marker":undefined}>
          <strong>{i+1}</strong><small>{x.tithi}</small><small>{x.nakshatra}</small>
          {lunarMarker?<small className="calendar-lunar-marker">{lunarMarker}</small>:null}
          {festival?<small className="calendar-festival-marker">{festival.name}</small>:null}
        </Link>;
      })}
    </div>

    <section className="wide-panel"><div className="seo-copy">
      <small>MONTH FINGERPRINT · {city.name.toUpperCase()}</small>
      <h2>{qualityContent.fingerprintTitle}</h2>
      <p>{qualityContent.fingerprintBody}</p>
    </div><div className="data-grid">{qualityContent.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}</div></section>

    <section className="wide-panel">
      <div className="seo-copy"><small>LOCAL CITY SIGNATURE · {city.state.toUpperCase()}</small><h2>{cityContext.title}</h2><p>{cityContext.body}</p><p>{cityContext.secondaryBody}</p></div>
      <div className="data-grid">{cityContext.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}</div>
    </section>

    <section className="wide-panel">
      <div className="seo-copy"><small>MONTHLY LOCALITY LENS · {city.state.toUpperCase()}</small><h2>{similarityContext.title}</h2><p>{similarityContext.localityBody}</p><h2>{similarityContext.solarTitle}</h2><p>{similarityContext.solarBody}</p></div>
      <div className="data-grid">{similarityContext.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}</div>
    </section>

    {highSimilarityContext?<section className="wide-panel">
      <div className="seo-copy"><small>GUJARAT MONTH COMPARISON LENS</small><h2>{highSimilarityContext.title}</h2><p>{highSimilarityContext.geographyBody}</p><h2>{highSimilarityContext.rhythmTitle}</h2><p>{highSimilarityContext.rhythmBody}</p></div>
      <div className="data-grid">{highSimilarityContext.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}</div>
    </section>:null}

    <section className="wide-panel"><div className="seo-copy"><h2>{cityContext.lunarTitle}</h2><p>{cityContext.lunarBody}</p></div></section>
    <section className="wide-panel"><div className="seo-copy"><h2>{qualityContent.lunarTitle}</h2><p>{qualityContent.lunarBody}</p></div></section>
    <section className="wide-panel"><div className="seo-copy"><h2>{qualityContent.solarTitle}</h2><p>{qualityContent.solarBody}</p></div></section>

    <section className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>Festivals in {monthName}</h2>
      <p className="page-subtitle">{qualityContent.festivalBody}</p>
      {monthFestivals.length
        ? <div className="city-directory">{monthFestivals.map(festival=><Link href={`/festivals/${festival.slug}/${y}/${city.slug}`} key={festival.slug}><small>{festival.date}</small><strong>{festival.name}</strong><span>{festival.short}</span></Link>)}</div>
        : <p className="page-subtitle">No major festival from the maintained dataset falls in this month.</p>}
    </section>

    <TopicalGraph title={`Explore ${monthName} in ${city.name}`} groups={topicalGroups}/>
  </div></main>;
}
