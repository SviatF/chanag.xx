import type {City} from "./cities";
import {buildCityContentProfile} from "./city-content-profile";
import type {ChoghadiyaPeriod,Panchang,TimeWindow} from "./panchang";

type Fact={label:string;value:string;note?:string};

export type ChoghadiyaQualityContent={
  directAnswer:string;
  facts:Fact[];
  fingerprintTitle:string;
  fingerprintBody:string;
  daytimeTitle:string;
  daytimeBody:string;
  nightTitle:string;
  nightBody:string;
  rahuTitle:string;
  rahuBody:string;
};

function clockMinutes(value:string){
  const [h,m]=value.split(":").map(Number);
  return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:0;
}

function periodMinutes(period:ChoghadiyaPeriod){
  const start=clockMinutes(period.start)+period.startDayOffset*1440;
  const end=clockMinutes(period.end)+period.endDayOffset*1440;
  return Math.max(0,end-start);
}

function windowRange(window:TimeWindow){return {start:clockMinutes(window.start),end:clockMinutes(window.end)};}
function periodRange(period:ChoghadiyaPeriod){return {start:clockMinutes(period.start)+period.startDayOffset*1440,end:clockMinutes(period.end)+period.endDayOffset*1440};}
function overlapMinutes(a:{start:number;end:number},b:{start:number;end:number}){return Math.max(0,Math.min(a.end,b.end)-Math.max(a.start,b.start));}
function effectCounts(periods:readonly ChoghadiyaPeriod[]){
  return {
    good:periods.filter(p=>p.effect==="good").length,
    neutral:periods.filter(p=>p.effect==="neutral").length,
    bad:periods.filter(p=>p.effect==="bad").length,
  };
}
function sequence(periods:readonly ChoghadiyaPeriod[]){return periods.map(p=>`${p.name} ${p.start}–${p.end}`).join(" · ");}
function favorable(periods:readonly ChoghadiyaPeriod[]){return periods.filter(p=>p.effect==="good");}

const slotNames=["opening slot","second slot","third slot","fourth slot","fifth slot","sixth slot","seventh slot","closing slot"] as const;
function slotLabel(index:number){return slotNames[index]??`slot ${index+1}`;}

function sunriseProfile(value:string){
  const minutes=clockMinutes(value);
  if(minutes<340)return {key:"pre-dawn-edge",text:"a very early local sunrise clock"};
  if(minutes<355)return {key:"early-rise",text:"an early sunrise profile"};
  if(minutes<360)return {key:"pre-six-rise",text:"a sunrise just before 06:00"};
  if(minutes<370)return {key:"near-six-rise",text:"a sunrise close to 06:00"};
  return {key:"late-rise",text:"a post-06:10 sunrise profile"};
}
function sunsetProfile(value:string){
  const minutes=clockMinutes(value);
  if(minutes<1080)return {key:"pre-six-set",text:"a sunset before 18:00"};
  if(minutes<1090)return {key:"near-six-set",text:"a sunset shortly after 18:00"};
  if(minutes<1100)return {key:"mid-six-set",text:"an early-evening sunset"};
  if(minutes<1130)return {key:"late-set",text:"a later evening sunset"};
  return {key:"very-late-set",text:"a notably late evening sunset"};
}
function daylightProfile(minutes:number){
  if(minutes<720)return {key:"compact-day",text:"a compact solar-day span"};
  if(minutes<735)return {key:"short-moderate-day",text:"a shorter moderate daylight span"};
  if(minutes<745)return {key:"mid-daylight",text:"a mid-range daylight span"};
  if(minutes<755)return {key:"long-moderate-day",text:"a longer moderate daylight span"};
  return {key:"extended-day",text:"an extended daylight span"};
}
function rahuPhase(share:number){
  if(share<15)return {key:"opening-day-rahu",text:"near the opening of the solar day"};
  if(share<30)return {key:"morning-rahu",text:"in the morning third of daylight"};
  if(share<40)return {key:"late-morning-rahu",text:"around the late-morning portion of daylight"};
  if(share<50)return {key:"midday-rahu",text:"around the middle of the solar day"};
  if(share<65)return {key:"afternoon-rahu",text:"in the afternoon portion of daylight"};
  return {key:"late-day-rahu",text:"late in the solar day"};
}
function overlapProfile(minutes:number){
  if(minutes===0)return {key:"clean-separation",text:"does not overlap any favorable-labelled Choghadiya minute"};
  if(minutes<20)return {key:"edge-overlap",text:"clips only the edge of a favorable-labelled period"};
  if(minutes<45)return {key:"partial-overlap",text:"partly intersects a favorable-labelled period"};
  return {key:"deep-overlap",text:"cuts substantially through favorable-labelled Choghadiya time"};
}

