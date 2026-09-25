import type {City} from "./cities";
import {buildCityContentProfile} from "./city-content-profile";
import type {Festival} from "./festivals";
import type {Panchang} from "./panchang";

type Fact={label:string;value:string;note?:string};
type FestivalSummary=Pick<Festival,"name"|"slug"|"date">;
type CalendarMonthEntry=Pick<Panchang,"date"|"tithi"|"nakshatra"|"rahu"|"yamaganda"|"gulika"|"abhijit"|"dayChoghadiya">;

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
function average(values:number[]){return values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):0;}
function range(values:number[]){return values.length?Math.max(...values)-Math.min(...values):0;}
function drift(first:number,last:number){
  const delta=last-first;
  if(Math.abs(delta)<=2)return {key:"stable",text:"stays essentially stable from the opening date to the closing date"};
  if(delta<0)return {key:"earlier",text:"moves earlier through the month"};
  return {key:"later",text:"moves later through the month"};
}
function lunarMarkerShape(entries:readonly CalendarMonthEntry[]){
  const marked=entries.filter(entry=>["Ekadashi","Purnima","Amavasya"].includes(entry.tithi));
  if(!marked.length)return {key:"no-key-markers",text:"no Ekadashi, Purnima or Amavasya state is present at local sunrise"};
  const days=marked.map(entry=>Number(entry.date.slice(-2))).filter(Number.isFinite);
  const avgDay=average(days);
  if(avgDay<=10)return {key:"front-loaded",text:"the key lunar-marker mornings are concentrated toward the opening third of the month"};
  if(avgDay>=21)return {key:"back-loaded",text:"the key lunar-marker mornings are concentrated toward the closing third of the month"};
  return {key:"mid-month-balanced",text:"the key lunar-marker mornings are centered through the middle part of the month"};
}
function festivalShape(festivals:readonly FestivalSummary[]){
  if(!festivals.length)return {key:"no-maintained-festival",text:"no maintained festival record falls in this Gregorian month"};
  if(festivals.length===1)return {key:"single-festival",text:`one maintained festival anchors the month: ${festivals[0].name}`};
  if(festivals.length<=3)return {key:"festival-cluster",text:`a compact festival cluster contains ${festivals.map(item=>item.name).join(", ")}`};
  return {key:"festival-dense",text:`the month is festival-dense with ${festivals.length} maintained festival records`};
}
function favorableShape(entries:readonly CalendarMonthEntry[]){
  if(!entries.length)return {key:"none",text:"no daytime Choghadiya rows are available",avgGood:0,variability:0};
  const counts=entries.map(entry=>entry.dayChoghadiya.filter(period=>period.effect==="good").length);
  const avgGood=average(counts);
  const variability=range(counts);
  if(variability===0)return {key:"uniform-favorable-count",text:"every local date carries the same favorable-period count",avgGood,variability};
  if(variability===1)return {key:"low-variance-favorable-count",text:"favorable-period counts vary only slightly through the month",avgGood,variability};
  return {key:"variable-favorable-count",text:"favorable-period counts shift materially across the month",avgGood,variability};
}
function timingShape(entries:readonly CalendarMonthEntry[],field:"rahu"|"yamaganda"|"gulika"){
  if(!entries.length)return {key:"unavailable",range:0,drift:{key:"stable",text:"is unavailable"},first:"—",last:"—"};
  const values=entries.map(entry=>clockMinutes(entry[field].start));
  const first=entries[0][field].start,last=entries[entries.length-1][field].start;
  return {key:range(values)<=3?"tight-clock":range(values)<=10?"moderate-clock-drift":"wide-clock-drift",range:range(values),drift:drift(clockMinutes(first),clockMinutes(last)),first,last};
}
function monthName(year:number,month:number){return new Intl.DateTimeFormat("en-IN",{month:"long",year:"numeric",timeZone:"Asia/Kolkata"}).format(new Date(Date.UTC(year,month-1,1,6)));}

