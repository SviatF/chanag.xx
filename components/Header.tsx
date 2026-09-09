import Link from "next/link";
import { MapPin, Search, ChevronDown } from "lucide-react";
import { City } from "@/lib/cities";

export default function Header({city}:{city:City}) {
  return <header className="site-header">
    <Link className="brand" href="/">PANCHANG</Link>
    <nav className="nav">
      <Link href={`/panchang/${city.slug}`}>Panchang <ChevronDown size={13}/></Link>
      <Link href={`/calendar/${city.slug}/2026/09`}>Calendar <ChevronDown size={13}/></Link>
      <Link href="/festivals/ganesh-chaturthi/2026">Festivals <ChevronDown size={13}/></Link>
      <Link href="/muhurat/wedding/2026/09">Muhurat <ChevronDown size={13}/></Link>
      <Link href="/tools">Tools <ChevronDown size={13}/></Link>
      <Link href="/regional">Regional <ChevronDown size={13}/></Link>
    </nav>
    <div className="header-actions">
      <Search size={18}/>
      <Link className="location-pill" href="/cities"><MapPin size={14}/>{city.name} · {city.state}</Link>
    </div>
  </header>
}
