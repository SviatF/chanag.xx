import { ChoghadiyaPeriod } from "@/lib/panchang";

function ToneDot({effect}:{effect:ChoghadiyaPeriod["effect"]}){
  return <i className={"timeline-dot "+effect}/>;
}

function Timeline({title,subtitle,periods}:{title:string;subtitle:string;periods:ChoghadiyaPeriod[]}){
  return <section className="choghadiya-timeline">
    <div className="choghadiya-head"><span>{title}</span><small>{subtitle}</small></div>
    <div className="timeline-track">
      {periods.map((period,index)=><div
        className={"timeline-segment "+period.effect}
        key={title+"-"+index}
        title={`${period.name} · ${period.start}–${period.end}`}
      >
        <ToneDot effect={period.effect}/>
        <strong>{period.name}</strong>
        <small>{period.start}</small>
        {index===periods.length-1?<em>{period.end}{period.endDayOffset?" +1":""}</em>:null}
      </div>)}
    </div>
  </section>;
}

export default function ChoghadiyaTable({
  day,
  night,
}:{day:ChoghadiyaPeriod[];night:ChoghadiyaPeriod[]}) {
  return <div className="choghadiya-stack">
    <Timeline title="Day Choghadiya" subtitle="Sunrise → Sunset" periods={day}/>
    <Timeline title="Night Choghadiya" subtitle="Sunset → Next sunrise" periods={night}/>
    <div className="timeline-legend">
      <span><ToneDot effect="good"/>Shubh / Labh / Amrit</span>
      <span><ToneDot effect="neutral"/>Char</span>
      <span><ToneDot effect="bad"/>Rog / Kaal / Udveg</span>
    </div>
  </div>;
}
