import Header from "@/components/Header";
import {coreCities,supportedCities} from "@/lib/cities";
import Link from "next/link";

export const metadata={
  title:"Panchang by City — India City Directory",
  description:"Browse Panchvani's supported Indian cities and open location-specific Panchang, sunrise, sunset, Rahu Kalam and auspicious timings."
};

export default function Cities(){
  const rows=[...supportedCities].sort((a,b)=>a.state.localeCompare(b.state)||a.name.localeCompare(b.name));
  return <main><Header city={coreCities[0]}/><div className="page-shell internal-visual internal-cities">
    <p className="page-kicker">Hyperlocal India · {supportedCities.length} supported cities</p><h1 className="page-title">Panchang for your city.</h1>
    <p className="page-subtitle">Choose any supported city to get local sunrise, sunset, Rahu Kalam, Yamaganda, Gulika and auspicious timings calculated for that location.</p>
    <div className="city-directory">{rows.map(c=><Link href={`/panchang/${c.slug}`} key={c.slug}><strong>{c.name}</strong><small>{c.state}</small></Link>)}</div>
  </div></main>;
}
