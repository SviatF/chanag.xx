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

function clockMinutes(value:string){const [h,m]=value.split(":").map(Number);return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:0;}
function average(values:number[]){return values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):0;}
function range(values:number[]){return values.length?Math.max(...values)-Math.min(...values):0;}
function drift(first:number,last:number){const delta=last-first;if(Math.abs(delta)<=2)return {key:"stable",text:"stays essentially stable from the opening date to the closing date"};if(delta<0)return {key:"earlier",text:"moves earlier through the month"};return {key:"later",text:"moves later through the month"};}
function lunarMarkerShape(entries:readonly CalendarMonthEntry[]){
  const marked=entries.filter(entry=>["Ekadashi","Purnima","Amavasya"].includes(entry.tithi));
  if(!marked.length)return {key:"no-key-markers",text:"no Ekadashi, Purnima or Amavasya state is present at local sunrise",marked};
  const days=marked.map(entry=>Number(entry.date.slice(-2))).filter(Number.isFinite),avgDay=average(days);
  if(avgDay<=10)return {key:"front-loaded",text:"the key lunar-marker mornings are concentrated toward the opening third of the month",marked};
  if(avgDay>=21)return {key:"back-loaded",text:"the key lunar-marker mornings are concentrated toward the closing third of the month",marked};
  return {key:"mid-month-balanced",text:"the key lunar-marker mornings are centered through the middle part of the month",marked};
}
function festivalShape(festivals:readonly FestivalSummary[]){
  if(!festivals.length)return {key:"no-maintained-festival",text:"no maintained festival record falls in this Gregorian month"};
  if(festivals.length===1)return {key:"single-festival",text:`one maintained festival anchors the month: ${festivals[0].name}`};
  if(festivals.length<=3)return {key:"festival-cluster",text:`a compact festival cluster contains ${festivals.map(item=>item.name).join(", ")}`};
  return {key:"festival-dense",text:`the month is festival-dense with ${festivals.length} maintained festival records`};
}
function favorableShape(entries:readonly CalendarMonthEntry[]){
  if(!entries.length)return {key:"none",text:"no daytime Choghadiya rows are available",avgGood:0,variability:0};
  const counts=entries.map(entry=>entry.dayChoghadiya.filter(period=>period.effect==="good").length),avgGood=average(counts),variability=range(counts);
  if(variability===0)return {key:"uniform-favorable-count",text:"every local date carries the same favorable-period count",avgGood,variability};
  if(variability===1)return {key:"low-variance-favorable-count",text:"favorable-period counts vary only slightly through the month",avgGood,variability};
  return {key:"variable-favorable-count",text:"favorable-period counts shift materially across the month",avgGood,variability};
}
function timingShape(entries:readonly CalendarMonthEntry[],field:"rahu"|"yamaganda"|"gulika"){
  if(!entries.length)return {key:"unavailable",range:0,drift:{key:"stable",text:"is unavailable"},first:"—",last:"—",average:0};
  const values=entries.map(entry=>clockMinutes(entry[field].start)),first=entries[0][field].start,last=entries[entries.length-1][field].start,r=range(values);
  return {key:r<=3?"tight-clock":r<=10?"moderate-clock-drift":"wide-clock-drift",range:r,drift:drift(clockMinutes(first),clockMinutes(last)),first,last,average:average(values)};
}
function monthName(year:number,month:number){return new Intl.DateTimeFormat("en-IN",{month:"long",year:"numeric",timeZone:"Asia/Kolkata"}).format(new Date(Date.UTC(year,month-1,1,6)));}
function narrativeKey(city:City){let hash=31;for(let i=0;i<city.slug.length;i++)hash=(hash*139+city.slug.charCodeAt(i)*(i+5))%65521;return hash;}
function weekdayLabel(date:string){return new Intl.DateTimeFormat("en-IN",{weekday:"long",timeZone:"Asia/Kolkata"}).format(new Date(`${date}T06:00:00Z`));}

