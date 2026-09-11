import Header from "@/components/Header";
import {supportedCities} from "@/lib/cities";
import {formatPanchangTime,getPanchang} from "@/lib/panchang";
import {parseIsoRouteDate} from "@/lib/route-validation";
import {resolveToolCity} from "@/lib/tool-expansion";

export const dynamic="force-dynamic";
export const metadata={title:"Nakshatra Finder",description:"Estimate birth Nakshatra and Pada from birth date and city. Exact natal Nakshatra requires birth time.",alternates:{canonical:"/tools/nakshatra-finder"}};

export default async function Page({searchParams}:{searchParams:Promise<{city?:string;date?:string}>}){
  const q=await searchParams;
  const city=resolveToolCity(q.city);
  const parsed=q.date?parseIsoRouteDate(q.date):null;
  const raw=parsed?parsed.toISOString().slice(0,10):"1995-01-01";
  const data=await getPanchang(parsed??new Date("1995-01-01T06:00:00Z"),city);
  const nakshatraEnd=formatPanchangTime(data.nakshatraEnd,data.nakshatraEndDate,data.date);
  return <main><Header city={city}/><div className="page-shell internal-visual internal-tools">
    <p className="page-kicker">DATE-ONLY BIRTH ESTIMATE</p><h1 className="page-title">Nakshatra Finder</h1>
    <p className="page-subtitle">Enter birth date and city to estimate the Nakshatra and Pada at local sunrise. This is a date-level Panchang estimate, not an exact Janma Nakshatra calculation; exact natal Nakshatra requires birth time because the Moon can cross a Nakshatra boundary during the day.</p>
    <form className="wide-panel" method="get"><label>Birth city<br/><select name="city" defaultValue={city.slug}>{supportedCities.map(c=><option value={c.slug} key={c.slug}>{c.name}, {c.state}</option>)}</select></label><label>Birth date<br/><input type="date" name="date" defaultValue={raw}/></label><button className="gold-button" type="submit">Estimate Nakshatra →</button></form>
    <div className="data-grid"><div className="data-card"><small>Estimated Nakshatra at sunrise</small><strong>{data.nakshatra}</strong></div><div className="data-card"><small>Pada at sunrise</small><strong>{data.nakshatraPada}</strong></div><div className="data-card"><small>Moon Sign at sunrise</small><strong>{data.rashi}</strong></div><div className="data-card"><small>Nakshatra transition</small><strong>{nakshatraEnd}</strong></div></div>
    <div className="seo-copy"><h2>Accuracy note</h2><p>This date-only utility evaluates the Panchang state at local sunrise. It should not be used as an exact birth-time result. For an exact Janma Nakshatra and Pada, Panchvani would need the precise birth time and birthplace and calculate the Moon's sidereal longitude at that instant.</p></div>
  </div></main>;
}