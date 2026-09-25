import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import ChoghadiyaTable from "@/components/ChoghadiyaTable";
import LanguageLinks from "@/components/LanguageLinks";
import TopicalGraph from "@/components/TopicalGraph";
import {findCityBySlug} from "@/lib/cities";
import {buildChoghadiyaQualityContent} from "@/lib/choghadiya-content-engine";
import {buildChoghadiyaCityContext} from "@/lib/choghadiya-city-context";
import {buildChoghadiyaCityHighSimilarityContext} from "@/lib/choghadiya-city-high-similarity-context";
import {getPanchang} from "@/lib/panchang";
import {todayInIndia} from "@/lib/dates";
import {isPriorityCity,robotsFor} from "@/lib/seo-policy";
import {regionalAlternates} from "@/lib/regional-seo";
import {buildChoghadiyaTopicalGraph} from "@/lib/topical-links";

// “Today” must roll over on India time without waiting for an ISR cache window.
export const dynamic="force-dynamic";

export async function generateMetadata({params}:{params:Promise<{city:string}>}):Promise<Metadata>{
  const p=await params;
  const city=findCityBySlug(p.city);
  if(!city)notFound();
  return {
    title:`Today's Choghadiya in ${city.name} — Day & Night Timings`,
    description:`Today Choghadiya for ${city.name}: 8 daytime and 8 nighttime periods calculated from local sunrise, sunset and next sunrise.`,
    alternates:{canonical:`/tools/choghadiya/${city.slug}`,languages:regionalAlternates(city,"choghadiya")},
    robots:robotsFor(isPriorityCity(city.slug))
  };
}

export default async function ChoghadiyaCityPage({params}:{params:Promise<{city:string}>}){
  const p=await params;
  const city=findCityBySlug(p.city);
  if(!city)notFound();
  const date=todayInIndia();
  const data=await getPanchang(date,city);
  const languageAlternates=regionalAlternates(city,"choghadiya");
  const quality=buildChoghadiyaQualityContent(data,city);
  const cityContext=buildChoghadiyaCityContext(data,city);
  const highSimilarityContext=buildChoghadiyaCityHighSimilarityContext(data,city);

  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"WebApplication","name":`Choghadiya Calculator — ${city.name}`,"applicationCategory":"LifestyleApplication","operatingSystem":"Web","url":`https://panchvani.com/tools/choghadiya/${city.slug}`,"description":quality.directAnswer},
    {"@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":"Tools","item":"https://panchvani.com/tools"},
      {"@type":"ListItem","position":2,"name":"Choghadiya","item":"https://panchvani.com/tools/choghadiya"},
      {"@type":"ListItem","position":3,"name":city.name}
    ]}
  ]};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-tools">
    <div className="breadcrumbs"><Link href="/tools">Tools</Link> / <Link href="/tools/choghadiya">Choghadiya</Link> / {city.name}</div>
    <p className="page-kicker">LOCAL CHOGHADIYA · {city.state}</p>
    <h1 className="page-title">Today's Choghadiya<br/>{city.name}</h1>
    <p className="page-subtitle">{quality.directAnswer}</p>
    <LanguageLinks languages={languageAlternates}/>

    <section className="wide-panel"><div className="data-grid">{quality.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}</div></section>

    <div className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>Day & night Choghadiya</h2>
      <ChoghadiyaTable day={data.dayChoghadiya} night={data.nightChoghadiya}/>
    </div>

    <section className="wide-panel"><div className="seo-copy"><h2>{quality.fingerprintTitle}</h2><p>{quality.fingerprintBody}</p><h2>{quality.daytimeTitle}</h2><p>{quality.daytimeBody}</p><h2>{quality.nightTitle}</h2><p>{quality.nightBody}</p><h2>{quality.rahuTitle}</h2><p>{quality.rahuBody}</p></div></section>

    <section className="wide-panel">
      <div className="seo-copy">
        <small>CHOGHADIYA LOCALITY LENS · {city.name.toUpperCase()}</small>
        <h2>{cityContext.localityTitle}</h2>
        <p>{cityContext.localityBody}</p>
        <h2>{cityContext.boundaryTitle}</h2>
        <p>{cityContext.boundaryBody}</p>
        <h2>{cityContext.weekdayTitle}</h2>
        <p>{cityContext.weekdayBody}</p>
      </div>
      <div className="data-grid">{cityContext.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}</div>
    </section>

    {highSimilarityContext?<section className="wide-panel">
      <div className="seo-copy">
        <small>LOCAL CLOCK COMPARISON LENS · {city.name.toUpperCase()}</small>
        <h2>{highSimilarityContext.title}</h2>
        <p>{highSimilarityContext.localityBody}</p>
        <h2>{highSimilarityContext.solarTitle}</h2>
        <p>{highSimilarityContext.solarBody}</p>
        <h2>{highSimilarityContext.planningTitle}</h2>
        <p>{highSimilarityContext.planningBody}</p>
      </div>
      <div className="data-grid">{highSimilarityContext.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}</div>
    </section>:null}

    <TopicalGraph title={`Explore timing in ${city.name}`} groups={buildChoghadiyaTopicalGraph(city,date)}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
