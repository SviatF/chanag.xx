import Header from "@/components/Header";
import MethodologyNote from "@/components/MethodologyNote";
import {supportedCities} from "@/lib/cities";
import {getPanchang} from "@/lib/panchang";
import {parseIsoRouteDate} from "@/lib/route-validation";
import {resolveToolCity} from "@/lib/tool-expansion";

export const dynamic="force-dynamic";
export const metadata={title:"Moon Sign Calculator",description:"Estimate Chandra Rashi from birth date and city. Exact natal Moon Sign requires birth time.",alternates:{canonical:"/tools/moon-sign-calculator"}};

export default async function Page({searchParams}:{searchParams:Promise<{city?:string;date?:string}>}){
  const q=await searchParams;
  const city=resolveToolCity(q.city);
  const parsed=q.date?parseIsoRouteDate(q.date):null;
  const raw=parsed?parsed.toISOString().slice(0,10):"1995-01-01";
  const data=await getPanchang(parsed??new Date("1995-01-01T06:00:00Z"),city);
  const ld={"@context":"https://schema.org","@type":"WebApplication","name":"Moon Sign Calculator","applicationCategory":"LifestyleApplication","operatingSystem":"Web"};
  return <main><Header city={city}/><div className="page-shell internal-visual internal-tools">
    <p className="page-kicker">MOON SIGN CALCULATOR</p><h1 className="page-title">Moon Sign Calculator</h1>
    <p className="page-subtitle">Enter birth date and city to estimate the sidereal Chandra Rashi from Panchvani's local Panchang calculation.</p>
    <form className="wide-panel" method="get"><label>Birth city<br/><select name="city" defaultValue={city.slug}>{supportedCities.map(c=><option value={c.slug} key={c.slug}>{c.name}, {c.state}</option>)}</select></label><label>Birth date<br/><input type="date" name="date" defaultValue={raw}/></label><button className="gold-button" type="submit">Estimate Moon Sign →</button></form>
    <div className="data-grid"><div className="data-card"><small>Estimated Chandra Rashi</small><strong>{data.rashi}</strong></div><div className="data-card"><small>Nakshatra at sunrise</small><strong>{data.nakshatra}</strong></div><div className="data-card"><small>Pada at sunrise</small><strong>{data.nakshatraPada}</strong></div></div>
    <MethodologyNote><p>This estimate uses birth date and city at Panchvani's local-day reference. Exact natal Moon Sign requires birth time and location at that moment.</p></MethodologyNote>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}