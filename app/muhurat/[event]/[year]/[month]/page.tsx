import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import TopicalGraph from "@/components/TopicalGraph";
import {cityBySlug} from "@/lib/cities";
import {getMonthlyMuhurat,muhuratRules} from "@/lib/muhurat";
import {getMuhuratScoreEvidence} from "@/lib/muhurat-score-evidence";
import {getVerifiedMuhuratClosure} from "@/lib/verified-muhurat-closures";
import {getMuhuratVerificationNotice} from "@/lib/muhurat-verification-notice";
import VerifiedMuhuratClosurePage from "@/components/VerifiedMuhuratClosurePage";
import {buildMuhuratMonthlyQualityContent} from "@/lib/muhurat-content-engine";
import {buildMuhuratMonthSimilarityContext} from "@/lib/muhurat-month-similarity-context";
import {isMonthlyMuhuratIndexable,robotsFor} from "@/lib/seo-policy";
import {parseRouteMonth,parseRouteYear} from "@/lib/route-validation";
import {muhuratMonthSsgPriority} from "@/lib/static-seo-routes";
import {buildMuhuratTopicalGraph} from "@/lib/topical-links";
import {muhuratYearPath} from "@/lib/yearly-expansion";
import {muhuratCityAuthorityLinks} from "@/lib/authority-city-links";

export const dynamicParams=true;
export const revalidate=86400;
export function generateStaticParams(){return muhuratMonthSsgPriority;}
function monthLabel(year:number,month:number){return new Intl.DateTimeFormat("en-IN",{month:"long",timeZone:"Asia/Kolkata"}).format(new Date(Date.UTC(year,month-1,1)));}

export async function generateMetadata({params}:{params:Promise<{event:string;year:string;month:string}>}):Promise<Metadata>{
  const p=await params;const rule=muhuratRules[p.event];const year=parseRouteYear(p.year),month=parseRouteMonth(p.month);if(!rule||!year||!month)notFound();
  const monthName=monthLabel(year,month);
  const closure=getVerifiedMuhuratClosure(p.event,year,month,cityBySlug("mumbai"));
  if(closure)return {title:`${rule.title} — ${p.event==="wedding"?"No Traditional Marathi Wedding Dates":"No Customary Marathi House-Entry Dates"}, ${monthName} ${year} · Mumbai`,description:closure.headline+`. ${closure.reason} under the reviewed ${closure.convention} convention.`,alternates:{canonical:`/muhurat/${p.event}/${year}/${p.month}`},robots:robotsFor(isMonthlyMuhuratIndexable(p.event,year,month))};
  return {title:`${rule.title} — ${monthName} ${year} Candidate Dates`,description:`${rule.title} astronomical candidates for ${monthName} ${year} from Mumbai sunrise data; not verified ceremony dates.`,alternates:{canonical:`/muhurat/${p.event}/${year}/${p.month}`},robots:robotsFor(isMonthlyMuhuratIndexable(p.event,year,month))};
}

