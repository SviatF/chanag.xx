import type {Metadata} from "next";
import Link from "next/link";
import Header from "@/components/Header";
import ChoghadiyaTable from "@/components/ChoghadiyaTable";
import {cityBySlug,cities} from "@/lib/cities";
import {getPanchang} from "@/lib/panchang";
import {todayInIndia} from "@/lib/dates";
import {isPriorityCity,robotsFor} from "@/lib/seo-policy";

export const revalidate=3600;

export async function generateMetadata({params}:{params:Promise<{city:string}>}):Promise<Metadata>{
  const p=await params;
  const city=cityBySlug(p.city);
  return {
    title:`Today's Choghadiya in ${city.name} — Day & Night Timings`,
    description:`Today Choghadiya for ${city.name}: 8 daytime and 8 nighttime periods calculated from local sunrise, sunset and next sunrise.`,
    alternates:{canonical:`/tools/choghadiya/${city.slug}`},
    robots:robotsFor(isPriorityCity(city.slug))
  };
}

export default async function ChoghadiyaCityPage({params}:{params:Promise<{city:string}>}){
  const p=await params;
  const city=cityBySlug(p.city);
  const data=await getPanchang(todayInIndia(),city);
  const good=data.dayChoghadiya.filter(x=>x.effect==="good");

  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"WebApplication","name":`Choghadiya Calculator — ${city.name}`,"applicationCategory":"LifestyleApplication","operatingSystem":"Web","url":`https://panchang.in/tools/choghadiya/${city.slug}`},
    {"@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":"Tools","item":"https://panchang.in/tools"},
      {"@type":"ListItem","position":2,"name":"Choghadiya"},
      {"@type":"ListItem","position":3,"name":city.name}
    ]}
  ]};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-tools">
    <div className="breadcrumbs"><Link href="/tools">Tools</Link> / Choghadiya / {city.name}</div>
    <p className="page-kicker">LOCAL CHOGHADIYA · {city.state}</p>
    <h1 className="page-title">Today's Choghadiya<br/>{city.name}</h1>
    <p className="page-subtitle">{data.date} · Day periods are divided from local sunrise to sunset; night periods continue to the next sunrise.</p>

    <div className="data-grid">
      <div className="data-card"><small>Sunrise</small><strong>{data.sunrise}</strong></div>
      <div className="data-card"><small>Sunset</small><strong>{data.sunset}</strong></div>
      <div className="data-card"><small>Best daytime periods</small><strong>{good.map(x=>x.name).join(" · ")||"See table"}</strong></div>
      <div className="data-card"><small>Rahu Kalam</small><strong>{data.rahu.start} — {data.rahu.end}</strong></div>
    </div>

    <div className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>Day & night Choghadiya</h2>
      <ChoghadiyaTable day={data.dayChoghadiya} night={data.nightChoghadiya}/>
    </div>

    <div className="pill-links">
      <Link href={`/panchang/${city.slug}/${data.date}`}>Full Panchang</Link>
      {cities.filter(c=>c.slug!==city.slug).slice(0,8).map(c=><Link href={`/tools/choghadiya/${c.slug}`} key={c.slug}>{c.name}</Link>)}
    </div>

    <div className="seo-copy"><h2>How Choghadiya is calculated</h2><p>The daylight interval from sunrise to sunset is divided into eight equal periods. The night interval from sunset to the next sunrise is also divided into eight periods. The sequence depends on the weekday, so local solar timing and the selected city both matter.</p></div>

    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
