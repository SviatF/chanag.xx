import Link from "next/link";
import Header from "@/components/Header";
import ToolLookupForm from "@/components/ToolLookupForm";
import TopicalGraph from "@/components/TopicalGraph";
import {formatWindow,getPanchang} from "@/lib/panchang";
import {
  expandedTools,
  expandedToolPath,
  moonPhaseName,
  resolveToolCity,
  resolveToolDate,
  toolDateIso,
  toolHubJsonLd,
  type ExpandedToolSlug,
} from "@/lib/tool-expansion";
import type {TopicalGraphGroup} from "@/lib/topical-types";

function ResultCards({slug,data}:{slug:ExpandedToolSlug;data:Awaited<ReturnType<typeof getPanchang>>}){
  if(slug==="tithi-finder")return <div className="data-grid">
    <div className="data-card"><small>Tithi</small><strong>{data.tithi}</strong><small>{data.paksha} Paksha</small></div>
    <div className="data-card"><small>Tithi ends</small><strong>{data.tithiEnd}</strong><small>Local IST clock time</small></div>
    <div className="data-card"><small>Hindu month</small><strong>{data.hinduMonth}</strong><small>Amanta system</small></div>
    <div className="data-card"><small>Moon illumination</small><strong>{data.moonIllumination}%</strong></div>
  </div>;
  if(slug==="nakshatra-today")return <div className="data-grid">
    <div className="data-card"><small>Nakshatra</small><strong>{data.nakshatra}</strong><small>Pada {data.nakshatraPada}</small></div>
    <div className="data-card"><small>Nakshatra ends</small><strong>{data.nakshatraEnd}</strong><small>Local IST clock time</small></div>
    <div className="data-card"><small>Chandra Rashi</small><strong>{data.rashi}</strong></div>
    <div className="data-card"><small>Tithi</small><strong>{data.tithi}</strong><small>{data.paksha} Paksha</small></div>
  </div>;
  if(slug==="moon-phase")return <div className="data-grid">
    <div className="data-card"><small>Moon phase</small><strong>{moonPhaseName(data)}</strong></div>
    <div className="data-card"><small>Illumination</small><strong>{data.moonIllumination}%</strong></div>
    <div className="data-card"><small>Paksha</small><strong>{data.paksha}</strong><small>{data.tithi}</small></div>
    <div className="data-card"><small>Moonrise</small><strong>{data.moonrise}</strong><small>Moonset {data.moonset}</small></div>
  </div>;
  if(slug==="hindu-month-finder")return <div className="data-grid">
    <div className="data-card"><small>Hindu lunar month</small><strong>{data.hinduMonth}</strong><small>Amanta convention</small></div>
    <div className="data-card"><small>Tithi</small><strong>{data.tithi}</strong><small>{data.paksha} Paksha</small></div>
    <div className="data-card"><small>Vikram Samvat</small><strong>{data.vikramSamvat}</strong></div>
    <div className="data-card"><small>Shaka Samvat</small><strong>{data.shakaSamvat}</strong></div>
  </div>;
  return <div className="data-grid">
    <div className="data-card"><small>Tithi</small><strong>{data.tithi}</strong><small>{data.paksha} · until {data.tithiEnd}</small></div>
    <div className="data-card"><small>Nakshatra</small><strong>{data.nakshatra}</strong><small>Pada {data.nakshatraPada} · until {data.nakshatraEnd}</small></div>
    <div className="data-card"><small>Yoga</small><strong>{data.yoga}</strong></div>
    <div className="data-card"><small>Karana</small><strong>{data.karana}</strong></div>
    <div className="data-card"><small>Sunrise</small><strong>{data.sunrise}</strong><small>Sunset {data.sunset}</small></div>
    <div className="data-card"><small>Rahu Kalam</small><strong>{formatWindow(data.rahu)}</strong></div>
    <div className="data-card"><small>Hindu month</small><strong>{data.hinduMonth}</strong></div>
    <div className="data-card"><small>Moon phase</small><strong>{moonPhaseName(data)}</strong><small>{data.moonIllumination}% illuminated</small></div>
  </div>;
}

