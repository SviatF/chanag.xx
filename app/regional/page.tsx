import Header from "@/components/Header";
import {cities} from "@/lib/cities";
import Link from "next/link";
import {regionalLanguageSeo,regionalLanguageSlugs,regionalCitiesForLanguage,regionalIntentLinksForCity} from "@/lib/regional-seo";

export const metadata={
  title:"Regional Panchang — Bengali, Tamil, Malayalam, Gujarati & Marathi",
  description:"Regional Panchang directory with language-specific calendar terminology, city-local calculations and demand-backed timing pages."
};

export default function Regional(){
  return <main><Header city={cities[0]}/><div className="page-shell internal-visual internal-regional">
    <div className="breadcrumbs"><Link href="/">Home</Link> / Regional</div>
    <p className="page-kicker">REGIONAL SEARCH DIRECTORY</p>
    <h1 className="page-title">Panchang in your language.</h1>
    <p className="page-subtitle">Regional terminology and calendar systems are treated as a first-class product layer. Choose a language first; Panchvani then exposes only cities relevant under the current language and SEO policy.</p>
    <div className="regional-list">{regionalLanguageSlugs.map(language=>{
      const config=regionalLanguageSeo[language];
      const cityList=regionalCitiesForLanguage(language);
      const intentCount=cityList.reduce((sum,city)=>sum+regionalIntentLinksForCity(language,city).length,0);
      return <Link href={`/regional/${language}`} key={language}>
        <strong>{config.native}</strong><small>{config.label} · {cityList.length} cities · {intentCount} active intent pages</small>
      </Link>;
    })}</div>
    <div className="seo-copy"><h2>How regional expansion works</h2><p>Language hubs are curated around actual regional calendar conventions and location-sensitive Panchang data. More specific regional timing URLs are not mass-indexed: they are activated only for relevant cities after demand review.</p></div>
  </div></main>;
}
