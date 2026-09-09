import Link from "next/link";
import { ChevronDown, Search, UserRound } from "lucide-react";
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
      <Link href={`/panchang/${city.slug}`}>Panchang <ChevronDown size={12}/></Link>
      <Link href={`/calendar/${city.slug}/${year}/${month}`}>Calendar <ChevronDown size={12}/></Link>
      <Link href={`/festivals-calendar/${year}`}>Festivals <ChevronDown size={12}/></Link>
      <Link href={`/muhurat/wedding/${year}/${month}`}>Muhurat <ChevronDown size={12}/></Link>
      <Link href="/tools">Tools <ChevronDown size={12}/></Link>
      <Link href="/regional">Regional <ChevronDown size={12}/></Link>
    </nav>
    <div className="header-actions">
      <Link className="header-search" href="/cities" aria-label="Search cities"><Search size={18}/></Link>
      <CityCommand city={city} cities={cities}/>
      <span className="account-dot" aria-hidden="true"><UserRound size={15}/></span>
    </div>
  </header>
}
