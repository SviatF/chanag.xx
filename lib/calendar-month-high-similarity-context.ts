import type {City} from "./cities";

type Window={start:string;end:string};
type Entry={
  date:string;
  tithi:string;
  nakshatra:string;
  paksha?:string;
  rahu:Window;
  yamaganda:Window;
  gulika:Window;
  abhijit:Window|null;
};
type Fact={label:string;value:string;note?:string};

export type CalendarMonthHighSimilarityContext={
  title:string;
  geographyBody:string;
  rhythmTitle:string;
  rhythmBody:string;
  facts:Fact[];
};

function clockMinutes(value:string){
  const [hours,minutes]=value.split(":").map(Number);
  return Number.isFinite(hours)&&Number.isFinite(minutes)?hours*60+minutes:0;
}
function average(values:number[]){
  return values.length?values.reduce((sum,value)=>sum+value,0)/values.length:0;
}
function monthLabel(year:number,month:number){
  return new Intl.DateTimeFormat("en-IN",{month:"long",year:"numeric",timeZone:"Asia/Kolkata"}).format(new Date(Date.UTC(year,month-1,1,6)));
}
function movementLabel(delta:number){
  if(Math.abs(delta)<=2)return "steady-clock";
  return delta<0?"earlier-clock drift":"later-clock drift";
}
function rangeLabel(value:number){
  if(value<=5)return "compressed range";
  if(value<=12)return "moderate range";
  return "wide range";
}
function diversityLabel(value:number,kind:"tithi"|"nakshatra"){
  if(kind==="tithi"){
    if(value<=8)return "concentrated Tithi rotation";
    if(value<=12)return "mixed Tithi rotation";
    return "broad Tithi rotation";
  }
  if(value<=12)return "concentrated Nakshatra rotation";
  if(value<=18)return "mixed Nakshatra rotation";
  return "broad Nakshatra rotation";
}
function coverageLabel(value:number,total:number){
  if(!total||value===0)return "no Abhijit coverage";
  const ratio=value/total;
  if(ratio<0.5)return "minority Abhijit coverage";
  if(ratio<0.85)return "partial Abhijit coverage";
  if(value===total)return "full Abhijit coverage";
  return "near-full Abhijit coverage";
}
function thirdCentroid(entries:readonly Entry[]){
  if(!entries.length)return 0;
  return average(entries.map(entry=>(clockMinutes(entry.rahu.start)+clockMinutes(entry.yamaganda.start)+clockMinutes(entry.gulika.start))/3));
}
function thirdLabel(index:number){
  return index===0?"opening third":index===1?"middle third":"closing third";
}
function splitThirds(entries:readonly Entry[]){
  const size=Math.max(1,Math.ceil(entries.length/3));
  return [entries.slice(0,size),entries.slice(size,size*2),entries.slice(size*2)];
}
function dominantThird(entries:readonly Entry[]){
  const values=splitThirds(entries).map(thirdCentroid);
  let index=0;
  for(let i=1;i<values.length;i++)if(values[i]>values[index])index=i;
  return {label:thirdLabel(index),values};
}
function mostVariable(entries:readonly Entry[]){
  const series=[
    {label:"Rahu",values:entries.map(entry=>clockMinutes(entry.rahu.start))},
    {label:"Yamaganda",values:entries.map(entry=>clockMinutes(entry.yamaganda.start))},
    {label:"Gulika",values:entries.map(entry=>clockMinutes(entry.gulika.start))},
  ];
  return series.map(item=>({...item,range:item.values.length?Math.max(...item.values)-Math.min(...item.values):0})).sort((a,b)=>b.range-a.range||a.label.localeCompare(b.label))[0];
}

const geographyBySlug:Record<string,{title:string;body:string}>={
  ahmedabad:{
    title:"Sabarmati-axis monthly interpretation",
    body:"This calendar is read from a north-central Gujarat frame built around the Sabarmati corridor. Its useful identity is a western inland clock with a northern-Gujarat seasonal position, not a generic state timetable. The comparison geometry runs southward toward the lower-latitude Surat corridor, south-east toward the central-Gujarat Vishwamitri basin, and east toward the Malwa plateau. That creates a directional reading in which the local month is the northern anchor of a Gujarat gradient. Sunrise-derived exclusions belong to this inland Sabarmati calculation, so a nearby city cannot be treated as a substitute merely because the civil date, Tithi label or festival list matches. For month-level interpretation, the practical question is how the western clock behaves while the northern side of the state moves through the season: whether exclusion starts tighten, spread or drift, and whether the lunar sequence reaches its checkpoints before or after the local daylight rhythm changes. The page therefore works as an upstream north-central reference rather than an average of Gujarat cities."
  },
  vadodara:{
    title:"Vishwamitri-hinge monthly interpretation",
    body:"This calendar is organized as a central-Gujarat hinge around the Vishwamitri basin. Instead of acting as the northern anchor of the state, it sits inside the transition between the Ahmedabad side to the north-west, the Surat side to the south-west and the Malwa-facing corridor to the east. That intermediate position is the main reading key: the local month is a bridge calendar whose solar checkpoints belong to a central corridor, not a borrowed schedule from either neighbouring metro. Month-level interpretation therefore looks for balance across three directions — northern Gujarat, southern Gujarat and the inland eastward connection — and asks how the exclusion clock settles inside that middle position. Even when Tithi and festival dates align with another Gujarat page, the useful locality signal is the central transition itself: a Vishwamitri-based sequence with its own daily boundaries, its own accumulated timing rhythm and a different role in the state’s north-to-south calendar geography."
  }
};

