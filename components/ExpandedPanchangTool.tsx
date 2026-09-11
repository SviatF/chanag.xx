import Link from "next/link";
import Header from "@/components/Header";
import ToolLookupForm from "@/components/ToolLookupForm";
import TopicalGraph from "@/components/TopicalGraph";
import {formatPanchangTime,formatWindow,getPanchang} from "@/lib/panchang";
import {getLunarMonthConventions,type LunarMonthConventions} from "@/lib/calendar-conventions";
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

function ResultCards({slug,data,lunar}:{slug:ExpandedToolSlug;data:Awaited<ReturnType<typeof getPanchang>>;lunar:LunarMonthConventions}){
  const tithiEnd=formatPanchangTime(data.tithiEnd,data.tithiEndDate,data.date);
  const nakshatraEnd=formatPanchangTime(data.nakshatraEnd,data.nakshatraEndDate,data.date);
  const moonrise=formatPanchangTime(data.moonrise,data.moonriseDate,data.date);
  const moonset=formatPanchangTime(data.moonset,data.moonsetDate,data.date);

  if(slug==="tithi-finder")return <div className="data-grid">
    <div className="data-card"><small>Tithi</small><strong>{data.tithi}</strong><small>{data.paksha} Paksha</small></div>
    <div className="data-card"><small>Tithi ends</small><strong>{tithiEnd}</strong><small>India local civil time</small></div>
    <div className="data-card"><small>Amanta month</small><strong>{lunar.amantaLabel}</strong></div>
    <div className="data-card"><small>Purnimanta month</small><strong>{lunar.purnimantaLabel}</strong></div>
    <div className="data-card"><small>Moon illumination</small><strong>{data.moonIllumination}%</strong></div>
  </div>;
  if(slug==="nakshatra-today")return <div className="data-grid">
    <div className="data-card"><small>Nakshatra</small><strong>{data.nakshatra}</strong><small>Pada {data.nakshatraPada}</small></div>
    <div className="data-card"><small>Nakshatra ends</small><strong>{nakshatraEnd}</strong><small>India local civil time</small></div>
    <div className="data-card"><small>Chandra Rashi</small><strong>{data.rashi}</strong></div>
    <div className="data-card"><small>Tithi</small><strong>{data.tithi}</strong><small>{data.paksha} Paksha</small></div>
  </div>;
  if(slug==="moon-phase")return <div className="data-grid">
    <div className="data-card"><small>Moon phase</small><strong>{moonPhaseName(data)}</strong></div>
    <div className="data-card"><small>Illumination</small><strong>{data.moonIllumination}%</strong></div>
    <div className="data-card"><small>Paksha</small><strong>{data.paksha}</strong><small>{data.tithi}</small></div>
    <div className="data-card"><small>Moonrise</small><strong>{moonrise}</strong><small>Moonset {moonset}</small></div>
  </div>;
  if(slug==="hindu-month-finder")return <div className="data-grid">
    <div className="data-card"><small>Amanta lunar month</small><strong>{lunar.amantaLabel}</strong><small>Month ends at Amavasya</small></div>
    <div className="data-card"><small>Purnimanta lunar month</small><strong>{lunar.purnimantaLabel}</strong><small>Month ends at Purnima</small></div>
    <div className="data-card"><small>Tithi</small><strong>{data.tithi}</strong><small>{data.paksha} Paksha</small></div>
    <div className="data-card"><small>Vikram Samvat</small><strong>{data.vikramSamvat}</strong><small>Chaitradi year</small></div>
    <div className="data-card"><small>Shaka Samvat</small><strong>{data.shakaSamvat}</strong><small>Chaitradi year</small></div>
  </div>;
  return <div className="data-grid">
    <div className="data-card"><small>Tithi</small><strong>{data.tithi}</strong><small>{data.paksha} · until {tithiEnd}</small></div>
    <div className="data-card"><small>Nakshatra</small><strong>{data.nakshatra}</strong><small>Pada {data.nakshatraPada} · until {nakshatraEnd}</small></div>
    <div className="data-card"><small>Yoga</small><strong>{data.yoga}</strong></div>
    <div className="data-card"><small>Karana</small><strong>{data.karana}</strong></div>
    <div className="data-card"><small>Sunrise</small><strong>{data.sunrise}</strong><small>Sunset {data.sunset}</small></div>
    <div className="data-card"><small>Rahu Kalam</small><strong>{formatWindow(data.rahu)}</strong></div>
    <div className="data-card"><small>Amanta month</small><strong>{lunar.amantaLabel}</strong></div>
    <div className="data-card"><small>Purnimanta month</small><strong>{lunar.purnimantaLabel}</strong></div>
    <div className="data-card"><small>Moon phase</small><strong>{moonPhaseName(data)}</strong><small>{data.moonIllumination}% illuminated</small></div>
  </div>;
}

