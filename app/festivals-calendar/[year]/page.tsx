import type {Metadata} from "next";
import Header from "@/components/Header";
import {cities} from "@/lib/cities";
import {festivalsForYear} from "@/lib/festivals";
import {festivalCatalog,festivalIndexYears,validateFestivalYear} from "@/lib/festival-expansion";
import {parseRouteYear} from "@/lib/route-validation";
import {robotsFor} from "@/lib/seo-policy";
import Link from "next/link";
import {notFound} from "next/navigation";

export const revalidate=86400;

export async function generateMetadata({params}:{params:Promise<{year:string}>}):Promise<Metadata>{
  const p=await params;
  const year=parseRouteYear(p.year);
  const festivals=year?festivalsForYear(year):[];
  if(!year||festivals.length===0)notFound();
  return {
    title:`Hindu Festivals ${year} — Dates & Panchang Calendar`,
    description:`Curated Hindu festival dates for ${year} with links to dedicated festival pages and local Panchang timing.`,
    alternates:{canonical:`/festivals-calendar/${year}`},
    robots:robotsFor(festivalIndexYears().includes(year))
  };
}

export default async function Page({params}:{params:Promise<{year:string}>}){
  const p=await params;
  const year=parseRouteYear(p.year);
  const festivals=year?festivalsForYear(year):[];
  if(!year||festivals.length===0)notFound();
  const coverage=validateFestivalYear(year);
  const missingNames=coverage.missing.map(slug=>festivalCatalog.find(item=>item.slug===slug)?.name??slug);

  return <main><Header city={cities[0]}/><div className="page-shell internal-visual internal-festival">
    <div className="breadcrumbs"><Link href="/">Home</Link> / <Link href="/festivals">Festivals</Link> / {year}</div>
    <p className="page-kicker">PILLAR CALENDAR</p>
    <h1 className="page-title">Hindu Festivals<br/>{year}</h1>
    <p className="page-subtitle">Annual festival hub backed by the current curated date registry. Only festival/year records actually present in the dataset are exposed as dedicated pages.</p>
    <div className="data-grid">
      <div className="data-card"><small>Catalog coverage</small><strong>{coverage.present}/{coverage.expected}</strong><small>{coverage.coveragePct}% of the canonical festival set</small></div>
      <div className="data-card"><small>Dataset validation</small><strong>{coverage.issues.length?"Review required":"Valid"}</strong><small>{coverage.issues.length?`${coverage.issues.length} structural issue(s) detected`:"ISO date and year checks passed"}</small></div>
      <div className="data-card"><small>Missing records</small><strong>{coverage.missing.length}</strong><small>{missingNames.length?missingNames.join(" · "):"None"}</small></div>
    </div>
    <div className="wide-panel"><table className="table"><thead><tr><th>Festival</th><th>Date</th></tr></thead><tbody>{festivals.map(f=><tr key={f.slug}><td><Link href={`/festivals/${f.slug}/${year}`}>{f.name}</Link></td><td>{f.date}</td></tr>)}</tbody></table></div>
    {coverage.missing.length?<div className="seo-copy"><h2>Dataset coverage note</h2><p>This year does not yet contain every festival in Panchvani’s canonical festival catalog. Missing records are intentionally not fabricated and do not receive indexable URLs until their date entry is added and validated.</p></div>:null}
  </div></main>;
}
