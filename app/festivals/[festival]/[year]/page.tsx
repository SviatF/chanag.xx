import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import MethodologyNote from "@/components/MethodologyNote";
import {cities} from "@/lib/cities";
import {festivalBySlugYear} from "@/lib/festivals";
import {getFestivalSemantics} from "@/lib/festival-conventions";
import {festivalPageIsIndexable,festivalYearSiblings} from "@/lib/festival-expansion";
import {buildFestivalYearQualityContext} from "@/lib/festival-parent-quality";
import {getFestivalRuleProfile} from "@/lib/religious-integrity";
import {robotsFor} from "@/lib/seo-policy";
import {parseRouteYear} from "@/lib/route-validation";

export const revalidate=86400;

export async function generateMetadata({params}:{params:Promise<{festival:string;year:string}>}):Promise<Metadata>{
  const p=await params;
  const year=parseRouteYear(p.year);
  const f=year?festivalBySlugYear(p.festival,year):undefined;
  if(!year||!f)notFound();
  const semantics=getFestivalSemantics(f);
  return {
    title:`${f.name} ${year} — Date, Meaning & Panchang Rule Context`,
    description:`${f.name} ${year}: ${f.date}. ${semantics.displayShort} See the observance rule context and open a city page for local Panchang values.`,
    alternates:{canonical:`/festivals/${f.slug}/${year}`},
    robots:robotsFor(festivalPageIsIndexable(f.slug,year))
  };
}

export default async function FestivalPage({params}:{params:Promise<{festival:string;year:string}>}){
  const p=await params;
  const year=parseRouteYear(p.year);
  const f=year?festivalBySlugYear(p.festival,year):undefined;
  if(!year||!f)notFound();

  const semantics=getFestivalSemantics(f);
  const ruleProfile=getFestivalRuleProfile(f);
  const quality=await buildFestivalYearQualityContext(f);
  const month=String(Number(f.date.slice(5,7))).padStart(2,"0");
  const siblingYears=festivalYearSiblings(f.slug,year);
  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"WebPage","name":`${f.name} ${year}`,"url":`https://panchvani.com/festivals/${f.slug}/${year}`,"description":quality.directAnswer,"about":{"@type":"Thing","name":f.name}},
    {"@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":"Home","item":"https://panchvani.com/"},
      {"@type":"ListItem","position":2,"name":"Festivals","item":"https://panchvani.com/festivals/"},
      {"@type":"ListItem","position":3,"name":`${f.name} ${year}`}
    ]}
  ]};

  return <main><Header city={cities[0]}/><div className="page-shell internal-visual internal-festival">
    <div className="breadcrumbs"><Link href="/">Home</Link> / <Link href="/festivals">Festivals</Link> / {f.name}</div>
    <p className="page-kicker">HINDU FESTIVAL · {year}</p>
    <h1 className="page-title">{f.name}<br/>{year}</h1>
    <p className="page-subtitle">{quality.directAnswer}</p>

    <div className="data-grid">
      {quality.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}
    </div>

    <section className="wide-panel"><div className="seo-copy">
      <h2>{quality.contextTitle}</h2>
      <p>{quality.contextBody}</p>
      <h2>{quality.lunarTitle}</h2>
      <p>{quality.lunarBody}</p>
    </div></section>

    <section className="wide-panel"><div className="seo-copy">
      <h2>{quality.cityVariationTitle}</h2>
      <p>{quality.cityVariationBody}</p>
      <h2>{quality.observanceTitle}</h2>
      <p>{quality.observanceBody}</p>
    </div></section>

    <div className="seo-copy">
      <h2>Meaning and observance</h2>
      <p>{f.meaning}</p>
      <p>{semantics.displayShort}</p>
      {semantics.lunarConventionNote?<p><strong>Calendar convention:</strong> {semantics.lunarConventionNote}</p>:null}
    </div>

    <section className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>Common observances</h2>
      <div className="data-grid">{f.rituals.map(item=><div className="data-card" key={item}><small>Tradition</small><strong>{item}</strong></div>)}</div>
    </section>

    <section className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>Local Panchang by city</h2>
      <p className="page-subtitle">Choose a priority city to see local Tithi, lunar-month conventions, sunrise, sunset, moonrise and supported festival references. The shared festival date stays the same; local astronomical boundaries are recalculated for the selected city.</p>
      <div className="pill-links">{cities.slice(0,12).map(city=><Link href={`/festivals/${f.slug}/${year}/${city.slug}`} key={city.slug}>{city.name}</Link>)}</div>
    </section>

    <div className="pill-links">
      <Link href={`/festivals-calendar/${year}`}>All {year} festivals</Link>
      {siblingYears.map(item=><Link href={`/festivals/${item.slug}/${item.year}`} key={item.year}>{item.name} {item.year}</Link>)}
      {f.relatedMuhurat?<Link href={`/muhurat/${f.relatedMuhurat}/${year}/${month}`}>Related {f.relatedMuhurat.replaceAll("-"," ")} planning shortlist →</Link>:null}
    </div>

    <MethodologyNote title="Observance and calculation scope"><p>{ruleProfile.ruleSummary}</p><ul>{ruleProfile.criteria.map(item=><li key={item}>{item}</li>)}</ul><p>{ruleProfile.localReference}</p>{ruleProfile.limitations.length?<ul>{ruleProfile.limitations.map(item=><li key={item}>{item}</li>)}</ul>:null}<p>The shared festival date and city-local Panchang context are separate from tradition-specific observance selection.</p>{ruleProfile.sources.length?<p><strong>Reference methodology:</strong> {ruleProfile.sources.map((source,index)=><span key={source.label}>{index?" · ":""}{source.label}</span>)}</p>:null}</MethodologyNote>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}