function Explanation({slug}:{slug:ExpandedToolSlug}){
  if(slug==="tithi-finder")return <><h2>How the Tithi is determined</h2><p>Panchvani derives Tithi from the angular separation between the Moon and Sun. Each 12° interval forms one Tithi. The displayed Tithi is evaluated at local sunrise, and the transition time is refined by the same Panchang engine.</p></>;
  if(slug==="nakshatra-today")return <><h2>How today's Nakshatra is determined</h2><p>The sidereal lunar longitude is calculated with Lahiri ayanamsha and divided into 27 Nakshatras. Each Nakshatra is divided into four Padas. The result is evaluated at local sunrise for the selected city and date.</p></>;
  if(slug==="moon-phase")return <><h2>How the Moon phase is classified</h2><p>Illumination comes from the Sun–Moon elongation used by the Panchang calculation. Panchvani combines illumination with Shukla/Krishna Paksha to distinguish waxing from waning phases.</p></>;
  if(slug==="hindu-month-finder")return <><h2>Why two Hindu month names can appear</h2><p>Amanta months end at Amavasya, while Purnimanta months end at Purnima. During Krishna Paksha the two systems commonly use adjacent month names for the same astronomical day. Panchvani shows both rather than treating one convention as universal. A month with no sidereal solar ingress between its two new moons is marked as Adhika.</p></>;
  return <><h2>One-date Panchang lookup</h2><p>Select any supported Indian city and date to open the calculated Tithi, Nakshatra, Yoga, Karana, both major lunar-month conventions and local solar timings, with a direct link to the full daily Panchang.</p></>;
}

export default async function ExpandedPanchangTool({slug,searchParams}:{slug:ExpandedToolSlug;searchParams:Promise<{city?:string;date?:string}>}){
  const query=await searchParams;
  const city=resolveToolCity(query.city);
  const date=resolveToolDate(query.date);
  const dateIso=toolDateIso(date);
  const data=await getPanchang(date,city);
  const lunar=getLunarMonthConventions(date,city,data);
  const tool=expandedTools[slug];
  const otherTools=(Object.keys(expandedTools) as ExpandedToolSlug[]).filter(item=>item!==slug).slice(0,4);
  const graph:TopicalGraphGroup[]=[
    {title:"Full Panchang context",description:"Open the full date and city pages behind this calculated result.",links:[
      {href:`/panchang/${city.slug}/${dateIso}`,label:`Full Panchang · ${city.name} · ${dateIso}`},
      {href:`/calendar/${city.slug}/${dateIso.slice(0,4)}/${dateIso.slice(5,7)}`,label:`Monthly calendar · ${city.name}`},
      {href:`/tools/choghadiya/${city.slug}`,label:`Today's Choghadiya · ${city.name}`}
    ]},
    {title:"Related calculators",description:"Other utilities powered by the same Panchang calculation layer.",links:otherTools.map(item=>({href:expandedToolPath(item),label:expandedTools[item].shortName}))}
  ];
  const ld=toolHubJsonLd(tool);

  return <main><Header city={city}/><div className="page-shell internal-visual internal-tools">
    <div className="breadcrumbs"><Link href="/tools">Tools</Link> / {tool.shortName}</div>
    <p className="page-kicker">{tool.kicker}</p>
    <h1 className="page-title">{tool.name}</h1>
    <p className="page-subtitle">{tool.description} Current result: {city.name}, {data.date}.</p>
    <ToolLookupForm city={city} date={dateIso} submitLabel={tool.submitLabel}/>
    <ResultCards slug={slug} data={data} lunar={lunar}/>
    <div className="seo-copy"><Explanation slug={slug}/><p>Calculation engine: {data.engine}. Local sunrise and sunset are calculated for the selected city using {data.sunriseConvention.toLowerCase()}. Times that continue after midnight include the following civil date.</p></div>
    <TopicalGraph title={`Explore ${tool.shortName} context`} groups={graph}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
