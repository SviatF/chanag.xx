import {cities,type City} from "./cities";
import {getLunarMonthConventions} from "./calendar-conventions";
import {getFestivalSemantics} from "./festival-conventions";
import type {Festival} from "./festivals";
import {getPanchang,type Panchang} from "./panchang";
import {getFestivalLocalReference,getFestivalRuleProfile} from "./religious-integrity";

type Fact={label:string;value:string;note?:string};
type ReferenceRow={city:City;data:Panchang};

export type FestivalYearQualityContext={
  directAnswer:string;
  contextTitle:string;
  contextBody:string;
  lunarTitle:string;
  lunarBody:string;
  cityVariationTitle:string;
  cityVariationBody:string;
  observanceTitle:string;
  observanceBody:string;
  facts:Fact[];
};

export type FestivalAnnualQualityContext={
  directAnswer:string;
  overviewTitle:string;
  overviewBody:string;
  distributionTitle:string;
  distributionBody:string;
  chronologyTitle:string;
  chronologyBody:string;
  planningTitle:string;
  planningBody:string;
  facts:Fact[];
};

const referenceSlugs=["mumbai","delhi","kolkata","chennai"] as const;
const referenceCities=referenceSlugs
  .map(slug=>cities.find(city=>city.slug===slug))
  .filter((city):city is City=>Boolean(city));

const monthFormatter=new Intl.DateTimeFormat("en-IN",{month:"long",timeZone:"Asia/Kolkata"});
const weekdayFormatter=new Intl.DateTimeFormat("en-IN",{weekday:"long",timeZone:"Asia/Kolkata"});
const longDateFormatter=new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"long",year:"numeric",timeZone:"Asia/Kolkata"});

function festivalDate(value:string){return new Date(`${value}T06:00:00Z`);}
function monthName(month:number){return monthFormatter.format(new Date(Date.UTC(2026,month-1,1,6)));}
function toMinutes(value:string){const [h,m]=value.split(":").map(Number);return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:0;}
function uniq<T>(items:T[]){return [...new Set(items)];}
function list(items:string[]){
  if(!items.length)return "none";
  if(items.length===1)return items[0];
  return `${items.slice(0,-1).join(", ")} and ${items[items.length-1]}`;
}
function localTimeRange(rows:ReferenceRow[],field:"sunrise"|"sunset"){
  const ordered=rows.slice().sort((a,b)=>toMinutes(a.data[field])-toMinutes(b.data[field]));
  const first=ordered[0],last=ordered[ordered.length-1];
  if(!first||!last)return "No local solar reference is available.";
  return `${first.city.name} ${first.data[field]} → ${last.city.name} ${last.data[field]}`;
}

const anchorCopy:Record<Festival["pujaRule"],string>={
  sunrise:"The practical observance frame begins from the local sunrise boundary, so the same civil date should still be read through each city's own morning Panchang state.",
  midday:"The practical observance frame is centered on the local middle of the solar day, which makes the city's sunrise/sunset geometry relevant even when the festival date is shared nationally.",
  sunset:"The practical observance frame is tied to the local evening boundary. Sunset and any following lunar reference therefore belong to the city-level calculation rather than to a single nationwide clock time.",
  night:"The practical observance frame belongs to the local night. Sunset, the night span and tradition-specific lunar conditions matter more than a generic daytime window.",
  day:"The observance is primarily a daytime festival, but sunrise, Tithi persistence and local solar boundaries still define the Panchang context for that civil date.",
};

