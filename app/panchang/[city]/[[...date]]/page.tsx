import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import DayWheel from "@/components/DayWheel";
import ChoghadiyaTable from "@/components/ChoghadiyaTable";
import TopicalGraph from "@/components/TopicalGraph";
import {findCityBySlug} from "@/lib/cities";
import {formatWindow,getPanchang} from "@/lib/panchang";
import {isDailyIndexable,robotsFor} from "@/lib/seo-policy";
import {getDailyGuidance} from "@/lib/day-guidance";
import {nextFestival} from "@/lib/festivals";
import {resolveDailyRouteDate} from "@/lib/route-validation";
import {buildDailyTopicalGraph} from "@/lib/topical-links";
import {vratLinkForTithi} from "@/lib/vrat-topical-links";

export const revalidate=3600;

export async function generateMetadata({params}:{params:Promise<{city:string,date?:string[]}>}):Promise<Metadata>{
  const p=await params;
  const city=findCityBySlug(p.city);
  const date=resolveDailyRouteDate(p.date);
  if(!city||!date)notFound();
  const ds=date.toISOString().slice(0,10);
  return {title:`Today Panchang in ${city.name} — ${ds}`,description:`Panchang for ${city.name}: Tithi, Nakshatra, sunrise, sunset, Rahu Kalam, Yamaganda, Gulika and Abhijit Muhurat for ${ds}.`,alternates:{canonical:`/panchang/${city.slug}/${ds}`},robots:robotsFor(isDailyIndexable(city.slug,ds))};
}

export default async function PanchangPage({params}:{params:Promise<{city:string,date?:string[]}>}){
  const p=await params;
  const city=findCityBySlug(p.city);
  const date=resolveDailyRouteDate(p.date);
  if(!city||!date)notFound();
  const data=await getPanchang(date,city);
  const guidance=getDailyGuidance(data,city);
  const festival=nextFestival(date);
  const topicalGroups=buildDailyTopicalGraph(city,date,festival);
  const vratLink=vratLinkForTithi(city,date,data.tithi);
  if(vratLink)topicalGroups.splice(1,0,{title:"Lunar observance",description:"This Tithi is part of a yearly sunrise-based lunar reference cluster.",links:[vratLink]});
  const faq=[
    {q:`What is Rahu Kalam today in ${city.name}?`,a:`Rahu Kalam in ${city.name} is ${formatWindow(data.rahu)} for ${data.date}.`},
    {q:`What is today's Tithi in ${city.name}?`,a:`Today's Tithi is ${data.tithi}, during ${data.paksha} Paksha.`},
    {q:`What is today's Nakshatra in ${city.name}?`,a:`The Nakshatra calculated for the day is ${data.nakshatra}.`},
    {q:`What is today favorable for in ${city.name}?`,a:`Today's Panchang signals favor ${guidance.auspicious.map(x=>x.title.toLowerCase()).join(", ")} when scheduled outside the inauspicious periods.`}
  ];
  const ld={ "@context":"https://schema.org","@graph":[
    {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://panchvani.com/"},{"@type":"ListItem","position":2,"name":city.name,"item":`https://panchvani.com/panchang/${city.slug}/`},{"@type":"ListItem","position":3,"name":data.date}]},
    {"@type":"FAQPage","mainEntity":faq.map(x=>({"@type":"Question","name":x.q,"acceptedAnswer":{"@type":"Answer","text":x.a}}))}
  ]};
  return <main><Header city={city}/><div className="page-shell internal-visual internal-panchang">
    <div className="breadcrumbs"><Link href="/">Home</Link> / <Link href={`/panchang/${city.slug}`}>{city.name}</Link> / {data.date}</div>
    <p className="page-kicker">DAILY PANCHANG · {city.state}</p><h1 className="page-title">{city.name} Panchang<br/>{data.date}</h1>
    <p className="page-subtitle">Precise local timings for {city.name}, including sunrise and sunset dependent periods. Calculation engine: {data.engine}.</p>
    <div className="wide-panel"><DayWheel data={data}/></div>
    <div className="data-grid">
      <div className="data-card"><small>Tithi</small><strong>{data.tithi}</strong><small>{data.paksha} Paksha · until {data.tithiEnd}</small></div>
      <div className="data-card"><small>Nakshatra</small><strong>{data.nakshatra}</strong><small>Pada {data.nakshatraPada} · until {data.nakshatraEnd}</small></div>
      <div className="data-card"><small>Yoga</small><strong>{data.yoga}</strong></div>
      <div className="data-card"><small>Karana</small><strong>{data.karana}</strong></div>
      <div className="data-card"><small>Sunrise</small><strong>{data.sunrise}</strong></div>
      <div className="data-card"><small>Sunset</small><strong>{data.sunset}</strong></div>
      <div className="data-card"><small>Moonrise</small><strong>{data.moonrise}</strong></div>
      <div className="data-card"><small>Moonset</small><strong>{data.moonset}</strong></div>
      <div className="data-card"><small>Hindu Month</small><strong>{data.hinduMonth}</strong></div>
      <div className="data-card"><small>Vikram Samvat</small><strong>{data.vikramSamvat}</strong></div>
      <div className="data-card"><small>Shaka Samvat</small><strong>{data.shakaSamvat}</strong></div>
      <div className="data-card"><small>Day Lord</small><strong>{data.dayLord}</strong></div>
    </div>
    <div className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Auspicious & avoid periods</h2><div className="timing-row">
      <div className="timing-chip good"><small>Abhijit Muhurat</small><strong>{formatWindow(data.abhijit)}</strong></div>
      <div className="timing-chip bad"><small>Rahu Kalam</small><strong>{formatWindow(data.rahu)}</strong></div>
      <div className="timing-chip bad"><small>Yamaganda</small><strong>{formatWindow(data.yamaganda)}</strong></div>
      <div className="timing-chip bad"><small>Gulika Kalam</small><strong>{formatWindow(data.gulika)}</strong></div>
    </div></div>
    <div className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>Auspicious today for</h2>
      <p className="page-subtitle">{guidance.summary}</p>
      <div className="data-grid">
        {guidance.auspicious.map(item=><div className="data-card" key={item.title}><small>Favorable signal</small><strong>{item.title}</strong><small>{item.detail}</small></div>)}
      </div>
      <h2 className="page-title" style={{fontSize:32,marginTop:28}}>Avoid today</h2>
      <div className="data-grid">
        {guidance.avoid.map(item=><div className="data-card" key={item.title}><small>Timing caution</small><strong>{item.title}</strong><small>{item.detail}</small></div>)}
      </div>
    </div>
    <div className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Choghadiya</h2><p className="page-subtitle">Eight daytime and eight nighttime periods calculated from local sunrise, sunset and the next sunrise.</p><ChoghadiyaTable day={data.dayChoghadiya} night={data.nightChoghadiya}/></div>
    <TopicalGraph title={`Explore ${city.name} Panchang`} groups={topicalGroups}/>
    <div className="seo-copy"><h2>How to use today’s Panchang</h2><p>The daily Panchang combines lunar factors such as Tithi and Nakshatra with location-sensitive solar timings. Rahu Kalam, Yamaganda and Gulika change with local sunrise and sunset, which is why the selected city matters. Use the timing bands above as a practical daily reference, and consult a qualified practitioner for personal rites that depend on an individual birth chart.</p></div>
    <div className="wide-panel"><h2>Frequently asked questions</h2>{faq.map(x=><div key={x.q} className="seo-copy"><strong>{x.q}</strong><p>{x.a}</p></div>)}</div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>
}