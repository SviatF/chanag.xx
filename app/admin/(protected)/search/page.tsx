import Link from "next/link";
import { supportedCities } from "@/lib/cities";
import { allFestivals } from "@/lib/festivals";
import { muhuratRules } from "@/lib/muhurat";

export default async function AdminSearch({searchParams}:{searchParams:Promise<{q?:string}>}){
  const {q=""}=await searchParams;
  const needle=q.trim().toLowerCase();
  const cities=needle?supportedCities.filter(item=>(item.name+" "+item.state+" "+item.slug).toLowerCase().includes(needle)).slice(0,20):[];
  const festivals=needle?allFestivals.filter(item=>(item.name+" "+item.slug+" "+item.short).toLowerCase().includes(needle)).slice(0,20):[];
  const rules=needle?Object.entries(muhuratRules).filter(([slug,rule])=>(slug+" "+rule.title+" "+rule.note).toLowerCase().includes(needle)).slice(0,20):[];
  return <div className="admin-page">
    <header className="admin-page-head"><div><p className="admin-eyebrow">GLOBAL SEARCH</p><h1>{needle?`Results for “${q}”`:"Search Panchvani"}</h1><p>Cities, festivals and Muhurat rule profiles.</p></div></header>
    <section className="admin-search-results">
      <article className="admin-panel"><h2>Cities</h2>{cities.map(item=><Link href={`/admin/cities?q=${encodeURIComponent(item.slug)}`} key={item.slug}><b>{item.name}</b><small>{item.state} · {item.slug}</small></Link>)}</article>
      <article className="admin-panel"><h2>Festivals</h2>{festivals.map(item=><Link href="/admin/festivals" key={item.slug+item.year}><b>{item.name}</b><small>{item.date} · {item.year}</small></Link>)}</article>
      <article className="admin-panel"><h2>Muhurat rules</h2>{rules.map(([slug,rule])=><Link href="/admin/muhurat" key={slug}><b>{rule.title}</b><small>{slug}</small></Link>)}</article>
    </section>
  </div>;
}
