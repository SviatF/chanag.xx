import Link from "next/link";
import Header from "@/components/Header";
import MethodologyNote from "@/components/MethodologyNote";
import {cities} from "@/lib/cities";
import {todayInIndia} from "@/lib/dates";
import {vratDefinitions,vratSlugs} from "@/lib/vrat";

export const metadata={
  title:"Ekadashi, Purnima & Amavasya Calendar — Lunar Tithi Dates",
  description:"Yearly Ekadashi, Purnima and Amavasya lunar Tithi calendars with city-specific sunrise observations and links to the full Panchang.",
  alternates:{canonical:"/vrat"}
};

export default function VratDirectory(){
  const current=todayInIndia().getUTCFullYear();
  const years=[current,current+1,current+2];
  return <main><Header city={cities[0]}/><div className="page-shell internal-visual internal-calendar">
    <div className="breadcrumbs"><Link href="/">Home</Link> / Vrat & Lunar Dates</div>
    <p className="page-kicker">LUNAR OBSERVANCE DIRECTORY</p>
    <h1 className="page-title">Ekadashi, Purnima<br/>& Amavasya</h1>
    <p className="page-subtitle">Open a lunar observance and year, then select a city for local Tithi dates.</p>

    <div className="data-grid">
      {vratSlugs.map(slug=>{const item=vratDefinitions[slug];return <div className="data-card" key={slug}><small>{item.hindi}</small><strong>{item.name}</strong><small>{item.short}</small><div className="pill-links">{years.map(year=><Link href={`/vrat/${slug}/${year}`} key={year}>{year}</Link>)}</div></div>;})}
    </div>

    <MethodologyNote title="How these dates are calculated"><p>Panchvani identifies the lunar Tithi active at local sunrise, so a transition close to sunrise can change the date shown by city. Ritual fasting, Parana, festival and sampradaya-specific observance rules can add conditions beyond the sunrise Tithi reference.</p></MethodologyNote>
  </div></main>;
}