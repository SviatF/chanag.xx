import Header from "@/components/Header";
import {cities} from "@/lib/cities";
import Link from "next/link";
import {expandedToolPath,expandedTools,expandedToolSlugs} from "@/lib/tool-expansion";

export const metadata={
  title:"Hindu Calendar Tools — Tithi, Nakshatra, Moon Phase, Rahu Kalam & Choghadiya",
  description:"Free Panchang and Hindu calendar tools for Tithi, Nakshatra, Moon phase, Hindu month, Rahu Kalam, Choghadiya and date lookup.",
  alternates:{canonical:"/tools"}
};

const existingTools=[
  ["Moon Sign Calculator","Estimate Chandra Rashi from a selected date and city. Exact natal Moon sign requires birth time.","/tools/moon-sign-calculator"],
  ["Nakshatra Finder","Estimate Nakshatra and Pada for a selected date and city. Exact Janma Nakshatra requires birth time.","/tools/nakshatra-finder"],
  ["Rahu Kalam Calculator","Calculate local Rahu Kalam for any supported Indian city and date.","/tools/rahu-kalam-calculator"],
  ["Today's Choghadiya","Choose a city for 8 daytime and 8 nighttime Choghadiya periods from local solar timings.","/tools/choghadiya"],
  ["Hindu Baby Names by Nakshatra","Browse all 27 Nakshatras with traditional Pada sounds and name ideas.","/tools/hindu-baby-names"]
] as const;

export default function Tools(){
  const evergreen=expandedToolSlugs.map(slug=>expandedTools[slug]);
  return <main><Header city={cities[0]}/><div className="page-shell internal-visual internal-tools">
    <p className="page-kicker">FREE PANCHANG TOOLS</p>
    <h1 className="page-title">Hindu calendar tools<br/>for dates, lunar values and local timings</h1>
    <p className="page-subtitle">Look up Tithi, Nakshatra, Moon phase, Hindu month and daily Panchang values, or calculate local timing periods for an Indian city.</p>
    <div className="tool-list">{evergreen.map(tool=><Link href={expandedToolPath(tool.slug)} key={tool.slug}><h3>{tool.name}</h3><p>{tool.description}</p><span className="page-kicker">Open free tool →</span></Link>)}</div>
    <div className="seo-copy"><h2>More Panchvani utilities</h2><p>Use the timing tools for location-sensitive Rahu Kalam and Choghadiya, or explore date-based Moon sign, Nakshatra and naming references. Date-only birth tools are estimates; precise natal calculations require birth time.</p></div>
    <div className="tool-list">{existingTools.map(([title,description,href])=><Link href={href} key={href}><h3>{title}</h3><p>{description}</p><span className="page-kicker">Open tool →</span></Link>)}</div>
  </div></main>;
}