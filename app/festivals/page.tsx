import Link from "next/link";
import Header from "@/components/Header";
import {cities} from "@/lib/cities";
import {festivalsForYear} from "@/lib/festivals";

export const metadata={
  title:"Hindu Festivals 2026–2027 — Dates, Panchang & Puja Timing",
  description:"Major Hindu festival dates for 2026 and 2027 with city-specific Panchang timing, regional names and local Puja references."
};

export default function FestivalsIndex(){
  const years=[2026,2027];
  return <main><Header city={cities[0]}/><div className="page-shell internal-visual internal-festival">
    <div className="breadcrumbs"><Link href="/">Home</Link> / Festivals</div>
    <p className="page-kicker">FESTIVAL DIRECTORY</p>
    <h1 className="page-title">Hindu Festivals<br/>2026–2027</h1>
    <p className="page-subtitle">Start with the exact date, then open the city page for local Panchang factors, sunrise/sunset and a practical Puja timing reference.</p>
    {years.map(year=><section className="wide-panel" key={year}>
      <h2 className="page-title" style={{fontSize:34}}>{year} festivals</h2>
      <div className="city-directory">
        {festivalsForYear(year).map(f=><Link href={`/festivals/${f.slug}/${year}`} key={f.slug}>
          <small>{f.date}</small><strong>{f.name}</strong><span>{f.short}</span>
        </Link>)}
      </div>
      <div className="pill-links"><Link href={`/festivals-calendar/${year}`}>View full {year} festival calendar →</Link></div>
    </section>)}
  </div></main>;
}
