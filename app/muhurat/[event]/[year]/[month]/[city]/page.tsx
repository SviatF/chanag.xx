import type {Metadata} from "next";
import Header from "@/components/Header";
import MethodologyNote from "@/components/MethodologyNote";
import TopicalGraph from "@/components/TopicalGraph";
import Link from "next/link";
import {notFound} from "next/navigation";
import {findCityBySlug} from "@/lib/cities";
import {getMonthlyMuhurat,muhuratRules} from "@/lib/muhurat";
import {buildMuhuratSeoSummary} from "@/lib/muhurat-seo";
import {muhuratBenchmarkSources,muhuratExcludedFactors,muhuratScreeningStatement} from "@/lib/religious-integrity";
import {isYearlyMuhuratIndexable,robotsFor} from "@/lib/seo-policy";
import {parseRouteMonth,parseRouteYear} from "@/lib/route-validation";
import {muhuratCityMonthSsgPriority} from "@/lib/static-seo-routes";
import {buildMuhuratTopicalGraph} from "@/lib/topical-links";
import {muhuratYearPath} from "@/lib/yearly-expansion";

export const dynamicParams=true;
export const revalidate=86400;

export function generateStaticParams(){return muhuratCityMonthSsgPriority;}

export async function generateMetadata({params}:{params:Promise<{event:string;year:string;month:string;city:string}>}):Promise<Metadata>{
  const p=await params;
  const city=findCityBySlug(p.city);
  const rule=muhuratRules[p.event];
  const year=parseRouteYear(p.year),month=parseRouteMonth(p.month);
  if(!city||!rule||!year||!month)notFound();
  return {title:`${rule.title} in ${city.name} — Candidate Dates ${p.month}/${year}`,description:`${rule.title} candidate dates in ${city.name} using Panchvani's Tithi + Nakshatra screening profile, with local planning windows and explicit limitations.`,alternates:{canonical:`/muhurat/${p.event}/${year}/${p.month}/${city.slug}`},robots:robotsFor(isYearlyMuhuratIndexable(p.event,year,city.slug))};
}

