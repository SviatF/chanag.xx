import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import DayWheel from "@/components/DayWheel";
import ChoghadiyaTable from "@/components/ChoghadiyaTable";
import LanguageLinks from "@/components/LanguageLinks";
import TopicalGraph from "@/components/TopicalGraph";
import {findCityBySlug} from "@/lib/cities";
import {buildDailyPanchangQualityContent} from "@/lib/daily-content-engine";
import {formatPanchangTime,formatWindow,getPanchang} from "@/lib/panchang";
import {getLunarMonthConventions} from "@/lib/calendar-conventions";
import {isDailyIndexable,robotsFor} from "@/lib/seo-policy";
import {nextValidatedFestival} from "@/lib/festival-expansion";
import {todayInIndia} from "@/lib/dates";
import {resolveDailyRouteDate} from "@/lib/route-validation";
import {regionalAlternates} from "@/lib/regional-seo";
import {datedPanchangSsgPriority} from "@/lib/static-seo-routes";
import {buildDailyTopicalGraph} from "@/lib/topical-links";
import {vratLinkForTithi} from "@/lib/vrat-topical-links";
import {criticalBoundaryNotice} from "@/lib/critical-boundary-notices";

export const dynamicParams=true;
export const revalidate=3600;

export function generateStaticParams(){
  return datedPanchangSsgPriority;
}

export async function generateMetadata({params}:{params:Promise<{city:string,date?:string[]}>}):Promise<Metadata>{
  const p=await params;
  const city=findCityBySlug(p.city);
  const date=resolveDailyRouteDate(p.date);
  if(!city||!date)notFound();
  const ds=date.toISOString().slice(0,10);
  const today=todayInIndia().toISOString().slice(0,10);
  const alternates:Metadata["alternates"]={canonical:`/panchang/${city.slug}/${ds}`};
  if(ds===today)alternates.languages=regionalAlternates(city,undefined,ds);
  return {title:`${city.name} Panchang for ${ds} — Tithi, Nakshatra & Sunrise`,description:`Panchang for ${city.name}: Tithi, Nakshatra, sunrise, sunset, Rahu Kalam, Yamaganda, Gulika and Abhijit Muhurat for ${ds}.`,alternates,robots:robotsFor(isDailyIndexable(city.slug,ds))};
}

