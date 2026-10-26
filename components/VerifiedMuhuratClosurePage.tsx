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
  const isWedding=event==="wedding";
  const rite=isWedding?"Wedding Muhurat":"Griha Pravesh Muhurat";
  const marathi=closure.convention==="Customary Marathi marriage calendar"||closure.convention==="Reviewed Marathi house-entry calendar";
  const dateKind=marathi
    ?isWedding?"Traditional Marathi marriage dates":"Traditional Marathi house-entry dates"
    :"Source-reviewed Delhi Vivaha dates";
  const heading=`${rite} in ${place} — ${monthName} ${year}`;
  const canonical=baseline
    ?`/muhurat/${event}/${year}/${month}`
    :`/muhurat/${event}/${year}/${month}/${city.slug}`;
  const ld={"@context":"https://schema.org","@type":"WebPage",
    "name":heading,
    "description":closure.headline,
    "url":`https://panchvani.com${canonical}`};
  return <main><Header city={city}/><div className="page-shell internal-visual internal-muhurat">
    <div className="breadcrumbs"><Link href={muhuratYearPath(event,year)}>{rite} {year}</Link> / {monthName} / {place}</div>
    <p className="page-kicker">REVIEWED {isWedding?"MARRIAGE":"HOUSE-ENTRY"} CALENDAR · {city.state.toUpperCase()}</p>
    <h1 className="page-title">{rite} in {place}<br/>{monthName} {year}</h1>
    <p className="page-subtitle">{closure.headline}. This documented result describes one community calendar, not an inability to calculate the local lunar day.</p>
    <div className="data-grid">
      <div className="data-card"><small>{dateKind}</small><strong>0</strong><small>{monthName} {year}</small></div>
      <div className="data-card"><small>Observance determining the result</small><strong>{closure.reason}</strong><small>Entire month excluded under this convention</small></div>
      <div className="data-card"><small>Reviewed convention</small><strong>{closure.convention}</strong><small>{city.name} · {city.state}</small></div>
    </div>
    <section className="wide-panel"><div className="seo-copy">
      <small>WHY THERE IS NO {monthName.toUpperCase()} SHORTLIST</small>
      <h2>Why are no {marathi?"customary Marathi":city.name+"-reviewed"} {isWedding?"wedding":"house-entry"} Muhurat dates recommended?</h2>
      <p>{closure.explanation}</p>
      <p>{closure.periodNote} All {new Date(Date.UTC(year,month,0)).getUTCDate()} civil dates of {monthName} are excluded under the named convention. This page does not promote an otherwise favorable hourly window to a confirmed {isWedding?"wedding":"Griha Pravesh"} recommendation.</p>
    </div></section>
    <section className="wide-panel"><div className="seo-copy">
      <small>REGIONAL AND COMMUNITY CONVENTIONS</small>
      <h2>Does the same rule apply to every {isWedding?"wedding":"house-entry"} ceremony?</h2>
      <p>{closure.alternativesNote}</p>
      {!isWedding?<p>Why might another published calendar list dates for the same month? Different traditions and calculation methods can apply distinct month restrictions and ceremony selection rules. The zero-date count here is explicitly the reviewed Marathi house-entry calendar, not a universal prohibition or an independently verified reconciliation of those other methods.</p>:null}
      <p>{isWedding
        ?marathi
          ?"Separate calculations such as Venus/Jupiter combustion, Yoga, Karana, Lagna and personalized compatibility are not independently certified here. The marriage closure follows the reviewed Marathi Chaturmas convention."
          :"This exact Delhi/October 2026 outcome follows three published local Vivaha calendars. Panchvani has not independently solved the full planetary-combustion clocks, regional rules or personal Lagna Shuddhi for each civil day."
        :"The house-entry closure follows reviewed published calendars. Exact Guru/Shukra combustion instants, prohibited Yoga/Karana and Lagna have not been independently certified for every local day. This page must not claim an invented minute-level religious computation."}</p>
    </div></section>
    <section className="wide-panel"><div className="seo-copy">
      <small>UNDERLYING ASTRONOMICAL DATA</small>
      <h2>What the local Panchang still provides</h2>
      <p>Sunrise, Tithi, Nakshatra, Rahu Kalam and Choghadiya are separate astronomical and time-of-day observations. Those values can remain valid even when the reviewed {isWedding?"wedding":"Griha Pravesh"} calendar does not recommend a ceremonial Muhurat. For example, the <Link href={`/panchang/${city.slug}/${year}-${String(month).padStart(2,"0")}-12`}>{city.name} Panchang for 12 {monthName} {year}</Link> provides the lunar-day context without treating a favorable clock interval as a fully approved {isWedding?"marriage":"house-entry"} ceremony.</p>
      <p>For other months, open the <Link href={muhuratYearPath(event,year)}>{year} {isWedding?"wedding":"Griha Pravesh"} planning calendar</Link>. Other month listings are screening references until their ceremony-specific exclusions receive the same independent review.</p>
    </div></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