export function buildCalendarMonthCityContext(city:City,year:number,month:number,entries:readonly CalendarMonthEntry[],festivals:readonly FestivalSummary[]):CalendarMonthCityContext{
  const profile=buildCityContentProfile(city);
  const label=monthName(year,month);
  if(!entries.length){
    return {
      title:`${city.name} ${label} local calendar signature`,
      body:`The month currently has no retained daily Panchang rows. Its location context is still ${profile.geoContext}, with a ${profile.latitudeContext} and a solar clock ${profile.solarClockContext}.`,
      secondaryBody:"No alternate-city calendar is substituted for this empty local state.",
      lunarTitle:"Lunar-marker structure",
      lunarBody:"No local daily rows are available to classify the month's lunar-marker distribution.",
      facts:[
        {label:"Geographic setting",value:profile.geoContext},
        {label:"Latitude profile",value:profile.latitudeContext},
        {label:"Solar-clock relation",value:profile.solarClockContext},
      ]
    };
  }

  const lunarMarkers=lunarMarkerShape(entries);
  const festival=festivalShape(festivals);
  const favorable=favorableShape(entries);
  const rahu=timingShape(entries,"rahu");
  const yamaganda=timingShape(entries,"yamaganda");
  const gulika=timingShape(entries,"gulika");
  const abhijitDays=entries.filter(entry=>entry.abhijit!==null).length;
  const tithiVariety=new Set(entries.map(entry=>entry.tithi)).size;
  const nakshatraVariety=new Set(entries.map(entry=>entry.nakshatra)).size;
  const firstFavorable=entries.map(entry=>entry.dayChoghadiya.find(period=>period.effect==="good")?.name??"none");
  const favoriteLeaders=[...new Set(firstFavorable)];

  const body=profile.solarClockContext.includes("west-shifted")
    ? `${label} in ${city.name} is calculated for ${profile.geoContext}, where the local solar clock is ${profile.solarClockContext}. Rahu Kalam ${rahu.drift.text}, Yamaganda ${yamaganda.drift.text}, and Gulika ${gulika.drift.text}; these city-timed exclusion clocks create a west-shifted monthly timing profile rather than a national fixed schedule.`
    : profile.solarClockContext.includes("east-shifted")
      ? `${city.name}'s ${label} calendar belongs to ${profile.geoContext}. Its solar clock is ${profile.solarClockContext}; Rahu Kalam ${rahu.drift.text}, Yamaganda ${yamaganda.drift.text}, and Gulika ${gulika.drift.text}, so the local timing grid carries an eastern-clock structure through the month.`
      : `${label} in ${city.name} is anchored to ${profile.geoContext}, with a solar clock ${profile.solarClockContext}. Rahu Kalam ${rahu.drift.text}, while Yamaganda ${yamaganda.drift.text} and Gulika ${gulika.drift.text} across the local monthly sequence.`;

  const secondaryBody=`The month combines ${lunarMarkers.text}; ${festival.text}; ${tithiVariety} distinct sunrise Tithi labels and ${nakshatraVariety} Nakshatras. Daytime Choghadiya shows ${favorable.text}, averaging ${favorable.avgGood} favorable-labelled periods per local date, while Abhijit remains available on ${abhijitDays} of ${entries.length} dates.`;

  return {
    title:`${city.name} ${label} local calendar signature`,
    body,
    secondaryBody,
    lunarTitle:`${lunarMarkers.key.replaceAll("-"," ")} lunar-marker pattern`,
    lunarBody:`For ${city.name}, ${lunarMarkers.text}. The month-start-to-end sequence contains ${tithiVariety} distinct Tithi labels and ${nakshatraVariety} Nakshatras; first-favorable Choghadiya labels rotate through ${favoriteLeaders.join(", ")}.`,
    facts:[
      {label:"Geographic setting",value:profile.geoContext},
      {label:"Solar-clock relation",value:profile.solarClockContext,note:profile.latitudeContext},
      {label:"Rahu start movement",value:rahu.drift.key,note:`${rahu.first} → ${rahu.last} · ${rahu.range} min range`},
      {label:"Yamaganda movement",value:yamaganda.drift.key,note:`${yamaganda.first} → ${yamaganda.last} · ${yamaganda.range} min range`},
      {label:"Gulika movement",value:gulika.drift.key,note:`${gulika.first} → ${gulika.last} · ${gulika.range} min range`},
      {label:"Lunar-marker shape",value:lunarMarkers.key,note:`${tithiVariety} Tithi · ${nakshatraVariety} Nakshatra labels`},
      {label:"Festival density",value:festival.key,note:festivals.length?festivals.map(item=>item.name).join(" · "):"No maintained festival"},
      {label:"Choghadiya shape",value:favorable.key,note:`Average ${favorable.avgGood} favorable periods · variance ${favorable.variability}`},
      {label:"Abhijit coverage",value:`${abhijitDays}/${entries.length}`,note:`First-good labels: ${favoriteLeaders.join(" · ")}`},
    ]
  };
}
