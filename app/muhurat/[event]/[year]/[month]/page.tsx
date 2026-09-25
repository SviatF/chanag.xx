import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import TopicalGraph from "@/components/TopicalGraph";
import {cityBySlug} from "@/lib/cities";
import {getMonthlyMuhurat,muhuratRules} from "@/lib/muhurat";
import {buildMuhuratMonthlyQualityContent} from "@/lib/muhurat-content-engine";
import {buildMuhuratMonthSimilarityContext} from "@/lib/muhurat-month-similarity-context";
import {isMonthlyMuhuratIndexable,robotsFor} from "@/lib/seo-policy";
import {parseRouteMonth,parseRouteYear} from "@/lib/route-validation";
import {muhuratMonthSsgPriority} from "@/lib/static-seo-routes";
import {buildMuhuratTopicalGraph} from "@/lib/topical-links";
import {muhuratYearPath} from "@/lib/yearly-expansion";

export const dynamicParams=true;
export const revalidate=86400;
export function generateStaticParams(){return muhuratMonthSsgPriority;}
function monthLabel(year:number,month:number){return new Intl.DateTimeFormat("en-IN",{month:"long",timeZone:"Asia/Kolkata"}).format(new Date(Date.UTC(year,month-1,1)));}

export async function generateMetadata({params}:{params:Promise<{event:string;year:string;month:string}>}):Promise<Metadata>{
  const p=await params;const rule=muhuratRules[p.event];const year=parseRouteYear(p.year),month=parseRouteMonth(p.month);if(!rule||!year||!month)notFound();
  const monthName=monthLabel(year,month);
  return {title:`${rule.title} — ${monthName} ${year} Candidate Dates`,description:`${rule.title} candidate dates for ${monthName} ${year} with Mumbai-baseline score spread, clean-time supply and event-specific continuity metrics.`,alternates:{canonical:`/muhurat/${p.event}/${year}/${p.month}`},robots:robotsFor(isMonthlyMuhuratIndexable(p.event,year,month))};
}

export default async function MuhuratPage({params}:{params:Promise<{event:string;year:string;month:string}>}){
  const p=await params;const rule=muhuratRules[p.event];const year=parseRouteYear(p.year),month=parseRouteMonth(p.month);if(!rule||!year||!month)notFound();
  const city=cityBySlug("mumbai");const monthName=monthLabel(year,month);
  const {rows}=await getMonthlyMuhurat(p.event,year,month,city);
  const top=rows[0];
  const quality=buildMuhuratMonthlyQualityContent(p.event,year,month,city,rows,"baseline");
  const similarity=buildMuhuratMonthSimilarityContext(p.event,year,month,rows);
  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"CollectionPage","name":`${rule.title} candidate dates — ${monthName} ${year}`,"url":`https://panchvani.com/muhurat/${p.event}/${year}/${p.month}`,"description":quality.directAnswer},
    {"@type":"ItemList","name":`${rule.title} screened candidate dates`,"itemListElement":rows.map((r,index)=>({"@type":"ListItem","position":index+1,"name":`${r.date} · Planning Score ${r.planning.score}/100`,"url":`https://panchvani.com/panchang/${city.slug}/${r.date}`}))}
  ]};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-muhurat">
    <div className="breadcrumbs"><Link href={muhuratYearPath(p.event,year)}>{rule.title} {year}</Link> / {monthName}</div>
    <p className="page-kicker">MUHURAT ANALYSIS · MUMBAI BASELINE</p>
    <h1 className="page-title">{rule.title}<br/>{monthName} {year}</h1>
    <p className="page-subtitle">{quality.directAnswer}</p>

    <div className="data-grid">{quality.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}</div>

    <section className="wide-panel">
      <div className="seo-copy"><small>MONTH COMPARISON FINGERPRINT · MUMBAI BASELINE</small><h2>{similarity.title}</h2><p>{similarity.positionBody}</p><h2>{similarity.sequenceTitle}</h2><p>{similarity.sequenceBody}</p></div>
      <div className="data-grid">{similarity.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}</div>
    </section>

    <section className="wide-panel"><div className="seo-copy"><h2>{quality.fingerprintTitle}</h2><p>{quality.fingerprintBody}</p></div></section>
    <section className="wide-panel"><div className="seo-copy"><h2>{quality.rankingTitle}</h2><p>{quality.rankingBody}</p></div></section>
    <section className="wide-panel"><div className="seo-copy"><h2>{quality.timingTitle}</h2><p>{quality.timingBody}</p></div></section>
    <section className="wide-panel"><div className="seo-copy"><h2>{quality.ruleTitle}</h2><p>{quality.ruleBody}</p></div></section>

    {top?<section className="wide-panel"><div className="seo-copy"><small>TOP MUMBAI-BASELINE FIT</small><h2>{top.date} · {top.planning.grade} · {top.planning.score}/100</h2><p>{top.reasons.join(" · ")}. Longest uninterrupted clean block: {top.planning.longestWindowMinutes} minutes. Total clean-time supply: {top.planning.totalCleanMinutes} minutes.</p><p>{top.recommendedWindows[0]?`First retained window: ${top.recommendedWindows[0].start}–${top.recommendedWindows[0].end} from ${top.recommendedWindows[0].sources.join(" + ")}.`:"The row passes the lunar screen but has no retained favorable daytime block."}</p></div></section>:null}

    <div className="wide-panel"><table className="table"><thead><tr><th>Rank / Date</th><th>Planning score</th><th>Lunar match</th><th>Planning windows</th><th>Local exclusions</th></tr></thead><tbody>{rows.length?rows.map((r,index)=><tr key={r.date}><td><small>#{index+1}</small><br/><Link href={`/panchang/${city.slug}/${r.date}`}>{r.date}</Link></td><td><strong>{r.planning.score}/100 · {r.planning.grade}</strong><small style={{display:"block"}}>{r.planning.longestWindowMinutes} min longest · {r.planning.totalCleanMinutes} min clean</small></td><td>{r.reasons.join(" · ")}</td><td>{r.recommendedWindows.length?<>{r.recommendedWindows.slice(0,4).map(window=><span key={`${window.start}-${window.end}`} style={{display:"block",whiteSpace:"nowrap"}}><strong>{window.start}–{window.end}</strong> <small>{window.sources.join(" + ")}</small></span>)}{r.recommendedWindows.length>4?<small>+{r.recommendedWindows.length-4} more retained windows</small>:null}</>:"No retained favorable daytime window"}</td><td>{r.avoidWindows.map(item=><span key={item.label} style={{display:"block",whiteSpace:"nowrap"}}>{item.label}: {item.window.start}–{item.window.end}</span>)}</td></tr>):<tr><td colSpan={5}>No dates matched the configured Tithi + Nakshatra profile for this month.</td></tr>}</tbody></table></div>

    <div className="pill-links"><Link href={muhuratYearPath(p.event,year)}>Full {year} analysis</Link></div>
    <TopicalGraph title={`Explore ${rule.title} from the Mumbai baseline`} groups={buildMuhuratTopicalGraph(city,p.event,year,month)}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
