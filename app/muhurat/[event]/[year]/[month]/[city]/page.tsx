import type {Metadata} from "next";
import Header from "@/components/Header";
import TopicalGraph from "@/components/TopicalGraph";
import Link from "next/link";
import {notFound} from "next/navigation";
import {findCityBySlug} from "@/lib/cities";
import {getMonthlyMuhurat,muhuratRules} from "@/lib/muhurat";
import {buildMuhuratMonthlyQualityContent} from "@/lib/muhurat-content-engine";
import {isMonthlyMuhuratIndexable,robotsFor} from "@/lib/seo-policy";
import {parseRouteMonth,parseRouteYear} from "@/lib/route-validation";
import {muhuratCityMonthSsgPriority} from "@/lib/static-seo-routes";
import {buildMuhuratTopicalGraph} from "@/lib/topical-links";
import {muhuratYearPath} from "@/lib/yearly-expansion";

export const dynamicParams=true;
export const revalidate=86400;
export function generateStaticParams(){return muhuratCityMonthSsgPriority;}

export async function generateMetadata({params}:{params:Promise<{event:string;year:string;month:string;city:string}>}):Promise<Metadata>{
  const p=await params;const city=findCityBySlug(p.city);const rule=muhuratRules[p.event];const year=parseRouteYear(p.year),month=parseRouteMonth(p.month);
  if(!city||!rule||!year||!month)notFound();
  return {title:`${rule.title} in ${city.name} — Candidate Dates ${p.month}/${year}`,description:`${rule.title} candidate dates in ${city.name} with local clean-time rankings, score spread, timing-source coverage and event-specific continuity metrics.`,alternates:{canonical:`/muhurat/${p.event}/${year}/${p.month}/${city.slug}`},robots:robotsFor(isMonthlyMuhuratIndexable(p.event,year,month,city.slug))};
}

export default async function Page({params}:{params:Promise<{event:string;year:string;month:string;city:string}>}){
  const p=await params;const city=findCityBySlug(p.city);const rule=muhuratRules[p.event];const year=parseRouteYear(p.year),month=parseRouteMonth(p.month);
  if(!city||!rule||!year||!month)notFound();
  const {rows}=await getMonthlyMuhurat(p.event,year,month,city);
  const top=rows[0];
  const quality=buildMuhuratMonthlyQualityContent(p.event,year,month,city,rows,"city");
  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"CollectionPage","name":`${rule.title} candidate dates in ${city.name} — ${p.month}/${year}`,"url":`https://panchvani.com/muhurat/${p.event}/${year}/${p.month}/${city.slug}`,"description":quality.directAnswer},
    {"@type":"ItemList","name":`${rule.title} screened candidate dates`,"itemListElement":rows.map((r,index)=>({"@type":"ListItem","position":index+1,"name":`${r.date} · Planning Score ${r.planning.score}/100`,"url":`https://panchvani.com/panchang/${city.slug}/${r.date}`}))}
  ]};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-muhurat">
    <div className="breadcrumbs"><Link href={muhuratYearPath(p.event,year)}>{rule.title} {year}</Link> / <Link href={`/muhurat/${p.event}/${year}/${p.month}`}>{p.month}</Link> / {city.name}</div>
    <p className="page-kicker">LOCAL MUHURAT ANALYSIS · {city.state}</p>
    <h1 className="page-title">{rule.title}<br/>{city.name}</h1>
    <p className="page-subtitle">{quality.directAnswer}</p>

    <div className="data-grid">{quality.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}</div>
    <section className="wide-panel"><div className="seo-copy"><h2>{quality.fingerprintTitle}</h2><p>{quality.fingerprintBody}</p></div></section>
    <section className="wide-panel"><div className="seo-copy"><h2>{quality.rankingTitle}</h2><p>{quality.rankingBody}</p></div></section>
    <section className="wide-panel"><div className="seo-copy"><h2>{quality.timingTitle}</h2><p>{quality.timingBody}</p></div></section>
    <section className="wide-panel"><div className="seo-copy"><h2>{quality.ruleTitle}</h2><p>{quality.ruleBody}</p></div></section>

    {top?<section className="wide-panel"><div className="seo-copy"><small>TOP LOCAL FIT · {city.name.toUpperCase()}</small><h2>{top.date} · {top.planning.grade} · {top.planning.score}/100</h2><p>{top.reasons.join(" · ")}. Longest uninterrupted clean block: {top.planning.longestWindowMinutes} minutes. Total clean-time supply: {top.planning.totalCleanMinutes} minutes.</p><p>{top.recommendedWindows[0]?`First retained local window: ${top.recommendedWindows[0].start}–${top.recommendedWindows[0].end} from ${top.recommendedWindows[0].sources.join(" + ")}.`:"This row passes the lunar screen but has no retained favorable daytime block after local exclusions."}</p></div></section>:null}

    <div className="wide-panel"><table className="table"><thead><tr><th>Rank / Date</th><th>Planning score</th><th>Lunar match</th><th>Local planning windows</th><th>Local exclusions</th></tr></thead><tbody>{rows.length?rows.map((r,index)=><tr key={r.date}><td><small>#{index+1}</small><br/><Link href={`/panchang/${city.slug}/${r.date}`}>{r.date}</Link></td><td><strong>{r.planning.score}/100 · {r.planning.grade}</strong><small style={{display:"block"}}>{r.planning.longestWindowMinutes} min longest · {r.planning.totalCleanMinutes} min clean</small></td><td>{r.reasons.join(" · ")}</td><td>{r.recommendedWindows.length?<>{r.recommendedWindows.slice(0,4).map(window=><span key={`${window.start}-${window.end}`} style={{display:"block",whiteSpace:"nowrap"}}><strong>{window.start}–{window.end}</strong> <small>{window.sources.join(" + ")}</small></span>)}{r.recommendedWindows.length>4?<small>+{r.recommendedWindows.length-4} more retained windows</small>:null}</>:"No retained favorable daytime window"}</td><td>{r.avoidWindows.map(item=><span key={item.label} style={{display:"block",whiteSpace:"nowrap"}}>{item.label}: {item.window.start}–{item.window.end}</span>)}</td></tr>):<tr><td colSpan={5}>No dates matched the configured Tithi + Nakshatra profile for this month.</td></tr>}</tbody></table></div>

    {p.event==="gold-purchase"?<section className="wide-panel"><div className="seo-copy"><small>PRICE CONTEXT · SEPARATE DATASET</small><h2>Gold price context for {city.name}</h2><p>The timing model and the market-price model are independent. Open the <Link href={`/gold-rate/${city.slug}`}>gold rate page for {city.name}</Link> to compare the local reference price separately from this timing analysis.</p></div></section>:null}

    <div className="pill-links"><Link href={`/muhurat/${p.event}/${year}/${p.month}`}>India baseline · month</Link><Link href={muhuratYearPath(p.event,year)}>Full {year} analysis</Link></div>
    <TopicalGraph title={`Explore ${rule.title} around ${city.name}`} groups={buildMuhuratTopicalGraph(city,p.event,year,month)}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
