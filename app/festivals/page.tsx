import Link from "next/link";
import Header from "@/components/Header";
import {cities} from "@/lib/cities";
import {festivalsForYear} from "@/lib/festivals";
import {getFestivalSemantics} from "@/lib/festival-conventions";
import {festivalCoverageSnapshot,festivalIndexYears} from "@/lib/festival-expansion";

const publicYears=festivalIndexYears();
const range=publicYears.length?(publicYears.length===1?String(publicYears[0]):`${publicYears[0]}–${publicYears[publicYears.length-1]}`):"Festival calendar";
export const metadata={
  title:`Hindu Festivals ${range} — Dates & Panchang`,
  description:"Major Hindu festival dates with city-specific Panchang context, lunar-month convention notes and festival-specific observance references where supported.",
  alternates:{canonical:"/festivals"}
};

export default function FestivalsIndex(){
  const coverage=new Map(festivalCoverageSnapshot().map(item=>[item.year,item]));
  return <main><Header city={cities[0]}/><div className="page-shell internal-visual internal-festival">
    <div className="breadcrumbs"><Link href="/">Home</Link> / Festivals</div>
    <p className="page-kicker">FESTIVAL DIRECTORY</p>
    <h1 className="page-title">Hindu Festivals<br/>{range}</h1>
    <p className="page-subtitle">Browse maintained festival years, then open a festival or city page for local Tithi, sunrise and sunset, lunar-month conventions and observance-rule context. Panchvani only shows a year here after the maintained festival list for that year is complete.</p>
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
  </div></main>;
}
