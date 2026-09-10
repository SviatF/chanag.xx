import type {Metadata} from "next";
import Header from "@/components/Header";
import Link from "next/link";
import {notFound} from "next/navigation";
import {findCityBySlug} from "@/lib/cities";
import {getMonthlyMuhurat,muhuratRules} from "@/lib/muhurat";
import {isMuhuratIndexable,robotsFor} from "@/lib/seo-policy";
import {parseRouteMonth,parseRouteYear} from "@/lib/route-validation";

export const revalidate=86400;

export async function generateMetadata({params}:{params:Promise<{event:string;year:string;month:string;city:string}>}):Promise<Metadata>{
  const p=await params;
  const city=findCityBySlug(p.city);
  const rule=muhuratRules[p.event];
  const year=parseRouteYear(p.year),month=parseRouteMonth(p.month);
  if(!city||!rule||!year||!month)notFound();
  return {title:`${rule.title} in ${city.name} — ${p.month}/${year}`,description:`City-specific ${rule.title.toLowerCase()} dates and filtered local Panchang windows for ${city.name}.`,alternates:{canonical:`/muhurat/${p.event}/${year}/${p.month}/${city.slug}`},robots:robotsFor(isMuhuratIndexable(p.event,city.slug))};
}

export default async function Page({params}:{params:Promise<{event:string;year:string;month:string;city:string}>}){
  const p=await params;
  const city=findCityBySlug(p.city);
  const rule=muhuratRules[p.event];
  const year=parseRouteYear(p.year),month=parseRouteMonth(p.month);
  if(!city||!rule||!year||!month)notFound();
  const {rows}=await getMonthlyMuhurat(p.event,year,month,city);

  const ld={"@context":"https://schema.org","@graph":rows.map(r=>({
    "@type":"Event",
    "name":`${rule.title} — ${r.date} in ${city.name}`,
    "startDate":r.date,
    "location":{"@type":"Place","name":city.name,"address":{"@type":"PostalAddress","addressRegion":city.state,"addressCountry":"IN"}},
    "description":`${r.reasons.join(" + ")}. ${rule.note}`
  }))};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-muhurat">
    <p className="page-kicker">CITY-SPECIFIC MUHURAT · {city.state}</p>
    <h1 className="page-title">{rule.title}<br/>{city.name}</h1>
    <p className="page-subtitle">{rule.note} All windows below are calculated from {city.name}'s local Panchang timings.</p>

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
      <h2>Why these windows differ by city</h2>
      <p>Rahu Kalam, Yamaganda, Gulika, Abhijit and Choghadiya depend on local sunrise and sunset. Panchvani therefore recalculates the recommended windows for {city.name} instead of copying one national timing across India.</p>
      <p>A date first has to match the event's Tithi and Nakshatra profile. Favorable daytime periods are then filtered so they do not overlap the local Rahu Kalam, Yamaganda or Gulika windows. This remains a general Panchang reference; personalized Kundli compatibility and ritual-specific constraints require a separate individual assessment.</p>
    </div>

    <div className="pill-links"><Link href={`/panchang/${city.slug}`}>Today's Panchang in {city.name}</Link><Link href={`/calendar/${city.slug}/${year}/${p.month}`}>Monthly calendar</Link><Link href={`/muhurat/${p.event}/${year}/${p.month}`}>India baseline</Link></div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
