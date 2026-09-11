import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import TopicalGraph from "@/components/TopicalGraph";
import {cityBySlug} from "@/lib/cities";
import {getMonthlyMuhurat,muhuratRules} from "@/lib/muhurat";
import {buildMuhuratSeoSummary} from "@/lib/muhurat-seo";
import {muhuratBenchmarkSources,muhuratExcludedFactors,muhuratScreeningStatement} from "@/lib/religious-integrity";
import {isYearlyMuhuratIndexable,robotsFor} from "@/lib/seo-policy";
import {parseRouteMonth,parseRouteYear} from "@/lib/route-validation";
import {buildMuhuratTopicalGraph} from "@/lib/topical-links";
import {muhuratYearPath} from "@/lib/yearly-expansion";

export const revalidate=86400;

function monthLabel(year:number,month:number){
  return new Intl.DateTimeFormat("en-IN",{month:"long",timeZone:"Asia/Kolkata"}).format(new Date(Date.UTC(year,month-1,1)));
}

export async function generateMetadata({params}:{params:Promise<{event:string;year:string;month:string}>}):Promise<Metadata>{
  const p=await params;
  const rule=muhuratRules[p.event];
  const year=parseRouteYear(p.year),month=parseRouteMonth(p.month);
  if(!rule||!year||!month)notFound();
  const monthName=monthLabel(year,month);
  return {title:`${rule.title} — ${monthName} ${year} Candidate Dates`,description:`${rule.title} candidate dates for ${monthName} ${year} using Panchvani's Tithi + Nakshatra screening profile and Mumbai baseline planning windows.`,alternates:{canonical:`/muhurat/${p.event}/${year}/${p.month}`},robots:robotsFor(isYearlyMuhuratIndexable(p.event,year))};
}

export default async function MuhuratPage({params}:{params:Promise<{event:string;year:string;month:string}>}){
  const p=await params;
  const rule=muhuratRules[p.event];
  const year=parseRouteYear(p.year),month=parseRouteMonth(p.month);
  if(!rule||!year||!month)notFound();
  const city=cityBySlug("mumbai");
  const monthName=monthLabel(year,month);
  const {rows}=await getMonthlyMuhurat(p.event,year,month,city);
  const top=rows[0];
  const seo=buildMuhuratSeoSummary(p.event,year,month,city,rows,"baseline");
  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"CollectionPage","name":`${rule.title} candidate dates — ${monthName} ${year}`,"url":`https://panchvani.com/muhurat/${p.event}/${year}/${p.month}`,"description":muhuratScreeningStatement},
    {"@type":"ItemList","name":`${rule.title} screened candidate dates`,"itemListElement":rows.map((r,index)=>({"@type":"ListItem","position":index+1,"name":`${r.date} · Planning Score ${r.planning.score}/100`,"url":`https://panchvani.com/panchang/${city.slug}/${r.date}`}))}
  ]};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-muhurat">
    <div className="breadcrumbs"><Link href={muhuratYearPath(p.event,year)}>{rule.title} {year}</Link> / {monthName}</div>
    <p className="page-kicker">MUHURAT PLANNING SCREEN · INDIA BASELINE</p>
    <h1 className="page-title">{rule.title}<br/>{monthName} {year}</h1>
    <p className="page-subtitle">{muhuratScreeningStatement} Mumbai is used only as the baseline for local timing comparisons; open a city page for local windows.</p>

    <section className="wide-panel"><div className="seo-copy"><small>MONTHLY SCREENING SUMMARY · {seo.monthLabel.toUpperCase()}</small><h2>{seo.headline}</h2><p>{seo.overview}</p><p>{seo.rankingInsight}</p><p>{seo.timingInsight}</p><p>{seo.alternatives}</p></div><div className="data-grid"><div className="data-card"><small>Screened candidates</small><strong>{seo.qualifyingCount}</strong><small>Tithi + Nakshatra profile matches</small></div><div className="data-card"><small>Average Planning Score</small><strong>{seo.averageScore}/100</strong><small>Practical planning metric only</small></div><div className="data-card"><small>Excellent planning band</small><strong>{seo.excellentCount}</strong></div><div className="data-card"><small>Strong planning band</small><strong>{seo.strongCount}</strong></div></div></section>

    {top?<section className="wide-panel"><div className="seo-copy"><small>TOP PRACTICAL FIT · MUMBAI BASELINE</small><h2>{top.date} · {top.planning.grade} · {top.planning.score}/100</h2><p>{top.reasons.join(" · ")}. This date passed the current Tithi + Nakshatra screen; it is not certified by a complete Panchang Shuddhi. The longest clean block is {top.planning.longestWindowMinutes} minutes.</p><p>{top.recommendedWindows[0]?`First local planning window: ${top.recommendedWindows[0].start}–${top.recommendedWindows[0].end}.`:"No clean favorable daytime window remains after exclusions."}</p></div></section>:null}

    <div className="wide-panel"><table className="table"><thead><tr><th>Rank / Date</th><th>Planning score</th><th>Screening match</th><th>Local planning windows</th><th>Local exclusions</th></tr></thead><tbody>{rows.length?rows.map((r,index)=><tr key={r.date}><td><small>#{index+1}</small><br/><Link href={`/panchang/${city.slug}/${r.date}`}>{r.date}</Link></td><td><strong>{r.planning.score}/100 · {r.planning.grade}</strong><small style={{display:"block"}}>{r.planning.longestWindowMinutes} min longest · {r.planning.totalCleanMinutes} min clean</small></td><td>{r.reasons.join(" · ")}</td><td>{r.recommendedWindows.length?<>{r.recommendedWindows.slice(0,4).map(window=><span key={`${window.start}-${window.end}`} style={{display:"block",whiteSpace:"nowrap"}}><strong>{window.start}–{window.end}</strong> <small>{window.sources.join(" + ")}</small></span>)}{r.recommendedWindows.length>4?<small>+{r.recommendedWindows.length-4} more clean windows</small>:null}</>:"No clean favorable daytime window after exclusions"}</td><td>{r.avoidWindows.map(item=><span key={item.label} style={{display:"block",whiteSpace:"nowrap"}}>{item.label}: {item.window.start}–{item.window.end}</span>)}</td></tr>):<tr><td colSpan={5}>No dates matched the current Tithi + Nakshatra screening profile for this month.</td></tr>}</tbody></table></div>

    <section className="wide-panel"><div className="seo-copy"><small>RELIGIOUS CONTENT INTEGRITY</small><h2>This is not a full Panchang Shuddhi</h2><p>Panchvani deliberately keeps the omitted factors visible rather than implying that Tithi + Nakshatra alone certify a ceremony date.</p><ul>{muhuratExcludedFactors.map(item=><li key={item}>{item}</li>)}</ul><p><strong>Reference benchmarks:</strong> {muhuratBenchmarkSources.map((source,index)=><span key={source.url}>{index?" · ":""}<a href={source.url} rel="noreferrer">{source.label}</a></span>)}</p></div></section>

    <div className="seo-copy"><h2>How the Planning Score works</h2><p>After the Tithi + Nakshatra screen, the score compares practical local availability: longest uninterrupted clean block, total unique clean minutes, timing-source diversity and whether Abhijit remains after Rahu Kalam, Yamaganda and Gulika are removed. It does not add religious authority to the shortlist.</p></div>

    <div className="pill-links"><Link href={muhuratYearPath(p.event,year)}>Full {year} planning screen</Link></div>
    <TopicalGraph title={`Explore ${rule.title} from the Mumbai baseline`} groups={buildMuhuratTopicalGraph(city,p.event,year,month)}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