export function buildCalendarMonthHighSimilarityContext(city:City,year:number,month:number,entries:readonly Entry[]):CalendarMonthHighSimilarityContext|null{
  const geography=geographyBySlug[city.slug];
  if(!geography)return null;
  const label=monthLabel(year,month);
  const tithiDiversity=new Set(entries.map(entry=>entry.tithi)).size;
  const nakshatraDiversity=new Set(entries.map(entry=>entry.nakshatra)).size;
  const pakshaSequence=[...new Set(entries.map(entry=>entry.paksha).filter((value):value is string=>Boolean(value)))];
  const abhijitCount=entries.filter(entry=>entry.abhijit!==null).length;
  const variable=mostVariable(entries);
  const thirds=splitThirds(entries);
  const third=dominantThird(entries);
  const firstCentroid=thirds[0]?.length?thirdCentroid(thirds[0]):0;
  const lastCentroid=thirds[2]?.length?thirdCentroid(thirds[2]):firstCentroid;
  const centroidDelta=Math.round(lastCentroid-firstCentroid);
  const opening=entries[0],middle=entries[Math.floor(entries.length/2)],closing=entries[entries.length-1];
  const rhythmBody=city.slug==="ahmedabad"
    ? `The Sabarmati-side timing trace for ${label} is read from the opening third forward. The combined Rahu/Yamaganda/Gulika centroid shows ${movementLabel(centroidDelta)} from the first third to the last, while ${variable.label} supplies the largest exclusion-start variation with a ${rangeLabel(variable.range)}. The lunar cadence moves from ${opening?.tithi??"an unavailable opening Tithi"} through ${middle?.tithi??"an unavailable midpoint Tithi"} to ${closing?.tithi??"an unavailable closing Tithi"}; Nakshatra checkpoints run ${opening?.nakshatra??"unavailable"} → ${middle?.nakshatra??"unavailable"} → ${closing?.nakshatra??"unavailable"}. The ${third.label} carries the latest three-window centroid. This combination describes the month as a northern-anchor sequence: local exclusions, lunar turnover and the western inland clock are read together rather than averaged with another Gujarat city.`
    : `Read ${label} as a central-corridor balance rather than a northern-anchor sequence. From the first third to the closing third, the combined exclusion centroid has ${movementLabel(centroidDelta)}; ${variable.label} is the most mobile exclusion start and occupies a ${rangeLabel(variable.range)}. The Tithi path is ${opening?.tithi??"unavailable"} → ${middle?.tithi??"unavailable"} → ${closing?.tithi??"unavailable"}, while the Nakshatra path is ${opening?.nakshatra??"unavailable"} → ${middle?.nakshatra??"unavailable"} → ${closing?.nakshatra??"unavailable"}. The latest centroid occurs in the ${third.label}. For the Vishwamitri hinge, these signals are useful because they show how a middle-position city resolves the same civil month through its own local boundaries instead of inheriting the timing profile of the northern or southern Gujarat reference.`;

  return {
    title:`${geography.title} · ${label}`,
    geographyBody:geography.body,
    rhythmTitle:city.slug==="ahmedabad"?"Northern-anchor timing trace":"Central-hinge timing trace",
    rhythmBody,
    facts:[
      {label:"Monthly geography role",value:city.slug==="ahmedabad"?"north-central anchor":"central transition hinge"},
      {label:"Tithi rotation",value:diversityLabel(tithiDiversity,"tithi"),note:`Opening / midpoint / closing: ${opening?.tithi??"—"} · ${middle?.tithi??"—"} · ${closing?.tithi??"—"}`},
      {label:"Nakshatra rotation",value:diversityLabel(nakshatraDiversity,"nakshatra"),note:`Opening / midpoint / closing: ${opening?.nakshatra??"—"} · ${middle?.nakshatra??"—"} · ${closing?.nakshatra??"—"}`},
      {label:"Paksha path",value:pakshaSequence.join(" → ")||"not exposed by the committed precomputed month shard"},
      {label:"Exclusion-clock drift",value:movementLabel(centroidDelta),note:`First-third to closing-third centroid delta: ${centroidDelta} min`},
      {label:"Most variable exclusion",value:variable.label,note:`${rangeLabel(variable.range)} · ${variable.range} min start-time range`},
      {label:"Latest timing third",value:third.label},
      {label:"Abhijit participation",value:coverageLabel(abhijitCount,entries.length),note:`${abhijitCount}/${entries.length} retained dates`}
    ]
  };
}
