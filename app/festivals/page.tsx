import Link from "next/link";
import Header from "@/components/Header";
import {cities} from "@/lib/cities";
import {festivalsForYear} from "@/lib/festivals";
import {festivalCoverageSnapshot,festivalDatasetYears} from "@/lib/festival-expansion";

const range=festivalDatasetYears.length?`${festivalDatasetYears[0]}–${festivalDatasetYears[festivalDatasetYears.length-1]}`:"Festival calendar";
export const metadata={
  title:`Hindu Festivals ${range} — Dates, Panchang & Puja Timing`,
  description:"Major Hindu festival dates with city-specific Panchang timing, regional names and local Puja references. Only years present in the curated festival dataset are published."
};

export default function FestivalsIndex(){
  const coverage=new Map(festivalCoverageSnapshot().map(item=>[item.year,item]));
  return <main><Header city={cities[0]}/><div className="page-shell internal-visual internal-festival">
    <div className="breadcrumbs"><Link href="/">Home</Link> / Festivals</div>
    <p className="page-kicker">FESTIVAL DIRECTORY</p>
    <h1 className="page-title">Hindu Festivals<br/>{range}</h1>
    <p className="page-subtitle">Start with a curated festival date, then open the city page for local Panchang factors, sunrise/sunset and a practical Puja timing reference. New years are published only after date records are added and validated.</p>
    {festivalDatasetYears.map(year=>{const state=coverage.get(year);return <section className="wide-panel" key={year}>
      <h2 className="page-title" style={{fontSize:34}}>{year} festivals</h2>
      <p className="page-subtitle">Dataset coverage: {state?.present??0}/{state?.expected??0} catalog festivals · {state?.coveragePct??0}%.</p>
      <div className="city-directory">
        {festivalsForYear(year).map(f=><Link href={`/festivals/${f.slug}/${year}`} key={f.slug}>
          <small>{f.date}</small><strong>{f.name}</strong><span>{f.short}</span>
        </Link>)}
      </div>
      <div className="pill-links"><Link href={`/festivals-calendar/${year}`}>View full {year} festival calendar →</Link></div>
    </section>})}
  </div></main>;
}
