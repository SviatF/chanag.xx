/**
 * Evidence status kept intentionally compact on indexed pages: full
 * methodology belongs on /accuracy. Generic paragraphs can make distinct
 * city/festival pages near-duplicates in the structural SEO gate.
 * A computed sunrise state or maintained festival date is not ritual approval.
 */
export type CalendarEvidenceScope="sunrise-tithi-reference"|"maintained-festival-date";
type Props={scope:CalendarEvidenceScope;cityName:string;subject:string;year:number};
export default function CalendarEvidenceNotice({scope,cityName,subject,year}:Props){
  const lunar=scope==="sunrise-tithi-reference";
  return <aside className="page-subtitle" aria-label="Calendar evidence status">
    <strong>Evidence status: {lunar?"Calculated sunrise Tithi":"Curated festival date"} · NOT RITUAL-APPROVED.</strong>{" "}
    {lunar
      ?<>The {subject} {year} observations for {cityName} do not select an approved fasting day, Parana interval or regional observance.</>
      :<>The {subject} {year} calendar entry is not independent certification of {cityName} Puja time or tradition-specific observance.</>}
  </aside>;
}
