import Link from "next/link";
import Header from "@/components/Header";
import type {City} from "@/lib/cities";
import type {VerifiedMuhuratClosure} from "@/lib/verified-muhurat-closures";
import {muhuratYearPath} from "@/lib/yearly-expansion";

type Props={
  event:string;
  year:number;
  month:number;
  city:City;
  baseline:boolean;
  closure:VerifiedMuhuratClosure;
};

export default function VerifiedMuhuratClosurePage({event,year,month,city,baseline,closure}:Props){
  const monthName=new Intl.DateTimeFormat("en-IN",{month:"long",timeZone:"Asia/Kolkata"})
    .format(new Date(Date.UTC(year,month-1,1)));
  const place=baseline?"Mumbai baseline":city.name;
  const heading=`Wedding Muhurat in ${place} — ${monthName} ${year}`;
  const canonical=baseline
    ?`/muhurat/${event}/${year}/${month}`
    :`/muhurat/${event}/${year}/${month}/${city.slug}`;
  const ld={"@context":"https://schema.org","@type":"WebPage",
    "name":heading,
    "description":closure.headline,
    "url":`https://panchvani.com${canonical}`};
  return <main><Header city={city}/><div className="page-shell internal-visual internal-muhurat">
    <div className="breadcrumbs"><Link href={muhuratYearPath(event,year)}>Wedding Muhurat {year}</Link> / {monthName} / {place}</div>
    <p className="page-kicker">REVIEWED REGIONAL MARRIAGE CALENDAR · MAHARASHTRA</p>
    <h1 className="page-title">Wedding Muhurat in {place}<br/>{monthName} {year}</h1>
    <p className="page-subtitle">{closure.headline}. This is a documented custom-specific closure, not a failure to calculate a lunar date.</p>
    <div className="data-grid">
      <div className="data-card"><small>Traditional Marathi marriage dates</small><strong>0</strong><small>{monthName} {year}</small></div>
      <div className="data-card"><small>Observance determining the result</small><strong>{closure.reason}</strong><small>Entire month excluded under this convention</small></div>
      <div className="data-card"><small>Reviewed convention</small><strong>{closure.convention}</strong><small>Mumbai · Maharashtra</small></div>
    </div>
    <section className="wide-panel"><div className="seo-copy">
      <small>WHY THERE IS NO {monthName.toUpperCase()} SHORTLIST</small>
      <h2>Why are no traditional Marathi wedding dates recommended?</h2>
      <p>{closure.explanation}</p>
      <p>The reviewed customary Marathi calendar excludes weddings in {monthName} {year}, within the approximate late-July to late-November 2026 Chaturmas observance. All {new Date(Date.UTC(year,month,0)).getUTCDate()} local dates of {monthName} are excluded by this documented convention; no favorable intraday clock is promoted as a wedding recommendation here. Exact observance boundaries vary by tradition.</p>
    </div></section>
    <section className="wide-panel"><div className="seo-copy">
      <small>REGIONAL AND COMMUNITY CONVENTIONS</small>
      <h2>Does the same rule apply to every wedding?</h2>
      <p>{closure.alternativesNote}</p>
      <p>Separate calculations such as Venus/Jupiter combustion, Yoga, Karana, Lagna and personalized compatibility are not being treated as independently verified here. The month's zero-date conclusion is based on the documented Marathi Chaturmas convention alone, not on an invented combination of unverified exclusions.</p>
    </div></section>
    <section className="wide-panel"><div className="seo-copy">
      <small>UNDERLYING ASTRONOMICAL DATA</small>
      <h2>What the local Panchang still provides</h2>
      <p>Sunrise, Tithi, Nakshatra, Rahu Kalam and Choghadiya are separate astronomical and time-of-day observations. Those values can remain valid even when the reviewed wedding calendar does not permit a ceremonial Muhurat. For example, the <Link href={`/panchang/${city.slug}/${year}-${String(month).padStart(2,"0")}-12`}>Mumbai Panchang for 12 {monthName} {year}</Link> provides the lunar-day context without treating a favorable clock interval as permission for a marriage ceremony.</p>
      <p>For other months, open the <Link href={muhuratYearPath(event,year)}>{year} wedding planning calendar</Link>. Other month listings are screening references until their ceremony-specific exclusions receive the same independent review.</p>
    </div></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
