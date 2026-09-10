import Header from "@/components/Header";
import {cities} from "@/lib/cities";
import Link from "next/link";
import {expandedToolPath,expandedTools,expandedToolSlugs} from "@/lib/tool-expansion";

export const metadata={
  title:"Hindu Calendar Tools — Tithi, Nakshatra, Moon Phase & Panchang",
  description:"Free Hindu calendar and Panchang calculators for Tithi, Nakshatra, Moon phase, Hindu month, Rahu Kalam, Choghadiya and more."
};

const existingTools=[
  ["Moon Sign Calculator","Estimate Chandra Rashi from birth date and city.","/tools/moon-sign-calculator"],
  ["Nakshatra Finder","Estimate birth Nakshatra and Pada from date and city.","/tools/nakshatra-finder"],
  ["Rahu Kalam Calculator","Calculate local Rahu Kalam for any supported Indian city and date.","/tools/rahu-kalam-calculator"],
  ["Choghadiya by City","See all 8 daytime and 8 nighttime Choghadiya periods from local sunrise and sunset.","/tools/choghadiya/mumbai"],
  ["Hindu Baby Names by Nakshatra","Browse name ideas grouped by traditional Nakshatra starting sounds.","/tools/hindu-baby-names/ashwini"]
] as const;

export default function Tools(){
  const evergreen=expandedToolSlugs.map(slug=>expandedTools[slug]);
  return <main><Header city={cities[0]}/><div className="page-shell internal-visual internal-tools">
    <p className="page-kicker">FREE CALCULATORS</p>
    <h1 className="page-title">Hindu calendar tools<br/>built on one Panchang engine.</h1>
    <p className="page-subtitle">Use evergreen calculators for Tithi, Nakshatra, lunar phase, Hindu month and date lookup without creating duplicate city/date pages.</p>
    <div className="tool-list">{evergreen.map(tool=><Link href={expandedToolPath(tool.slug)} key={tool.slug}><h3>{tool.name}</h3><p>{tool.description}</p><span className="page-kicker">Open free tool →</span></Link>)}</div>
    <div className="seo-copy"><h2>More Panchvani utilities</h2><p>These tools cover birth-date estimates, local timing and Nakshatra naming workflows. Date-only birth tools are estimates because exact natal calculations require an exact birth time.</p></div>
    <div className="tool-list">{existingTools.map(([title,description,href])=><Link href={href} key={href}><h3>{title}</h3><p>{description}</p><span className="page-kicker">Open tool →</span></Link>)}</div>
  </div></main>;
}