export function buildCalendarMonthCityContext(city:City,year:number,month:number,entries:readonly CalendarMonthEntry[],festivals:readonly FestivalSummary[]):CalendarMonthCityContext{
  const profile=buildCityContentProfile(city),label=monthName(year,month);
  if(!entries.length){
    return {
      title:`${city.name} ${label} local calendar signature`,
      body:`The month currently has no retained daily Panchang rows. Its location context is still ${profile.geoContext}, with a ${profile.latitudeContext} and a solar clock ${profile.solarClockContext}. ${profile.dailyContext}`,
      secondaryBody:"No alternate-city calendar is substituted for this empty local state; the page remains tied to the requested city's own calculation scope.",
      lunarTitle:"Lunar-marker structure",
      lunarBody:"No local daily rows are available to classify the month's lunar-marker distribution.",
      facts:[{label:"Geographic setting",value:profile.geoContext},{label:"Latitude profile",value:profile.latitudeContext},{label:"Solar-clock relation",value:profile.solarClockContext}]
    };
  }

  const lunarMarkers=lunarMarkerShape(entries),festival=festivalShape(festivals),favorable=favorableShape(entries),rahu=timingShape(entries,"rahu"),yamaganda=timingShape(entries,"yamaganda"),gulika=timingShape(entries,"gulika");
  const abhijitDays=entries.filter(entry=>entry.abhijit!==null).length,tithiVariety=new Set(entries.map(entry=>entry.tithi)).size,nakshatraVariety=new Set(entries.map(entry=>entry.nakshatra)).size;
  const firstFavorable=entries.map(entry=>entry.dayChoghadiya.find(period=>period.effect==="good")?.name??"none"),favoriteLeaders=[...new Set(firstFavorable)];
  const markerWeekdays=lunarMarkers.marked.map(entry=>`${entry.tithi} ${weekdayLabel(entry.date)}`),variant=narrativeKey(city)%6;
  const clockSignature=`Rahu ${rahu.key}, Yamaganda ${yamaganda.key}, Gulika ${gulika.key}`;

  const body=variant===0
    ? `${label} is read from ${profile.geoContext}, not from a generic India timetable. ${city.name} is ${profile.solarClockContext} in a ${profile.latitudeContext}. Across the local month, Rahu ${rahu.drift.text}, Yamaganda ${yamaganda.drift.text}, and Gulika ${gulika.drift.text}. ${profile.dailyContext}`
    : variant===1
      ? `The monthly clock for ${city.name} belongs to ${profile.geoContext}. Its ${profile.latitudeContext} and ${profile.solarClockContext} determine where sunrise-derived exclusion periods land on the civil clock. This month's timing signature is ${clockSignature}; from the first date to the last, Rahu ${rahu.drift.text}. ${profile.dailyContext}`
      : variant===2
        ? `${city.name}'s ${label} sequence is a local solar-calendar object anchored in ${profile.geoContext}. Because the city is ${profile.solarClockContext}, Rahu, Yamaganda and Gulika are recomputed from the city's own day structure rather than copied from another metro. Their month-level pattern resolves to ${clockSignature}. ${profile.dailyContext}`
        : variant===3
          ? `For ${label}, the geographic baseline is ${profile.geoContext}. ${city.name} sits at a ${profile.latitudeContext}, with a solar clock ${profile.solarClockContext}. Rahu starts move through a ${rahu.key} range, Yamaganda through ${yamaganda.key}, and Gulika through ${gulika.key}; together these movements define the city's intramonth exclusion-clock signature. ${profile.dailyContext}`
          : variant===4
            ? `This ${label} calendar keeps ${city.name}'s local timing frame intact. The city belongs to ${profile.geoContext}; its solar day is ${profile.solarClockContext} and its latitude profile is ${profile.latitudeContext}. Rahu ${rahu.drift.text}, while Yamaganda ${yamaganda.drift.text} and Gulika ${gulika.drift.text}. ${profile.dailyContext}`
            : `The useful monthly distinction for ${city.name} begins with place: ${profile.geoContext}. That local frame is ${profile.solarClockContext}, so every sunrise-derived timing row belongs to the city's own clock. In ${label}, the exclusion pattern is ${clockSignature}, with Rahu ${rahu.drift.text}. ${profile.dailyContext}`;

  const secondaryBody=variant%3===0
    ? `The lunar side of the month is ${lunarMarkers.key}: ${lunarMarkers.text}. The sequence exposes ${tithiVariety} distinct sunrise Tithi labels and ${nakshatraVariety} Nakshatras. On the timing side, Choghadiya is ${favorable.key}, averaging ${favorable.avgGood} favorable-labelled periods per date; Abhijit survives on ${abhijitDays} of ${entries.length} dates. Festival structure is ${festival.key}: ${festival.text}.`
    : variant%3===1
      ? `Three independent layers describe the month. Lunar markers are ${lunarMarkers.key}; maintained-festival density is ${festival.key}; favorable Choghadiya counts are ${favorable.key}. The daily sunrise sequence contains ${tithiVariety} Tithi labels and ${nakshatraVariety} Nakshatras, while Abhijit is present on ${abhijitDays}/${entries.length} dates. This separates lunar-state variety from local solar-timing availability.`
      : `The month does not reduce to one festival list or one Tithi table. ${lunarMarkers.text}; ${festival.text}; and the Choghadiya count is ${favorable.text}. Across ${entries.length} local dates there are ${tithiVariety} Tithi states and ${nakshatraVariety} Nakshatra states, with Abhijit retained on ${abhijitDays} dates. Those layers jointly form the city's monthly fingerprint.`;

  const lunarBody=variant<=1
    ? `For ${city.name}, ${lunarMarkers.text}. The marked sunrise states occur as ${markerWeekdays.join(" · ")||"no key marker"}. First-favorable Choghadiya labels rotate through ${favoriteLeaders.join(", ")}. This makes the marker distribution a local sunrise sequence rather than a date list detached from the city's Panchang clock.`
    : variant<=3
      ? `The key lunar-marker geometry is ${lunarMarkers.key}. ${markerWeekdays.length?`In weekday terms the marked mornings resolve to ${markerWeekdays.join(" · ")}.`:"No Ekadashi/Purnima/Amavasya sunrise marker appears."} Across the full month, ${tithiVariety} Tithi labels and ${nakshatraVariety} Nakshatras pass through the local sunrise checkpoint, while first-good Choghadiya labels include ${favoriteLeaders.join(", ")}.`
      : `Read the month's lunar layer through sunrise checkpoints: ${lunarMarkers.text}. The specific marker/weekday combinations are ${markerWeekdays.join(" · ")||"none"}. The wider sunrise sequence spans ${tithiVariety} Tithi labels and ${nakshatraVariety} Nakshatras. Separately, the first favorable Choghadiya slot cycles among ${favoriteLeaders.join(", ")}, so lunar and intraday timing patterns remain distinct.`;

  return {
    title:`${city.name} ${label} local calendar signature`,
    body,
    secondaryBody,
    lunarTitle:`${lunarMarkers.key.replaceAll("-"," ")} lunar-marker pattern`,
    lunarBody,
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
