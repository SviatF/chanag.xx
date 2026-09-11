import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import ChoghadiyaTable from "@/components/ChoghadiyaTable";
import TopicalGraph from "@/components/TopicalGraph";
import {findCityBySlug} from "@/lib/cities";
import {formatPanchangTime,getPanchang,formatWindow} from "@/lib/panchang";
import {regional} from "@/lib/regional";
import {todayInIndia} from "@/lib/dates";
import {getRegionalCalendarProfile} from "@/lib/regional-calendar";
import {getLunarMonthConventions,getRegionalCalendarConventions} from "@/lib/calendar-conventions";
import {isRegionalIndexable,robotsFor} from "@/lib/seo-policy";
import {isRegionalLanguageSlug,regionalAlternates,regionalIntentLinksForCity} from "@/lib/regional-seo";
import {choghadiyaNativeNames,localizeNakshatra,localizePaksha,localizeTithi,nativeCityName} from "@/lib/regional-i18n";
import {regionalPureLocale} from "@/lib/regional-pure-copy";
import {nativeCalendarName,nativeRashi,nativeRegionalMonth,nativeStateName} from "@/lib/regional-values";
import type {TopicalGraphGroup} from "@/lib/topical-types";

export const revalidate=3600;

type RegionalKey=keyof typeof regional;

export async function generateMetadata({params}:{params:Promise<{language:string;city:string}>}):Promise<Metadata>{
  const p=await params;
  const city=findCityBySlug(p.city);
  if(!city||!isRegionalLanguageSlug(p.language))notFound();
  const copy=regionalPureLocale(p.language);
  const cityName=nativeCityName(p.language,city);
  return {
    title:copy.cityMetaTitle(cityName),
    description:copy.cityMetaDescription(cityName),
    alternates:{canonical:`/regional/${p.language}/${city.slug}`,languages:regionalAlternates(city)},
    robots:robotsFor(isRegionalIndexable(p.language,city))
  };
}

