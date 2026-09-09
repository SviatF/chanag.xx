import Header from "@/components/Header";
import { cities } from "@/lib/cities";
import Link from "next/link";

export const metadata={title:"Panchang by City"};
export default function Cities(){
  return <main><Header city={cities[0]}/><div className="page-shell">
    <p className="page-kicker">Hyperlocal India</p><h1 className="page-title">Panchang for your city.</h1>
    <p className="page-subtitle">Choose a city to get local sunrise, sunset, Rahu Kalam, Yamaganda, Gulika and auspicious timings calculated for that location.</p>
    <div className="city-directory">{cities.map(c=><Link href={`/panchang/${c.slug}`} key={c.slug}><strong>{c.name}</strong><small>{c.state}</small></Link>)}</div>
  </div></main>
}
