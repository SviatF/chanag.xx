import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import LanguageLinks from "@/components/LanguageLinks";
import {cities} from "@/lib/cities";
import {nativeCityName} from "@/lib/regional-i18n";
import {regionalPureLocale} from "@/lib/regional-pure-copy";
import {nativeStateName} from "@/lib/regional-values";
import {buildRegionalHubQuality} from "@/lib/regional-hub-quality";
import {
  isRegionalLanguageSlug,
  regionalCitiesForLanguage,
  regionalIntentLinksForCity,
  regionalLanguageHubAlternates,
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
    alternates:{canonical:`/regional/${language}`,languages:regionalLanguageHubAlternates()},
    robots:robotsFor(availableCities.length>0),
  };
}

export default async function RegionalLanguageHub({params}:{params:Promise<{language:string}>}){
  const {language}=await params;
  if(!isRegionalLanguageSlug(language))notFound();
  const copy=regionalPureLocale(language);
  const availableCities=regionalCitiesForLanguage(language);
  const headerCity=availableCities[0]??cities[0];
  const languageAlternates=regionalLanguageHubAlternates();
  const quality=buildRegionalHubQuality(language,{
    cityNames:availableCities.map(city=>nativeCityName(language,city)),
    stateNames:availableCities.map(city=>nativeStateName(language,city.state)),
    panchangName:copy.panchangName,
  });

  const collection={"@type":"CollectionPage","name":copy.hubTitle,"url":`https://panchvani.com/regional/${language}`,"description":copy.hubDescription,"inLanguage":copy.hreflang};
  const ld=quality
    ?{"@context":"https://schema.org","@graph":[collection,{"@type":"FAQPage","mainEntity":quality.faqs.map(faq=>({"@type":"Question","name":faq.question,"acceptedAnswer":{"@type":"Answer","text":faq.answer}}))}]}
    :{"@context":"https://schema.org",...collection};

  return <main><Header city={headerCity}/><div className="page-shell internal-visual internal-regional">
    <div className="breadcrumbs"><Link href="/regional">Panchvani</Link> / {copy.nativeLanguage}</div>
    <p className="page-kicker">{copy.nativeLanguage} · {copy.localCalculation}</p>
    <h1 className="page-title">{copy.hubTitle}</h1>
    <p className="page-subtitle">{copy.hubDescription}</p>

    {quality?<>
      <div className="data-grid">
        <div className="data-card"><small>{quality.cityCountLabel}</small><strong>{availableCities.length}</strong><small>{quality.cityCountNote}</small></div>
        <div className="data-card"><small>{quality.localBasisLabel}</small><strong>{quality.localBasisValue}</strong><small>{quality.localBasisNote}</small></div>
      </div>
      <section className="wide-panel"><div className="seo-copy"><h2>{quality.overviewTitle}</h2><p>{quality.overviewBody}</p></div></section>
    </>:null}

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

    {quality?<>
      <section className="wide-panel"><div className="seo-copy"><h2>{quality.coverageTitle}</h2><p>{quality.coverageBody}</p></div></section>
      <section className="wide-panel"><div className="seo-copy"><h2>{quality.timingTitle}</h2><p>{quality.timingBody}</p></div></section>
      <section className="wide-panel"><div className="seo-copy"><h2>{quality.usageTitle}</h2><p>{quality.usageBody}</p></div></section>
    </>:null}

    <section className="wide-panel"><div className="seo-copy">
      <h2>{copy.calendarExplanationTitle}</h2>
      <p>{copy.methodologyText}</p>
      <p>{copy.afterMidnightNote}</p>
    </div></section>

    {quality?<section className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>{copy.panchangName}</h2>
      <div className="seo-copy">{quality.faqs.map(faq=><div key={faq.question}><h3>{faq.question}</h3><p>{faq.answer}</p></div>)}</div>
    </section>:null}

    <LanguageLinks languages={languageAlternates}/>
    <div className="pill-links"><Link href="/regional">{copy.allLanguages}</Link></div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
