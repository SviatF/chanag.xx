import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import {cities} from "@/lib/cities";
import {regional} from "@/lib/regional";
import {
  isRegionalLanguageSlug,
  regionalCitiesForLanguage,
  regionalIntentLinksForCity,
  regionalLanguageSeo,
} from "@/lib/regional-seo";

export const revalidate=86400;

type RegionalKey=keyof typeof regional;

export async function generateMetadata({params}:{params:Promise<{language:string}>}):Promise<Metadata>{
  const {language}=await params;
  if(!isRegionalLanguageSlug(language))notFound();
  const config=regionalLanguageSeo[language];
  return {
    title:`${config.label} — Local Panchang by City`,
    description:`${config.label} directory with city-local Panchang, regional calendar terminology and approved timing-intent pages.`,
    alternates:{canonical:`/regional/${language}`},
    robots:{index:true,follow:true,googleBot:{index:true,follow:true,"max-image-preview":"large" as const,"max-snippet":-1,"max-video-preview":-1}},
  };
}

export default async function RegionalLanguageHub({params}:{params:Promise<{language:string}>}){
  const {language}=await params;
  if(!isRegionalLanguageSlug(language))notFound();
  const config=regionalLanguageSeo[language];
  const lang=regional[language as RegionalKey];
  const availableCities=regionalCitiesForLanguage(language);
  const intentCount=availableCities.reduce((total,city)=>total+regionalIntentLinksForCity(language,city).length,0);
  const sampleSignals=config.panchangSignals.slice(0,3);

  return <main><Header city={cities[0]}/><div className="page-shell internal-visual internal-regional">
    <div className="breadcrumbs"><Link href="/regional">Regional</Link> / {config.label}</div>
    <p className="page-kicker">{config.native} · REGIONAL SEARCH HUB</p>
    <h1 className="page-title">{config.label}<br/>by city</h1>
    <p className="page-subtitle">Choose an approved city to open a location-sensitive Panchang with regional calendar naming, local sunrise/sunset and timing data. Intent-specific pages are activated only where search demand and language relevance justify them.</p>

    <div className="data-grid">
      <div className="data-card"><small>Regional language</small><strong>{config.native}</strong><small>{config.hreflang}</small></div>
      <div className="data-card"><small>Indexable cities</small><strong>{availableCities.length}</strong><small>Only active cities with {config.code} relevance</small></div>
      <div className="data-card"><small>Active intent pages</small><strong>{intentCount}</strong><small>Demand-gated Rahu Kalam / Choghadiya</small></div>
      <div className="data-card"><small>Primary search terms</small><strong>{sampleSignals[0]}</strong><small>{sampleSignals.slice(1).join(" · ")}</small></div>
    </div>

    <section className="wide-panel">
      <h2 className="page-title" style={{fontSize:34}}>{config.label} cities</h2>
      <p className="page-subtitle">These city pages are eligible under the current SEO city policy and contain the regional calendar layer for {lang.native}.</p>
      <div className="city-directory">{availableCities.map(city=>{
        const intents=regionalIntentLinksForCity(language,city);
        return <Link href={`/regional/${language}/${city.slug}`} key={city.slug}>
          <small>{city.state}</small><strong>{city.name}</strong><span>{intents.length?`${intents.length} active regional intent ${intents.length===1?"page":"pages"}`:"Regional Panchang hub"}</span>
        </Link>;
      })}</div>
    </section>

    <div className="seo-copy"><h2>Regional depth, not translated duplication</h2><p>Panchvani keeps the selected city’s astronomical calculation while applying the appropriate regional calendar system, month naming and conventional terminology. Separate timing-intent URLs are not opened across every city automatically: they enter the index only through the regional demand policy.</p></div>
    <div className="pill-links"><Link href="/regional">All regional languages</Link></div>
  </div></main>;
}
