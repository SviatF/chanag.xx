import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import {cityBySlug} from "@/lib/cities";
import {muhuratRules} from "@/lib/muhurat";
import {buildMuhuratYearQualityContent} from "@/lib/muhurat-content-engine";
import {buildMuhuratYearContext} from "@/lib/muhurat-year-context";
import {buildMuhuratYearHighSimilarityContext} from "@/lib/muhurat-year-high-similarity-context";
import {isYearlyMuhuratIndexable,robotsFor,yearlyIndexYears} from "@/lib/seo-policy";
import {parseRouteYear} from "@/lib/route-validation";
import {muhuratYearSsgPriority} from "@/lib/static-seo-routes";
import {buildYearlyMuhuratSummary,hinduCalendarYearPath,muhuratYearPath} from "@/lib/yearly-expansion";

export const dynamicParams=true;
export const revalidate=86400;
export function generateStaticParams(){return muhuratYearSsgPriority;}

export async function generateMetadata({params}:{params:Promise<{event:string;year:string}>}):Promise<Metadata>{
  const p=await params;const rule=muhuratRules[p.event];const year=parseRouteYear(p.year);if(!rule||!year)notFound();
  return {title:`${rule.title} ${year} — Candidate Months & Planning Dates`,description:`Yearly ${rule.title.toLowerCase()} analysis for ${year}: active months, candidate density, score spread and Mumbai-baseline clean-time patterns.`,alternates:{canonical:muhuratYearPath(p.event,year)},robots:robotsFor(isYearlyMuhuratIndexable(p.event,year))};
}

export default async function YearlyMuhurat({params}:{params:Promise<{event:string;year:string}>}){
  const p=await params;const rule=muhuratRules[p.event];const year=parseRouteYear(p.year);if(!rule||!year)notFound();
  const city=cityBySlug("mumbai");const activeYears=yearlyIndexYears();
  const summary=await buildYearlyMuhuratSummary(p.event,year,city);
  const quality=buildMuhuratYearQualityContent(p.event,year,city,summary);
  const yearContext=buildMuhuratYearContext(summary);
  const highSimilarityContext=buildMuhuratYearHighSimilarityContext(summary);
  const ld={"@context":"https://schema.org","@type":"CollectionPage","name":`${rule.title} ${year} analysis`,"url":`https://panchvani.com${muhuratYearPath(p.event,year)}`,"description":quality.directAnswer};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-muhurat">
    <div className="breadcrumbs"><Link href="/muhurat">Muhurat</Link> / {rule.title} / {year}</div>
    <p className="page-kicker">YEARLY MUHURAT ANALYSIS · MUMBAI BASELINE</p>
    <h1 className="page-title">{rule.title}<br/>{year}</h1>
    <p className="page-subtitle">{quality.directAnswer}</p>

    <div className="data-grid">{quality.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}</div>
    <section className="wide-panel"><div className="seo-copy"><h2>{quality.fingerprintTitle}</h2><p>{quality.fingerprintBody}</p></div></section>

    <section className="wide-panel">
      <div className="seo-copy"><small>ANNUAL YEAR LENS · MUMBAI BASELINE</small><h2>{yearContext.title}</h2><p>{yearContext.body}</p></div>
      <div className="data-grid">{yearContext.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}</div>
    </section>

    <section className="wide-panel"><div className="seo-copy"><h2>{yearContext.calendarTitle}</h2><p>{yearContext.calendarBody}</p><h2>{yearContext.densityTitle}</h2><p>{yearContext.densityBody}</p></div></section>
    <section className="wide-panel"><div className="seo-copy"><h2>{yearContext.timingTitle}</h2><p>{yearContext.timingBody}</p><h2>{yearContext.rankingTitle}</h2><p>{yearContext.rankingBody}</p></div></section>

    <section className="wide-panel">
      <div className="seo-copy"><small>ANNUAL COMPARISON FINGERPRINT</small><h2>{highSimilarityContext.title}</h2><p>{highSimilarityContext.eventBody}</p><h2>{highSimilarityContext.sequenceTitle}</h2><p>{highSimilarityContext.sequenceBody}</p></div>
      <div className="data-grid">{highSimilarityContext.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}</div>
    </section>
    <section className="wide-panel"><div className="seo-copy"><h2>{highSimilarityContext.shortlistTitle}</h2><p>{highSimilarityContext.shortlistBody}</p></div></section>

    <section className="wide-panel"><div className="seo-copy"><h2>{quality.seasonalTitle}</h2><p>{quality.seasonalBody}</p></div></section>
    <section className="wide-panel"><div className="seo-copy"><h2>{quality.rankingTitle}</h2><p>{quality.rankingBody}</p></div></section>
    <section className="wide-panel"><div className="seo-copy"><h2>{quality.ruleTitle}</h2><p>{quality.ruleBody}</p></div></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Month-by-month {year}</h2><div className="city-directory">{summary.months.map(item=><Link href={`/muhurat/${p.event}/${year}/${item.slug}`} key={item.slug}><small>{item.qualified} candidates · avg {item.averageScore}/100</small><strong>{item.name}</strong><span>{item.top?`Top ${item.top.date} · ${item.top.planning.score}/100 · ${item.top.planning.longestWindowMinutes} min longest block`:"No configured-profile candidate"}</span></Link>)}</div></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Top planning fits of {year}</h2>{summary.topRows.length?<div className="wide-panel"><table className="table"><thead><tr><th>Rank / Date</th><th>Score</th><th>Lunar match</th><th>Clean time</th></tr></thead><tbody>{summary.topRows.map((row,index)=><tr key={row.date}><td>#{index+1} · <Link href={`/panchang/${city.slug}/${row.date}`}>{row.date}</Link></td><td><strong>{row.planning.score}/100 · {row.planning.grade}</strong></td><td>{row.reasons.join(" · ")}</td><td>{row.planning.longestWindowMinutes} min longest · {row.planning.totalCleanMinutes} min total</td></tr>)}</tbody></table></div>:<p className="page-subtitle">No dates matched the configured Tithi + Nakshatra profile in {year}.</p>}</section>

    <div className="pill-links">{activeYears.includes(year-1)?<Link href={muhuratYearPath(p.event,year-1)}>← {year-1}</Link>:null}<Link href={hinduCalendarYearPath(year)}>Hindu Calendar {year}</Link>{activeYears.includes(year+1)?<Link href={muhuratYearPath(p.event,year+1)}>{year+1} →</Link>:null}</div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
