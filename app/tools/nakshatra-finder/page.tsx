import Header from "@/components/Header";
import {supportedCities} from "@/lib/cities";
import {getPanchang} from "@/lib/panchang";
import {parseIsoRouteDate} from "@/lib/route-validation";
import {resolveToolCity} from "@/lib/tool-expansion";

export const dynamic="force-dynamic";
export const metadata={title:"Nakshatra Finder",description:"Estimate birth Nakshatra and Pada from birth date and city. Exact natal Nakshatra requires birth time."};

export default async function Page({searchParams}:{searchParams:Promise<{city?:string;date?:string}>}){
  const q=await searchParams;
  const city=resolveToolCity(q.city);
  const parsed=q.date?parseIsoRouteDate(q.date):null;
  const raw=parsed?parsed.toISOString().slice(0,10):"1995-01-01";
  const data=await getPanchang(parsed??new Date("1995-01-01T06:00:00Z"),city);
  return <main><Header city={city}/><div className="page-shell internal-visual internal-tools">
    <p className="page-kicker">DATE-ONLY BIRTH ESTIMATE</p><h1 className="page-title">Nakshatra Finder</h1>
    <p className="page-subtitle">Enter birth date and city to estimate the Nakshatra and Pada at the Panchang engine's local-day reference. Exact natal Nakshatra requires birth time because the Moon can cross a Nakshatra boundary during the day.</p>
    <form className="wide-panel" method="get"><label>Birth city<br/><select name="city" defaultValue={city.slug}>{supportedCities.map(c=><option value={c.slug} key={c.slug}>{c.name}, {c.state}</option>)}</select></label><label>Birth date<br/><input type="date" name="date" defaultValue={raw}/></label><button className="gold-button" type="submit">Estimate Nakshatra →</button></form>
    <div className="data-grid"><div className="data-card"><small>Estimated Nakshatra</small><strong>{data.nakshatra}</strong></div><div className="data-card"><small>Pada at sunrise</small><strong>{data.nakshatraPada}</strong></div><div className="data-card"><small>Moon Sign at sunrise</small><strong>{data.rashi}</strong></div><div className="data-card"><small>Nakshatra transition</small><strong>{data.nakshatraEnd}</strong></div></div>
    <div className="seo-copy"><h2>Accuracy note</h2><p>This date-only utility is useful for a quick estimate. For an exact birth Nakshatra, Panchvani would need the precise birth time and location and calculate the Moon's sidereal longitude at that moment.</p></div>
  </div></main>;
}
