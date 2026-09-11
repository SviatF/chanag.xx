import { ChoghadiyaPeriod } from "@/lib/panchang";

export type ChoghadiyaTableLocale={
  dayTitle:string;
  nightTitle:string;
  daySubtitle:string;
  nightSubtitle:string;
  goodLabel:string;
  neutralLabel:string;
  badLabel:string;
  names?:Record<string,string>;
};

const defaultLocale:ChoghadiyaTableLocale={
  dayTitle:"Day Choghadiya",
  nightTitle:"Night Choghadiya",
  daySubtitle:"Sunrise → Sunset",
  nightSubtitle:"Sunset → Next sunrise",
  goodLabel:"Shubh / Labh / Amrit",
  neutralLabel:"Char",
  badLabel:"Rog / Kaal / Udveg",
};

function ToneDot({effect}:{effect:ChoghadiyaPeriod["effect"]}){
  return <i className={"timeline-dot "+effect}/>;
}

function Timeline({title,subtitle,periods,names}:{title:string;subtitle:string;periods:ChoghadiyaPeriod[];names?:Record<string,string>}){
  return <section className="choghadiya-timeline">
    <div className="choghadiya-head"><span>{title}</span><small>{subtitle}</small></div>
    <div className="timeline-track">
      {periods.map((period,index)=>{
        const name=names?.[period.name]??period.name;
        return <div
          className={"timeline-segment "+period.effect}
          key={title+"-"+index}
          title={`${name} · ${period.start}–${period.end}`}
        >
          <ToneDot effect={period.effect}/>
          <strong>{name}</strong>
          <small>{period.start}</small>
          {index===periods.length-1?<em>{period.end}{period.endDayOffset?" +1":""}</em>:null}
        </div>;
      })}
    </div>
  </section>;
}

export default function ChoghadiyaTable({
  day,
  night,
  locale,
}:{day:ChoghadiyaPeriod[];night:ChoghadiyaPeriod[];locale?:ChoghadiyaTableLocale}) {
  const copy=locale??defaultLocale;
  return <div className="choghadiya-stack">
    <Timeline title={copy.dayTitle} subtitle={copy.daySubtitle} periods={day} names={copy.names}/>
    <Timeline title={copy.nightTitle} subtitle={copy.nightSubtitle} periods={night} names={copy.names}/>
    <div className="timeline-legend">
      <span><ToneDot effect="good"/>{copy.goodLabel}</span>
      <span><ToneDot effect="neutral"/>{copy.neutralLabel}</span>
      <span><ToneDot effect="bad"/>{copy.badLabel}</span>
    </div>
  </div>;
}