export default async function RegionalPage({params}:{params:Promise<{language:string;city:string}>}){
  const p=await params;
  const city=findCityBySlug(p.city);
  if(!city||!isRegionalLanguageSlug(p.language))notFound();
  const language=p.language;
  const lang=regional[language as RegionalKey];
  const copy=regionalPureLocale(language);
  const cityName=nativeCityName(language,city);
  const stateName=nativeStateName(language,city.state);
  const date=todayInIndia();
  const data=await getPanchang(date,city);
  const lunarConventions=getLunarMonthConventions(date,city,data);
  const regionalConventions=getRegionalCalendarConventions(date,city,data);
  const profile=getRegionalCalendarProfile(language,data,lunarConventions,regionalConventions);
  const t=lang.terms;
  const displayTithi=localizeTithi(language,data.tithi);
  const displayPaksha=localizePaksha(language,data.paksha);
  const displayNakshatra=localizeNakshatra(language,data.nakshatra);
  const displayMonth=nativeRegionalMonth(language,profile);
  const calendarName=nativeCalendarName(language);
  const solarRashi=nativeRashi(language,profile.solarSign);
  const tithiEnd=formatPanchangTime(data.tithiEnd,data.tithiEndDate,data.date);
  const nakshatraEnd=formatPanchangTime(data.nakshatraEnd,data.nakshatraEndDate,data.date);
  const moonrise=formatPanchangTime(data.moonrise,data.moonriseDate,data.date);
  const moonset=formatPanchangTime(data.moonset,data.moonsetDate,data.date);
  const intentLinks=regionalIntentLinksForCity(language,city);
  const year=Number(data.date.slice(0,4));
  const month=data.date.slice(5,7);
  const topical:TopicalGraphGroup[]=[
    {title:copy.regionalContext,links:[
      {href:`/regional/${language}`,label:copy.allCities},
      ...intentLinks.map(item=>({href:item.href,label:item.label}))
    ]},
    {title:copy.calculationContext,links:[
      {href:`/panchang/${city.slug}/${data.date}`,label:`${copy.fullPanchang} · ${cityName}`},
      {href:`/calendar/${city.slug}/${year}/${month}`,label:`${copy.monthlyCalendar} · ${cityName}`},
      {href:`/tools/choghadiya/${city.slug}`,label:`${copy.dayChoghadiya} · ${cityName}`}
    ]}
  ];
  const yearLabel=language==="gujarati"?`${copy.gujaratiSamvat} ${regionalConventions.gujaratiSamvat}`:profile.yearLabel;
  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"WebPage","name":copy.cityPanchangTitle(cityName),"url":`https://panchvani.com/regional/${language}/${city.slug}`,"description":copy.cityMetaDescription(cityName),"inLanguage":copy.hreflang},
    {"@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":"Panchvani","item":"https://panchvani.com/regional"},
      {"@type":"ListItem","position":2,"name":copy.panchangName,"item":`https://panchvani.com/regional/${language}`},
      {"@type":"ListItem","position":3,"name":cityName}
    ]}
  ]};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-regional">
    <div className="breadcrumbs"><Link href="/regional">Panchvani</Link> / <Link href={`/regional/${language}`}>{copy.panchangName}</Link> / {cityName}</div>
    <p className="page-kicker">{copy.nativeLanguage} · {stateName} · {copy.localCalculation}</p>
    <h1 className="page-title">{copy.cityPanchangTitle(cityName)}</h1>
    <p className="page-subtitle">{calendarName} · {displayMonth}{yearLabel?` · ${yearLabel}`:""}</p>

    <div className="data-grid">
      <div className="data-card"><small>{t.tithi}</small><strong>{displayTithi}</strong><small>{displayPaksha} · {tithiEnd} {copy.until}</small></div>
      <div className="data-card"><small>{t.nakshatra}</small><strong>{displayNakshatra}</strong><small>{copy.pada} {data.nakshatraPada} · {nakshatraEnd} {copy.until}</small></div>
      <div className="data-card"><small>{t.yoga}</small><strong>{data.yoga}</strong></div>
      <div className="data-card"><small>{t.karana}</small><strong>{data.karana}</strong></div>
      <div className="data-card"><small>{t.sunrise}</small><strong>{data.sunrise}</strong></div>
      <div className="data-card"><small>{t.sunset}</small><strong>{data.sunset}</strong></div>
      <div className="data-card"><small>{t.moonrise}</small><strong>{moonrise}</strong></div>
      <div className="data-card"><small>{t.moonset}</small><strong>{moonset}</strong></div>
      <div className="data-card"><small>{t.month}</small><strong>{displayMonth}</strong><small>{calendarName}{yearLabel?` · ${yearLabel}`:""}</small></div>
      {profile.solarSign?<div className="data-card"><small>{copy.solarRashi}</small><strong>{solarRashi}</strong></div>:null}
      {language==="gujarati"?<div className="data-card"><small>{copy.gujaratiSamvat}</small><strong>{regionalConventions.gujaratiSamvat}</strong><small>{copy.yearBegins}: {regionalConventions.gujaratiSamvatYearStart}</small></div>:<div className="data-card"><small>{copy.vikramSamvat}</small><strong>{data.vikramSamvat}</strong></div>}
      <div className="data-card"><small>{copy.shakaSamvat}</small><strong>{data.shakaSamvat}</strong></div>
    </div>

    {regionalConventions.solarIngress?<div className="wide-panel"><h2>{copy.solarTransitionTitle}</h2><p className="page-subtitle">{copy.solarTransitionText(nativeRashi(language,regionalConventions.solarIngress.from),nativeRashi(language,regionalConventions.solarIngress.to),regionalConventions.solarIngress.time)}</p></div>:null}

    <div className="wide-panel"><div className="timing-row">
      <div className="timing-chip bad"><small>{t.rahu}</small><strong>{formatWindow(data.rahu)}</strong></div>
      <div className="timing-chip bad"><small>{t.yamaganda}</small><strong>{formatWindow(data.yamaganda)}</strong></div>
      <div className="timing-chip bad"><small>{t.gulika}</small><strong>{formatWindow(data.gulika)}</strong></div>
      <div className="timing-chip good"><small>{t.auspicious}</small><strong>{formatWindow(data.abhijit)}</strong></div>
    </div></div>

    <div className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>{copy.dayChoghadiya}</h2>
      <ChoghadiyaTable day={data.dayChoghadiya} night={data.nightChoghadiya} locale={{dayTitle:copy.dayChoghadiya,nightTitle:copy.nightChoghadiya,daySubtitle:copy.sunriseToSunset,nightSubtitle:copy.sunsetToNextSunrise,goodLabel:copy.goodPeriods,neutralLabel:copy.neutralPeriod,badLabel:copy.difficultPeriods,names:choghadiyaNativeNames[language]}}/>
    </div>

    <div className="seo-copy"><h2>{copy.calendarExplanationTitle}</h2><p>{copy.methodologyText}</p><p>{copy.afterMidnightNote}</p></div>

    <div className="pill-links"><Link href={`/regional/${language}`}>{copy.allCities}</Link><Link href="/regional">{copy.allLanguages}</Link></div>
    <TopicalGraph title={`${copy.regionalContext} · ${cityName}`} groupEyebrow={copy.nativeLanguage} groups={topical}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
