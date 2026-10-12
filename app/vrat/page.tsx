import Link from "next/link";
import Header from "@/components/Header";
import {cities} from "@/lib/cities";
import {todayInIndia} from "@/lib/dates";
import {vratDefinitions,vratSlugs} from "@/lib/vrat";
import {currentVratHotset} from "@/lib/hotset-links";

export const metadata={title:"Ekadashi, Purnima & Amavasya Calendar — Lunar Tithi Dates",description:"Yearly Ekadashi, Purnima and Amavasya lunar Tithi calendars with city-specific sunrise observations, transition fingerprints and links to the full Panchang.",alternates:{canonical:"/vrat"}};

export default function VratDirectory(){
  const now=todayInIndia();const current=now.getUTCFullYear();const years=[current,current+1,current+2];const hotset=currentVratHotset(now);
  return <main><Header city={cities[0]}/><div className="page-shell internal-visual internal-calendar">
    <div className="breadcrumbs"><Link href="/">Home</Link> / Vrat & Lunar Dates</div>
    <p className="page-kicker">LUNAR OBSERVANCE DIRECTORY</p><h1 className="page-title">Ekadashi, Purnima<br/>& Amavasya</h1>
    <p className="page-subtitle">Open a lunar observance and year, then select a city to compare local sunrise states, repeated transitions and yearly distribution.</p>
    <div className="data-grid">{vratSlugs.map(slug=>{const item=vratDefinitions[slug];return <div className="data-card" key={slug}><small>{item.hindi}</small><strong>{item.name}</strong><small>{item.short}</small><div className="pill-links">{years.map(year=><Link href={`/vrat/${slug}/${year}`} key={year}>{year}</Link>)}</div></div>;})}</div>
    <section className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>Current-year local Vrat references</h2>
      <p className="page-subtitle">Direct local sunrise-based references for the current year across every actively indexed city.</p>
      <div className="data-grid">{hotset.map(group=>{const item=vratDefinitions[group.vrat];return <div className="data-card" key={group.vrat}><small>{current}</small><strong>{item.name}</strong><div className="pill-links"><Link href={group.parentHref}>Year overview</Link>{group.cityLinks.map(city=><Link href={city.href} key={city.slug}>{city.name}</Link>)}</div></div>})}</div>
    </section>
  </div></main>;
}
