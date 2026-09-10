import Header from "@/components/Header";
import {cities} from "@/lib/cities";
import {festivalsForYear} from "@/lib/festivals";
import {parseRouteYear} from "@/lib/route-validation";
import Link from "next/link";
import {notFound} from "next/navigation";

export const revalidate=86400;

export default async function Page({params}:{params:Promise<{year:string}>}){
  const p=await params;
  const year=parseRouteYear(p.year);
  const festivals=year?festivalsForYear(year):[];
  if(!year||festivals.length===0)notFound();
  return <main><Header city={cities[0]}/><div className="page-shell internal-visual internal-festival"><p className="page-kicker">PILLAR CALENDAR</p><h1 className="page-title">Hindu Festivals<br/>{year}</h1><p className="page-subtitle">Annual festival hub with links to dedicated date, timing and regional pages.</p><div className="wide-panel"><table className="table"><thead><tr><th>Festival</th><th>Date</th></tr></thead><tbody>{festivals.map(f=><tr key={f.slug}><td><Link href={`/festivals/${f.slug}/${year}`}>{f.name}</Link></td><td>{f.date}</td></tr>)}</tbody></table></div></div></main>;
}
