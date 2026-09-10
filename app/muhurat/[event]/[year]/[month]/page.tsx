import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import {cityBySlug} from "@/lib/cities";
import {getMonthlyMuhurat,muhuratRules} from "@/lib/muhurat";
import {isMuhuratIndexable,robotsFor} from "@/lib/seo-policy";
import {parseRouteMonth,parseRouteYear} from "@/lib/route-validation";

export const revalidate=86400;

export async function generateMetadata({params}:{params:Promise<{event:string;year:string;month:string}>}):Promise<Metadata>{
  const p=await params;
  const rule=muhuratRules[p.event];
  const year=parseRouteYear(p.year),month=parseRouteMonth(p.month);
  if(!rule||!year||!month)notFound();
  return {title:`${rule.title} ${year} — Best Dates in ${p.month}`,description:`Candidate ${rule.title.toLowerCase()} dates and local auspicious reference windows for ${p.month}/${year}.`,alternates:{canonical:`/muhurat/${p.event}/${year}/${p.month}`},robots:robotsFor(isMuhuratIndexable(p.event))};
}

export default async function MuhuratPage({params}:{params:Promise<{event:string;year:string;month:string}>}){
  const p=await params;
  const rule=muhuratRules[p.event];
  const year=parseRouteYear(p.year),month=parseRouteMonth(p.month);
  if(!rule||!year||!month)notFound();
  const city=cityBySlug("mumbai");
  const {rows}=await getMonthlyMuhurat(p.event,year,month,city);
  const ld={"@context":"https://schema.org","@graph":rows.map(r=>({"@type":"Event","name":`${rule.title} — ${r.date}`,"startDate":r.date,"location":{"@type":"Place","name":city.name},"description":`${r.reasons.join(" + ")}. ${rule.note}`}))};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-muhurat">
    <p className="page-kicker">AUSPICIOUS PLANNING · INDIA BASELINE</p>
    <h1 className="page-title">{rule.title}<br/>{p.month}/{year}</h1>
    <p className="page-subtitle">{rule.note} The table below uses Mumbai as the baseline location; open a city page for exact local windows. This is a general Panchang-based shortlist rather than a personalized Kundli consultation.</p>

    <div className="pill-links">{["mumbai","delhi","kolkata","chennai","bengaluru"].map(slug=><Link href={`/muhurat/${p.event}/${year}/${p.month}/${slug}`} key={slug}>{cityBySlug(slug).name}</Link>)}</div>

    <div className="wide-panel">
      <table className="table">
        <thead><tr><th>Date</th><th>Why it qualifies</th><th>Recommended local windows</th><th>Avoid</th></tr></thead>
        <tbody>{rows.length?rows.map(r=><tr key={r.date}>
          <td><Link href={`/panchang/${city.slug}/${r.date}`}>{r.date}</Link></td>
          <td>{r.reasons.join(" · ")}</td>
          <td>{r.recommendedWindows.length?r.recommendedWindows.slice(0,4).map(window=><span key={`${window.start}-${window.end}`} style={{display:"block",whiteSpace:"nowrap"}}><strong>{window.start}–{window.end}</strong> <small>{window.sources.join(" + ")}</small></span>):"No clean favorable daytime window after exclusions"}</td>
          <td>{r.avoidWindows.map(item=><span key={item.label} style={{display:"block",whiteSpace:"nowrap"}}>{item.label}: {item.window.start}–{item.window.end}</span>)}</td>
        </tr>):<tr><td colSpan={4}>No candidates matched the current rule set for this month.</td></tr>}</tbody>
      </table>
    </div>

    <div className="seo-copy">
      <h2>How these dates and windows are selected</h2>
      <p>A date enters this shortlist only when its calculated Tithi and Nakshatra match the event rule profile. Panchvani then takes favorable daytime Panchang periods such as Abhijit Muhurat and good Choghadiya and removes overlaps with the local Rahu Kalam, Yamaganda and Gulika periods.</p>
      <p>The resulting windows are a general location-sensitive Panchang reference, not a personalized marriage or ceremony prescription. Personal horoscope compatibility, Tara Bala, individual Lagna and sampradaya-specific ritual constraints are outside this general shortlist.</p>
    </div>

    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
