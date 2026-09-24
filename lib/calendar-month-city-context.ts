import type {City} from "./cities";
import {buildCityContentProfile} from "./city-content-profile";
import type {Festival} from "./festivals";
import type {Panchang} from "./panchang";

type Fact={label:string;value:string;note?:string};
type FestivalSummary=Pick<Festival,"name"|"slug"|"date">;

export type CalendarMonthCityContext={
  title:string;
  body:string;
  secondaryBody:string;
  lunarTitle:string;
  lunarBody:string;
  facts:Fact[];
};

function clockMinutes(value:string){
  const [h,m]=value.split(":").map(Number);
  return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:0;
}
function daylight(entry:Panchang){
  const rise=clockMinutes(entry.sunrise),set=clockMinutes(entry.sunset);
  return set>=rise?set-rise:set+1440-rise;
}
function average(values:number[]){return values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):0;}
function range(values:number[]){return values.length?Math.max(...values)-Math.min(...values):0;}
function drift(first:number,last:number){
  const delta=last-first;
  if(Math.abs(delta)<=2)return {key:"stable",text:"essentially stable across the month"};
  if(delta<0)return {key:"earlier",text:`moves earlier through the month`};
  return {key:"later",text:`moves later through the month`};
}
function daylightShape(first:number,last:number){
  const delta=last-first;
  if(Math.abs(delta)<=6)return {key:"steady-daylight",text:"daylight length stays nearly level from month start to month end"};
  if(delta>0)return {key:"lengthening-daylight",text:"the local solar day lengthens across the month"};
  return {key:"shortening-daylight",text:"the local solar day shortens across the month"};
}
function lunarMarkerShape(entries:readonly Panchang[]){
  const marked=entries.filter(entry=>["Ekadashi","Purnima","Amavasya"].includes(entry.tithi));
  if(!marked.length)return {key:"no-key-markers",text:"no Ekadashi, Purnima or Amavasya state is present at local sunrise"};
  const days=marked.map(entry=>Number(entry.date.slice(-2))).filter(Number.isFinite);
  const avgDay=average(days);
  if(avgDay<=10)return {key:"front-loaded",text:"the key lunar-marker mornings are concentrated toward the opening third of the month"};
  if(avgDay>=21)return {key:"back-loaded",text:"the key lunar-marker mornings are concentrated toward the closing third of the month"};
  return {key:"mid-month-balanced",text:"the key lunar-marker mornings are centered through the middle part of the month"};
}
function moonShape(entries:readonly Panchang[]){
  if(!entries.length)return {key:"unavailable",text:"moon-illumination range is unavailable"};
  const values=entries.map(entry=>entry.moonIllumination);
  const min=Math.min(...values),max=Math.max(...values);
  const span=max-min;
  if(span>=85)return {key:"full-lunar-sweep",text:"the month samples nearly the full dark-to-bright lunar range"};
  if(span>=65)return {key:"broad-lunar-sweep",text:"the sunrise sequence spans a broad lunar-illumination range"};
  return {key:"partial-lunar-sweep",text:"the retained month samples a narrower lunar-illumination range"};
}
function festivalShape(festivals:readonly FestivalSummary[]){
  if(!festivals.length)return {key:"no-maintained-festival",text:"no maintained festival record falls in this Gregorian month"};
  if(festivals.length===1)return {key:"single-festival",text:`one maintained festival anchors the month: ${festivals[0].name}`};
  if(festivals.length<=3)return {key:"festival-cluster",text:`a compact festival cluster contains ${festivals.map(item=>item.name).join(", ")}`};
  return {key:"festival-dense",text:`the month is festival-dense with ${festivals.length} maintained festival records`};
}
function choghadiyaShape(entries:readonly Panchang[]){
  if(!entries.length)return {key:"none",text:"no daytime Choghadiya rows are available"};
  const counts=entries.map(entry=>entry.dayChoghadiya.filter(period=>period.effect==="good").length);
  const avgGood=average(counts);
  const variability=range(counts);
  if(variability===0)return {key:"uniform-favorable-count",text:`every local date carries the same favorable-period count`};
  if(variability===1)return {key:"low-variance-favorable-count",text:`favorable-period counts vary only slightly through the month`};
  return {key:"variable-favorable-count",text:`favorable-period counts shift materially across the month`};
}
function monthName(year:number,month:number){return new Intl.DateTimeFormat("en-IN",{month:"long",year:"numeric",timeZone:"Asia/Kolkata"}).format(new Date(Date.UTC(year,month-1,1,6)));}

