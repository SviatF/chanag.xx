import type {Metadata} from "next";
import Link from "next/link";
import Header from "@/components/Header";
import DayWheel from "@/components/DayWheel";
import ChoghadiyaTable from "@/components/ChoghadiyaTable";
import {cityBySlug,cities} from "@/lib/cities";
import {formatWindow,getPanchang} from "@/lib/panchang";
import {todayInIndia} from "@/lib/dates";

export const dynamic="force-dynamic";

function parseDate(parts?:string[]){
  const raw=parts?.[0];
  if(raw&&/^\d{4}-\d{2}-\d{2}$/.test(raw)) return new Date(raw+"T06:00:00Z");
  return todayInIndia();
}

export async function generateMetadata({params}:{params:Promise<{city:string,date?:string[]}>}):Promise<Metadata>{
  const p=await params;const city=cityBySlug(p.city);const date=parseDate(p.date);
  const ds=date.toISOString().slice(0,10);
  return {title:`Today Panchang in ${city.name} — ${ds}`,description:`Panchang for ${city.name}: Tithi, Nakshatra, sunrise, sunset, Rahu Kalam, Yamaganda, Gulika and Abhijit Muhurat for ${ds}.`,alternates:{canonical:`/panchang/${city.slug}/${ds}`}};
}

export default async function PanchangPage({params}:{params:Promise<{city:string,date?:string[]}>}){
  const p=await params;const city=cityBySlug(p.city);const date=parseDate(p.date);const data=await getPanchang(date,city);
  const prev=new Date(date);prev.setUTCDate(prev.getUTCDate()-1);const next=new Date(date);next.setUTCDate(next.getUTCDate()+1);
  const month=String(date.getUTCMonth()+1).padStart(2,"0");
  const faq=[
    {q:`What is Rahu Kalam today in ${city.name}?`,a:`Rahu Kalam in ${city.name} is ${formatWindow(data.rahu)} for ${data.date}.`},
    {q:`What is today's Tithi in ${city.name}?`,a:`Today's Tithi is ${data.tithi}, during ${data.paksha} Paksha.`},
    {q:`What is today's Nakshatra in ${city.name}?`,a:`The Nakshatra calculated for the day is ${data.nakshatra}.`}
  ];
  const ld={ "@context":"https://schema.org","@graph":[
    {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://panchang.in/"},{"@type":"ListItem","position":2,"name":city.name,"item":`https://panchang.in/panchang/${city.slug}/`},{"@type":"ListItem","position":3,"name":data.date}]},
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
    <div className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Choghadiya</h2><p className="page-subtitle">Eight daytime and eight nighttime periods calculated from local sunrise, sunset and the next sunrise.</p><ChoghadiyaTable day={data.dayChoghadiya} night={data.nightChoghadiya}/></div>
    <div className="pill-links"><Link href={`/panchang/${city.slug}/${prev.toISOString().slice(0,10)}`}>← Previous day</Link><Link href={`/calendar/${city.slug}/${date.getUTCFullYear()}/${month}`}>Monthly calendar</Link><Link href={`/panchang/${city.slug}/${next.toISOString().slice(0,10)}`}>Next day →</Link>{cities.filter(c=>c.state===city.state&&c.slug!==city.slug).slice(0,4).map(c=><Link href={`/panchang/${c.slug}/${data.date}`} key={c.slug}>{c.name}</Link>)}</div>
    <div className="seo-copy"><h2>How to use today’s Panchang</h2><p>The daily Panchang combines lunar factors such as Tithi and Nakshatra with location-sensitive solar timings. Rahu Kalam, Yamaganda and Gulika change with local sunrise and sunset, which is why the selected city matters. Use the timing bands above as a practical daily reference, and consult a qualified practitioner for personal rites that depend on an individual birth chart.</p></div>
    <div className="wide-panel"><h2>Frequently asked questions</h2>{faq.map(x=><div key={x.q} className="seo-copy"><strong>{x.q}</strong><p>{x.a}</p></div>)}</div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>
}
