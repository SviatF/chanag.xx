import type {Metadata} from "next";
import Header from "@/components/Header";
import TopicalGraph from "@/components/TopicalGraph";
import Link from "next/link";
import {notFound} from "next/navigation";
import {findCityBySlug} from "@/lib/cities";
import {getMonthlyMuhurat,muhuratRules} from "@/lib/muhurat";
import {getMuhuratScoreEvidence} from "@/lib/muhurat-score-evidence";
import {getVerifiedMuhuratClosure} from "@/lib/verified-muhurat-closures";
import {getMuhuratVerificationNotice} from "@/lib/muhurat-verification-notice";
import VerifiedMuhuratClosurePage from "@/components/VerifiedMuhuratClosurePage";
import {buildMuhuratMonthlyQualityContent} from "@/lib/muhurat-content-engine";
import {buildMuhuratCityContext} from "@/lib/muhurat-city-context";
import {buildMuhuratCitySimilarityContext} from "@/lib/muhurat-city-similarity-context";
import {buildMuhuratCityMonthHeading} from "@/lib/muhurat-heading";
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
  const heading=buildMuhuratCityMonthHeading(rule.title,city.name,year,month);
  const closure=getVerifiedMuhuratClosure(p.event,year,month,city);
  if(closure)return {title:`${rule.title} — ${p.event==="wedding"?"No Traditional Marathi Wedding Dates":"No Customary Marathi House-Entry Dates"} in ${city.name} · ${heading.period}`,description:closure.headline+`. ${closure.reason} under the reviewed ${closure.convention} convention.`,alternates:{canonical:`/muhurat/${p.event}/${year}/${p.month}/${city.slug}`},robots:robotsFor(isMonthlyMuhuratIndexable(p.event,year,month,city.slug))};
  return {title:`${heading.full} Candidate Dates`,description:`${heading.full}: sunrise-based Tithi/Nakshatra and daytime interval screening; dates are not verified ceremony recommendations.`,alternates:{canonical:`/muhurat/${p.event}/${year}/${p.month}/${city.slug}`},robots:robotsFor(isMonthlyMuhuratIndexable(p.event,year,month,city.slug))};
}

