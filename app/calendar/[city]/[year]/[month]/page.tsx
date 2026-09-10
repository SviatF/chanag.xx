import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import TopicalGraph from "@/components/TopicalGraph";
import {findCityBySlug} from "@/lib/cities";
import {getPanchang} from "@/lib/panchang";
import {festivalsForYear} from "@/lib/festivals";
import {isMonthlyIndexable,robotsFor} from "@/lib/seo-policy";
import {parseRouteMonth,parseRouteYear} from "@/lib/route-validation";
import {buildCalendarTopicalGraph} from "@/lib/topical-links";
import {vratYearLinks} from "@/lib/vrat-topical-links";

export const revalidate=86400;

export async function generateMetadata({params}:{params:Promise<{city:string;year:string;month:string}>}):Promise<Metadata>{
  const p=await params;
  const city=findCityBySlug(p.city);
  const y=parseRouteYear(p.year),m=parseRouteMonth(p.month);
  if(!city||!y||!m)notFound();
  return {
    title:`${city.name} Hindu Calendar — ${p.month}/${p.year}`,
    description:`Monthly Hindu calendar for ${city.name} with Tithi, festivals, Ekadashi, Purnima and Amavasya.`,
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
  const entries=await Promise.all(
    Array.from({length:count},(_,i)=>getPanchang(new Date(Date.UTC(y,m-1,i+1,6)),city))
  );

  const monthFestivals=festivalsForYear(y).filter(f=>Number(f.date.slice(5,7))===m);
  const festivalByDate=new Map(monthFestivals.map(f=>[f.date,f]));
  const monthName=new Intl.DateTimeFormat("en-IN",{month:"long",timeZone:"Asia/Kolkata"}).format(new Date(Date.UTC(y,m-1,1)));
  const prev=new Date(Date.UTC(y,m-2,1));
  const next=new Date(Date.UTC(y,m,1));
  const prevMonth=String(prev.getUTCMonth()+1).padStart(2,"0");
  const nextMonth=String(next.getUTCMonth()+1).padStart(2,"0");
  const keyDates=entries.filter(entry=>["Ekadashi","Purnima","Amavasya"].includes(entry.tithi)).map(entry=>({date:entry.date,tithi:entry.tithi}));
  const topicalGroups=buildCalendarTopicalGraph(city,y,m,keyDates);
  const lunarLinks=vratYearLinks(city,y);
  if(lunarLinks.length)topicalGroups.splice(1,0,{title:"Yearly lunar observances",description:"Open sunrise-based Ekadashi, Purnima and Amavasya references for this city and year.",links:lunarLinks});

  return <main><Header city={city}/><div className="page-shell internal-visual internal-calendar">
    <div className="breadcrumbs"><Link href="/">Home</Link> / <Link href={`/panchang/${city.slug}`}>{city.name}</Link> / Calendar</div>
    <p className="page-kicker">MONTHLY CALENDAR</p>
    <h1 className="page-title">{monthName} {y}<br/>in {city.name}</h1>
    <p className="page-subtitle">Every day links directly to its local Panchang. Ekadashi, Purnima, Amavasya and major festivals are surfaced directly in the grid.</p>

    <div className="pill-links">
      <Link href={`/calendar/${city.slug}/${prev.getUTCFullYear()}/${prevMonth}`}>← Previous month</Link>
      <Link href={`/panchang/${city.slug}`}>Today in {city.name}</Link>
      <Link href={`/calendar/${city.slug}/${next.getUTCFullYear()}/${nextMonth}`}>Next month →</Link>
    </div>

    <div className="month-grid">
      {Array.from({length:first}).map((_,i)=><div key={`blank-${i}`}/>)}
      {entries.map((x,i)=>{
        const festival=festivalByDate.get(x.date);
        const lunarMarker=x.tithi==="Ekadashi"?"Ekadashi":x.tithi==="Purnima"?"Purnima":x.tithi==="Amavasya"?"Amavasya":null;
        return <Link
          href={`/panchang/${city.slug}/${x.date}`}
          key={x.date}
          className={festival?"has-festival":lunarMarker?"has-lunar-marker":undefined}
        >
          <strong>{i+1}</strong>
          <small>{x.tithi}</small>
          <small>{x.nakshatra}</small>
          {lunarMarker?<small className="calendar-lunar-marker">{lunarMarker}</small>:null}
          {festival?<small className="calendar-festival-marker">{festival.name}</small>:null}
        </Link>;
      })}
    </div>

    <section className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>Festivals in {monthName}</h2>
      {monthFestivals.length
        ? <div className="city-directory">{monthFestivals.map(festival=><Link href={`/festivals/${festival.slug}/${y}/${city.slug}`} key={festival.slug}><small>{festival.date}</small><strong>{festival.name}</strong><span>{festival.short}</span></Link>)}</div>
        : <p className="page-subtitle">No major festivals from the current curated festival database fall in this month.</p>}
    </section>

    <TopicalGraph title={`Explore ${monthName} in ${city.name}`} groups={topicalGroups}/>
  </div></main>;
}