export async function buildFestivalYearQualityContext(festival:Festival):Promise<FestivalYearQualityContext>{
  const date=festivalDate(festival.date);
  const references:ReferenceRow[]=await Promise.all(referenceCities.map(async city=>({city,data:await getPanchang(date,city)})));
  const base=references[0];
  if(!base)throw new Error("Festival parent quality requires at least one reference city");

  const semantics=getFestivalSemantics(festival);
  const ruleProfile=getFestivalRuleProfile(festival);
  const lunar=getLunarMonthConventions(date,base.city,base.data);
  const localReference=getFestivalLocalReference(festival,base.data);
  const weekday=weekdayFormatter.format(date);
  const displayDate=longDateFormatter.format(date);
  const tithiStates=uniq(references.map(item=>`${item.data.paksha} ${item.data.tithi}`));
  const nakshatraStates=uniq(references.map(item=>item.data.nakshatra));
  const sunriseRange=localTimeRange(references,"sunrise");
  const sunsetRange=localTimeRange(references,"sunset");
  const regionalLabels=uniq([...festival.regionalNames,...semantics.relatedObservances]);
  const ritualSequence=festival.rituals.join(" → ");
  const convention=semantics.lunarConventionNote??`On the Mumbai reference calculation, the Amanta month is ${lunar.amantaLabel} and the Purnimanta month is ${lunar.purnimantaLabel}.`;
  const localReferenceSentence=localReference
    ? `${localReference.label}: ${localReference.value}. ${localReference.note}`
    : `This parent page does not publish a universal ritual clock time. ${ruleProfile.localReference}`;

  const directAnswer=`${festival.name} is maintained on ${weekday}, ${displayDate}. The parent page describes the observance rule and lunar context; exact city timing remains local. On the Mumbai reference calculation the day opens with ${base.data.paksha} ${base.data.tithi} under ${base.data.nakshatra}, while sunrise/sunset are recalculated for each city.`;

  const contextBody=`${festival.meaning} For the ${festival.year} record, Panchvani treats ${festival.date} as the maintained festival date and keeps the astronomical context separate from ritual certification. ${anchorCopy[festival.pujaRule]} The active rule profile is “${ruleProfile.title}”. Its current criteria are ${list(ruleProfile.criteria)}. This distinction matters because a shared festival date can coexist with local timing boundaries and tradition-specific selection rules.`;

  const lunarBody=`Across the reference cities used for this parent analysis, the sunrise-day Panchang resolves to ${list(tithiStates)} for Tithi/Paksha and ${list(nakshatraStates)} for Nakshatra. ${convention} The Mumbai reference carries Amanta ${lunar.amantaLabel} and Purnimanta ${lunar.purnimantaLabel}. These labels explain the calendar context of the maintained date; they do not replace the festival-specific rule profile or a sampradaya-specific observance decision.`;

  const cityVariationBody=`A single nationwide clock time is not copied onto the city pages. For this date the four reference cities span sunrise from ${sunriseRange} and sunset from ${sunsetRange}. The observed Tithi set is ${list(tithiStates)}, while the Nakshatra set is ${list(nakshatraStates)}. That local solar/lunar frame is why the city descendants calculate their own sunrise, sunset, moonrise and supported festival references instead of inheriting one parent-page timing value.`;

  const observanceBody=`The maintained observance sequence on this page is ${ritualSequence}. ${regionalLabels.length?`Regional or alternate labels in the registry include ${list(regionalLabels)}. `:""}${localReferenceSentence}${festival.relatedMuhurat?` Panchvani also exposes a separate ${festival.relatedMuhurat.replaceAll("-"," ")} planning shortlist for users whose intent is event planning rather than festival observance.`:""} The parent page therefore acts as the festival rule-and-context layer, while city pages carry the local astronomical execution layer.`;

  return {
    directAnswer,
    contextTitle:`Why ${festival.name} falls on this maintained ${festival.year} date`,
    contextBody,
    lunarTitle:`Lunar context for ${festival.name}`,
    lunarBody,
    cityVariationTitle:"Why local city timing can differ",
    cityVariationBody,
    observanceTitle:"Observance scope and practical reading",
    observanceBody,
    facts:[
      {label:"Maintained date",value:festival.date,note:weekday},
      {label:"Observance anchor",value:festival.pujaRule,note:ruleProfile.title},
      {label:"Mumbai sunrise state",value:`${base.data.paksha} ${base.data.tithi}`,note:base.data.nakshatra},
      {label:"Lunar months",value:`${lunar.amantaLabel} / ${lunar.purnimantaLabel}`,note:"Amanta / Purnimanta"},
      {label:"Reference-city Tithi states",value:String(tithiStates.length),note:list(tithiStates)},
      {label:"Reference-city Nakshatras",value:String(nakshatraStates.length),note:list(nakshatraStates)},
      {label:"Solar reference",value:`${base.data.sunrise}–${base.data.sunset}`,note:"Mumbai baseline; city pages recalculate locally"},
      {label:"Rule exactness",value:ruleProfile.exactness==="derived-reference"?"derived local reference":"context only",note:ruleProfile.limitations[0]},
    ]
  };
}