function Explanation({slug}:{slug:ExpandedToolSlug}){
  if(slug==="tithi-finder")return <><h2>How the Tithi is determined</h2><p>Panchvani derives Tithi from the angular separation between the Moon and Sun. Each 12° interval forms one Tithi. The displayed Tithi is evaluated at local sunrise, and the transition time is refined by the same Panchang engine.</p></>;
  if(slug==="nakshatra-today")return <><h2>How today's Nakshatra is determined</h2><p>The sidereal lunar longitude is calculated with Lahiri ayanamsha and divided into 27 Nakshatras. Each Nakshatra is divided into four Padas. The result is evaluated at local sunrise for the selected city and date.</p></>;
  if(slug==="moon-phase")return <><h2>How the Moon phase is classified</h2><p>Illumination comes from the Sun–Moon elongation used by the Panchang calculation. Panchvani combines illumination with Shukla/Krishna Paksha to distinguish waxing from waning phases.</p></>;
  if(slug==="hindu-month-finder")return <><h2>How the Hindu month is determined</h2><p>This tool uses the Amanta convention already implemented in Panchvani: the lunar month is derived from the sidereal solar sign around the previous new moon. Regional calendars can use different month conventions.</p></>;
  return <><h2>One-date Panchang lookup</h2><p>This tool is an evergreen lookup interface. The detailed date-and-city Panchang remains the canonical daily content surface, while this page helps users select any supported city and date without creating a separate indexed query-parameter URL.</p></>;
}

export default async function ExpandedPanchangTool({slug,searchParams}:{slug:ExpandedToolSlug;searchParams:Promise<{city?:string;date?:string}>}){
  const query=await searchParams;
  const city=resolveToolCity(query.city);
  const date=resolveToolDate(query.date);
  const dateIso=toolDateIso(date);
  const data=await getPanchang(date,city);
  const tool=expandedTools[slug];
  const otherTools=(Object.keys(expandedTools) as ExpandedToolSlug[]).filter(item=>item!==slug).slice(0,4);
  const graph:TopicalGraphGroup[]=[
    {title:"Full Panchang context",description:"Open the canonical date and city pages behind this calculated result.",links:[
      {href:`/panchang/${city.slug}/${dateIso}`,label:`Full Panchang · ${city.name} · ${dateIso}`},
      {href:`/calendar/${city.slug}/${dateIso.slice(0,4)}/${dateIso.slice(5,7)}`,label:`Monthly calendar · ${city.name}`},
      {href:`/tools/choghadiya/${city.slug}`,label:`Today's Choghadiya · ${city.name}`}
    ]},
    {title:"Related calculators",description:"Evergreen utilities powered by the same calculation layer.",links:otherTools.map(item=>({href:expandedToolPath(item),label:expandedTools[item].shortName}))}
  ];
  const ld=toolHubJsonLd(tool);

  return <main><Header city={city}/><div className="page-shell internal-visual internal-tools">
    <div className="breadcrumbs"><Link href="/tools">Tools</Link> / {tool.shortName}</div>
    <p className="page-kicker">{tool.kicker}</p>
    <h1 className="page-title">{tool.name}</h1>
    <p className="page-subtitle">{tool.description} Current result: {city.name}, {data.date}.</p>
    <ToolLookupForm city={city} date={dateIso} submitLabel={tool.submitLabel}/>
    <ResultCards slug={slug} data={data}/>
    <div className="seo-copy"><Explanation slug={slug}/><p>Calculation engine: {data.engine}. City selection affects local sunrise/sunset-based values; the URL query parameters are inputs, not separate indexable landing pages.</p></div>
    <TopicalGraph title={`Explore ${tool.shortName} context`} groups={graph}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