function directAnswerByFirstGood(city:string,date:string,day:{good:number},first:ChoghadiyaPeriod|undefined,last:ChoghadiyaPeriod|undefined,rahu:TimeWindow,index:number){
  if(!first)return `On ${date}, ${city}'s daytime Choghadiya sequence has no period marked favorable; Rahu Kalam runs ${rahu.start}–${rahu.end}.`;
  switch(index){
    case 0:return `${city} opens ${date} with a favorable Choghadiya: ${first.name} ${first.start}–${first.end}. There are ${day.good} favorable daytime periods in total, ending with ${last?.name??first.name} ${last?.start??first.start}–${last?.end??first.end}; Rahu Kalam is ${rahu.start}–${rahu.end}.`;
    case 1:return `The first favorable Choghadiya in ${city} on ${date} arrives in the second daytime slot: ${first.name} ${first.start}–${first.end}. The day contains ${day.good} favorable labels overall, while Rahu Kalam occupies ${rahu.start}–${rahu.end}.`;
    case 2:return `${city}'s ${date} Choghadiya does not begin favorably; its first favorable window is the third slot, ${first.name} ${first.start}–${first.end}. ${day.good} daytime periods are marked favorable, and Rahu Kalam runs ${rahu.start}–${rahu.end}.`;
    case 3:return `On ${date}, ${city} reaches its first favorable Choghadiya only in the fourth daytime segment: ${first.name} ${first.start}–${first.end}. The calculated day has ${day.good} favorable segments; Rahu Kalam is ${rahu.start}–${rahu.end}.`;
    case 4:return `${city}'s favorable Choghadiya is back-loaded on ${date}: the first good-labelled slot is #5, ${first.name} ${first.start}–${first.end}. There are ${day.good} favorable daytime segments, with Rahu Kalam at ${rahu.start}–${rahu.end}.`;
    default:return `${city} has a late-starting favorable Choghadiya pattern on ${date}: ${first.name} first appears in ${slotLabel(index)} at ${first.start}–${first.end}. The day carries ${day.good} favorable labels; Rahu Kalam is ${rahu.start}–${rahu.end}.`;
  }
}

function daytimeBodyBySlot(index:number,args:{dayMinutes:number;avg:number;first?:ChoghadiyaPeriod;last?:ChoghadiyaPeriod;day:{good:number;neutral:number;bad:number}}){
  const {dayMinutes,avg,first,last,day}=args;
  if(!first)return `Across ${dayMinutes} daylight minutes, the eight calculated segments average about ${avg} minutes each. None is tagged favorable; the mix is ${day.neutral} neutral and ${day.bad} difficult.`;
  if(index===0)return `The favorable sequence starts immediately at sunrise-side slot #1 with ${first.name}. Across the ${dayMinutes}-minute solar day, eight segments average about ${avg} minutes; the final favorable label is ${last?.name} in ${slotLabel(last?7:0)}. This is an opening-favorable day structure rather than a delayed one.`;
  if(index===1)return `Slot #1 is not the favorable entry point. The first good-labelled period begins in slot #2 with ${first.name}; over ${dayMinutes} daylight minutes, the eight-part grid averages ${avg} minutes per segment and closes its favorable run with ${last?.name}.`;
  if(index===2)return `Two daytime slots pass before the first favorable label appears. ${first.name} occupies the third slot, making the front of the ${dayMinutes}-minute day more restrictive than an opening-favorable sequence; average segment length is about ${avg} minutes.`;
  if(index===3)return `The first half of the eight-part grid is the key divider here: favorable time begins only at slot #4 with ${first.name}. The local solar day lasts ${dayMinutes} minutes, so each daytime segment is roughly ${avg} minutes; ${last?.name} is the last favorable label.`;
  if(index===4)return `Favorable time begins after the midpoint of the eight-slot sequence. ${first.name} first appears in slot #5; with ${dayMinutes} daylight minutes and ~${avg}-minute segments, this day has a distinctly back-loaded favorable profile.`;
  return `The day's favorable labels are concentrated late in the sequence. ${first.name} first appears in ${slotLabel(index)}, after most earlier segments have passed; the ${dayMinutes}-minute solar day averages ${avg} minutes per Choghadiya segment.`;
}

