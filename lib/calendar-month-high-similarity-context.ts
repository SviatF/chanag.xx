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

const geographyBySlug:Record<string,{title:string;body:string;role:string;rhythmTitle:string;rhythmLead:string}>={
  ahmedabad:{
    title:"Sabarmati-axis monthly interpretation",
    body:"This calendar is read from a north-central Gujarat frame built around the Sabarmati corridor. Its useful identity is a western inland clock with a northern-Gujarat seasonal position, not a generic state timetable. The comparison geometry runs southward toward the lower-latitude Surat corridor, south-east toward the central-Gujarat Vishwamitri basin, and east toward the Malwa plateau. That creates a directional reading in which the local month is the northern anchor of a Gujarat gradient. Sunrise-derived exclusions belong to this inland Sabarmati calculation, so a nearby city cannot be treated as a substitute merely because the civil date, Tithi label or festival list matches. For month-level interpretation, the practical question is how the western clock behaves while the northern side of the state moves through the season: whether exclusion starts tighten, spread or drift, and whether the lunar sequence reaches its checkpoints before or after the local daylight rhythm changes. The page therefore works as an upstream north-central reference rather than an average of Gujarat cities.",
    role:"north-central Gujarat anchor",
    rhythmTitle:"Northern-anchor timing trace",
    rhythmLead:"The Sabarmati month is read as a north-to-south Gujarat reference. Its exclusion windows are followed as a western inland sequence, while lunar checkpoints show how the northern anchor moves through the civil month."
  },
  vadodara:{
    title:"Vishwamitri-hinge monthly interpretation",
    body:"This calendar is organized as a central-Gujarat hinge around the Vishwamitri basin. Instead of acting as the northern anchor of the state, it sits inside the transition between the Ahmedabad side to the north-west, the Surat side to the south-west and the Malwa-facing corridor to the east. That intermediate position is the main reading key: the local month is a bridge calendar whose solar checkpoints belong to a central corridor, not a borrowed schedule from either neighbouring metro. Month-level interpretation therefore looks for balance across three directions — northern Gujarat, southern Gujarat and the inland eastward connection — and asks how the exclusion clock settles inside that middle position. Even when Tithi and festival dates align with another Gujarat page, the useful locality signal is the central transition itself: a Vishwamitri-based sequence with its own daily boundaries, its own accumulated timing rhythm and a different role in the state’s north-to-south calendar geography.",
    role:"central Gujarat transition hinge",
    rhythmTitle:"Central-hinge timing trace",
    rhythmLead:"The Vishwamitri month is read as a middle-position Gujarat sequence. The timing trace asks how a central corridor mediates between northern, southern and Malwa-facing clocks while the lunar month advances."
  },
  "pimpri-chinchwad":{
    title:"Upper-Bhima metropolitan plateau month",
    body:"Pimpri-Chinchwad is read from the upper Bhima-basin side of the Pune metropolitan plateau, but the monthly calendar deliberately keeps its own coordinate instead of collapsing into Pune. The useful comparison is a three-part Maharashtra geometry: Pune is the immediate plateau neighbour, Mumbai and Thane sit beyond the Sahyadri toward the Konkan clock, and Nashik moves the reference north into the upper Godavari basin. That means the local month is best understood as a metropolitan-plateau boundary case where small changes in dawn can move sunrise-derived exclusions or lunar checkpoints even when the civil calendar looks nearly identical to Pune. The page therefore emphasizes coordinate-level timing drift, the sequence of exclusion windows through the month and the exact order of local Tithi and Nakshatra checkpoints. Its role is not to invent a second Pune calendar, but to preserve the upper-Bhima side of the metropolitan timing field as a separate solar-lunar sequence.",
    role:"upper-Bhima metropolitan plateau node",
    rhythmTitle:"Metropolitan-plateau boundary trace",
    rhythmLead:"The Pimpri-Chinchwad month is read for small boundary shifts rather than broad regional contrast. Its useful signal is how a near-Pune clock changes the accumulated exclusion sequence and the sunrise checkpoint of the lunar calendar."
  },
  ghaziabad:{
    title:"NCR eastern-edge monthly clock",
    body:"Ghaziabad sits immediately east of Delhi on the upper Ganga-Yamuna plain, giving the monthly calendar an NCR-edge identity rather than a generic northern-plains label. Delhi is the closest western comparison, Agra extends the Yamuna corridor to the south-east, and Lucknow moves farther into the central Gangetic clock. The city therefore occupies a narrow but meaningful eastward step in the northern timing field. Month-level interpretation focuses on whether that step changes the clock position of sunrise-derived exclusions and whether a Tithi or Nakshatra transition that is close to dawn resolves differently from the capital. The local sequence is intentionally read through those boundary-sensitive shifts, through the progression of Rahu, Yamaganda and Gulika across the month, and through the opening-to-closing lunar cadence. This makes Ghaziabad an eastern-NCR checkpoint rather than an alias for Delhi.",
    role:"eastern NCR boundary node",
    rhythmTitle:"NCR eastward boundary trace",
    rhythmLead:"The Ghaziabad month follows a small eastward solar shift from Delhi and tests how that shift accumulates across exclusion starts and lunar checkpoints. Boundary sensitivity, not broad regional distance, is the defining monthly signal."
  },
  ludhiana:{
    title:"Central-Punjab seasonal month",
    body:"Ludhiana's monthly calendar belongs to the central Punjab alluvial plain at one of the more northerly latitudes in the active city set. Its identity comes from combining a western civil-time solar position with a comparatively strong seasonal daylight swing. Delhi lies to the south-east, while the Punjab plain keeps Ludhiana outside both the NCR clock and the Himalayan-valley frame. For a monthly Panchang this matters because the sunrise-derived exclusion grid is moving inside a northern seasonal envelope rather than a low-latitude plateau or coastal one. The useful reading therefore tracks the shape of the exclusion clock through the month, the changing relation between opening and closing thirds, and the lunar labels encountered at the local dawn checkpoint. The page acts as a Punjab-plains seasonal reference whose timing rhythm cannot be represented by a generic north-India schedule.",
    role:"central Punjab seasonal anchor",
    rhythmTitle:"Punjab seasonal timing trace",
    rhythmLead:"The Ludhiana month is read through northern seasonality and a western Punjab clock. The trace gives extra weight to how exclusion starts migrate through the month while the local dawn line moves inside a stronger seasonal envelope."
  },
  agra:{
    title:"Yamuna-corridor monthly sequence",
    body:"Agra is read from the Yamuna corridor of western Uttar Pradesh, between the more western Jaipur clock and the NCR to the north-west, with Lucknow farther east. That corridor position gives the month a different role from both Delhi-Ghaziabad and the central Gangetic cities. The local calendar uses Agra's own sunrise to decide the timing grid, then follows how Rahu, Yamaganda and Gulika occupy the civil clock as the month advances. Lunar checkpoints are interpreted inside that river-corridor frame, especially when transitions fall close to dawn or when two nearby northern cities otherwise share the same Tithi label. The resulting page is a western-Uttar-Pradesh Yamuna sequence: neither an NCR extension nor an Awadh calendar, but a distinct monthly solar-lunar path with its own exclusion drift and local boundary order.",
    role:"western Yamuna corridor reference",
    rhythmTitle:"Yamuna-corridor timing trace",
    rhythmLead:"The Agra month is read along a west-to-east river-corridor axis. Its timing trace asks how the local exclusion grid and lunar checkpoints sit between the more western Rajasthan clock and the later Gangetic progression."
  },
  nashik:{
    title:"Upper-Godavari inland month",
    body:"Nashik's monthly calendar is anchored in the upper Godavari basin of northern Maharashtra. It shares western India's late civil-time solar character but is neither a Pune plateau duplicate nor a Mumbai-Thane coastal timetable. Pune and Pimpri-Chinchwad sit farther south on the western Deccan, while the Konkan metros lie beyond the Sahyadri toward the coast. Nashik's more northerly inland position therefore creates a separate seasonal and sunrise pattern inside Maharashtra. Month-level interpretation uses that distinction to follow exclusion-window drift, the placement of Abhijit across retained dates and the succession of Tithi and Nakshatra states at local sunrise. The page functions as an upper-Godavari reference whose inland northern-Maharashtra geometry is visible in the actual month rhythm rather than reduced to a state name.",
    role:"upper-Godavari inland anchor",
    rhythmTitle:"Godavari-basin timing trace",
    rhythmLead:"The Nashik month is read as a northern-Maharashtra inland sequence. Its trace combines a western solar clock with a more northerly seasonal frame, then measures how exclusions and lunar checkpoints move through that Godavari-basin month."
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
  const rhythmBody=`${geography.rhythmLead} For ${label}, the combined Rahu/Yamaganda/Gulika centroid shows ${movementLabel(centroidDelta)} from the opening third to the closing third. ${variable.label} supplies the largest exclusion-start variation with a ${rangeLabel(variable.range)}. The Tithi checkpoints move ${opening?.tithi??"unavailable"} → ${middle?.tithi??"unavailable"} → ${closing?.tithi??"unavailable"}, while Nakshatra moves ${opening?.nakshatra??"unavailable"} → ${middle?.nakshatra??"unavailable"} → ${closing?.nakshatra??"unavailable"}. The latest three-window centroid occurs in the ${third.label}. Read together, those observations make the month a ${geography.role}: the solar exclusion pattern and lunar succession are attached to this local clock rather than inferred from another city.`;

  return {
    title:`${geography.title} · ${label}`,
    geographyBody:geography.body,
    rhythmTitle:geography.rhythmTitle,
    rhythmBody,
    facts:[
      {label:"Monthly geography role",value:geography.role},
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