export default async function Page({params}:{params:Promise<{event:string;year:string;month:string;city:string}>}){
  const p=await params;
  const city=findCityBySlug(p.city);
  const rule=muhuratRules[p.event];
  const year=parseRouteYear(p.year),month=parseRouteMonth(p.month);
  if(!city||!rule||!year||!month)notFound();
  const {rows}=await getMonthlyMuhurat(p.event,year,month,city);
  const top=rows[0];
  const seo=buildMuhuratSeoSummary(p.event,year,month,city,rows,"city");

  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"CollectionPage","name":`${rule.title} candidate dates in ${city.name} — ${p.month}/${year}`,"url":`https://panchvani.com/muhurat/${p.event}/${year}/${p.month}/${city.slug}`,"description":muhuratScreeningStatement},
    {"@type":"ItemList","name":`${rule.title} screened candidate dates`,"itemListElement":rows.map((r,index)=>({"@type":"ListItem","position":index+1,"name":`${r.date} · Planning Score ${r.planning.score}/100`,"url":`https://panchvani.com/panchang/${city.slug}/${r.date}`}))}
  ]};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-muhurat">
    <div className="breadcrumbs"><Link href={muhuratYearPath(p.event,year)}>{rule.title} {year}</Link> / <Link href={`/muhurat/${p.event}/${year}/${p.month}`}>{p.month}</Link> / {city.name}</div>
    <p className="page-kicker">MUHURAT PLANNING SCREEN · {city.state}</p>
    <h1 className="page-title">{rule.title}<br/>{city.name}</h1>
    <p className="page-subtitle">Planning Scores compare local clean-time availability for screened candidate dates in {city.name}.</p>

    <section className="wide-panel"><div className="seo-copy"><small>LOCAL MONTHLY SUMMARY · {seo.monthLabel.toUpperCase()} · {city.name.toUpperCase()}</small><h2>{seo.headline}</h2><p>{seo.overview}</p><p>{seo.rankingInsight}</p><p>{seo.timingInsight}</p><p>{seo.alternatives}</p></div><div className="data-grid"><div className="data-card"><small>Screened candidates</small><strong>{seo.qualifyingCount}</strong><small>Tithi + Nakshatra profile matches</small></div><div className="data-card"><small>Average Planning Score</small><strong>{seo.averageScore}/100</strong><small>Practical planning metric</small></div><div className="data-card"><small>Excellent planning band</small><strong>{seo.excellentCount}</strong><small>Score 85+ inside this model</small></div><div className="data-card"><small>Strong planning band</small><strong>{seo.strongCount}</strong><small>Score 70–84 inside this model</small></div></div></section>

    {top?<section className="wide-panel"><div className="seo-copy"><small>TOP PRACTICAL FIT · {city.name.toUpperCase()}</small><h2>{top.date} · {top.planning.grade} · {top.planning.score}/100</h2><p>{top.reasons.join(" · ")}. The longest uninterrupted clean block is {top.planning.longestWindowMinutes} minutes and the total clean-time supply is {top.planning.totalCleanMinutes} minutes.</p><p>{top.recommendedWindows[0]?`First local planning window: ${top.recommendedWindows[0].start}–${top.recommendedWindows[0].end}.`:"No clean favorable daytime window remains after local exclusions."}</p></div></section>:null}

    <div className="wide-panel"><table className="table"><thead><tr><th>Rank / Date</th><th>Planning score</th><th>Screening match</th><th>Local planning windows</th><th>Local exclusions</th></tr></thead><tbody>{rows.length?rows.map((r,index)=><tr key={r.date}><td><small>#{index+1}</small><br/><Link href={`/panchang/${city.slug}/${r.date}`}>{r.date}</Link></td><td><strong>{r.planning.score}/100 · {r.planning.grade}</strong><small style={{display:"block"}}>{r.planning.longestWindowMinutes} min longest · {r.planning.totalCleanMinutes} min clean</small></td><td>{r.reasons.join(" · ")}</td><td>{r.recommendedWindows.length?<>{r.recommendedWindows.slice(0,4).map(window=><span key={`${window.start}-${window.end}`} style={{display:"block",whiteSpace:"nowrap"}}><strong>{window.start}–{window.end}</strong> <small>{window.sources.join(" + ")}</small></span>)}{r.recommendedWindows.length>4?<small>+{r.recommendedWindows.length-4} more clean windows</small>:null}</>:"No clean favorable daytime window after exclusions"}</td><td>{r.avoidWindows.map(item=><span key={item.label} style={{display:"block",whiteSpace:"nowrap"}}>{item.label}: {item.window.start}–{item.window.end}</span>)}</td></tr>):<tr><td colSpan={5}>No dates matched the current Tithi + Nakshatra screening profile for this month.</td></tr>}</tbody></table></div>

    <div className="seo-copy"><h2>Why the Planning Score changes by city</h2><p>Rahu Kalam, Yamaganda, Gulika, Abhijit and Choghadiya depend on local sunrise and sunset. Panchvani recalculates those practical windows for {city.name}; the score then compares continuity, total clean minutes and timing-source diversity after local exclusions.</p><p>A date must first match the current event Tithi + Nakshatra profile before any practical clean-time ranking is calculated.</p></div>

    {p.event==="gold-purchase"?<section className="wide-panel"><div className="seo-copy"><small>PRICE CONTEXT · SEPARATE FROM MUHURAT</small><h2>Check today's gold rate in {city.name}</h2><p>Muhurat screening and market price answer different questions. For current 22K, 24K and 18K reference prices, open the <Link href={`/gold-rate/${city.slug}`}>gold rate page for {city.name}</Link>.</p></div></section>:null}

    <div className="pill-links"><Link href={`/muhurat/${p.event}/${year}/${p.month}`}>India baseline · month</Link><Link href={muhuratYearPath(p.event,year)}>Full {year} planning screen</Link></div>
    <TopicalGraph title={`Explore ${rule.title} around ${city.name}`} groups={buildMuhuratTopicalGraph(city,p.event,year,month)}/>
    <MethodologyNote title="Screening scope"><p>{muhuratScreeningStatement}</p><p>Additional factors outside this screen:</p><ul>{muhuratExcludedFactors.map(item=><li key={item}>{item}</li>)}</ul><p><strong>Reference conventions:</strong> {muhuratBenchmarkSources.map((source,index)=><span key={source.label}>{index?" · ":""}{source.label}</span>)}</p>{p.event==="gold-purchase"?<p>A favorable timing window is not financial advice.</p>:null}</MethodologyNote>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
