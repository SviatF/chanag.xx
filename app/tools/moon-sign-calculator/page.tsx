import Header from "@/components/Header";
import {supportedCities} from "@/lib/cities";
import {getPanchang} from "@/lib/panchang";
import {parseIsoRouteDate} from "@/lib/route-validation";
import {resolveToolCity} from "@/lib/tool-expansion";

export const dynamic="force-dynamic";
export const metadata={title:"Moon Sign Calculator",description:"Estimate Chandra Rashi from birth date and city. Exact natal Moon Sign requires birth time."};

export default async function Page({searchParams}:{searchParams:Promise<{city?:string;date?:string}>}){
  const q=await searchParams;
  const city=resolveToolCity(q.city);
  const parsed=q.date?parseIsoRouteDate(q.date):null;
  const raw=parsed?parsed.toISOString().slice(0,10):"1995-01-01";
  const data=await getPanchang(parsed??new Date("1995-01-01T06:00:00Z"),city);
  const ld={"@context":"https://schema.org","@type":"WebApplication","name":"Moon Sign Calculator","applicationCategory":"LifestyleApplication","operatingSystem":"Web"};
  return <main><Header city={city}/><div className="page-shell internal-visual internal-tools">
    <p className="page-kicker">DATE-ONLY BIRTH ESTIMATE</p><h1 className="page-title">Moon Sign Calculator</h1>
    <p className="page-subtitle">Enter birth date and city to estimate the sidereal Chandra Rashi from the Panchang layer. Because this tool does not ask for birth time, treat the result as a date-level estimate rather than an exact natal chart calculation.</p>
    <form className="wide-panel" method="get"><label>Birth city<br/><select name="city" defaultValue={city.slug}>{supportedCities.map(c=><option value={c.slug} key={c.slug}>{c.name}, {c.state}</option>)}</select></label><label>Birth date<br/><input type="date" name="date" defaultValue={raw}/></label><button className="gold-button" type="submit">Estimate Moon Sign →</button></form>
    <div className="data-grid"><div className="data-card"><small>Estimated Chandra Rashi</small><strong>{data.rashi}</strong></div><div className="data-card"><small>Nakshatra at sunrise</small><strong>{data.nakshatra}</strong></div><div className="data-card"><small>Pada at sunrise</small><strong>{data.nakshatraPada}</strong></div></div>
    <div className="seo-copy"><h2>Accuracy note</h2><p>The Moon can change Nakshatra or Rashi during a calendar day. Exact birth-time astrology needs the birth time and location at that moment; this tool evaluates the Panchang state at the engine's local-day reference.</p></div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
