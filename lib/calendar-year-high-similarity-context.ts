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
  geographyLabel:string;
};

const profiles:Record<string,LocalProfile>={
  pune:{
    title:"Sahyadri-leeward annual planning lens",
    locality:"This yearly calendar is read from Pune's inland Deccan setting east of the Sahyadri crest. The useful comparison is not a generic Maharashtra label: an inland plateau clock, leeward geography and Pune's own month-opening sunrise states define the annual sequence. That makes the calendar an interior western-Deccan chronology rather than a metropolitan-Konkan coastal one.",
    solarInterpretation:"For Pune, the solar-year fingerprint is interpreted as an inland plateau arc. The earliest and latest month-opening sunrises, the shortest and longest first-of-month daylight spans, and the order in which those extrema appear are the practical annual markers. This emphasizes seasonal movement across the plateau instead of treating nearby western-Maharashtra cities as timing equivalents.",
    planningInterpretation:"When using the yearly overview for planning, read Pune's months as an inland sequence moving through pre-monsoon heat, monsoon-season cloud cover and the cooler post-monsoon part of the civil year. The Panchang calculation remains astronomical; this locality lens only explains why the same lunar labels should still be read against Pune's separate local solar boundaries.",
    geographyLabel:"inland western Deccan",
  },
  thane:{
    title:"Ulhas-side metropolitan Konkan annual lens",
    locality:"This yearly calendar is read from Thane's north-eastern metropolitan Konkan position around the Ulhas-creek side of the Mumbai region. Its annual identity is therefore built as a low-latitude coastal-metropolitan clock with its own coordinates and month-opening solar states, not as an inland Deccan substitute and not as a renamed Mumbai calendar.",
    solarInterpretation:"For Thane, the solar-year fingerprint is interpreted through a compact Konkan-coastal arc. The month-opening sunrise and daylight extrema matter less as abstract numbers than as the order in which the coastal-metropolitan clock shifts through the year. That chronology gives Thane a separate annual timing identity even when nearby Maharashtra pages share many of the same lunar names.",
    planningInterpretation:"For practical yearly reading, treat Thane as a metropolitan-Konkan sequence whose local sunrise boundaries sit inside the humid coastal belt west of the Sahyadri interior. The Panchang rules do not change by city; what changes is the local clock frame on which those Tithi, Nakshatra and observance states are experienced.",
    geographyLabel:"metropolitan Konkan coast",
  },
  "pimpri-chinchwad":{
    title:"Upper-Bhima metropolitan plateau annual lens",
    locality:"This yearly calendar belongs to the upper Bhima-basin side of the Pune metropolitan plateau. The annual identity is deliberately narrower than a Maharashtra label and more precise than a Pune proxy: Pimpri-Chinchwad retains its own coordinate, its own month-opening dawns and its own boundary-sensitive lunar states. Pune is the immediate plateau comparison, while Mumbai and Thane sit across the Sahyadri toward the Konkan and Nashik shifts the reference north into the upper Godavari basin. The yearly sequence therefore acts as a metropolitan plateau checkpoint where small solar differences can still reorder a sunrise-sensitive Panchang state.",
    solarInterpretation:"The solar-year fingerprint is interpreted through metropolitan proximity rather than broad regional separation. The useful evidence is the month-by-month spread between earliest and latest opening dawn, the chronology of daylight extrema and whether those extrema line up with Pune or diverge at the local coordinate. That gives the page a coordinate-level annual signature instead of a duplicated Pune seasonality paragraph.",
    planningInterpretation:"Read the twelve months as a local upper-Bhima progression. The important annual question is not whether the region shares monsoon and post-monsoon seasons with Pune, but how the local sunrise checkpoints intersect the monthly lunar states across that progression. Those local checkpoints keep the yearly calendar independently useful.",
    geographyLabel:"upper-Bhima metropolitan plateau",
  },
  ghaziabad:{
    title:"Eastern-NCR annual boundary lens",
    locality:"Ghaziabad's yearly calendar is anchored immediately east of Delhi on the upper Ganga-Yamuna plain. It shares the NCR's northern seasonal regime but occupies a slightly more easterly solar position, creating an annual clock that is close to the capital without being identical to it. Agra extends the Yamuna comparison to the south-east, while Lucknow moves deeper into the central Gangetic system. The year is therefore read as an eastern-NCR boundary sequence whose value lies in small but repeated dawn differences across twelve month-opening checkpoints.",
    solarInterpretation:"For Ghaziabad, annual solar structure is read through the accumulation of small eastward timing shifts. The earliest and latest month-opening sunrises define the outer range, but the chronology of those extrema and the daylight spread show how an NCR-edge clock moves through the northern seasonal cycle. That is a different analytical role from Delhi's capital reference.",
    planningInterpretation:"Use the annual page to compare how local sunrise moves through winter, spring, monsoon and autumn while lunar labels change independently. A month-opening Tithi near dawn can resolve differently from Delhi even when the seasonal arc is similar, so the yearly sequence preserves those local boundary checks rather than flattening the NCR into one timetable.",
    geographyLabel:"eastern NCR upper plain",
  },
  ludhiana:{
    title:"Central-Punjab seasonal annual lens",
    locality:"This yearly calendar is generated from the central Punjab alluvial plain at a far-northern latitude. Its annual identity combines a western IST solar placement with one of the stronger seasonal daylight swings in the active city set. Delhi is the principal south-eastern comparison, but Ludhiana's Punjab-plains position keeps the year outside both an NCR frame and a Himalayan-valley frame. The month-opening samples therefore form a distinctly northern-western sequence whose sunrise range and lunar checkpoints move across a wider seasonal envelope than the Deccan pages.",
    solarInterpretation:"The solar-year fingerprint is interpreted through amplitude and order. Track the earliest and latest month-opening dawns, the shortest and longest opening-day spans and the sequence in which those extrema occur. In Ludhiana those markers describe a central-Punjab seasonal arc, not merely a generic northern-city curve, because the western longitude and high latitude work together across the year.",
    planningInterpretation:"Read the annual overview as a Punjab-plains progression from short-day winter structure into the long-day part of the year and back again. The Panchang state sampled at each local dawn supplies a second independent layer, so the yearly identity comes from the interaction of pronounced seasonality with the actual lunar sequence.",
    geographyLabel:"central Punjab alluvial plain",
  },
  agra:{
    title:"Yamuna-corridor annual chronology lens",
    locality:"Agra's yearly calendar belongs to the Yamuna corridor of western Uttar Pradesh. It sits east of Jaipur, south-east of the NCR and west of the central Gangetic cities, giving it an annual role that is neither Rajasthan, Delhi-region nor Awadh. The twelve month-opening checkpoints are therefore read through a western-Uttar-Pradesh river corridor where northern seasonality combines with a distinct longitude position. That corridor identity keeps the local year separate even when festival dates and many lunar labels are shared with nearby northern cities.",
    solarInterpretation:"The annual solar fingerprint is read as a corridor chronology. The dawn and daylight extrema show how Agra moves between the more western clock of Rajasthan and the more easterly Gangetic progression. The order of those extrema, rather than one average sunrise, is the useful annual signature because it determines the local solar frame around each month-opening Panchang state.",
    planningInterpretation:"Use the yearly page to follow the local Yamuna-side progression month by month. Seasonal movement supplies the solar envelope, while the Tithi, Paksha, Nakshatra and Moon-sign checkpoints supply the lunar arc. Together they distinguish Agra's year from both an NCR calendar and an eastern Uttar Pradesh sequence.",
    geographyLabel:"western Yamuna river corridor",
  },
  nashik:{
    title:"Upper-Godavari annual inland lens",
    locality:"Nashik's yearly calendar is anchored in the upper Godavari basin of northern Maharashtra. The city shares western India's late civil-time solar tendency but sits north of Pune and away from the Mumbai-Thane coast, giving it a separate combination of inland geography, latitude and seasonal movement. Pimpri-Chinchwad and Pune provide the southern plateau comparison, while the Konkan metros represent the coastal alternative. The twelve month-opening snapshots therefore form a northern-Maharashtra inland chronology rather than a Maharashtra-wide template.",
    solarInterpretation:"For Nashik, the solar-year fingerprint is interpreted through the upper-Godavari seasonal arc. The earliest and latest month-opening sunrises, the daylight floor and ceiling and the order in which those markers appear show how a more northerly inland western city moves across the year. That combination is materially different from both Surat's lower-latitude western clock and the Pune metropolitan plateau.",
    planningInterpretation:"Read the year as an inland northern-Maharashtra progression. Month-opening lunar states are attached to Nashik's own dawn line, while the annual solar spread provides the seasonal envelope. This lets the page distinguish shared western-India lunar labels from the actual local chronology in which they occur.",
    geographyLabel:"upper-Godavari inland Maharashtra",
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
      {label:"Annual geography",value:profile.geographyLabel,note:profile.title},
      {label:"Sunrise spread",value:sunriseShape,note:snapshots.length?`${monthName(sunrise.minIndex)} → ${monthName(sunrise.maxIndex)}`:"No snapshots"},
      {label:"Daylight spread",value:dayShape,note:snapshots.length?`${monthName(day.minIndex)} → ${monthName(day.maxIndex)}`:"No snapshots"},
      {label:"Solar chronology",value:solarChronology,note:`Year ${year}`},
      {label:"Lunar checkpoints",value:snapshots.length?"opening · mid-year · closing":"unavailable",note:snapshots.length?`${first?.paksha} → ${middle?.paksha} → ${last?.paksha}`:"No snapshots"},
      {label:"Festival footprint",value:festivals.length?`${festivals.length} maintained observances`:"no maintained observances",note:festivals[0]?`${festivals[0].name} opens the stored sequence`:"No festival entries"},
    ]
  };
}
