import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import {cityBySlug} from "@/lib/cities";
import {formatWindow} from "@/lib/panchang";
import {getMonthlyMuhurat,muhuratRules} from "@/lib/muhurat";
import {isMuhuratIndexable,robotsFor} from "@/lib/seo-policy";
import {parseRouteMonth,parseRouteYear} from "@/lib/route-validation";

export const revalidate=86400;

export async function generateMetadata({params}:{params:Promise<{event:string;year:string;month:string}>}):Promise<Metadata>{
  const p=await params;
  const rule=muhuratRules[p.event];
  const year=parseRouteYear(p.year),month=parseRouteMonth(p.month);
  if(!rule||!year||!month)notFound();
  return {title:`${rule.title} ${year} — Best Dates in ${p.month}`,description:`Candidate ${rule.title.toLowerCase()} dates and local auspicious windows for ${p.month}/${year}.`,alternates:{canonical:`/muhurat/${p.event}/${year}/${p.month}`},robots:robotsFor(isMuhuratIndexable(p.event))};
}

export default async function MuhuratPage({params}:{params:Promise<{event:string;year:string;month:string}>}){
  const p=await params;
  const rule=muhuratRules[p.event];
  const year=parseRouteYear(p.year),month=parseRouteMonth(p.month);
  if(!rule||!year||!month)notFound();
  const city=cityBySlug("mumbai");
  const {rows}=await getMonthlyMuhurat(p.event,year,month,city);
  const ld={"@context":"https://schema.org","@graph":rows.map(r=>({"@type":"Event","name":`${rule.title} — ${r.date}`,"startDate":r.date,"location":{"@type":"Place","name":city.name},"description":rule.note}))};
  return <main><Header city={city}/><div className="page-shell internal-visual internal-muhurat"><p className="page-kicker">AUSPICIOUS PLANNING · {city.name}</p><h1 className="page-title">{rule.title}<br/>{p.month}/{year}</h1><p className="page-subtitle">{rule.note} This page is a general Panchang-based shortlist rather than a personalized Kundli consultation.</p><div className="pill-links">{["mumbai","delhi","kolkata","chennai","bengaluru"].map(slug=><Link href={`/muhurat/${p.event}/${year}/${p.month}/${slug}`} key={slug}>{cityBySlug(slug).name}</Link>)}</div><div className="wide-panel"><table className="table"><thead><tr><th>Date</th><th>Tithi</th><th>Nakshatra</th><th>Abhijit</th><th>Avoid Rahu</th></tr></thead><tbody>{rows.length?rows.map(r=><tr key={r.date}><td><Link href={`/panchang/${city.slug}/${r.date}`}>{r.date}</Link></td><td>{r.data.tithi}</td><td>{r.data.nakshatra}</td><td>{formatWindow(r.data.abhijit)}</td><td>{formatWindow(r.data.rahu)}</td></tr>):<tr><td colSpan={5}>No candidates matched the current rule set for this month.</td></tr>}</tbody></table></div><div className="seo-copy"><h2>How these dates are selected</h2><p>{rule.note} The calculation remains location-sensitive because sunrise-based periods such as Rahu Kalam vary by city. Personal horoscope compatibility and specialized ritual constraints are intentionally outside this general-purpose shortlist.</p></div><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/></div></main>;
}
