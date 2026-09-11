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
  regionalIntentPath,
  regionalLanguageSupportsIntent,
} from "@/lib/regional-seo";
import {robotsFor} from "@/lib/seo-policy";
import {choghadiyaNativeNames,localizePaksha,localizeTithi,nativeCityName} from "@/lib/regional-i18n";
import {regionalPureLocale} from "@/lib/regional-pure-copy";
import {nativeCalendarName,nativeRegionalMonth} from "@/lib/regional-values";
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
  const copy=regionalPureLocale(language);
  const cityName=nativeCityName(language,city);
  return {
    title:copy.intentMetaTitle(intent,cityName),
    description:copy.intentMetaDescription(intent,cityName),
    alternates:{canonical:regionalIntentPath(language,city,intent),languages:regionalAlternates(city,intent)},
    robots:robotsFor(isRegionalIntentIndexable(language,city,intent)),
  };
}

export default async function RegionalIntentPage({params}:{params:Promise<{language:string;city:string;intent:string}>}){
  const p=await params;
  const route=resolveRoute(p.language,p.city,p.intent);
  if(!route)notFound();
  const {language,city,intent}=route;
  const copy=regionalPureLocale(language);
  const cityName=nativeCityName(language,city);
  const date=todayInIndia();
  const data=await getPanchang(date,city);
  const lunar=getLunarMonthConventions(date,city,data);
  const regionalConventions=getRegionalCalendarConventions(date,city,data);
  const lang=regional[language as RegionalKey];
  const profile=getRegionalCalendarProfile(language,data,lunar,regionalConventions);
  const month=nativeRegionalMonth(language,profile);
  const calendarName=nativeCalendarName(language);
  const native=copy.intentTitle(intent,cityName);
  const siblingIntents=regionalIntentLinksForCity(language,city).filter(item=>item.intent!==intent);
  const englishHref=intent==="choghadiya"?`/tools/choghadiya/${city.slug}`:`/panchang/${city.slug}/${data.date}`;
  const topical:TopicalGraphGroup[]=[
    {title:copy.regionalContext,links:[
      {href:`/regional/${language}`,label:copy.allCities},
      {href:`/regional/${language}/${city.slug}`,label:`${copy.panchangName} · ${cityName}`},
      ...siblingIntents.map(item=>({href:item.href,label:item.label}))
    ]},
    {title:copy.calculationContext,links:[
      {href:englishHref,label:`${copy.fullPanchang} · ${cityName}`},
      {href:`/calendar/${city.slug}/${data.date.slice(0,4)}/${data.date.slice(5,7)}`,label:`${copy.monthlyCalendar} · ${cityName}`}
    ]}
  ];

  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"WebPage","name":native,"url":`https://panchvani.com${regionalIntentPath(language,city,intent)}`,"description":copy.intentMetaDescription(intent,cityName),"inLanguage":copy.hreflang},
    {"@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":"Panchvani","item":"https://panchvani.com/regional"},
      {"@type":"ListItem","position":2,"name":copy.panchangName,"item":`https://panchvani.com/regional/${language}`},
      {"@type":"ListItem","position":3,"name":cityName,"item":`https://panchvani.com/regional/${language}/${city.slug}`},
      {"@type":"ListItem","position":4,"name":native}
    ]}
  ]};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-regional">
    <div className="breadcrumbs"><Link href="/regional">Panchvani</Link> / <Link href={`/regional/${language}`}>{copy.panchangName}</Link> / <Link href={`/regional/${language}/${city.slug}`}>{cityName}</Link> / {native}</div>
    <p className="page-kicker">{copy.nativeLanguage} · {cityName} · {copy.localTiming}</p>
    <h1 className="page-title">{native}</h1>
    <p className="page-subtitle">{data.date} · {calendarName} · {copy.localCalculation}</p>

    {intent==="rahu-kalam"?<>
      <div className="data-grid">
        <div className="data-card"><small>{lang.terms.rahu}</small><strong>{formatWindow(data.rahu)}</strong><small>{data.date} · {cityName}</small></div>
        <div className="data-card"><small>{lang.terms.sunrise}</small><strong>{data.sunrise}</strong></div>
        <div className="data-card"><small>{lang.terms.sunset}</small><strong>{data.sunset}</strong></div>
        <div className="data-card"><small>{lang.terms.yamaganda}</small><strong>{formatWindow(data.yamaganda)}</strong></div>
        <div className="data-card"><small>{lang.terms.gulika}</small><strong>{formatWindow(data.gulika)}</strong></div>
        <div className="data-card"><small>{lang.terms.tithi}</small><strong>{localizeTithi(language,data.tithi)}</strong><small>{localizePaksha(language,data.paksha)}</small></div>
        <div className="data-card"><small>{lang.terms.month}</small><strong>{month}</strong><small>{calendarName}</small></div>
      </div>
      <div className="seo-copy"><h2>{native}</h2><p>{copy.rahuExplanation(cityName)}</p><p>{copy.methodologyText}</p></div>
    </>:<>
      <div className="data-grid">
        <div className="data-card"><small>{lang.terms.sunrise}</small><strong>{data.sunrise}</strong></div>
        <div className="data-card"><small>{lang.terms.sunset}</small><strong>{data.sunset}</strong></div>
        <div className="data-card"><small>{lang.terms.rahu}</small><strong>{formatWindow(data.rahu)}</strong></div>
        <div className="data-card"><small>{lang.terms.tithi}</small><strong>{localizeTithi(language,data.tithi)}</strong><small>{localizePaksha(language,data.paksha)}</small></div>
        <div className="data-card"><small>{lang.terms.month}</small><strong>{month}</strong><small>{calendarName}</small></div>
      </div>
      <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>{native}</h2><p className="page-subtitle">{copy.choghadiyaExplanation(cityName)}</p><ChoghadiyaTable day={data.dayChoghadiya} night={data.nightChoghadiya} locale={{dayTitle:copy.dayChoghadiya,nightTitle:copy.nightChoghadiya,daySubtitle:copy.sunriseToSunset,nightSubtitle:copy.sunsetToNextSunrise,goodLabel:copy.goodPeriods,neutralLabel:copy.neutralPeriod,badLabel:copy.difficultPeriods,names:choghadiyaNativeNames[language]}}/></section>
      <div className="seo-copy"><h2>{copy.calendarExplanationTitle}</h2><p>{copy.methodologyText}</p></div>
    </>}

    <TopicalGraph title={`${copy.regionalContext} · ${cityName}`} groupEyebrow={copy.nativeLanguage} groups={topical}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
