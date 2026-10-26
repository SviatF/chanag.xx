import {delhiEkadashiEvidence,delhiFestivalEvidence} from "@/lib/independent-calendar-evidence";

type Props={kind:"festival"|"ekadashi";slug:string;citySlug:string;year:number};
/** Carefully scoped publication evidence, not a computed city-wide ritual result. */
export default function IndependentCalendarEvidence({kind,slug,citySlug,year}:Props){
  if(kind==="ekadashi"){
    const example=delhiEkadashiEvidence(slug,year,citySlug);
    if(!example)return null;
    return <section className="wide-panel" aria-label="Independent calendar publication comparison">
      <div className="seo-copy">
        <small>EXTERNAL FASTING CALENDAR · DELHI · SOURCE REVIEW</small>
        <h2>{example.name}: sunrise Tithi and tradition-specific fasting days differ</h2>
        <p>Published Smarta fasting date: <strong>{example.smarta}</strong>. Published Vaishnava fasting date: <strong>{example.vaishnava}</strong>.</p>
        <p>{example.explanation}</p>
        <p>This is a sourced example of a different rule system, not a PANCHVANI-calculated fasting or Parana recommendation. Review the <a href="https://github.com/SviatF/chanag.xx/blob/main/docs/audits/INDEPENDENT_PUBLISHED_CALENDAR_2026-10-26.md" target="_blank" rel="noopener noreferrer">independent publication evidence ledger</a> for the exact source, city and rules.</p>
      </div>
    </section>;
  }
  const example=delhiFestivalEvidence(slug,year,citySlug);
  if(!example)return null;
  return <section className="wide-panel" aria-label="Independent festival date evidence">
    <div className="seo-copy">
      <small>PUBLISHED LOCALITY EVIDENCE · DELHI · 2027</small>
      <h2>{example.title}</h2>
      <p>Maintained Delhi observance: <strong>{example.observance}</strong>. {example.explanation}</p>
      <p>See the <a href="https://github.com/SviatF/chanag.xx/blob/main/docs/audits/INDEPENDENT_PUBLISHED_CALENDAR_2026-10-26.md" target="_blank" rel="noopener noreferrer">independently published calendar evidence ledger</a> for dated source records. This comparison does not independently certify ritual eligibility or a city-specific puja minute.</p>
    </div>
  </section>;
}
