import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import {cityBySlug} from "@/lib/cities";
import {muhuratRules} from "@/lib/muhurat";
import {muhuratExcludedFactors,muhuratScreeningStatement} from "@/lib/religious-integrity";
import {isYearlyMuhuratIndexable,robotsFor,yearlyIndexYears} from "@/lib/seo-policy";
import {parseRouteYear} from "@/lib/route-validation";
import {buildYearlyMuhuratSummary,hinduCalendarYearPath,muhuratYearPath} from "@/lib/yearly-expansion";

export const revalidate=86400;

export async function generateMetadata({params}:{params:Promise<{event:string;year:string}>}):Promise<Metadata>{
  const p=await params;const rule=muhuratRules[p.event];const year=parseRouteYear(p.year);if(!rule||!year)notFound();
  return {title:`${rule.title} ${year} — Candidate Months & Planning Dates`,description:`Yearly ${rule.title.toLowerCase()} screening hub for ${year}, aggregating Tithi + Nakshatra candidate dates and practical Planning Scores from the Mumbai baseline.`,alternates:{canonical:muhuratYearPath(p.event,year)},robots:robotsFor(isYearlyMuhuratIndexable(p.event,year))};
}

export default async function YearlyMuhurat({params}:{params:Promise<{event:string;year:string}>}){
  const p=await params;const rule=muhuratRules[p.event];const year=parseRouteYear(p.year);if(!rule||!year)notFound();
  const city=cityBySlug("mumbai");
  const activeYears=yearlyIndexYears();
  const summary=await buildYearlyMuhuratSummary(p.event,year,city);
  const top=summary.topRows[0];
  const ld={"@context":"https://schema.org","@type":"CollectionPage","name":`${rule.title} ${year} screening summary`,"url":`https://panchvani.com${muhuratYearPath(p.event,year)}`,"description":muhuratScreeningStatement};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-muhurat">
    <div className="breadcrumbs"><Link href="/muhurat">Muhurat</Link> / {rule.title} / {year}</div>
    <p className="page-kicker">YEARLY MUHURAT PLANNING SCREEN · INDIA BASELINE</p>
    <h1 className="page-title">{rule.title}<br/>{year}</h1>
    <p className="page-subtitle">{muhuratScreeningStatement} This annual view aggregates all 12 monthly screens using Mumbai as the baseline location.</p>

    <section className="wide-panel"><div className="data-grid">
      <div className="data-card"><small>Screened candidates</small><strong>{summary.totalQualified}</strong><small>Across 12 months</small></div>
      <div className="data-card"><small>Average Planning Score</small><strong>{summary.averageScore}/100</strong><small>Practical metric only</small></div>
      <div className="data-card"><small>Excellent planning band</small><strong>{summary.excellentCount}</strong><small>Score 85+</small></div>
      <div className="data-card"><small>Strong planning band</small><strong>{summary.strongCount}</strong><small>Score 70–84</small></div>
      <div className="data-card"><small>Strongest planning month</small><strong>{summary.strongestMonth?.name??"—"}</strong><small>{summary.strongestMonth?.top?`Top ${summary.strongestMonth.top.planning.score}/100`:"No screened candidate"}</small></div>
      <div className="data-card"><small>Top practical date</small><strong>{top?.date??"—"}</strong><small>{top?`${top.planning.grade} · ${top.planning.score}/100`:"No screened candidate"}</small></div>
    </div></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Month-by-month {year}</h2><div className="city-directory">{summary.months.map(item=><Link href={`/muhurat/${p.event}/${year}/${item.slug}`} key={item.slug}><small>{item.qualified} screened · avg {item.averageScore}/100</small><strong>{item.name}</strong><span>{item.top?`Top practical fit ${item.top.date} · ${item.top.planning.score}/100 ${item.top.planning.grade}`:"No current-screen candidate"}</span></Link>)}</div></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Top planning fits of {year}</h2>{summary.topRows.length?<div className="wide-panel"><table className="table"><thead><tr><th>Rank / Date</th><th>Score</th><th>Screening match</th><th>Clean time</th></tr></thead><tbody>{summary.topRows.map((row,index)=><tr key={row.date}><td>#{index+1} · <Link href={`/panchang/${city.slug}/${row.date}`}>{row.date}</Link></td><td><strong>{row.planning.score}/100 · {row.planning.grade}</strong></td><td>{row.reasons.join(" · ")}</td><td>{row.planning.longestWindowMinutes} min longest · {row.planning.totalCleanMinutes} min total</td></tr>)}</tbody></table></div>:<p className="page-subtitle">No dates matched the current Tithi + Nakshatra screening profile in {year}.</p>}</section>

    <section className="wide-panel"><div className="seo-copy"><small>LIMITS OF THE YEARLY SCREEN</small><h2>What still requires full Panchang Shuddhi or personal review</h2><ul>{muhuratExcludedFactors.map(item=><li key={item}>{item}</li>)}</ul></div></section>

    <div className="pill-links">{activeYears.includes(year-1)?<Link href={muhuratYearPath(p.event,year-1)}>← {year-1}</Link>:null}<Link href={hinduCalendarYearPath(year)}>Hindu Calendar {year}</Link>{activeYears.includes(year+1)?<Link href={muhuratYearPath(p.event,year+1)}>{year+1} →</Link>:null}</div>
    <div className="seo-copy"><h2>How to use the annual ranking</h2><p>The annual page is a planning overview, not a religious certification layer. Open a month to inspect screened dates and then a city page for location-specific clean-time windows.</p></div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
