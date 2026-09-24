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
import {getDailyGuidance} from "@/lib/day-guidance";
import {nextValidatedFestival} from "@/lib/festival-expansion";
import {todayInIndia} from "@/lib/dates";
import {resolveDailyRouteDate} from "@/lib/route-validation";
import {regionalAlternates} from "@/lib/regional-seo";
import {datedPanchangSsgPriority} from "@/lib/static-seo-routes";
import {buildDailyTopicalGraph} from "@/lib/topical-links";
import {vratLinkForTithi} from "@/lib/vrat-topical-links";

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
  return {title:`Today Panchang in ${city.name} — ${ds}`,description:`Panchang for ${city.name}: Tithi, Nakshatra, sunrise, sunset, Rahu Kalam, Yamaganda, Gulika and Abhijit Muhurat for ${ds}.`,alternates,robots:robotsFor(isDailyIndexable(city.slug,ds))};
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
  const guidance=getDailyGuidance(data,city);
  const festival=nextValidatedFestival(date);
  const topicalGroups=buildDailyTopicalGraph(city,date,festival);
  const vratLink=vratLinkForTithi(city,date,data.tithi);
  if(vratLink)topicalGroups.splice(1,0,{title:"Lunar observance",description:"This Tithi is part of a yearly sunrise-based lunar reference cluster.",links:[vratLink]});
  const tithiEnd=formatPanchangTime(data.tithiEnd,data.tithiEndDate,data.date);
  const nakshatraEnd=formatPanchangTime(data.nakshatraEnd,data.nakshatraEndDate,data.date);
  const moonrise=formatPanchangTime(data.moonrise,data.moonriseDate,data.date);
  const moonset=formatPanchangTime(data.moonset,data.moonsetDate,data.date);
  const faq=[
    {q:`What is Rahu Kalam today in ${city.name}?`,a:`Rahu Kalam in ${city.name} is ${formatWindow(data.rahu)} for ${data.date}.`},
    {q:`What is today's Tithi in ${city.name}?`,a:`Today's Tithi is ${data.tithi}, during ${data.paksha} Paksha.`},
    {q:`What is today's Nakshatra in ${city.name}?`,a:`The Nakshatra calculated for the day is ${data.nakshatra}.`},
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
      <div className="data-card"><small>Yoga</small><strong>{data.yoga}</strong></div>
      <div className="data-card"><small>Karana</small><strong>{data.karana}</strong></div>
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
    <div className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Auspicious & avoid periods</h2><div className="timing-row">
      <div className="timing-chip good"><small>Abhijit Muhurat</small><strong>{formatWindow(data.abhijit)}</strong></div>
      <div className="timing-chip bad"><small>Rahu Kalam</small><strong>{formatWindow(data.rahu)}</strong></div>
      <div className="timing-chip bad"><small>Yamaganda</small><strong>{formatWindow(data.yamaganda)}</strong></div>
      <div className="timing-chip bad"><small>Gulika Kalam</small><strong>{formatWindow(data.gulika)}</strong></div>
    </div></div>
    <div className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>Auspicious today for</h2>
      <p className="page-subtitle">{guidance.summary}</p>
      <div className="data-grid">
        {guidance.auspicious.map(item=><div className="data-card" key={item.title}><small>Favorable signal</small><strong>{item.title}</strong><small>{item.detail}</small></div>)}
      </div>
      <h2 className="page-title" style={{fontSize:32,marginTop:28}}>Avoid today</h2>
      <div className="data-grid">
        {guidance.avoid.map(item=><div className="data-card" key={item.title}><small>Timing caution</small><strong>{item.title}</strong><small>{item.detail}</small></div>)}
      </div>
    </div>
    <div className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Choghadiya</h2><p className="page-subtitle">Eight daytime and eight nighttime periods for {city.name}.</p><ChoghadiyaTable day={data.dayChoghadiya} night={data.nightChoghadiya}/></div>

    <section className="wide-panel"><div className="seo-copy">
      <small>DAY FINGERPRINT · {city.name.toUpperCase()}</small>
      <h2>{qualityContent.fingerprintTitle}</h2>
      <p>{qualityContent.fingerprintBody}</p>
    </div><div className="data-grid">{qualityContent.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}</div></section>

    <section className="wide-panel"><div className="seo-copy"><h2>{qualityContent.transitionTitle}</h2><p>{qualityContent.transitionBody}</p></div></section>
    <section className="wide-panel"><div className="seo-copy"><h2>{qualityContent.solarTitle}</h2><p>{qualityContent.solarBody}</p><h2>{qualityContent.lunarTitle}</h2><p>{qualityContent.lunarBody}</p></div></section>

    <TopicalGraph title={`Explore ${city.name} Panchang`} groups={topicalGroups}/>
    <div className="wide-panel"><h2>Frequently asked questions</h2>{faq.map(x=><div key={x.q} className="seo-copy"><strong>{x.q}</strong><p>{x.a}</p></div>)}</div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>
}
