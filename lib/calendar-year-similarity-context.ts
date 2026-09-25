import type {City} from "./cities";
import {buildCityContentProfile} from "./city-content-profile";
import type {Festival} from "./festivals";
import type {Panchang} from "./panchang";

type FestivalSummary=Pick<Festival,"name"|"slug"|"date">;
type Fact={label:string;value:string;note?:string};

export type CalendarYearSimilarityContext={
  title:string;
  localityBody:string;
  chronologyTitle:string;
  chronologyBody:string;
  festivalTitle:string;
  festivalBody:string;
  facts:Fact[];
};

function clockMinutes(value:string){const [h,m]=value.split(":").map(Number);return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:0;}
function daylight(entry:Panchang){const rise=clockMinutes(entry.sunrise),set=clockMinutes(entry.sunset);return set>=rise?set-rise:set+1440-rise;}
function monthName(month:number){return new Intl.DateTimeFormat("en-IN",{month:"long",timeZone:"Asia/Kolkata"}).format(new Date(Date.UTC(2026,month-1,1,6)));}
function weekday(year:number,month:number,day=1){return new Intl.DateTimeFormat("en-IN",{weekday:"long",timeZone:"Asia/Kolkata"}).format(new Date(Date.UTC(year,month-1,day,6)));}
function yearFrame(year:number){
  const leap=new Date(Date.UTC(year,1,29)).getUTCMonth()===1;
  const open=weekday(year,1,1),close=weekday(year,12,31);
  return {key:`${leap?"leap":"common"}-${open.toLowerCase()}`,label:`${leap?"leap":"common"} Gregorian year opening on ${open}`,open,close,leap};
}
function sunriseClass(value:string){const min=clockMinutes(value);if(min<350)return "very-early";if(min<365)return "early";if(min<380)return "near-six";if(min<395)return "post-six";return "late";}
function daylightClass(value:number){if(value<700)return "compact";if(value<730)return "short-balanced";if(value<760)return "balanced";if(value<790)return "long-balanced";return "extended";}
function monthArc(snapshots:readonly Panchang[]){
  return snapshots.map((item,index)=>`${monthName(index+1)} ${item.paksha} ${item.tithi} / ${item.nakshatra} / ${sunriseClass(item.sunrise)} sunrise`).join(" · ");
}
function seasonalArc(snapshots:readonly Panchang[]){
  return snapshots.map((item,index)=>`${monthName(index+1)} ${daylightClass(daylight(item))}`).join(" · ");
}
function festivalMap(festivals:readonly FestivalSummary[],year:number){
  if(!festivals.length)return "No maintained festival entries are attached to this year.";
  const byMonth=new Map<number,FestivalSummary[]>();
  for(const item of festivals){const m=Number(item.date.slice(5,7));byMonth.set(m,[...(byMonth.get(m)??[]),item]);}
  return [...byMonth.entries()].sort((a,b)=>a[0]-b[0]).map(([month,items])=>`${monthName(month)}: ${items.map(item=>`${item.name} on ${weekday(year,month,Number(item.date.slice(8,10)))}`).join(", ")}`).join(" · ");
}
function quarterFingerprint(snapshots:readonly Panchang[]){
  const picks=[0,3,6,9].filter(index=>snapshots[index]);
  return picks.map(index=>{const item=snapshots[index];return `${monthName(index+1)} opens with ${item.paksha} ${item.tithi}, ${item.nakshatra}, Moon in ${item.rashi}`;}).join(" · ");
}
function dominantMonthStartWeekday(year:number){
  const counts=new Map<string,number>();
  for(let month=1;month<=12;month++){const w=weekday(year,month,1);counts.set(w,(counts.get(w)??0)+1);}
  return [...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]??["—",0] as [string,number];
}
function cityVariant(slug:string){let h=19;for(let i=0;i<slug.length;i++)h=(h*151+slug.charCodeAt(i)*(i+7))%104729;return h%6;}

