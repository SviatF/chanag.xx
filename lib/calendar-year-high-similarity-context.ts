import type {City} from "./cities";
import type {Festival} from "./festivals";
import type {Panchang} from "./panchang";

type FestivalSummary=Pick<Festival,"name"|"slug"|"date">;
type Fact={label:string;value:string;note?:string};

export type CalendarYearHighSimilarityContext={
  eyebrow:string;
  title:string;
  localityBody:string;
  solarTitle:string;
  solarBody:string;
  lunarTitle:string;
  lunarBody:string;
  festivalTitle:string;
  festivalBody:string;
  facts:Fact[];
};

type LocalProfile={
  title:string;
  locality:string;
  solarInterpretation:string;
  planningInterpretation:string;
};

const profiles:Record<string,LocalProfile>={
  pune:{
    title:"Sahyadri-leeward annual planning lens",
    locality:"This yearly calendar is read from Pune's inland Deccan setting east of the Sahyadri crest. The useful comparison is not a generic Maharashtra label: an inland plateau clock, leeward geography and Pune's own month-opening sunrise states define the annual sequence. That makes the calendar an interior western-Deccan chronology rather than a metropolitan-Konkan coastal one.",
    solarInterpretation:"For Pune, the solar-year fingerprint is interpreted as an inland plateau arc. The earliest and latest month-opening sunrises, the shortest and longest first-of-month daylight spans, and the order in which those extrema appear are the practical annual markers. This emphasizes seasonal movement across the plateau instead of treating nearby western-Maharashtra cities as timing equivalents.",
    planningInterpretation:"When using the yearly overview for planning, read Pune's months as an inland sequence moving through pre-monsoon heat, monsoon-season cloud cover and the cooler post-monsoon part of the civil year. The Panchang calculation remains astronomical; this locality lens only explains why the same lunar labels should still be read against Pune's separate local solar boundaries.",
  },
  thane:{
    title:"Ulhas-side metropolitan Konkan annual lens",
    locality:"This yearly calendar is read from Thane's north-eastern metropolitan Konkan position around the Ulhas-creek side of the Mumbai region. Its annual identity is therefore built as a low-latitude coastal-metropolitan clock with its own coordinates and month-opening solar states, not as an inland Deccan substitute and not as a renamed Mumbai calendar.",
    solarInterpretation:"For Thane, the solar-year fingerprint is interpreted through a compact Konkan-coastal arc. The month-opening sunrise and daylight extrema matter less as abstract numbers than as the order in which the coastal-metropolitan clock shifts through the year. That chronology gives Thane a separate annual timing identity even when nearby Maharashtra pages share many of the same lunar names.",
    planningInterpretation:"For practical yearly reading, treat Thane as a metropolitan-Konkan sequence whose local sunrise boundaries sit inside the humid coastal belt west of the Sahyadri interior. The Panchang rules do not change by city; what changes is the local clock frame on which those Tithi, Nakshatra and observance states are experienced.",
  },
};

function clockMinutes(value:string){const [h,m]=value.split(":").map(Number);return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:0;}
function daylight(entry:Panchang){const rise=clockMinutes(entry.sunrise),set=clockMinutes(entry.sunset);return set>=rise?set-rise:set+1440-rise;}
function monthName(index:number){return new Intl.DateTimeFormat("en-IN",{month:"long",timeZone:"Asia/Kolkata"}).format(new Date(Date.UTC(2026,index,1,6)));}
function extrema(values:number[]){
  if(!values.length)return {min:0,max:0,minIndex:0,maxIndex:0,spread:0};
  const min=Math.min(...values),max=Math.max(...values);
  return {min,max,minIndex:values.indexOf(min),maxIndex:values.indexOf(max),spread:max-min};
}
function spreadClass(value:number){
  if(value<15)return "tight annual spread";
  if(value<30)return "compact annual spread";
  if(value<50)return "moderate annual spread";
  return "pronounced annual spread";
}
function chronologyClass(minIndex:number,maxIndex:number){
  if(minIndex===maxIndex)return "single-point seasonal pivot";
  if(minIndex<maxIndex)return "earliest-to-latest progression";
  return "late-to-early seasonal reversal";
}
function lunarArc(snapshots:readonly Panchang[]){
  const picks=[0,2,5,8,11].filter(index=>snapshots[index]);
  return picks.map(index=>`${monthName(index)} opens with ${snapshots[index].paksha} ${snapshots[index].tithi}, ${snapshots[index].nakshatra}, Moon in ${snapshots[index].rashi}`).join(" · ");
}
function festivalArc(festivals:readonly FestivalSummary[]){
  if(!festivals.length)return "No maintained festival records are attached to this yearly route.";
  return festivals.slice(0,8).map(item=>`${item.name} falls in ${monthName(Number(item.date.slice(5,7))-1)}`).join(" · ");
}

