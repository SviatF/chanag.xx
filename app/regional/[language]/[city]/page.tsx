import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import ChoghadiyaTable from "@/components/ChoghadiyaTable";
import { cityBySlug } from "@/lib/cities";
import { getPanchang, formatWindow } from "@/lib/panchang";
import { regional } from "@/lib/regional";
import { todayInIndia } from "@/lib/dates";
import { getBengaliPanjikaProfile } from "@/lib/bengali-panjika";
import { isRegionalIndexable, robotsFor } from "@/lib/seo-policy";

export const revalidate = 3600;

const hreflang: Record<string,string> = {
  bengali:"bn-IN",
  tamil:"ta-IN",
  malayalam:"ml-IN",
  gujarati:"gu-IN",
  marathi:"mr-IN",
};

const bengaliTithi:Record<string,string>={
  Pratipada:"প্রতিপদ",Dvitiya:"দ্বিতীয়া",Tritiya:"তৃতীয়া",Chaturthi:"চতুর্থী",Panchami:"পঞ্চমী",
  Shashthi:"ষষ্ঠী",Saptami:"সপ্তমী",Ashtami:"অষ্টমী",Navami:"নবমী",Dashami:"দশমী",
  Ekadashi:"একাদশী",Dwadashi:"দ্বাদশী",Trayodashi:"ত্রয়োদশী",Chaturdashi:"চতুর্দশী",
  Purnima:"পূর্ণিমা",Amavasya:"অমাবস্যা"
};

export async function generateMetadata({params}:{params:Promise<{language:string;city:string}>}):Promise<Metadata>{
  const p=await params;
  const city=cityBySlug(p.city);
  const lang=(regional as any)[p.language]??regional.bengali;
  const languages:Record<string,string>={"en-IN":`/panchang/${city.slug}`};
  for(const [slug,code] of Object.entries(hreflang)) languages[code]=`/regional/${slug}/${city.slug}`;
  return {
    title:`${lang.label} in ${city.name}`,
    description:`${lang.label} for ${city.name} with Tithi, Nakshatra, sunrise, sunset, Rahu Kalam and regional calendar data.`,
    alternates:{canonical:`/regional/${p.language}/${city.slug}`,languages},
    robots:robotsFor(isRegionalIndexable(p.language,city))
  };
}

export default async function RegionalPage({params}:{params:Promise<{language:string;city:string}>}){
  const p=await params;
  const city=cityBySlug(p.city);
  const lang=(regional as any)[p.language]??regional.bengali;
  const data=await getPanchang(todayInIndia(),city);
  const t=lang.terms;
  const isBengali=p.language==="bengali";
  const bengali=isBengali?getBengaliPanjikaProfile(data):null;

  const displayTithi=isBengali?(bengaliTithi[data.tithi]??data.tithi):data.tithi;

  return <main><Header city={city}/><div className="page-shell internal-visual internal-regional">
    <div className="breadcrumbs"><Link href="/regional">Regional</Link> / {lang.label} / {city.name}</div>
    <p className="page-kicker">{lang.label} · {city.state}</p>
    <h1 className="page-title">{t.today}<br/>{city.name}</h1>
    <p className="page-subtitle">
      {isBengali&&bengali
        ? `${bengali.calendarLabel} · ${bengali.month.native} (${bengali.month.en}) · ${bengali.yearLabel}`
        : `Regional Panchang terminology for ${city.name}, calculated from the same local astronomical engine.`}
    </p>

    <div className="data-grid">
      <div className="data-card"><small>{t.tithi}</small><strong>{displayTithi}</strong><small>{data.paksha} Paksha · until {data.tithiEnd}</small></div>
      <div className="data-card"><small>{t.nakshatra}</small><strong>{data.nakshatra}</strong><small>Pada {data.nakshatraPada} · until {data.nakshatraEnd}</small></div>
      <div className="data-card"><small>Yoga</small><strong>{data.yoga}</strong></div>
      <div className="data-card"><small>Karana</small><strong>{data.karana}</strong></div>
      <div className="data-card"><small>{t.sunrise}</small><strong>{data.sunrise}</strong></div>
      <div className="data-card"><small>{t.sunset}</small><strong>{data.sunset}</strong></div>
      <div className="data-card"><small>Moonrise</small><strong>{data.moonrise}</strong></div>
      <div className="data-card"><small>Moonset</small><strong>{data.moonset}</strong></div>
      {bengali?<div className="data-card"><small>বাংলা মাস</small><strong>{bengali.month.native}</strong><small>{bengali.month.en} · {bengali.yearLabel}</small></div>:<div className="data-card"><small>Hindu Month</small><strong>{data.hinduMonth}</strong></div>}
      {bengali?<div className="data-card"><small>সৌর রাশি</small><strong>{bengali.solarSign}</strong></div>:null}
      <div className="data-card"><small>Vikram Samvat</small><strong>{data.vikramSamvat}</strong></div>
      <div className="data-card"><small>Shaka Samvat</small><strong>{data.shakaSamvat}</strong></div>
    </div>

    <div className="wide-panel"><div className="timing-row">
      <div className="timing-chip bad"><small>{t.rahu}</small><strong>{formatWindow(data.rahu)}</strong></div>
      <div className="timing-chip bad"><small>Yamaganda</small><strong>{formatWindow(data.yamaganda)}</strong></div>
      <div className="timing-chip bad"><small>Gulika</small><strong>{formatWindow(data.gulika)}</strong></div>
      <div className="timing-chip good"><small>{t.auspicious}</small><strong>{formatWindow(data.abhijit)}</strong></div>
    </div></div>

    <div className="wide-panel">
      <h2 className="page-title" style={{fontSize:32}}>Choghadiya</h2>
      <ChoghadiyaTable day={data.dayChoghadiya} night={data.nightChoghadiya}/>
    </div>

    {bengali?<div className="seo-copy"><h2>Bengali Panjika system</h2><p>This Bengali version does not simply rename the English interface. Its displayed Bengali month is derived from the sidereal solar sign: Boishakh begins with Mesha, followed by Joishtho, Asharh, Srabon, Bhadro, Ashshin, Kartik, Ogrohaeon, Poush, Magh, Falgun and Choitro. The Bengali year is calculated against that solar-year boundary.</p></div>:null}

    <div className="pill-links"><Link href={`/panchang/${city.slug}/${data.date}`}>English Daily Panchang</Link><Link href="/regional">All regional Panchang</Link></div>
  </div></main>;
}