export default async function PanchangPage({params}:{params:Promise<{city:string,date?:string[]}>}){
  const p=await params;
  const city=findCityBySlug(p.city);
  const date=resolveDailyRouteDate(p.date);
  if(!city||!date)notFound();
  const data=await getPanchang(date,city);
  const languageAlternates=regionalAlternates(city,undefined,data.date);
  const lunar=getLunarMonthConventions(date,city,data);
  const qualityContent=buildDailyPanchangQualityContent(city,data,lunar);
  const boundaryNotice=criticalBoundaryNotice(city.slug,data.date);
  const festival=nextValidatedFestival(date);
  const topicalGroups=buildDailyTopicalGraph(city,date,festival);
  const vratLink=vratLinkForTithi(city,date,data.tithi);
  if(vratLink)topicalGroups.splice(1,0,{title:"Lunar observance",description:"This Tithi is part of a yearly sunrise-based lunar reference cluster.",links:[vratLink]});
  const tithiEnd=formatPanchangTime(data.tithiEnd,data.tithiEndDate,data.date);
  const nakshatraEnd=formatPanchangTime(data.nakshatraEnd,data.nakshatraEndDate,data.date);
  const yogaEnd=formatPanchangTime(data.yogaEnd,data.yogaEndDate,data.date);
  const karanaEnd=formatPanchangTime(data.karanaEnd,data.karanaEndDate,data.date);
  const moonrise=formatPanchangTime(data.moonrise,data.moonriseDate,data.date);
  const moonset=formatPanchangTime(data.moonset,data.moonsetDate,data.date);
  const faq=[
    {q:`What is Rahu Kalam in ${city.name} on ${data.date}?`,a:`Rahu Kalam in ${city.name} is ${formatWindow(data.rahu)} for ${data.date}.`},
    {q:`What is the sunrise Tithi in ${city.name} on ${data.date}?`,a:`At local sunrise on ${data.date}, the Tithi is ${data.tithi} during ${data.paksha} Paksha; the stated transition clock applies only until its end.`},
    {q:`What is the sunrise Nakshatra in ${city.name} on ${data.date}?`,a:`At local sunrise on ${data.date}, the Nakshatra is ${data.nakshatra}; it ends at ${nakshatraEnd}.`},
    {q:`Why can Hindu month names differ?`,a:`Panchvani shows both Amanta and Purnimanta lunar month labels because these two month conventions are followed in different parts of India.`}
  ];
  const ld={ "@context":"https://schema.org","@graph":[
    {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://panchvani.com/"},{"@type":"ListItem","position":2,"name":city.name,"item":`https://panchvani.com/panchang/${city.slug}/${data.date}`},{"@type":"ListItem","position":3,"name":data.date}]},
    {"@type":"FAQPage","mainEntity":faq.map(x=>({"@type":"Question","name":x.q,"acceptedAnswer":{"@type":"Answer","text":x.a}}))}
  ]};
  return <main><Header city={city}/><div className="page-shell internal-visual internal-panchang">
    <div className="breadcrumbs"><Link href="/">Home</Link> / {city.name} / {data.date}</div>
    <p className="page-kicker">DAILY PANCHANG · {city.state}</p><h1 className="page-title">{city.name} Panchang<br/>{data.date}</h1>
    <p className="page-subtitle">{qualityContent.directAnswer}</p>
    <LanguageLinks languages={languageAlternates}/>
    <div className="wide-panel"><DayWheel data={data}/></div>
    <div className="data-grid">
      <div className="data-card"><small>Tithi</small><strong>{data.tithi}</strong><small>{data.paksha} Paksha · until {tithiEnd}</small></div>
      <div className="data-card"><small>Nakshatra</small><strong>{data.nakshatra}</strong><small>Pada {data.nakshatraPada} · until {nakshatraEnd}</small></div>
      <div className="data-card"><small>Yoga</small><strong>{data.yoga}</strong><small>Ends {yogaEnd}</small></div>
      <div className="data-card"><small>Karana</small><strong>{data.karana}</strong><small>Ends {karanaEnd}</small></div>
      <div className="data-card"><small>Sunrise</small><strong>{data.sunrise}</strong></div>
      <div className="data-card"><small>Sunset</small><strong>{data.sunset}</strong></div>
      <div className="data-card"><small>Moonrise</small><strong>{moonrise}</strong></div>
      <div className="data-card"><small>Moonset</small><strong>{moonset}</strong></div>
      <div className="data-card"><small>Amanta Lunar Month</small><strong>{lunar.amantaLabel}</strong><small>Month ends at Amavasya</small></div>
      <div className="data-card"><small>Purnimanta Lunar Month</small><strong>{lunar.purnimantaLabel}</strong><small>Month ends at Purnima</small></div>
      <div className="data-card"><small>Vikram Samvat</small><strong>{data.vikramSamvat}</strong></div>
      <div className="data-card"><small>Shaka Samvat</small><strong>{data.shakaSamvat}</strong></div>
      <div className="data-card"><small>Day Lord</small><strong>{data.dayLord}</strong></div>
    </div>
    {boundaryNotice?<section className="wide-panel" aria-label="Sunrise Tithi source review"><div className="seo-copy"><small>SUNRISE BOUNDARY · SOURCE REVIEW</small><h2>Minute-sensitive Tithi evidence for {city.name}</h2><p>{boundaryNotice.summary}</p><p>Published calendars disagree or omit the second-level precision needed to determine the exact sunrise order. A sunrise-based Tithi is not automatically a tradition-approved Vrat or Muhurat date. For conventions and corrections, see the <Link href="/accuracy">accuracy policy</Link> and <Link href="/corrections">corrections process</Link>.</p></div></section>:null}
    <div className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Auspicious & avoid periods</h2><div className="timing-row">
      <div className="timing-chip good"><small>Abhijit Muhurat</small><strong>{formatWindow(data.abhijit)}</strong></div>
      <div className="timing-chip bad"><small>Rahu Kalam</small><strong>{formatWindow(data.rahu)}</strong></div>
      <div className="timing-chip bad"><small>Yamaganda</small><strong>{formatWindow(data.yamaganda)}</strong></div>
      <div className="timing-chip bad"><small>Gulika Kalam</small><strong>{formatWindow(data.gulika)}</strong></div>
    </div></div>
    <section className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>Calculated local timing intervals · ${data.date}</h2>
      <div className="timing-row">
        <div className="timing-chip good"><small>Abhijit Muhurat</small><strong>{formatWindow(data.abhijit)}</strong></div>
        <div className="timing-chip bad"><small>Rahu Kalam</small><strong>{formatWindow(data.rahu)}</strong></div>
        <div className="timing-chip bad"><small>Yamaganda</small><strong>{formatWindow(data.yamaganda)}</strong></div>
        <div className="timing-chip bad"><small>Gulika Kalam</small><strong>{formatWindow(data.gulika)}</strong></div>
      </div>
    </section>
    <section className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>How to read these local timings</h2>
      <p className="page-subtitle">The Tithi and Nakshatra above describe the state at the calculated ${city.name} sunrise on ${data.date}. Their end times may fall on the following civil date. Rahu Kalam, Yamaganda, Gulika and Choghadiya are local time intervals; they do not independently establish whether a wedding, fast or other ritual is permitted.</p>
      <p>See <Link href="/methodology">calculation methodology</Link> and <Link href="/accuracy">data accuracy status</Link> for conventions, uncertainty and limitations.</p>
    </section>
    <div className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Choghadiya · ${city.name} · ${data.date}</h2>
      <p className="page-subtitle">Eight daytime and eight nighttime intervals derived from local sunrise, sunset and next sunrise.</p><ChoghadiyaTable day={data.dayChoghadiya} night={data.nightChoghadiya}/></div>
    <section className="wide-panel">
      <div className="seo-copy"><h2>{qualityContent.transitionTitle}</h2><p>{qualityContent.transitionBody}</p></div>
    </section>
    <section className="wide-panel">
      <div className="seo-copy"><h2>{qualityContent.solarTitle}</h2><p>{qualityContent.solarBody}</p><h2>{qualityContent.lunarTitle}</h2><p>{qualityContent.lunarBody}</p></div>
    </section>
    <TopicalGraph title={`Explore ${city.name} Panchang`} groups={topicalGroups}/>
    <div className="wide-panel"><h2>Frequently asked questions</h2>{faq.map(x=><div key={x.q} className="seo-copy"><strong>{x.q}</strong><p>{x.a}</p></div>)}</div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>
}
