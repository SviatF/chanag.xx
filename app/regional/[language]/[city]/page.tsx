import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import ChoghadiyaTable from "@/components/ChoghadiyaTable";
import TopicalGraph from "@/components/TopicalGraph";
import { findCityBySlug } from "@/lib/cities";
import { formatPanchangTime, getPanchang, formatWindow } from "@/lib/panchang";
import { regional } from "@/lib/regional";
import { todayInIndia } from "@/lib/dates";
import { getRegionalCalendarProfile } from "@/lib/regional-calendar";
import { isRegionalIndexable, robotsFor } from "@/lib/seo-policy";
import {buildRegionalTopicalGraph} from "@/lib/topical-links";
import {isRegionalLanguageSlug,regionalAlternates,regionalIntentLinksForCity} from "@/lib/regional-seo";

export const revalidate = 3600;

type RegionalKey=keyof typeof regional;
const regionalBySlug=(slug:string)=>regional[slug as RegionalKey];

const bengaliTithi:Record<string,string>={
  Pratipada:"প্রতিপদ",Dvitiya:"দ্বিতীয়া",Tritiya:"তৃতীয়া",Chaturthi:"চতুর্থী",Panchami:"পঞ্চমী",
  Shashthi:"ষষ্ঠী",Saptami:"সপ্তমী",Ashtami:"অষ্টমী",Navami:"নবমী",Dashami:"দশমী",
  Ekadashi:"একাদশী",Dwadashi:"দ্বাদশী",Trayodashi:"ত্রয়োদশী",Chaturdashi:"চতুর্দশী",
  Purnima:"পূর্ণিমা",Amavasya:"অমাবস্যা"
};

export async function generateMetadata({params}:{params:Promise<{language:string;city:string}>}):Promise<Metadata>{
  const p=await params;
  const city=findCityBySlug(p.city);
  const lang=regionalBySlug(p.language);
  if(!city||!lang||!isRegionalLanguageSlug(p.language))notFound();
  return {
    title:`${lang.label} in ${city.name}`,
    description:`${lang.label} for ${city.name} with Tithi, Nakshatra, sunrise, sunset, Rahu Kalam and regional calendar data.`,
    alternates:{canonical:`/regional/${p.language}/${city.slug}`,languages:regionalAlternates(city)},
    robots:robotsFor(isRegionalIndexable(p.language,city))
  };
}

export default async function RegionalPage({params}:{params:Promise<{language:string;city:string}>}){
  const p=await params;
  const city=findCityBySlug(p.city);
  const lang=regionalBySlug(p.language);
  if(!city||!lang||!isRegionalLanguageSlug(p.language))notFound();
  const date=todayInIndia();
  const data=await getPanchang(date,city);
  const t=lang.terms;
  const isBengali=p.language==="bengali";
  const profile=getRegionalCalendarProfile(p.language,data);
  const displayTithi=isBengali?(bengaliTithi[data.tithi]??data.tithi):data.tithi;
  const tithiEnd=formatPanchangTime(data.tithiEnd,data.tithiEndDate,data.date);
  const nakshatraEnd=formatPanchangTime(data.nakshatraEnd,data.nakshatraEndDate,data.date);
  const moonrise=formatPanchangTime(data.moonrise,data.moonriseDate,data.date);
  const moonset=formatPanchangTime(data.moonset,data.moonsetDate,data.date);
  const intentLinks=regionalIntentLinksForCity(p.language,city);
  const graph=buildRegionalTopicalGraph(city,p.language,date);
  if(intentLinks.length)graph.splice(1,0,{title:"Regional timing searches",description:"Open the local timing pages available for this language and city.",links:intentLinks.map(item=>({href:item.href,label:item.label}))});

  return <main><Header city={city}/><div className="page-shell internal-visual internal-regional">
    <div className="breadcrumbs"><Link href="/regional">Regional</Link> / <Link href={`/regional/${p.language}`}>{lang.label}</Link> / {city.name}</div>
    <p className="page-kicker">{lang.label} · {city.state}</p>
    <h1 className="page-title">{t.today}<br/>{city.name}</h1>
    <p className="page-subtitle">
      {profile.calendarSystem} · {profile.monthNative?`${profile.monthNative} (${profile.month})`:profile.month}{profile.yearLabel?` · ${profile.yearLabel}`:""}
    </p>

    <div className="data-grid">
      <div className="data-card"><small>{t.tithi}</small><strong>{displayTithi}</strong><small>{data.paksha} Paksha · until {tithiEnd}</small></div>
      <div className="data-card"><small>{t.nakshatra}</small><strong>{profile.nakshatra}</strong><small>Pada {data.nakshatraPada} · until {nakshatraEnd}</small></div>
      <div className="data-card"><small>{t.yoga}</small><strong>{data.yoga}</strong></div>
      <div className="data-card"><small>{t.karana}</small><strong>{data.karana}</strong></div>
      <div className="data-card"><small>{t.sunrise}</small><strong>{data.sunrise}</strong></div>
      <div className="data-card"><small>{t.sunset}</small><strong>{data.sunset}</strong></div>
      <div className="data-card"><small>{t.moonrise}</small><strong>{moonrise}</strong></div>
      <div className="data-card"><small>{t.moonset}</small><strong>{moonset}</strong></div>
      <div className="data-card"><small>{t.month}</small><strong>{profile.monthNative??profile.month}</strong><small>{profile.monthNative?profile.month:profile.calendarSystem}{profile.yearLabel?` · ${profile.yearLabel}`:""}</small></div>
      {profile.solarSign?<div className="data-card"><small>Solar Rashi</small><strong>{profile.solarSign}</strong></div>:null}
      <div className="data-card"><small>Vikram Samvat</small><strong>{data.vikramSamvat}</strong></div>
      <div className="data-card"><small>Shaka Samvat</small><strong>{data.shakaSamvat}</strong></div>
    </div>

    <div className="wide-panel"><div className="timing-row">
      <div className="timing-chip bad"><small>{t.rahu}</small><strong>{formatWindow(data.rahu)}</strong></div>
      <div className="timing-chip bad"><small>{t.yamaganda}</small><strong>{formatWindow(data.yamaganda)}</strong></div>
      <div className="timing-chip bad"><small>{t.gulika}</small><strong>{formatWindow(data.gulika)}</strong></div>
      <div className="timing-chip good"><small>{t.auspicious}</small><strong>{formatWindow(data.abhijit)}</strong></div>
    </div></div>

    <div className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>Choghadiya</h2>
      <ChoghadiyaTable day={data.dayChoghadiya} night={data.nightChoghadiya}/>
    </div>

    <div className="seo-copy"><h2>{profile.calendarSystem}</h2><p>{profile.note}</p><p>The regional calendar layer is combined with the same city-local astronomical calculation used across Panchvani. Times that continue after midnight retain the following civil date instead of being shown as an ambiguous clock time.</p></div>

    <div className="pill-links"><Link href={`/regional/${p.language}`}>All {lang.label} cities</Link><Link href="/regional">All regional Panchang</Link></div>
    <TopicalGraph title={`Explore ${city.name} across Panchvani`} groups={graph}/>
  </div></main>;
}