export default async function Page({params}:{params:Promise<{event:string;year:string;month:string;city:string}>}){
  const p=await params;const city=findCityBySlug(p.city);const rule=muhuratRules[p.event];const year=parseRouteYear(p.year),month=parseRouteMonth(p.month);
  if(!city||!rule||!year||!month)notFound();
  const heading=buildMuhuratCityMonthHeading(rule.title,city.name,year,month);
  const closure=getVerifiedMuhuratClosure(p.event,year,month,city);
  if(closure)return <VerifiedMuhuratClosurePage event={p.event} year={year} month={month} city={city} baseline={false} closure={closure}/>;
  const {rows}=await getMonthlyMuhurat(p.event,year,month,city);
  const top=rows[0];
  const scoreEvidence=top?getMuhuratScoreEvidence(top):null;
  const verification=getMuhuratVerificationNotice(p.event,year,month,city);
  const quality=buildMuhuratMonthlyQualityContent(p.event,year,month,city,rows,"city");
  const localContext=buildMuhuratCityContext(city,rows,rule.title);
  const similarityContext=buildMuhuratCitySimilarityContext(city,rows,rule.title,year,month);
  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"CollectionPage","name":`${heading.full} astronomical screening reference — not ceremony approval`,"url":`https://panchvani.com/muhurat/${p.event}/${year}/${p.month}/${city.slug}`,"description":verification.explanation}
  ]};

  return <main data-ritual-status="candidate-only"><Header city={city}/><div className="page-shell internal-visual internal-muhurat">
    <div className="breadcrumbs"><Link href={muhuratYearPath(p.event,year)}>{rule.title} {year}</Link> / <Link href={`/muhurat/${p.event}/${year}/${p.month}`}>{heading.period}</Link> / {city.name}</div>
    <p className="page-kicker">LOCAL MUHURAT ANALYSIS · {city.state}</p>
    <h1 className="page-title">{heading.primary}<br/>{heading.period}</h1>
    <p className="page-subtitle">{quality.directAnswer}</p>
    <section className="wide-panel"><div className="seo-copy"><small>RITUAL VERIFICATION · {city.name.toUpperCase()} · {p.event.toUpperCase()}</small><h2>{verification.headline}</h2><p>{verification.explanation}</p></div></section>

    <div className="data-grid">{quality.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}</div>
    <section className="wide-panel"><div className="seo-copy"><h2>{quality.fingerprintTitle}</h2><p>{quality.fingerprintBody}</p></div></section>

    <section className="wide-panel">
      <div className="seo-copy"><small>LOCAL CITY SIGNATURE · {city.state.toUpperCase()}</small><h2>{localContext.title}</h2><p>{localContext.body}</p><p>{localContext.secondaryBody}</p></div>
      <div className="data-grid">{localContext.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}</div>
    </section>

    <section className="wide-panel">
      <div className="seo-copy"><small>MUHURAT LOCALITY LENS · {city.state.toUpperCase()}</small><h2>{similarityContext.title}</h2><p>{similarityContext.localityBody}</p><h2>{similarityContext.decisionTitle}</h2><p>{similarityContext.decisionBody}</p></div>
      <div className="data-grid">{similarityContext.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}</div>
    </section>

    <section className="wide-panel"><div className="seo-copy"><h2>{quality.rankingTitle}</h2><p>{quality.rankingBody}</p></div></section>
    <section className="wide-panel"><div className="seo-copy"><h2>{quality.timingTitle}</h2><p>{quality.timingBody}</p></div></section>
    <section className="wide-panel"><div className="seo-copy"><h2>{quality.ruleTitle}</h2><p>{quality.ruleBody}</p></div></section>

    {top&&scoreEvidence?<section className="wide-panel"><div className="seo-copy">
      <small>RANKING EVIDENCE · {rule.title.toUpperCase()} · {city.name.toUpperCase()}</small>
      <h2>Why {top.date} gets {scoreEvidence.score}/100</h2>
      <p>{scoreEvidence.summary}</p>
      <div className="data-grid">
        <div className="data-card"><small>Longest retained interval</small><strong>{scoreEvidence.continuity}/40</strong></div>
        <div className="data-card"><small>Total retained clock time</small><strong>{scoreEvidence.availability}/25</strong></div>
        <div className="data-card"><small>Favorable label types</small><strong>{scoreEvidence.sourceDiversity}/20</strong></div>
        <div className="data-card"><small>Abhijit survives exclusions</small><strong>{scoreEvidence.abhijit}/15</strong></div>
      </div>
      <p>{top.lunarEvidenceStatus==="lunar-bounded"?`At sunrise on ${top.date}, ${top.data.tithi} Tithi lasts until ${top.data.tithiEnd} (${top.data.tithiEndDate}), and ${top.data.nakshatra} Nakshatra until ${top.data.nakshatraEnd} (${top.data.nakshatraEndDate}). Every retained daytime window is clipped to the earlier transition and screened against Rahu Kalam, Yamaganda and Gulika.`:"Only sunrise Tithi/Nakshatra evidence is available for this date; intraday lunar continuity is not confirmed."} Use the <Link href={`/panchang/${city.slug}/${top.date}`}>full Panchang for {city.name} on {top.date}</Link> to review the underlying lunar dates and transition times. The availability score does not certify complete ritual suitability, Lagna or tradition-specific Shuddhi.</p>
      {p.event==="wedding"?<p>Wedding Bhadra check for {city.name}: windows overlapping the sunrise-active Vishti Karana, or the following Vishti after Vanija, are removed at their actual dated Karana transitions. Other religious eligibility checks remain unverified.</p>:null}
    </div></section>:null}

    {top?<section className="wide-panel"><div className="seo-copy"><small>TOP LOCAL FIT · {city.name.toUpperCase()}</small><h2>{top.date} · {top.planning.grade} · {top.planning.score}/100</h2><p>{top.reasons.join(" · ")}. Longest uninterrupted clean block: {top.planning.longestWindowMinutes} minutes. Total clean-time supply: {top.planning.totalCleanMinutes} minutes.</p><p>{top.recommendedWindows[0]?`First retained local window: ${top.recommendedWindows[0].start}–${top.recommendedWindows[0].end} from ${top.recommendedWindows[0].sources.join(" + ")}.`:"This row passes the lunar screen but has no retained favorable daytime block after local exclusions."}</p></div></section>:null}

    <div className="wide-panel"><table className="table"><thead><tr><th>Rank / Date</th><th>Window score /100</th><th>Tithi + Nakshatra · bounded daytime</th><th>Local planning windows</th><th>Local exclusions</th></tr></thead><tbody>{rows.length?rows.map((r,index)=><tr key={r.date}><td><small>#{index+1}</small><br/><Link href={`/panchang/${city.slug}/${r.date}`}>{r.date}</Link></td><td><strong>{r.planning.score}/100 · {r.planning.grade}</strong><small style={{display:"block"}}>{r.planning.longestWindowMinutes} min longest · {r.planning.totalCleanMinutes} min clean</small></td><td>{r.reasons.join(" · ")}</td><td>{r.recommendedWindows.length?<>{r.recommendedWindows.slice(0,4).map(window=><span key={`${window.start}-${window.end}`} style={{display:"block",whiteSpace:"nowrap"}}><strong>{window.start}–{window.end}</strong> <small>{window.sources.join(" + ")}</small></span>)}{r.recommendedWindows.length>4?<small>+{r.recommendedWindows.length-4} more retained windows</small>:null}</>:"No retained favorable daytime window"}</td><td>{r.avoidWindows.map(item=><span key={item.label} style={{display:"block",whiteSpace:"nowrap"}}>{item.label}: {item.window.start}–{item.window.end}</span>)}</td></tr>):<tr><td colSpan={5}>No dates matched the configured Tithi + Nakshatra profile for this month.</td></tr>}</tbody></table></div>

    {p.event==="gold-purchase"?<section className="wide-panel"><div className="seo-copy"><small>PRICE CONTEXT · SEPARATE DATASET</small><h2>Gold price context for {city.name}</h2><p>The timing model and the market-price model are independent. Open the <Link href={`/gold-rate/${city.slug}`}>gold rate page for {city.name}</Link> to compare the local reference price separately from this timing analysis.</p></div></section>:null}

    <div className="pill-links"><Link href={`/muhurat/${p.event}/${year}/${p.month}`}>India baseline · {heading.period}</Link><Link href={muhuratYearPath(p.event,year)}>Full {year} analysis</Link></div>
    <TopicalGraph title={`Explore ${rule.title} around ${city.name}`} groups={buildMuhuratTopicalGraph(city,p.event,year,month)}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
