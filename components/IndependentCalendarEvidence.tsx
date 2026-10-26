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
        <p>This is a cited example of a different rule system, not a PANCHVANI-calculated fasting or Parana recommendation. Source: <a href={example.source} target="_blank" rel="noopener noreferrer">Drik Panchang · Delhi Ekadashi calendar</a>.</p>
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
      <p>Publisher comparison: <a href={example.source} target="_blank" rel="noopener noreferrer">Drik Panchang · Delhi</a> and <a href={example.secondSource} target="_blank" rel="noopener noreferrer">second published calendar</a>. This comparison does not independently certify ritual eligibility or a city-specific puja minute.</p>
    </div>
  </section>;
}
