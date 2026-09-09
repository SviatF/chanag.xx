import { Panchang, formatWindow } from "@/lib/panchang";
import { Moon, Sun } from "lucide-react";

export default function DayWheel({data}:{data:Panchang}) {
  return <div className="wheel-wrap" aria-label="Visual day timeline">
    <div className="wheel">
      <div className="wheel-ring ring-a"/>
      <div className="wheel-ring ring-b"/>
      <div className="wheel-segment seg-rahu"/>
      {data.abhijit ? <div className="wheel-segment seg-abhijit"/> : null}
      <div className="wheel-label top"><Moon size={17}/>Night</div>
      <div className="wheel-label right danger"><span>Rahu Kalam</span><small>{formatWindow(data.rahu)}</small></div>
      <div className="wheel-label bottom good"><span>Abhijit Muhurat</span><small>{formatWindow(data.abhijit)}</small></div>
      <div className="wheel-label left"><span>Sunrise</span><small>{data.sunrise}</small></div>
      <div className="wheel-center"><Sun size={27}/><strong>{data.weekday}</strong><span>{data.date}</span><small>A mindful day creates a brighter tomorrow</small></div>
      <span className="clock t24">24:00</span><span className="clock t06">06:00</span><span className="clock t12">12:00</span><span className="clock t18">18:00</span>
    </div>
  </div>
}