export function buildCalendarYearHighSimilarityContext(city:City,year:number,snapshots:readonly Panchang[],festivals:readonly FestivalSummary[]):CalendarYearHighSimilarityContext|null{
  const profile=profiles[city.slug];
  if(!profile)return null;
  const sunriseValues=snapshots.map(item=>clockMinutes(item.sunrise));
  const daylightValues=snapshots.map(daylight);
  const sunrise=extrema(sunriseValues),day=extrema(daylightValues);
  const sunriseShape=spreadClass(sunrise.spread),dayShape=spreadClass(day.spread);
  const solarChronology=chronologyClass(sunrise.minIndex,sunrise.maxIndex);
  const first=snapshots[0],middle=snapshots[5],last=snapshots[11]??snapshots[snapshots.length-1];
  const lunarPath=lunarArc(snapshots);
  const festivalPath=festivalArc(festivals);
  const localityBody=`${profile.locality} ${profile.planningInterpretation}`;
  const solarBody=snapshots.length
    ? `${profile.solarInterpretation} The sunrise arc forms a ${sunriseShape}: ${monthName(sunrise.minIndex)} carries the earliest month-opening sunrise and ${monthName(sunrise.maxIndex)} the latest, producing a ${solarChronology}. First-of-month daylight forms a ${dayShape}; ${monthName(day.minIndex)} is the shortest sampled opening-day span and ${monthName(day.maxIndex)} the longest. These extrema come directly from the twelve local Panchang snapshots for ${year}.`
    : `${profile.solarInterpretation} No month-opening Panchang snapshots are available, so no solar extrema are inferred.`;
  const lunarBody=snapshots.length
    ? `The annual lunar path is intentionally read at separated checkpoints rather than as twelve interchangeable cards. ${lunarPath}. ${first&&middle&&last?`The opening, mid-year and closing checkpoints move from ${first.paksha} ${first.tithi} / ${first.nakshatra}, through ${middle.paksha} ${middle.tithi} / ${middle.nakshatra}, to ${last.paksha} ${last.tithi} / ${last.nakshatra}.`:""}`
    : "No month-opening lunar checkpoints are available for this yearly route.";
  const festivalBody=`The maintained observance footprint is another annual discriminator: ${festivalPath}. This sequence is shown as a navigation layer around the local Panchang year, not as a substitute for festival-specific timing pages.`;

  return {
    eyebrow:`YEARLY CITY COMPARISON LENS · ${city.name.toUpperCase()}`,
    title:profile.title,
    localityBody,
    solarTitle:`Local solar-year chronology · ${sunriseShape}`,
    solarBody,
    lunarTitle:"Separated lunar checkpoints across the year",
    lunarBody,
    festivalTitle:"Maintained observance sequence",
    festivalBody,
    facts:[
      {label:"Annual geography",value:city.slug==="pune"?"inland western Deccan":"metropolitan Konkan coast",note:profile.title},
      {label:"Sunrise spread",value:sunriseShape,note:snapshots.length?`${monthName(sunrise.minIndex)} → ${monthName(sunrise.maxIndex)}`:"No snapshots"},
      {label:"Daylight spread",value:dayShape,note:snapshots.length?`${monthName(day.minIndex)} → ${monthName(day.maxIndex)}`:"No snapshots"},
      {label:"Solar chronology",value:solarChronology,note:`Year ${year}`},
      {label:"Lunar checkpoints",value:snapshots.length?"opening · mid-year · closing":"unavailable",note:snapshots.length?`${first?.paksha} → ${middle?.paksha} → ${last?.paksha}`:"No snapshots"},
      {label:"Festival footprint",value:festivals.length?`${festivals.length} maintained observances`:"no maintained observances",note:festivals[0]?`${festivals[0].name} opens the stored sequence`:"No festival entries"},
    ]
  };
}
