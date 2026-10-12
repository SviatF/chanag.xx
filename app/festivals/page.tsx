import Link from "next/link";
import Header from "@/components/Header";
import MethodologyNote from "@/components/MethodologyNote";
import {cities} from "@/lib/cities";
import {festivalsForYear} from "@/lib/festivals";
import {getFestivalSemantics} from "@/lib/festival-conventions";
import {festivalCoverageSnapshot,festivalIndexYears} from "@/lib/festival-expansion";
import {todayInIndia} from "@/lib/dates";
import {upcomingFestivalHotset} from "@/lib/hotset-links";

const publicYears=festivalIndexYears();
const range=publicYears.length?(publicYears.length===1?String(publicYears[0]):`${publicYears[0]}–${publicYears[publicYears.length-1]}`):"Festival calendar";
export const metadata={
  title:`Hindu Festivals ${range} — Dates & Panchang`,
  description:"Major Hindu festival dates with city-specific Panchang context, lunar-month convention notes and festival-specific observance references where supported.",
  alternates:{canonical:"/festivals"}
};

export default function FestivalsIndex(){
  const coverage=new Map(festivalCoverageSnapshot().map(item=>[item.year,item]));
  const upcoming=upcomingFestivalHotset(todayInIndia(),2);
  return <main><Header city={cities[0]}/><div className="page-shell internal-visual internal-festival">
    <div className="breadcrumbs"><Link href="/">Home</Link> / Festivals</div>
    <p className="page-kicker">FESTIVAL DIRECTORY</p>
    <h1 className="page-title">Hindu Festivals<br/>{range}</h1>
    <p className="page-subtitle">Browse festival years, then open a festival or city page for local Tithi, sunrise and sunset, lunar-month conventions and observance-rule context.</p>
    {upcoming.length?<section className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>Coming next</h2>
      <p className="page-subtitle">The nearest maintained festival pages and their city-local references.</p>
      <div className="data-grid">{upcoming.map(group=><div className="data-card" key={group.festival.slug}><small>{group.festival.date}</small><strong>{group.festival.name}</strong><div className="pill-links"><Link href={group.parentHref}>Festival overview</Link>{group.cityLinks.map(city=><Link href={city.href} key={city.slug}>{city.name}</Link>)}</div></div>)}</div>
    </section>:null}
    {publicYears.map(year=>{const state=coverage.get(year);return <section className="wide-panel" key={year}>
      <h2 className="page-title" style={{fontSize:34}}>{year} festivals</h2>
      <p className="page-subtitle">{state?.present??0} maintained festival dates.</p>
      <div className="city-directory">
        {festivalsForYear(year).map(f=>{const semantics=getFestivalSemantics(f);return <Link href={`/festivals/${f.slug}/${year}`} key={f.slug}>
          <small>{f.date}</small><strong>{f.name}</strong><span>{semantics.displayShort}</span>
        </Link>})}
      </div>
      <div className="pill-links"><Link href={`/festivals-calendar/${year}`}>View full {year} festival calendar →</Link></div>
    </section>})}
    {!publicYears.length?<div className="seo-copy"><p>Festival dates are being reviewed before a full annual directory is shown.</p></div>:null}
    <MethodologyNote title="Festival directory coverage"><p>Panchvani publishes a year in this directory after its maintained festival list passes the annual coverage checks. Festival/year pages are generated only from validated date records already present in the registry.</p></MethodologyNote>
  </div></main>;
}
