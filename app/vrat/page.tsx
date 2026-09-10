import Link from "next/link";
import Header from "@/components/Header";
import {cities} from "@/lib/cities";
import {todayInIndia} from "@/lib/dates";
import {vratDefinitions,vratSlugs} from "@/lib/vrat";

export const metadata={
  title:"Ekadashi, Purnima & Amavasya Calendar — Lunar Tithi Dates",
  description:"Yearly Ekadashi, Purnima and Amavasya lunar Tithi calendars with city-specific sunrise observations and links to the full Panchang."
};

export default function VratDirectory(){
  const current=todayInIndia().getUTCFullYear();
  const years=[current,current+1,current+2];
  return <main><Header city={cities[0]}/><div className="page-shell internal-visual internal-calendar">
    <div className="breadcrumbs"><Link href="/">Home</Link> / Vrat & Lunar Dates</div>
    <p className="page-kicker">LUNAR OBSERVANCE DIRECTORY</p>
    <h1 className="page-title">Ekadashi, Purnima<br/>& Amavasya</h1>
    <p className="page-subtitle">Sunrise-based lunar Tithi references calculated with the Panchvani astronomy engine. Open a year, then select a city for local sunrise-sensitive observations.</p>

    <div className="data-grid">
      {vratSlugs.map(slug=>{const item=vratDefinitions[slug];return <div className="data-card" key={slug}><small>{item.hindi}</small><strong>{item.name}</strong><small>{item.short}</small><div className="pill-links">{years.map(year=><Link href={`/vrat/${slug}/${year}`} key={year}>{year}</Link>)}</div></div>;})}
    </div>

    <div className="seo-copy"><h2>What these calendars mean</h2><p>Panchvani identifies the lunar Tithi active at local sunrise. That makes the city relevant: sunrise occurs at a different instant in Mumbai, Delhi, Chennai or Kolkata, and a Tithi transition close to sunrise can change the local date shown.</p><p>These pages are Panchang references. Ritual fasting, Parana, festival and sampradaya-specific observance rules may apply additional conditions beyond sunrise Tithi, especially for Ekadashi.</p></div>
  </div></main>;
}