export function buildCalendarMonthCityContext(city:City,year:number,month:number,entries:readonly Panchang[],festivals:readonly FestivalSummary[]):CalendarMonthCityContext{
  const profile=buildCityContentProfile(city);
  const label=monthName(year,month);
  if(!entries.length){
    return {
      title:`${city.name} ${label} local calendar signature`,
      body:`The month currently has no retained daily Panchang rows. Its location context is still ${profile.geoContext}, with a ${profile.latitudeContext} and a solar clock ${profile.solarClockContext}.`,
      secondaryBody:`No alternate-city calendar is substituted for this empty local state.`,
      lunarTitle:"Lunar-marker structure",
      lunarBody:"No local daily rows are available to classify the month's lunar-marker distribution.",
      facts:[
        {label:"Geographic setting",value:profile.geoContext},
        {label:"Latitude profile",value:profile.latitudeContext},
        {label:"Solar-clock relation",value:profile.solarClockContext},
      ]
    };
  }

  const first=entries[0],last=entries[entries.length-1];
  const sunrises=entries.map(entry=>clockMinutes(entry.sunrise));
  const sunsets=entries.map(entry=>clockMinutes(entry.sunset));
  const daylights=entries.map(daylight);
  const rahuStarts=entries.map(entry=>clockMinutes(entry.rahu.start));
  const sunriseDrift=drift(clockMinutes(first.sunrise),clockMinutes(last.sunrise));
  const sunsetDrift=drift(clockMinutes(first.sunset),clockMinutes(last.sunset));
  const dayShape=daylightShape(daylight(first),daylight(last));
  const lunarMarkers=lunarMarkerShape(entries);
  const moon=moonShape(entries);
  const festival=festivalShape(festivals);
  const choghadiya=choghadiyaShape(entries);
  const nextDayTithi=entries.filter(entry=>entry.tithiEndDate&&entry.tithiEndDate>entry.date).length;
  const nextDayNakshatra=entries.filter(entry=>entry.nakshatraEndDate&&entry.nakshatraEndDate>entry.date).length;
  const abhijitDays=entries.filter(entry=>entry.abhijit!==null).length;

  const body=profile.solarClockContext.includes("west-shifted")
    ? `${label} in ${city.name} is calculated for ${profile.geoContext}. The city is ${profile.solarClockContext}; sunrise ${sunriseDrift.text}, sunset ${sunsetDrift.text}, and ${dayShape.text}. This west-shifted local clock is part of the month page's actual timing structure rather than a city-name substitution.`
    : profile.solarClockContext.includes("east-shifted")
      ? `${city.name}'s ${label} calendar belongs to ${profile.geoContext}, where the solar clock is ${profile.solarClockContext}. Across the month, sunrise ${sunriseDrift.text}, sunset ${sunsetDrift.text}, and ${dayShape.text}; the entire daily grid therefore sits on this city's own eastern clock profile.`
      : `${label} in ${city.name} is anchored to ${profile.geoContext}, close to India's standard-meridian solar clock. Through the month, sunrise ${sunriseDrift.text}, sunset ${sunsetDrift.text}, while ${dayShape.text}.`;

  const secondaryBody=`The month combines ${lunarMarkers.text}; ${moon.text}; and ${festival.text}. Daytime Choghadiya shows ${choghadiya.text}. ${nextDayTithi} Tithi transition${nextDayTithi===1?"":"s"} and ${nextDayNakshatra} Nakshatra transition${nextDayNakshatra===1?"":"s"} cross into the following civil date, adding another city-specific timing layer.`;

  return {
    title:`${city.name} ${label} local calendar signature`,
    body,
    secondaryBody,
    lunarTitle:`${lunarMarkers.key.replaceAll("-"," ")} lunar-marker pattern`,
    lunarBody:`For ${city.name}, ${lunarMarkers.text}. ${moon.text}. This pattern is derived from the Tithi state active at each local sunrise, not from a date-only month list.`,
    facts:[
      {label:"Geographic setting",value:profile.geoContext},
      {label:"Solar-clock relation",value:profile.solarClockContext,note:profile.latitudeContext},
      {label:"Sunrise movement",value:sunriseDrift.key,note:`${first.sunrise} → ${last.sunrise} · ${range(sunrises)} min range`},
      {label:"Sunset movement",value:sunsetDrift.key,note:`${first.sunset} → ${last.sunset} · ${range(sunsets)} min range`},
      {label:"Daylight shape",value:dayShape.key,note:`${daylight(first)} → ${daylight(last)} min`},
      {label:"Rahu start range",value:`${range(rahuStarts)} min`,note:`${first.rahu.start} first-day start`},
      {label:"Lunar-marker shape",value:lunarMarkers.key,note:moon.key},
      {label:"Festival density",value:festival.key,note:festivals.length?festivals.map(item=>item.name).join(" · "):"No maintained festival"},
      {label:"Abhijit coverage",value:`${abhijitDays}/${entries.length}`,note:choghadiya.key},
    ]
  };
}