export default async function MuhuratPage({params}:{params:Promise<{event:string;year:string;month:string}>}){
  const p=await params;const rule=muhuratRules[p.event];const year=parseRouteYear(p.year),month=parseRouteMonth(p.month);if(!rule||!year||!month)notFound();
  const city=cityBySlug("mumbai");const monthName=monthLabel(year,month);
  const closure=getVerifiedMuhuratClosure(p.event,year,month,city);
  if(closure)return <VerifiedMuhuratClosurePage event={p.event} year={year} month={month} city={city} baseline={true} closure={closure}/>;
  const {rows}=await getMonthlyMuhurat(p.event,year,month,city);
  const top=rows[0];
  const scoreEvidence=top?getMuhuratScoreEvidence(top):null;
  const verification=getMuhuratVerificationNotice(p.event,year,month,city);
  const quality=buildMuhuratMonthlyQualityContent(p.event,year,month,city,rows,"baseline");
  const similarity=buildMuhuratMonthSimilarityContext(p.event,year,month,rows);
  const cityLinks=muhuratCityAuthorityLinks(p.event,year,month);
  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"CollectionPage","name":`${rule.title} astronomical screening reference — ${monthName} ${year}`,"url":`https://panchvani.com/muhurat/${p.event}/${year}/${p.month}`,"description":verification.explanation}
  ]};

  return <main data-ritual-status="candidate-only"><Header city={city}/><div className="page-shell internal-visual internal-muhurat">
    <div className="breadcrumbs"><Link href={muhuratYearPath(p.event,year)}>{rule.title} {year}</Link> / {monthName}</div>
    <p className="page-kicker">MUHURAT ANALYSIS · MUMBAI BASELINE</p>
    <h1 className="page-title">{rule.title}<br/>{monthName} {year}</h1>
    <p className="page-subtitle">{quality.directAnswer}</p>
    <section className="wide-panel"><div className="seo-copy"><small>BASELINE RITUAL VERIFICATION · {p.event.toUpperCase()}</small><h2>{verification.headline}</h2><p>{verification.explanation}</p></div></section>

    <div className="data-grid">{quality.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}</div>

    <section className="wide-panel">
      <div className="seo-copy"><small>MONTH COMPARISON FINGERPRINT · MUMBAI BASELINE</small><h2>{similarity.title}</h2><p>{similarity.positionBody}</p><h2>{similarity.sequenceTitle}</h2><p>{similarity.sequenceBody}</p></div>
      <div className="data-grid">{similarity.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}</div>
    </section>

    <section className="wide-panel"><div className="seo-copy"><h2>{quality.fingerprintTitle}</h2><p>{quality.fingerprintBody}</p></div></section>
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

    {top?<section className="wide-panel"><div className="seo-copy"><small>TOP MUMBAI-BASELINE FIT</small><h2>{top.date} · {top.planning.grade} · {top.planning.score}/100</h2><p>{top.reasons.join(" · ")}. Longest uninterrupted clean block: {top.planning.longestWindowMinutes} minutes. Total clean-time supply: {top.planning.totalCleanMinutes} minutes.</p><p>{top.recommendedWindows[0]?`First retained window: ${top.recommendedWindows[0].start}–${top.recommendedWindows[0].end} from ${top.recommendedWindows[0].sources.join(" + ")}.`:"The row passes the lunar screen but has no retained favorable daytime block."}</p></div></section>:null}

    <div className="wide-panel"><table className="table"><thead><tr><th>Rank / Date</th><th>Window score /100</th><th>Tithi + Nakshatra · bounded daytime</th><th>Planning windows</th><th>Local exclusions</th></tr></thead><tbody>{rows.length?rows.map((r,index)=><tr key={r.date}><td><small>#{index+1}</small><br/><Link href={`/panchang/${city.slug}/${r.date}`}>{r.date}</Link></td><td><strong>{r.planning.score}/100 · {r.planning.grade}</strong><small style={{display:"block"}}>{r.planning.longestWindowMinutes} min longest · {r.planning.totalCleanMinutes} min clean</small></td><td>{r.reasons.join(" · ")}</td><td>{r.recommendedWindows.length?<>{r.recommendedWindows.slice(0,4).map(window=><span key={`${window.start}-${window.end}`} style={{display:"block",whiteSpace:"nowrap"}}><strong>{window.start}–{window.end}</strong> <small>{window.sources.join(" + ")}</small></span>)}{r.recommendedWindows.length>4?<small>+{r.recommendedWindows.length-4} more retained windows</small>:null}</>:"No retained favorable daytime window"}</td><td>{r.avoidWindows.map(item=><span key={item.label} style={{display:"block",whiteSpace:"nowrap"}}>{item.label}: {item.window.start}–{item.window.end}</span>)}</td></tr>):<tr><td colSpan={5}>No dates matched the configured Tithi + Nakshatra profile for this month.</td></tr>}</tbody></table></div>

    {cityLinks.length?<section className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>Local {rule.title} by city</h2>
      <p className="page-subtitle">Open the same month and event with city-local sunrise, exclusions and retained clean-time windows across every actively indexed city.</p>
      <div className="city-directory">{cityLinks.map(item=><Link href={item.href} key={item.slug}><small>{item.state}</small><strong>{item.name}</strong><span>{monthName} {year} local analysis</span></Link>)}</div>
    </section>:null}

    <div className="pill-links"><Link href={muhuratYearPath(p.event,year)}>Full {year} analysis</Link></div>
    <TopicalGraph title={`Explore ${rule.title} from the Mumbai baseline`} groups={buildMuhuratTopicalGraph(city,p.event,year,month)}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
