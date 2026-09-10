import type {Metadata} from "next";
import Header from "@/components/Header";
import Link from "next/link";
import {notFound} from "next/navigation";
import {findCityBySlug} from "@/lib/cities";
import {getMonthlyMuhurat,muhuratRules} from "@/lib/muhurat";
import {formatWindow} from "@/lib/panchang";
import {isMuhuratIndexable,robotsFor} from "@/lib/seo-policy";
import {parseRouteMonth,parseRouteYear} from "@/lib/route-validation";

export const revalidate=86400;

export async function generateMetadata({params}:{params:Promise<{event:string;year:string;month:string;city:string}>}):Promise<Metadata>{
  const p=await params;
  const city=findCityBySlug(p.city);
  const rule=muhuratRules[p.event];
  const year=parseRouteYear(p.year),month=parseRouteMonth(p.month);
  if(!city||!rule||!year||!month)notFound();
  return {title:`${rule.title} in ${city.name} — ${p.month}/${year}`,description:`City-specific ${rule.title.toLowerCase()} dates and local Panchang windows for ${city.name}.`,alternates:{canonical:`/muhurat/${p.event}/${year}/${p.month}/${city.slug}`},robots:robotsFor(isMuhuratIndexable(p.event,city.slug))};
}

export default async function Page({params}:{params:Promise<{event:string;year:string;month:string;city:string}>}){
  const p=await params;
  const city=findCityBySlug(p.city);
  const rule=muhuratRules[p.event];
  const year=parseRouteYear(p.year),month=parseRouteMonth(p.month);
  if(!city||!rule||!year||!month)notFound();
  const {rows}=await getMonthlyMuhurat(p.event,year,month,city);
  return <main><Header city={city}/><div className="page-shell internal-visual internal-muhurat"><p className="page-kicker">CITY-SPECIFIC MUHURAT</p><h1 className="page-title">{rule.title}<br/>{city.name}</h1><p className="page-subtitle">{rule.note}</p><div className="wide-panel"><table className="table"><thead><tr><th>Date</th><th>Tithi</th><th>Nakshatra</th><th>Abhijit</th><th>Rahu Kalam</th></tr></thead><tbody>{rows.map(r=><tr key={r.date}><td><Link href={`/panchang/${city.slug}/${r.date}`}>{r.date}</Link></td><td>{r.data.tithi}</td><td>{r.data.nakshatra}</td><td>{formatWindow(r.data.abhijit)}</td><td>{formatWindow(r.data.rahu)}</td></tr>)}</tbody></table></div></div></main>;
}