function nightBodyBySlot(index:number,args:{night:{good:number;neutral:number;bad:number};avg:number;first?:ChoghadiyaPeriod;seq:string}){
  const {night,avg,first,seq}=args;
  if(!first)return `The night grid contains no favorable-labelled segment. Its eight-part pattern is ${seq}, with ${night.neutral} neutral and ${night.bad} difficult labels.`;
  if(index<=1)return `Nighttime becomes favorable near its opening: ${first.name} is the first good-labelled night period in ${slotLabel(index)}. The night grid averages about ${avg} minutes per segment and follows this exact order: ${seq}.`;
  if(index<=3)return `The first favorable night signal is delayed into ${slotLabel(index)}, where ${first.name} begins. Before that point the sequence carries no good label; the full eight-period order is ${seq}.`;
  if(index<=5)return `The night is front-loaded with non-favorable labels and turns favorable only around ${slotLabel(index)} with ${first.name}. Average segment length is about ${avg} minutes; full sequence: ${seq}.`;
  return `A favorable night label arrives very late: ${first.name} first appears in ${slotLabel(index)}. Most night segments precede it, giving this local night a distinctly late-favorable shape: ${seq}.`;
}

export function buildChoghadiyaQualityContent(data:Panchang,city:City):ChoghadiyaQualityContent{
  const cityProfile=buildCityContentProfile(city);
  const day=effectCounts(data.dayChoghadiya);
  const night=effectCounts(data.nightChoghadiya);
  const dayGood=favorable(data.dayChoghadiya);
  const nightGood=favorable(data.nightChoghadiya);
  const dayMinutes=Math.max(0,clockMinutes(data.sunset)-clockMinutes(data.sunrise));
  const avgDaySegment=data.dayChoghadiya.length?Math.round(data.dayChoghadiya.reduce((sum,p)=>sum+periodMinutes(p),0)/data.dayChoghadiya.length):0;
  const avgNightSegment=data.nightChoghadiya.length?Math.round(data.nightChoghadiya.reduce((sum,p)=>sum+periodMinutes(p),0)/data.nightChoghadiya.length):0;
  const rahu=windowRange(data.rahu);
  const rahuGoodOverlap=data.dayChoghadiya.filter(p=>p.effect==="good").reduce((sum,p)=>sum+overlapMinutes(rahu,periodRange(p)),0);
  const rahuStartOffset=Math.max(0,rahu.start-clockMinutes(data.sunrise));
  const rahuDayShare=dayMinutes?Math.round((rahuStartOffset/dayMinutes)*100):0;
  const firstGood=dayGood[0];
  const lastGood=dayGood[dayGood.length-1];
  const firstGoodIndex=firstGood?data.dayChoghadiya.indexOf(firstGood):-1;
  const lastGoodIndex=lastGood?data.dayChoghadiya.indexOf(lastGood):-1;
  const firstNightGood=nightGood[0];
  const firstNightGoodIndex=firstNightGood?data.nightChoghadiya.indexOf(firstNightGood):-1;
  const rise=sunriseProfile(data.sunrise),set=sunsetProfile(data.sunset),daylight=daylightProfile(dayMinutes);
  const rahuPosition=rahuPhase(rahuDayShare),rahuOverlap=overlapProfile(rahuGoodOverlap);
  const solarSignature=`${rise.key} / ${set.key} / ${daylight.key}`;

  const directAnswer=directAnswerByFirstGood(city.name,data.date,day,firstGood,lastGood,data.rahu,firstGoodIndex);
  const clockBody=rise.key==="pre-dawn-edge"
    ? `${city.name} has ${rise.text} paired with ${set.text}. That combination creates ${daylight.text} of ${dayMinutes} minutes and shifts the entire eight-slot clock earlier than a city whose sunrise is near or after 06:00. Exact daytime order: ${sequence(data.dayChoghadiya)}.`
    : rise.key==="early-rise"
      ? `The local clock begins early in ${city.name}: ${data.sunrise} sunrise combines with ${data.sunset} sunset, producing ${daylight.text}. The signature is ${solarSignature}; the calculated daytime chain is ${sequence(data.dayChoghadiya)}.`
      : rise.key==="pre-six-rise"
        ? `${city.name}'s solar clock starts just before six and ends with ${set.text}. Over ${dayMinutes} daylight minutes, the Choghadiya boundaries inherit that local clock instead of a national fixed timetable. The daytime chain is ${sequence(data.dayChoghadiya)}.`
        : rise.key==="near-six-rise"
          ? `A near-06:00 sunrise and ${set.text} define ${city.name}'s clock signature today. The resulting ${daylight.text} is split into the sequence ${sequence(data.dayChoghadiya)}; its boundary times are specific to this sunrise/sunset pair.`
          : `${city.name} has ${rise.text}, combined with ${set.text}. The result is ${daylight.text} of ${dayMinutes} minutes, so today's exact daytime order — ${sequence(data.dayChoghadiya)} — sits later on the clock than an otherwise identical weekday with an earlier sunrise.`;
  const fingerprintBody=`${clockBody} Geographically, this calculation belongs to ${cityProfile.geoContext}; its ${cityProfile.latitudeContext} and solar clock ${cityProfile.solarClockContext} give the page a location-specific timing context even when another city shares the same weekday Choghadiya name order.`;

  const daytimeBody=daytimeBodyBySlot(firstGoodIndex,{dayMinutes,avg:avgDaySegment,first:firstGood,last:lastGood,day});
  const nightBody=nightBodyBySlot(firstNightGoodIndex,{night,avg:avgNightSegment,first:firstNightGood,seq:sequence(data.nightChoghadiya)});
  const rahuBody=rahuOverlap.key==="clean-separation"
    ? `Rahu Kalam begins ${rahuStartOffset} minutes after sunrise, ${rahuPosition.text}, and ${rahuOverlap.text}. On this date the Rahu interval is cleanly separated from every favorable-labelled Choghadiya segment.`
    : rahuOverlap.key==="edge-overlap"
      ? `The Rahu interval sits ${rahuPosition.text}: ${data.rahu.start}–${data.rahu.end}. It ${rahuOverlap.text}, totaling only ${rahuGoodOverlap} overlapping minutes; this is an edge conflict rather than a deep collision.`
      : rahuOverlap.key==="partial-overlap"
        ? `${city.name}'s Rahu Kalam starts ${rahuStartOffset} minutes after sunrise and falls ${rahuPosition.text}. It ${rahuOverlap.text} for ${rahuGoodOverlap} minutes, so the favorable label alone is not enough to interpret that part of the day.`
        : `Rahu Kalam is structurally important today because it ${rahuOverlap.text}. Starting ${rahuStartOffset} minutes after sunrise, it occupies ${rahuPosition.text} and removes ${rahuGoodOverlap} minutes from periods that otherwise carry a favorable label.`;

  return {
    directAnswer,
    facts:[
      {label:"Geographic setting",value:cityProfile.geoContext,note:cityProfile.latitudeContext},
      {label:"Solar-clock relation",value:cityProfile.solarClockContext,note:solarSignature},
      {label:"Favorable day entry",value:firstGood?slotLabel(firstGoodIndex):"none",note:firstGood?`${firstGood.name} ${firstGood.start}–${firstGood.end}`:undefined},
      {label:"Favorable day exit",value:lastGood?slotLabel(lastGoodIndex):"none",note:lastGood?`${lastGood.name} ${lastGood.start}–${lastGood.end}`:undefined},
      {label:"Night favorable entry",value:firstNightGood?slotLabel(firstNightGoodIndex):"none",note:firstNightGood?`${firstNightGood.name} ${firstNightGood.start}–${firstNightGood.end}`:undefined},
      {label:"Rahu phase",value:rahuPosition.key,note:`${rahuDayShare}% after sunrise`},
      {label:"Rahu / good-label relation",value:rahuOverlap.key,note:`${rahuGoodOverlap} overlap min`},
    ],
    fingerprintTitle:`${city.name} Choghadiya fingerprint · ${cityProfile.geoContext}`,
    fingerprintBody,
    daytimeTitle:`Daytime shape · favorable entry at ${firstGood?slotLabel(firstGoodIndex):"no slot"}`,
    daytimeBody,
    nightTitle:`Night shape · ${firstNightGood?slotLabel(firstNightGoodIndex):"no favorable entry"}`,
    nightBody,
    rahuTitle:`Rahu relationship · ${rahuPosition.key} / ${rahuOverlap.key}`,
    rahuBody,
  };
}
