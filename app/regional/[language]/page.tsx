import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import {cities} from "@/lib/cities";
import {nativeCityName} from "@/lib/regional-i18n";
import {regionalPureLocale} from "@/lib/regional-pure-copy";
import {nativeStateName} from "@/lib/regional-values";
import {
  isRegionalLanguageSlug,
  regionalCitiesForLanguage,
  regionalIntentLinksForCity,
} from "@/lib/regional-seo";
import {robotsFor} from "@/lib/seo-policy";

export const revalidate=86400;

export async function generateMetadata({params}:{params:Promise<{language:string}>}):Promise<Metadata>{
  const {language}=await params;
  if(!isRegionalLanguageSlug(language))notFound();
  const copy=regionalPureLocale(language);
  const availableCities=regionalCitiesForLanguage(language);
  return {
    title:copy.hubTitle,
    description:copy.hubDescription,
    alternates:{canonical:`/regional/${language}`},
    robots:robotsFor(availableCities.length>0),
  };
}

export default async function RegionalLanguageHub({params}:{params:Promise<{language:string}>}){
  const {language}=await params;
  if(!isRegionalLanguageSlug(language))notFound();
  const copy=regionalPureLocale(language);
  const availableCities=regionalCitiesForLanguage(language);
  const headerCity=availableCities[0]??cities[0];

  const ld={"@context":"https://schema.org","@type":"CollectionPage","name":copy.hubTitle,"url":`https://panchvani.com/regional/${language}`,"description":copy.hubDescription,"inLanguage":copy.hreflang};

  return <main><Header city={headerCity}/><div className="page-shell internal-visual internal-regional">
    <div className="breadcrumbs"><Link href="/regional">Panchvani</Link> / {copy.nativeLanguage}</div>
    <p className="page-kicker">{copy.nativeLanguage} · {copy.localCalculation}</p>
    <h1 className="page-title">{copy.hubTitle}</h1>
    <p className="page-subtitle">{copy.hubDescription}</p>

    {availableCities.length?<section className="wide-panel">
      <h2 className="page-title" style={{fontSize:34}}>{copy.citiesTitle}</h2>
      <p className="page-subtitle">{copy.citiesIntro}</p>
      <div className="city-directory">{availableCities.map(city=>{
        const intents=regionalIntentLinksForCity(language,city);
        const cityName=nativeCityName(language,city);
        return <Link href={`/regional/${language}/${city.slug}`} key={city.slug}>
          <small>{nativeStateName(language,city.state)}</small><strong>{cityName}</strong><span>{intents.length?intents.map(item=>item.label).join(" · "):copy.panchangName}</span>
        </Link>;
      })}</div>
    </section>:<section className="wide-panel"><div className="seo-copy"><h2>{copy.noCoverageTitle}</h2><p>{copy.noCoverageText}</p></div></section>}

    <div className="seo-copy"><h2>{copy.methodologyTitle}</h2><p>{copy.methodologyText}</p></div>
    <div className="pill-links"><Link href="/regional">{copy.allLanguages}</Link></div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
