import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import {cityBySlug} from "@/lib/cities";
import {getMonthlyMuhurat,muhuratRules} from "@/lib/muhurat";
import {buildMuhuratSeoSummary} from "@/lib/muhurat-seo";
import {isMuhuratIndexable,robotsFor} from "@/lib/seo-policy";
import {parseRouteMonth,parseRouteYear} from "@/lib/route-validation";

export const revalidate=86400;

export async function generateMetadata({params}:{params:Promise<{event:string;year:string;month:string}>}):Promise<Metadata>{
  const p=await params;
  const rule=muhuratRules[p.event];
  const year=parseRouteYear(p.year),month=parseRouteMonth(p.month);
  if(!rule||!year||!month)notFound();
  return {title:`${rule.title} ${year} — Ranked Dates & Local Windows`,description:`Ranked ${rule.title.toLowerCase()} dates with Panchvani Planning Score and filtered local auspicious reference windows for ${p.month}/${year}.`,alternates:{canonical:`/muhurat/${p.event}/${year}/${p.month}`},robots:robotsFor(isMuhuratIndexable(p.event))};
}

export default async function MuhuratPage({params}:{params:Promise<{event:string;year:string;month:string}>}){
  const p=await params;
  const rule=muhuratRules[p.event];
  const year=parseRouteYear(p.year),month=parseRouteMonth(p.month);
  if(!rule||!year||!month)notFound();
  const city=cityBySlug("mumbai");
  const {rows}=await getMonthlyMuhurat(p.event,year,month,city);
  const top=rows[0];
  const seo=buildMuhuratSeoSummary(p.event,year,month,city,rows,"baseline");
  const ld={"@context":"https://schema.org","@graph":rows.map(r=>({"@type":"Event","name":`${rule.title} — ${r.date}`,"startDate":r.date,"location":{"@type":"Place","name":city.name},"description":`${r.reasons.join(" + ")}. Panchvani Planning Score ${r.planning.score}/100 (${r.planning.grade}). ${rule.note}`}))};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-muhurat">
    <p className="page-kicker">AUSPICIOUS PLANNING · INDIA BASELINE</p>
    <h1 className="page-title">{rule.title}<br/>{p.month}/{year}</h1>
    <p className="page-subtitle">{rule.note} The table uses Mumbai as the baseline location; open a city page for exact local windows. The Planning Score compares already-qualified dates by practical clean-time availability and is not a personalized astrological suitability score.</p>

    <div className="pill-links">{["mumbai","delhi","kolkata","chennai","bengaluru"].map(slug=><Link href={`/muhurat/${p.event}/${year}/${p.month}/${slug}`} key={slug}>{cityBySlug(slug).name}</Link>)}</div>

    <section className="wide-panel">
      <div className="seo-copy">
        <small>MONTHLY CALCULATION SUMMARY · {seo.monthLabel.toUpperCase()}</small>
        <h2>{seo.headline}</h2>
        <p>{seo.overview}</p>
        <p>{seo.rankingInsight}</p>
        <p>{seo.timingInsight}</p>
        <p>{seo.alternatives}</p>
      </div>
      <div className="data-grid">
        <div className="data-card"><small>Qualified dates</small><strong>{seo.qualifyingCount}</strong><small>Tithi + Nakshatra matches</small></div>
        <div className="data-card"><small>Average Planning Score</small><strong>{seo.averageScore}/100</strong><small>Across qualified dates</small></div>
        <div className="data-card"><small>Excellent dates</small><strong>{seo.excellentCount}</strong><small>Planning Score 85+</small></div>
        <div className="data-card"><small>Strong dates</small><strong>{seo.strongCount}</strong><small>Planning Score 70–84</small></div>
      </div>
    </section>

    {top?<section className="wide-panel">
      <div className="seo-copy">
        <small>TOP PLANNING FIT · MUMBAI BASELINE</small>
        <h2>{top.date} · {top.planning.grade} · {top.planning.score}/100</h2>
        <p>{top.reasons.join(" · ")}. The longest clean block is {top.planning.longestWindowMinutes} minutes, with {top.planning.totalCleanMinutes} unique clean minutes across favorable daytime periods.</p>
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
      <h2>How the Panchvani Planning Score works</h2>
      <p>A date first has to qualify through the event's Tithi and Nakshatra rule profile. The score then compares those qualified dates using practical local availability: the longest uninterrupted clean block, total unique clean minutes, the number of distinct favorable timing sources and whether an Abhijit block remains after exclusions.</p>
      <p>The continuity target is event-specific so a longer ceremony is not evaluated like a short purchase activity. Overlapping favorable periods are counted only once in the clean-minute total. Rahu Kalam, Yamaganda and Gulika never add points and are removed before scoring.</p>
      <p>This ranking is a Panchvani planning aid, not a claim that one date is universally more religiously auspicious than another. Personal horoscope compatibility, Tara Bala, Lagna and sampradaya-specific ritual constraints remain outside this general shortlist.</p>
    </div>

    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
