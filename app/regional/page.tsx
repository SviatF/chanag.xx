import Header from "@/components/Header";
import LanguageLinks from "@/components/LanguageLinks";
import {cities} from "@/lib/cities";
import Link from "next/link";
import {regionalLanguageSeo,regionalLanguageSlugs,regionalCitiesForLanguage,regionalLanguageHubAlternates} from "@/lib/regional-seo";

export const metadata={
  title:"Panchang in Indian Languages — Bengali, Tamil, Malayalam, Gujarati & Marathi",
  description:"Choose Bengali, Tamil, Malayalam, Gujarati or Marathi Panchang pages with local city calculations and regional calendar conventions.",
  alternates:{canonical:"/regional",languages:regionalLanguageHubAlternates()}
};

export default function Regional(){
  const languageAlternates=regionalLanguageHubAlternates();
  return <main><Header city={cities[0]}/><div className="page-shell internal-visual internal-regional">
    <div className="breadcrumbs"><Link href="/">Home</Link> / Regional Panchang</div>
    <p className="page-kicker">INDIAN LANGUAGE PANCHANG</p>
    <h1 className="page-title">Panchang in your language.</h1>
    <p className="page-subtitle">Choose a language to see location-sensitive Panchang values with the calendar terminology and month system used for that regional tradition.</p>
    <LanguageLinks languages={languageAlternates} title="Choose a language"/>
    <div className="regional-list">{regionalLanguageSlugs.map(language=>{
      const config=regionalLanguageSeo[language];
      const cityList=regionalCitiesForLanguage(language);
      return cityList.length?<Link href={`/regional/${language}`} key={language}>
        <strong>{config.native}</strong><small>{config.label} · {cityList.length} {cityList.length===1?"city":"cities"}</small>
      </Link>:<div key={language}>
        <strong>{config.native}</strong><small>{config.label} · city coverage in preparation</small>
      </div>;
    })}</div>
    <div className="seo-copy"><h2>One calculation, regional calendar context</h2><p>Panchvani calculates local astronomical values from the selected city, then presents them with the appropriate regional calendar conventions and terminology. Regional pages are added only where a relevant city and language context are available.</p></div>
  </div></main>;
}
