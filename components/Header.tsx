import Link from "next/link";
import { Search } from "lucide-react";
import { City, cities } from "@/lib/cities";
import { todayInIndia } from "@/lib/dates";
import CityCommand from "@/components/CityCommand";

export default function Header({city}:{city:City}) {
  const today=todayInIndia();
  const year=today.getUTCFullYear();
  const month=String(today.getUTCMonth()+1).padStart(2,"0");
  return <header className="site-header">
    <Link className="brand" href="/">PANCHANG</Link>
    <nav className="nav">
      <Link href={`/panchang/${city.slug}`}>Panchang</Link>
      <Link href={`/calendar/${city.slug}/${year}/${month}`}>Calendar</Link>
      <Link href={`/festivals-calendar/${year}`}>Festivals</Link>
      <Link href={`/muhurat/wedding/${year}/${month}`}>Muhurat</Link>
      <Link href="/tools">Tools</Link>
      <Link href="/regional">Regional</Link>
    </nav>
    <div className="header-actions">
      <Link className="header-search" href="/cities" aria-label="Search cities"><Search size={18}/></Link>
      <CityCommand city={city} cities={cities}/>
    </div>
  </header>
}
