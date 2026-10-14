import Link from "next/link";

/**
 * Public evidence scope. A computed sunrise state or maintained festival date
 * must never be styled as independently certified observance, fasting or Puja.
 * No "verified" tier exists until actual city/method/tradition evidence ships.
 */
export type CalendarEvidenceScope="sunrise-tithi-reference"|"maintained-festival-date";
type Props={scope:CalendarEvidenceScope;cityName:string;subject:string;year:number};
export default function CalendarEvidenceNotice({scope,cityName,subject,year}:Props){
  const lunar=scope==="sunrise-tithi-reference";
  return <section className="wide-panel" aria-label="Calendar evidence and observance status">
    <div className="seo-copy">
      <small>DATA STATUS · {lunar?"CALCULATED SUNRISE REFERENCE":"MAINTAINED FESTIVAL DATE"} · NOT RITUAL-APPROVED</small>
      <h2>{lunar?"What these dates establish":"What this festival date establishes"}</h2>
      {lunar
        ?<p>The {subject} entries for {cityName} in {year} identify the lunar Tithi present at local sunrise, calculated using the UT-correct ephemeris. They do not select an approved fasting day, Parana interval or tradition-specific observance. Ekadashi can require separate Smarta, Vaishnava or ISKCON rules; the same distinction applies to festival-specific Purnima and Amavasya rites.</p>
        :<p>The {subject} {year} date is a maintained festival-calendar record. The Panchang times displayed for {cityName} are calculated locally, but they do not independently certify the correct observance day or Puja window for every regional or religious tradition. Astronomy and published date evidence are separate from ritual approval.</p>}
      <p>Calculation methods, published-source comparisons and ritual suitability have different evidence requirements. See <Link href="/accuracy">accuracy and validation</Link> for the current limits.</p>
    </div>
  </section>;
}
