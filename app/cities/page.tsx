import Header from "@/components/Header";
import CityCommand from "@/components/CityCommand";
import {coreCities,supportedCities} from "@/lib/cities";
import {todayInIndia} from "@/lib/dates";
import {activeIndexCitySlugs} from "@/lib/seo-policy";
import {cityYearAuthorityLinks} from "@/lib/authority-city-links";
import {currentCityHotset} from "@/lib/hotset-links";
import Link from "next/link";

export const metadata={
  title:"Panchang by City — Local Hindu Panchang Across India",
  description:"Choose an Indian city for location-specific Panchang, sunrise, sunset, Rahu Kalam, Yamaganda, Gulika and daily lunar timings.",
  alternates:{canonical:"/cities"}
};

export default function Cities(){
  const active=new Set(activeIndexCitySlugs());
  const now=todayInIndia();
  const today=now.toISOString().slice(0,10);
  const year=now.getUTCFullYear();
  const cityYearLinks=cityYearAuthorityLinks(year);
  const hotset=currentCityHotset(now);
  const featured=supportedCities.filter(city=>active.has(city.slug)).sort((a,b)=>a.state.localeCompare(b.state)||a.name.localeCompare(b.name));
  return <main><Header city={coreCities[0]}/><div className="page-shell internal-visual internal-cities">
    <p className="page-kicker">LOCAL PANCHANG · INDIA</p>
    <h1 className="page-title">Panchang for your city</h1>
    <p className="page-subtitle">Local Panchang timings depend on sunrise and sunset, so location matters. Search any supported Indian city or open one of the commonly used city pages below.</p>

    <section className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>Find any supported city</h2>
      <p className="page-subtitle">Panchvani supports {supportedCities.length} city locations. Use the city selector to search by city or state without loading hundreds of links onto this page.</p>
      <div className="pill-links"><CityCommand city={coreCities[0]}/></div>
    </section>

    <section className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>Popular local Panchang pages</h2>
      <div className="city-directory">{featured.map(city=><Link href={`/panchang/${city.slug}/${today}`} key={city.slug}><strong>{city.name}</strong><small>{city.state}</small><span>Today’s local Panchang</span></Link>)}</div>
    </section>

    <section className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>Current month calendars</h2>
      <p className="page-subtitle">Direct links to the current local calendar month for every actively indexed city.</p>
      <div className="pill-links">{hotset.map(item=><Link href={item.monthHref} key={item.slug}>{item.name}</Link>)}</div>
    </section>

    <section className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>City calendar hubs</h2>
      <p className="page-subtitle">Open a yearly city hub to reach all twelve monthly calendars, maintained festivals, Vrat references and Muhurat planning pages without depending on sitemap discovery alone.</p>
      <div className="city-directory">{cityYearLinks.map(item=><Link href={item.href} key={item.slug}><small>{item.state}</small><strong>{item.name}</strong><span>{year} · 12 months · festivals · Vrat · Muhurat</span></Link>)}</div>
    </section>

    <div className="seo-copy"><h2>Why city selection matters</h2><p>Sunrise, sunset, Rahu Kalam, Yamaganda, Gulika, Choghadiya and several daily Panchang references are location-sensitive. Select the city closest to where the timing will be used rather than relying on a national clock-time table.</p></div>
  </div></main>;
}
