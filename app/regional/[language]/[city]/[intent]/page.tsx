import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import ChoghadiyaTable from "@/components/ChoghadiyaTable";
import TopicalGraph from "@/components/TopicalGraph";
import {findCityBySlug} from "@/lib/cities";
import {todayInIndia} from "@/lib/dates";
import {formatWindow,getPanchang} from "@/lib/panchang";
import {regional} from "@/lib/regional";
import {getRegionalCalendarProfile} from "@/lib/regional-calendar";
import {getLunarMonthConventions,getRegionalCalendarConventions} from "@/lib/calendar-conventions";
import {
  isRegionalIntentIndexable,
  isRegionalIntentSlug,
  isRegionalLanguageSlug,
  regionalAlternates,
  regionalIntentLinksForCity,
  regionalIntentNativeLabel,
  regionalIntentPath,
  regionalIntentSeo,
  regionalLanguageSeo,
  regionalLanguageSupportsIntent,
} from "@/lib/regional-seo";
import {robotsFor} from "@/lib/seo-policy";
import type {TopicalGraphGroup} from "@/lib/topical-types";

export const revalidate=3600;

type RegionalKey=keyof typeof regional;

function resolveRoute(language:string,citySlug:string,intent:string){
  if(!isRegionalLanguageSlug(language)||!isRegionalIntentSlug(intent))return null;
  const city=findCityBySlug(citySlug);
  if(!city||!regionalLanguageSupportsIntent(language,intent))return null;
  return {language,city,intent};
}

export async function generateMetadata({params}:{params:Promise<{language:string;city:string;intent:string}>}):Promise<Metadata>{
  const p=await params;
  const route=resolveRoute(p.language,p.city,p.intent);
  if(!route)notFound();
  const {language,city,intent}=route;
  const native=regionalIntentNativeLabel(language,intent);
  const label=regionalIntentSeo[intent].label;
  return {
    title:`${native} in ${city.name} — ${label} Today`,
    description:`${label} today in ${city.name} with local sunrise/sunset calculation and ${regional[language as RegionalKey].label} context.`,
    alternates:{canonical:regionalIntentPath(language,city,intent),languages:regionalAlternates(city,intent)},
    robots:robotsFor(isRegionalIntentIndexable(language,city,intent)),
  };
}