export function buildCalendarYearSimilarityContext(city:City,year:number,snapshots:readonly Panchang[],festivals:readonly FestivalSummary[]):CalendarYearSimilarityContext{
  const profile=buildCityContentProfile(city),frame=yearFrame(year),variant=cityVariant(city.slug),monthStart=dominantMonthStartWeekday(year);
  if(!snapshots.length){
    return {
      title:`${city.name} ${year} locality lens`,
      localityBody:`${profile.dailyContext} The yearly route remains anchored to ${profile.geoContext}, with a ${profile.latitudeContext} and a solar clock ${profile.solarClockContext}.`,
      chronologyTitle:`${frame.label}`,
      chronologyBody:`The civil year opens on ${frame.open} and closes on ${frame.close}; no month-start Panchang snapshots are currently available to build a twelve-step chronology.`,
      festivalTitle:"Festival footprint",
      festivalBody:"No maintained festival entries are attached to the empty yearly snapshot state.",
      facts:[{label:"Year frame",value:frame.key},{label:"Geographic frame",value:profile.geoContext},{label:"Solar clock",value:profile.solarClockContext}]
    };
  }

  const first=snapshots[0],last=snapshots[snapshots.length-1];
  const daylightValues=snapshots.map(daylight);
  const minDay=Math.min(...daylightValues),maxDay=Math.max(...daylightValues);
  const shortestIndex=daylightValues.indexOf(minDay),longestIndex=daylightValues.indexOf(maxDay);
  const firstQuarter=quarterFingerprint(snapshots);
  const arc=monthArc(snapshots),solarArc=seasonalArc(snapshots),festMap=festivalMap(festivals,year);
  const distinctWeekdays=new Set(Array.from({length:12},(_,i)=>weekday(year,i+1,1))).size;
  const sunriseClasses=[...new Set(snapshots.map(item=>sunriseClass(item.sunrise)))];
  const daylightClasses=[...new Set(daylightValues.map(daylightClass))];
  const lunarPairs=[...new Set(snapshots.map(item=>`${item.paksha} ${item.tithi}`))];
  const nakshatras=[...new Set(snapshots.map(item=>item.nakshatra))];
  const lunarRashis=[...new Set(snapshots.map(item=>item.rashi))];

  const localityBody=variant===0
    ? `${profile.dailyContext} Across the full ${year} calendar, that city-specific clock is sampled at twelve month starts. The sequence belongs to ${profile.geoContext}; a ${profile.latitudeContext} and a solar clock ${profile.solarClockContext} jointly determine where the annual sunrise and daylight pattern sits on IST.`
    : variant===1
      ? `The yearly page should be read through ${city.name}'s local geography rather than as a renamed national calendar. ${profile.dailyContext} In annual terms, ${profile.geoContext} contributes a ${profile.latitudeContext}, while the city remains ${profile.solarClockContext}; those conditions shape every month-start checkpoint below.`
      : variant===2
        ? `${city.name}'s annual chronology is anchored to ${profile.geoContext}. ${profile.dailyContext} The city's ${profile.latitudeContext} controls the scale of seasonal daylight change, and its position ${profile.solarClockContext} controls where those changes land on the civil clock.`
        : variant===3
          ? `Start with place, not with the year number: ${profile.geoContext}. ${profile.dailyContext} That local frame combines a ${profile.latitudeContext} with a solar clock ${profile.solarClockContext}, so the twelve first-of-month Panchang states form a city-specific annual series.`
          : variant===4
            ? `This yearly calendar keeps ${city.name}'s own solar frame intact. ${profile.dailyContext} The geographic baseline is ${profile.geoContext}; because it is a ${profile.latitudeContext} and ${profile.solarClockContext}, month-start sunrise states should not be substituted with a nearby city's series.`
            : `${profile.geoContext} supplies the local frame for ${city.name}'s ${year} calendar. ${profile.dailyContext} Over twelve monthly checkpoints, its ${profile.latitudeContext} and solar clock ${profile.solarClockContext} create a distinct annual timing signature.`;

  const chronologyBody=variant%3===0
    ? `${frame.label}. Month-start weekdays span ${distinctWeekdays} weekday labels, led by ${monthStart[0]} on ${monthStart[1]} month openings. The quarter checkpoints are ${firstQuarter}. The full lunar/sunrise arc is ${arc}.`
    : variant%3===1
      ? `The civil-year frame is ${frame.key}: January opens on ${frame.open} and December closes on ${frame.close}. Among first-of-month dates, ${monthStart[0]} is the most frequent opening weekday. Quarter anchors read ${firstQuarter}. Across all twelve snapshots, the sunrise-state chronology is ${arc}.`
      : `Calendar geometry and Panchang geometry intersect here. ${frame.leap?"A leap-year frame adds the extra February day":"A common-year frame keeps February at its ordinary length"}, while first-of-month weekdays cover ${distinctWeekdays} distinct labels. The quarter-start lunar checkpoints are ${firstQuarter}; the twelve-step sequence is ${arc}.`;

  const festivalBody=festivals.length
    ? `Festival placement is mapped onto this city's yearly route as follows: ${festMap}. The same annual series carries ${lunarPairs.length} distinct Paksha/Tithi month-start states, ${nakshatras.length} Nakshatras and ${lunarRashis.length} Moon-sign states. Solar-day classes across the year are ${solarArc}.`
    : `There is no maintained festival entry for ${year}, so this yearly route is differentiated by its local annual Panchang chronology instead: ${lunarPairs.length} Paksha/Tithi month-start states, ${nakshatras.length} Nakshatras, ${lunarRashis.length} Moon signs and the solar-day sequence ${solarArc}.`;

  return {
    title:`${city.name} ${year} annual locality lens · ${frame.key}`,
    localityBody,
    chronologyTitle:`Civil-year + month-start chronology · ${frame.open} opening`,
    chronologyBody,
    festivalTitle:`Annual festival and solar-day map`,
    festivalBody,
    facts:[
      {label:"Civil-year frame",value:frame.key,note:`${frame.open} → ${frame.close}`},
      {label:"Most common month-start weekday",value:monthStart[0],note:`${monthStart[1]} month openings`},
      {label:"Geographic frame",value:profile.geoContext,note:profile.latitudeContext},
      {label:"Solar-clock relation",value:profile.solarClockContext},
      {label:"Shortest sampled daylight",value:daylightClass(minDay),note:monthName(shortestIndex+1)},
      {label:"Longest sampled daylight",value:daylightClass(maxDay),note:monthName(longestIndex+1)},
      {label:"Sunrise-class variety",value:sunriseClasses.join(" · ")},
      {label:"Daylight-class variety",value:daylightClasses.join(" · ")},
      {label:"Lunar-state variety",value:`${lunarPairs.length} Paksha/Tithi · ${nakshatras.length} Nakshatras`,note:`${lunarRashis.length} Moon signs`},
      {label:"Year endpoints",value:`${first.paksha} ${first.tithi} → ${last.paksha} ${last.tithi}`,note:`${first.nakshatra} → ${last.nakshatra}`},
    ]
  };
}
