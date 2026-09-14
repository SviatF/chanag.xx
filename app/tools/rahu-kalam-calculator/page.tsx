import Header from "@/components/Header";
import MethodologyNote from "@/components/MethodologyNote";
import {cityBySlug,supportedCities} from "@/lib/cities";
import {formatWindow,getPanchang} from "@/lib/panchang";
import {todayInIndia} from "@/lib/dates";
import {parseIsoRouteDate} from "@/lib/route-validation";

export const dynamic="force-dynamic";
export const metadata={title:"Rahu Kalam Calculator",description:"Calculate Rahu Kalam for any supported Indian city and date.",alternates:{canonical:"/tools/rahu-kalam-calculator"}};

export default async function Page({searchParams}:{searchParams:Promise<{city?:string;date?:string}>}){
  const q=await searchParams;
  const city=cityBySlug(q.city??"mumbai");
  const parsed=q.date?parseIsoRouteDate(q.date):null;
  const date=parsed??todayInIndia();
  const raw=date.toISOString().slice(0,10);
  const data=await getPanchang(date,city);
  const ld={"@context":"https://schema.org","@type":"WebApplication","name":"Rahu Kalam Calculator","applicationCategory":"LifestyleApplication","operatingSystem":"Web"};
  return <main><Header city={city}/><div className="page-shell internal-visual internal-tools">
    <p className="page-kicker">CALCULATOR</p><h1 className="page-title">Rahu Kalam Calculator</h1>
    <p className="page-subtitle">Calculate Rahu Kalam for any supported city and date.</p>
    <form className="wide-panel" method="get"><label>City<br/><select name="city" defaultValue={city.slug}>{supportedCities.map(c=><option value={c.slug} key={c.slug}>{c.name}, {c.state}</option>)}</select></label><label>Date<br/><input type="date" name="date" defaultValue={raw}/></label><button className="gold-button" type="submit">Calculate →</button></form>
    <div className="data-grid"><div className="data-card"><small>Rahu Kalam</small><strong>{formatWindow(data.rahu)}</strong></div><div className="data-card"><small>Sunrise</small><strong>{data.sunrise}</strong></div><div className="data-card"><small>Sunset</small><strong>{data.sunset}</strong></div><div className="data-card"><small>City</small><strong>{city.name}</strong></div></div>
    <MethodologyNote><p>Rahu Kalam uses one eighth of the selected city's local daylight interval, with the segment determined by weekday. Sunrise and sunset are recalculated for the selected civil date and city.</p></MethodologyNote>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}