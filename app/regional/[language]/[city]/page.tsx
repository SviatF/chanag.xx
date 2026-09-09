import type { Metadata } from "next";
import Header from "@/components/Header";
import { cityBySlug } from "@/lib/cities";
import { getPanchang, formatWindow } from "@/lib/panchang";
import { regional } from "@/lib/regional";\nimport { todayInIndia } from "@/lib/dates";

export const dynamic = "force-dynamic";

const hreflang: Record<string,string> = {
  bengali:"bn-IN",
  tamil:"ta-IN",
  malayalam:"ml-IN",
  gujarati:"gu-IN",
  marathi:"mr-IN",
};

export async function generateMetadata({params}:{params:Promise<{language:string;city:string}>}):Promise<Metadata>{
  const p=await params;
  const city=cityBySlug(p.city);
  const lang=(regional as any)[p.language]??regional.bengali;
  const languages:Record<string,string>={"en-IN":`/panchang/${city.slug}`};
  for(const [slug,code] of Object.entries(hreflang)) languages[code]=`/regional/${slug}/${city.slug}`;
  return {
    title:`${lang.label} in ${city.name}`,
    description:`${lang.label} for ${city.name} with Tithi, Nakshatra, sunrise, sunset and Rahu Kalam.`,
    alternates:{canonical:`/regional/${p.language}/${city.slug}`,languages}
  };
}

export default async function RegionalPage({params}:{params:Promise<{language:string;city:string}>}){
  const p=await params;
  const city=cityBySlug(p.city);
  const lang=(regional as any)[p.language]??regional.bengali;
  const data=await getPanchang(todayInIndia(),city);
  const t=lang.terms;
  return <main><Header city={city}/><div className="page-shell">
    <p className="page-kicker">{lang.label}</p>
    <h1 className="page-title">{t.today}<br/>{city.name}</h1>
    <div className="data-grid">
      <div className="data-card"><small>{t.tithi}</small><strong>{data.tithi}</strong><small>{data.tithiEnd}</small></div>
      <div className="data-card"><small>{t.nakshatra}</small><strong>{data.nakshatra}</strong><small>{data.nakshatraEnd}</small></div>
      <div className="data-card"><small>{t.sunrise}</small><strong>{data.sunrise}</strong></div>
      <div className="data-card"><small>{t.sunset}</small><strong>{data.sunset}</strong></div>
    </div>
    <div className="wide-panel"><div className="timing-row">
      <div className="timing-chip bad"><small>{t.rahu}</small><strong>{formatWindow(data.rahu)}</strong></div>
      <div className="timing-chip good"><small>{t.auspicious}</small><strong>{formatWindow(data.abhijit)}</strong></div>
    </div></div>
  </div></main>
}