export default async function RegionalIntentPage({params}:{params:Promise<{language:string;city:string;intent:string}>}){
  const p=await params;
  const route=resolveRoute(p.language,p.city,p.intent);
  if(!route)notFound();
  const {language,city,intent}=route;
  const date=todayInIndia();
  const data=await getPanchang(date,city);
  const lunar=getLunarMonthConventions(date,city,data);
  const regionalConventions=getRegionalCalendarConventions(date,city,data);
  const lang=regional[language as RegionalKey];
  const profile=getRegionalCalendarProfile(language,data,lunar,regionalConventions);
  const native=regionalIntentNativeLabel(language,intent);
  const siblingIntents=regionalIntentLinksForCity(language,city).filter(item=>item.intent!==intent);
  const englishHref=intent==="choghadiya"?`/tools/choghadiya/${city.slug}`:`/panchang/${city.slug}/${data.date}`;
  const topical:TopicalGraphGroup[]=[
    {title:"Regional context",description:"Continue with the same language and city context.",links:[
      {href:`/regional/${language}`,label:lang.label},
      {href:`/regional/${language}/${city.slug}`,label:`${lang.label} · ${city.name}`},
      ...siblingIntents.map(item=>({href:item.href,label:item.label}))
    ]},
    {title:"Calculation context",description:"Open the complete Panchang calculation for the same city and local day.",links:[
      {href:englishHref,label:intent==="choghadiya"?`Full Choghadiya · ${city.name}`:`Full Panchang · ${city.name}`},
      {href:`/calendar/${city.slug}/${data.date.slice(0,4)}/${data.date.slice(5,7)}`,label:`${city.name} monthly calendar`}
    ]}
  ];

  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"WebPage","name":`${native} in ${city.name}`,"url":`https://panchvani.com${regionalIntentPath(language,city,intent)}`,"inLanguage":regionalLanguageSeo[language].hreflang},
    {"@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":"Regional","item":"https://panchvani.com/regional"},
      {"@type":"ListItem","position":2,"name":lang.label,"item":`https://panchvani.com/regional/${language}`},
      {"@type":"ListItem","position":3,"name":city.name,"item":`https://panchvani.com/regional/${language}/${city.slug}`},
      {"@type":"ListItem","position":4,"name":native}
    ]}
  ]};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-regional">
    <div className="breadcrumbs"><Link href="/regional">Regional</Link> / <Link href={`/regional/${language}`}>{lang.label}</Link> / <Link href={`/regional/${language}/${city.slug}`}>{city.name}</Link> / {native}</div>
    <p className="page-kicker">{lang.native} · {city.state} · LOCAL TIMING</p>
    <h1 className="page-title">{native}<br/>{city.name}</h1>
    <p className="page-subtitle">{data.date} · {profile.calendarSystem} · calculated from {city.name} local solar timings.</p>

    {intent==="rahu-kalam"?<>
      <div className="data-grid">
        <div className="data-card"><small>{lang.terms.rahu}</small><strong>{formatWindow(data.rahu)}</strong><small>{data.date} · {city.name}</small></div>
        <div className="data-card"><small>{lang.terms.sunrise}</small><strong>{data.sunrise}</strong><small>Local sunrise</small></div>
        <div className="data-card"><small>{lang.terms.sunset}</small><strong>{data.sunset}</strong><small>Local sunset</small></div>
        <div className="data-card"><small>{lang.terms.yamaganda}</small><strong>{formatWindow(data.yamaganda)}</strong></div>
        <div className="data-card"><small>{lang.terms.gulika}</small><strong>{formatWindow(data.gulika)}</strong></div>
        <div className="data-card"><small>{lang.terms.tithi}</small><strong>{data.tithi}</strong><small>{data.paksha} Paksha</small></div>
        <div className="data-card"><small>{lang.terms.month}</small><strong>{profile.monthNative??profile.month}</strong><small>{profile.yearLabel??profile.calendarSystem}</small></div>
      </div>
      <div className="seo-copy"><h2>{native} — how this time is calculated</h2><p>Rahu Kalam is derived from one eighth of the local daylight interval, with the segment determined by weekday. Because Panchvani uses {city.name} sunrise and sunset, the clock time can differ from another city on the same date.</p><p>{profile.note}</p></div>
    </>:<>
      <div className="data-grid">
        <div className="data-card"><small>{lang.terms.sunrise}</small><strong>{data.sunrise}</strong></div>
        <div className="data-card"><small>{lang.terms.sunset}</small><strong>{data.sunset}</strong></div>
        <div className="data-card"><small>{lang.terms.rahu}</small><strong>{formatWindow(data.rahu)}</strong></div>
        <div className="data-card"><small>{lang.terms.tithi}</small><strong>{data.tithi}</strong><small>{data.paksha} Paksha</small></div>
        <div className="data-card"><small>{lang.terms.month}</small><strong>{profile.monthNative??profile.month}</strong><small>{profile.yearLabel??profile.calendarSystem}</small></div>
      </div>
      <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>{native}</h2><p className="page-subtitle">Day and night Choghadiya are segmented from local sunrise → sunset → next sunrise for {city.name}.</p><ChoghadiyaTable day={data.dayChoghadiya} night={data.nightChoghadiya}/></section>
      <div className="seo-copy"><h2>Local Choghadiya in {lang.label}</h2><p>The clock periods are calculated from {city.name} solar timing rather than copied from a national timetable.</p><p>{profile.note}</p></div>
    </>}

    <TopicalGraph title={`Explore ${city.name} regional timing`} groups={topical}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