export function buildFestivalAnnualQualityContext(year:number,festivals:readonly Festival[]):FestivalAnnualQualityContext{
  const sorted=festivals.slice().sort((a,b)=>a.date.localeCompare(b.date));
  const monthCounts=new Map<number,number>();
  const weekdayCounts=new Map<string,number>();
  const anchorCounts=new Map<Festival["pujaRule"],number>();
  let regionalLabelCount=0;
  let conventionSensitive=0;
  let relatedPlanning=0;

  for(const festival of sorted){
    const date=festivalDate(festival.date);
    const month=Number(festival.date.slice(5,7));
    monthCounts.set(month,(monthCounts.get(month)??0)+1);
    const weekday=weekdayFormatter.format(date);
    weekdayCounts.set(weekday,(weekdayCounts.get(weekday)??0)+1);
    anchorCounts.set(festival.pujaRule,(anchorCounts.get(festival.pujaRule)??0)+1);
    regionalLabelCount+=festival.regionalNames.length;
    if(getFestivalSemantics(festival).lunarConventionNote)conventionSensitive++;
    if(festival.relatedMuhurat)relatedPlanning++;
  }

  const busiestCount=Math.max(0,...monthCounts.values());
  const busiestMonths=[...monthCounts.entries()].filter(([,count])=>count===busiestCount).map(([month])=>monthName(month));
  const activeMonths=[...monthCounts.keys()].sort((a,b)=>a-b).map(monthName);
  const emptyMonths=Array.from({length:12},(_,i)=>i+1).filter(month=>!monthCounts.has(month)).map(monthName);
  const weekdayOrder=[...weekdayCounts.entries()].sort((a,b)=>b[1]-a[1]);
  const anchorOrder=[...anchorCounts.entries()].sort((a,b)=>b[1]-a[1]);
  const first=sorted[0],last=sorted[sorted.length-1];
  const chronology=sorted.map(item=>`${item.name} (${monthName(Number(item.date.slice(5,7)))}, ${weekdayFormatter.format(festivalDate(item.date))})`).join(" · ");
  const anchorNarrative=anchorOrder.map(([anchor,count])=>`${anchor}: ${count}`).join(" · ");
  const weekdayNarrative=weekdayOrder.map(([weekday,count])=>`${weekday}: ${count}`).join(" · ");

  const directAnswer=`The ${year} Hindu festival calendar contains ${sorted.length} maintained festival records across ${activeMonths.length} active months. It is an annual chronology rather than a multi-year directory: each row opens a dedicated festival page, while city descendants provide local Panchang timing where supported.`;
  const overviewBody=`This annual page is intentionally separate from /festivals. The directory helps users browse the festival catalog across available years; this route explains the internal shape of one civil year. The maintained sequence begins with ${first?.name??"the first validated record"} in ${first?monthName(Number(first.date.slice(5,7))):"the opening month"} and closes with ${last?.name??"the final validated record"} in ${last?monthName(Number(last.date.slice(5,7))):"the closing month"}. ${activeMonths.length} months contain at least one maintained festival record, while ${emptyMonths.length?`${list(emptyMonths)} currently contain none from this curated set.`:"every month is represented in the maintained set."}`;
  const distributionBody=`The densest part of the maintained calendar is ${list(busiestMonths)}, with ${busiestCount} festival record${busiestCount===1?"":"s"}. The observance-anchor mix is ${anchorNarrative}. This mix matters because sunrise-led, sunset-led, night, midday and general daytime festivals should not be flattened into one generic timing model. ${conventionSensitive} maintained festivals carry an explicit Amanta/Purnimanta convention note, ${regionalLabelCount} regional or alternate labels are stored across the set, and ${relatedPlanning} festivals link to a separate Muhurat-planning intent.`;
  const chronologyBody=`The year's maintained sequence is: ${chronology}. Weekday distribution across the registry is ${weekdayNarrative}. These are descriptive properties of the curated ${year} dataset, not claims that a weekday alone determines observance. The dedicated festival pages add meaning, rule profile and lunar context; city pages then recalculate local solar and lunar values for the same maintained civil date.`;
  const planningBody=`Use this page when the task is “show me the validated festival chronology for ${year}”. Use an individual festival page when the task is “explain this festival's date and observance rule”. Use a city descendant when the task depends on local sunrise, sunset, moonrise, Tithi persistence or a supported local reference window. Keeping those three intents separate prevents the annual calendar from becoming a thin duplicate of the directory or a substitute for city-specific Panchang calculation.`;

  return {
    directAnswer,
    overviewTitle:`How to read the ${year} festival calendar`,
    overviewBody,
    distributionTitle:"Festival distribution and timing-rule mix",
    distributionBody,
    chronologyTitle:`Maintained ${year} chronology`,
    chronologyBody,
    planningTitle:"Choose the right festival layer",
    planningBody,
    facts:[
      {label:"Maintained records",value:String(sorted.length),note:`${activeMonths.length} active months`},
      {label:"Busiest month",value:list(busiestMonths),note:`${busiestCount} maintained record${busiestCount===1?"":"s"}`},
      {label:"Empty months",value:String(emptyMonths.length),note:emptyMonths.length?list(emptyMonths):"None"},
      {label:"Convention-sensitive",value:String(conventionSensitive),note:"Explicit Amanta/Purnimanta note"},
      {label:"Regional labels",value:String(regionalLabelCount),note:"Stored aliases and regional names"},
      {label:"Related planning links",value:String(relatedPlanning),note:"Separate Muhurat intent"},
    ]
  };
}
