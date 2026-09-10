import type {Metadata} from "next";
import Header from "@/components/Header";
import Link from "next/link";
import {notFound} from "next/navigation";
import {findCityBySlug} from "@/lib/cities";
import {getMonthlyMuhurat,muhuratRules} from "@/lib/muhurat";
import {buildMuhuratSeoSummary} from "@/lib/muhurat-seo";
import {isMuhuratIndexable,robotsFor} from "@/lib/seo-policy";
import {parseRouteMonth,parseRouteYear} from "@/lib/route-validation";

export const revalidate=86400;

export async function generateMetadata({params}:{params:Promise<{event:string;year:string;month:string;city:string}>}):Promise<Metadata>{
  const p=await params;
  const city=findCityBySlug(p.city);
  const rule=muhuratRules[p.event];
  const year=parseRouteYear(p.year),month=parseRouteMonth(p.month);
  if(!city||!rule||!year||!month)notFound();
  return {title:`${rule.title} in ${city.name} — Ranked Dates ${p.month}/${year}`,description:`Ranked city-specific ${rule.title.toLowerCase()} dates with Panchvani Planning Score and filtered local Panchang windows for ${city.name}.`,alternates:{canonical:`/muhurat/${p.event}/${year}/${p.month}/${city.slug}`},robots:robotsFor(isMuhuratIndexable(p.event,city.slug))};
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

  const ld={"@context":"https://schema.org","@graph":rows.map(r=>({
    "@type":"Event",
    "name":`${rule.title} — ${r.date} in ${city.name}`,
    "startDate":r.date,
    "location":{"@type":"Place","name":city.name,"address":{"@type":"PostalAddress","addressRegion":city.state,"addressCountry":"IN"}},
    "description":`${r.reasons.join(" + ")}. Panchvani Planning Score ${r.planning.score}/100 (${r.planning.grade}). ${rule.note}`
  }))};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-muhurat">
    <p className="page-kicker">CITY-SPECIFIC MUHURAT · {city.state}</p>
    <h1 className="page-title">{rule.title}<br/>{city.name}</h1>
    <p className="page-subtitle">{rule.note} All windows below are calculated from {city.name}'s local Panchang timings. The Planning Score ranks already-qualified dates by practical clean-time availability, not by personalized horoscope compatibility.</p>

    <section className="wide-panel">
      <div className="seo-copy">
        <small>LOCAL MONTHLY SUMMARY · {seo.monthLabel.toUpperCase()} · {city.name.toUpperCase()}</small>
        <h2>{seo.headline}</h2>
        <p>{seo.overview}</p>
        <p>{seo.rankingInsight}</p>
        <p>{seo.timingInsight}</p>
        <p>{seo.alternatives}</p>
      </div>
      <div className="data-grid">
        <div className="data-card"><small>Qualified dates</small><strong>{seo.qualifyingCount}</strong><small>Local shortlist for {city.name}</small></div>
        <div className="data-card"><small>Average Planning Score</small><strong>{seo.averageScore}/100</strong><small>Across qualified dates</small></div>
        <div className="data-card"><small>Excellent dates</small><strong>{seo.excellentCount}</strong><small>Planning Score 85+</small></div>
        <div className="data-card"><small>Strong dates</small><strong>{seo.strongCount}</strong><small>Planning Score 70–84</small></div>
      </div>
    </section>

    {top?<section className="wide-panel">
      <div className="seo-copy">
        <small>TOP PLANNING FIT · {city.name.toUpperCase()}</small>
        <h2>{top.date} · {top.planning.grade} · {top.planning.score}/100</h2>
        <p>{top.reasons.join(" · ")}. The longest uninterrupted clean block is {top.planning.longestWindowMinutes} minutes and the day contains {top.planning.totalCleanMinutes} unique clean minutes from favorable daytime sources.</p>
        <p>{top.recommendedWindows[0]?`First available reference window: ${top.recommendedWindows[0].start}–${top.recommendedWindows[0].end}.`:"No clean favorable daytime window remains after exclusions."}</p>
      </div>
    </section>:null}

    <div className="wide-panel">
      <table className="table">
        <thead><tr><th>Rank / Date</th><th>Planning score</th><th>Why it qualifies</th><th>Recommended local windows</th><th>Avoid</th></tr></thead>
        <tbody>{rows.length?rows.map((r,index)=><tr key={r.date}>
          <td><small>#{index+1}</small><br/><Link href={`/panchang/${city.slug}/${r.date}`}>{r.date}</Link></td>
          <td><strong>{r.planning.score}/100 · {r.planning.grade}</strong><small style={{display:"block"}}>{r.planning.longestWindowMinutes} min longest · {r.planning.totalCleanMinutes} min clean</small></td>
          <td>{r.reasons.join(" · ")}</td>
          <td>{r.recommendedWindows.length?<>{r.recommendedWindows.slice(0,4).map(window=><span key={`${window.start}-${window.end}`} style={{display:"block",whiteSpace:"nowrap"}}><strong>{window.start}–{window.end}</strong> <small>{window.sources.join(" + ")}</small></span>)}{r.recommendedWindows.length>4?<small>+{r.recommendedWindows.length-4} more clean windows</small>:null}</>:"No clean favorable daytime window after exclusions"}</td>
          <td>{r.avoidWindows.map(item=><span key={item.label} style={{display:"block",whiteSpace:"nowrap"}}>{item.label}: {item.window.start}–{item.window.end}</span>)}</td>
        </tr>):<tr><td colSpan={5}>No candidates matched the current rule set for this month.</td></tr>}</tbody>
      </table>
    </div>

    <div className="seo-copy">
      <h2>Why the ranking changes by city</h2>
      <p>Rahu Kalam, Yamaganda, Gulika, Abhijit and Choghadiya depend on local sunrise and sunset. Panchvani therefore recalculates both the clean windows and the Planning Score for {city.name}; the same date can have a different practical rank in another city.</p>
      <p>A date first has to match the event's Tithi and Nakshatra profile. The score then evaluates the longest uninterrupted clean block, total unique clean minutes, favorable timing-source diversity and whether Abhijit remains available after local exclusions. Overlapping windows are counted once.</p>
      <p>The continuity target is event-specific, so a longer ceremony is not scored like a short purchase activity. The ranking remains a general Panchang planning aid rather than a personalized Kundli prescription.</p>
    </div>

    <div className="pill-links"><Link href={`/panchang/${city.slug}`}>Today's Panchang in {city.name}</Link><Link href={`/calendar/${city.slug}/${year}/${p.month}`}>Monthly calendar</Link><Link href={`/muhurat/${p.event}/${year}/${p.month}`}>India baseline</Link></div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
