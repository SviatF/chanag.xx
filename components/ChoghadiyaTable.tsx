import { ChoghadiyaPeriod } from "@/lib/panchang";

function PeriodRow({ period }:{ period: ChoghadiyaPeriod }) {
  const offset = period.endDayOffset ? " +1" : "";
  return <div className={"choghadiya-row " + period.effect}>
    <span className="choghadiya-name">{period.name}</span>
    <strong>{period.start} — {period.end}{offset}</strong>
  </div>;
}

export default function ChoghadiyaTable({
  day,
  night,
}:{day:ChoghadiyaPeriod[];night:ChoghadiyaPeriod[]}) {
  return <div className="choghadiya-grid">
    <section>
      <div className="choghadiya-head"><span>Day Choghadiya</span><small>Sunrise → Sunset</small></div>
      <div className="choghadiya-list">{day.map((period,index)=><PeriodRow key={"day-"+index} period={period}/>)}</div>
    </section>
    <section>
      <div className="choghadiya-head"><span>Night Choghadiya</span><small>Sunset → Next sunrise</small></div>
      <div className="choghadiya-list">{night.map((period,index)=><PeriodRow key={"night-"+index} period={period}/>)}</div>
    </section>
  </div>;
}
