import type {Metadata} from "next";
import Header from "@/components/Header";
import MethodologyNote from "@/components/MethodologyNote";
import {cities} from "@/lib/cities";
import {festivalsForYear} from "@/lib/festivals";
import {festivalCatalog,festivalIndexYears,validateFestivalYear} from "@/lib/festival-expansion";
import {buildFestivalAnnualQualityContext} from "@/lib/festival-parent-quality";
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
    title:`${year} Hindu Festival Calendar — Dates, Rules & Panchang Context`,
    description:`Analytical Hindu festival calendar for ${year}: maintained dates, annual distribution, observance-rule mix and links to festival-specific and city-local Panchang context.`,
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
  const quality=buildFestivalAnnualQualityContext(year,festivals);

  return <main><Header city={cities[0]}/><div className="page-shell internal-visual internal-festival">
    <div className="breadcrumbs"><Link href="/">Home</Link> / <Link href="/festivals">Festivals</Link> / {year}</div>
    <p className="page-kicker">ANNUAL FESTIVAL CALENDAR · {year}</p>
    <h1 className="page-title">{year} Hindu<br/>Festival Calendar</h1>
    <p className="page-subtitle">{quality.directAnswer}</p>

    <div className="data-grid">
      <div className="data-card"><small>Catalog coverage</small><strong>{coverage.present}/{coverage.expected}</strong><small>{coverage.coveragePct}% of the canonical festival set</small></div>
      <div className="data-card"><small>Dataset validation</small><strong>{coverage.issues.length?"Review required":"Valid"}</strong><small>{coverage.issues.length?`${coverage.issues.length} structural issue(s) detected`:"ISO date and year checks passed"}</small></div>
      <div className="data-card"><small>Missing records</small><strong>{coverage.missing.length}</strong><small>{missingNames.length?missingNames.join(" · "):"None"}</small></div>
      {quality.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}
    </div>

    <section className="wide-panel"><div className="seo-copy">
      <h2>{quality.overviewTitle}</h2>
      <p>{quality.overviewBody}</p>
      <h2>{quality.distributionTitle}</h2>
      <p>{quality.distributionBody}</p>
    </div></section>

    <section className="wide-panel"><div className="seo-copy">
      <h2>{quality.chronologyTitle}</h2>
      <p>{quality.chronologyBody}</p>
      <h2>{quality.planningTitle}</h2>
      <p>{quality.planningBody}</p>
    </div></section>

    <div className="wide-panel"><table className="table"><thead><tr><th>Festival</th><th>Date</th><th>Observance anchor</th><th>Regional names</th></tr></thead><tbody>{festivals.map(f=><tr key={f.slug}><td><Link href={`/festivals/${f.slug}/${year}`}>{f.name}</Link></td><td>{f.date}</td><td>{f.pujaRule}</td><td>{f.regionalNames.length?f.regionalNames.join(" · "):"—"}</td></tr>)}</tbody></table></div>

    <MethodologyNote title="Dataset coverage and route scope"><p>This annual calendar is built from Panchvani's curated date registry. It summarizes one validated year and does not replace the cross-year festival directory, festival-specific observance rules or city-local Panchang calculations. Dedicated festival/year pages are exposed only for records present in the maintained dataset.{coverage.missing.length?` ${missingNames.join(" · ")} ${missingNames.length===1?"is":"are"} not fabricated and remain unpublished until a date entry is added and validated.`:" The annual catalog coverage check is complete for this year."}</p></MethodologyNote>
  </div></main>;
}
