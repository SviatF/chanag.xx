import type {City} from "./cities";
import {buildCityContentProfile} from "./city-content-profile";
import type {Festival} from "./festivals";
import type {Panchang} from "./panchang";

type Fact={label:string;value:string;note?:string};
type FestivalSummary=Pick<Festival,"name"|"slug"|"date">;

export type CalendarYearCityContext={
  title:string;
  body:string;
  seasonalTitle:string;
  seasonalBody:string;
  lunarTitle:string;
  lunarBody:string;
  festivalTitle:string;
  festivalBody:string;
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
function monthName(value:string){
  const month=Number(value.slice(5,7));
  return new Intl.DateTimeFormat("en-IN",{month:"long",timeZone:"Asia/Kolkata"}).format(new Date(Date.UTC(2026,month-1,1,6)));
}
function seasonalShape(snapshots:readonly Panchang[]){
  if(!snapshots.length)return {key:"unavailable",text:"no month-start solar sequence is available"};
  const daylights=snapshots.map(daylight);
  const spread=range(daylights);
  if(spread<35)return {key:"low-seasonality",text:"a comparatively compact annual daylight swing"};
  if(spread<75)return {key:"moderate-seasonality",text:"a moderate annual daylight swing"};
  if(spread<115)return {key:"strong-seasonality",text:"a strong annual daylight swing"};
  return {key:"high-seasonality",text:"a very large annual daylight swing"};
}
function lunarShape(snapshots:readonly Panchang[]){
  const states=new Set(snapshots.map(item=>`${item.paksha}:${item.tithi}`)).size;
  const nakshatras=new Set(snapshots.map(item=>item.nakshatra)).size;
  const rashis=new Set(snapshots.map(item=>item.rashi)).size;
  if(states<=5)return {key:"repeating-month-start-lunar-pattern",text:"month starts repeat a relatively small set of Paksha/Tithi states",states,nakshatras,rashis};
  if(states<=8)return {key:"mixed-month-start-lunar-pattern",text:"month starts rotate through a mixed set of lunar states",states,nakshatras,rashis};
  return {key:"high-variety-month-start-lunar-pattern",text:"month starts show high lunar-state variety across the year",states,nakshatras,rashis};
}
function festivalShape(festivals:readonly FestivalSummary[]){
  if(!festivals.length)return {key:"no-maintained-festivals",text:"no maintained festival record is stored for this year",peak:"none",activeMonths:0};
  const counts=new Map<number,string[]>();
  for(const item of festivals){
    const month=Number(item.date.slice(5,7));
    counts.set(month,[...(counts.get(month)??[]),item.name]);
  }
  const active=[...counts.entries()].sort((a,b)=>a[0]-b[0]);
  const max=Math.max(...active.map(([,items])=>items.length));
  const peak=active.filter(([,items])=>items.length===max).map(([month,items])=>`${new Intl.DateTimeFormat("en-IN",{month:"long",timeZone:"Asia/Kolkata"}).format(new Date(Date.UTC(2026,month-1,1,6)))}: ${items.join(", ")}`).join(" · ");
  if(active.length<=3)return {key:"festival-clustered",text:"festival coverage is concentrated in a small number of Gregorian months",peak,activeMonths:active.length};
  if(active.length<=7)return {key:"festival-banded",text:"festival coverage forms several distinct annual bands",peak,activeMonths:active.length};
  return {key:"festival-broad",text:"festival coverage is distributed broadly across the Gregorian year",peak,activeMonths:active.length};
}
function sunrisePhase(value:number){
  if(value<350)return "early-rise";
  if(value<370)return "near-six";
  if(value<390)return "post-six";
  return "late-rise";
}

export function buildCalendarYearCityContext(city:City,year:number,snapshots:readonly Panchang[],festivals:readonly FestivalSummary[]):CalendarYearCityContext{
  const profile=buildCityContentProfile(city);
  if(!snapshots.length){
    return {
      title:`${city.name} ${year} yearly local signature`,
      body:`No month-start snapshots are available for ${year}. The page still belongs to ${profile.geoContext}, a ${profile.latitudeContext} with a solar clock ${profile.solarClockContext}.`,
      seasonalTitle:"Seasonal solar structure",
      seasonalBody:"No month-start solar series is available to classify annual daylight movement.",
      lunarTitle:"Month-start lunar structure",
      lunarBody:"No month-start lunar checkpoints are available.",
      festivalTitle:"Festival distribution",
      festivalBody:"No maintained festival records are attached to this empty yearly state.",
      facts:[
        {label:"Geographic setting",value:profile.geoContext},
        {label:"Latitude profile",value:profile.latitudeContext},
        {label:"Solar-clock relation",value:profile.solarClockContext},
      ]
    };
  }

  const sunriseValues=snapshots.map(item=>clockMinutes(item.sunrise));
  const sunsetValues=snapshots.map(item=>clockMinutes(item.sunset));
  const daylightValues=snapshots.map(daylight);
  const earliest=[...snapshots].sort((a,b)=>clockMinutes(a.sunrise)-clockMinutes(b.sunrise))[0];
  const latest=[...snapshots].sort((a,b)=>clockMinutes(b.sunrise)-clockMinutes(a.sunrise))[0];
  const longestDay=[...snapshots].sort((a,b)=>daylight(b)-daylight(a))[0];
  const shortestDay=[...snapshots].sort((a,b)=>daylight(a)-daylight(b))[0];
  const season=seasonalShape(snapshots);
  const lunar=lunarShape(snapshots);
  const festival=festivalShape(festivals);
  const sunriseMode=sunrisePhase(average(sunriseValues));
  const moonRange=range(snapshots.map(item=>item.moonIllumination));
  const hinduMonths=new Set(snapshots.map(item=>item.hinduMonth)).size;
  const solarSigns=new Set(snapshots.map(item=>item.solarRashi)).size;

  const body=profile.latitudeContext.includes("northern")
    ? `${city.name}'s ${year} calendar reflects ${profile.geoContext}, where a ${profile.latitudeContext} produces ${season.text}. The local solar clock is ${profile.solarClockContext}, so the month-start sunrise series has a ${sunriseMode} character rather than matching a pan-India fixed clock.`
    : profile.latitudeContext.includes("southern")||profile.latitudeContext.includes("tropical")
      ? `The ${year} yearly calendar for ${city.name} belongs to ${profile.geoContext}. Its ${profile.latitudeContext} produces ${season.text}, while the local solar clock is ${profile.solarClockContext}; together they create a more compressed seasonal timing pattern than many northern-city calendars.`
      : `${city.name}'s ${year} annual calendar is anchored to ${profile.geoContext}. Its ${profile.latitudeContext} and ${profile.solarClockContext} combine into ${season.text}, visible in the month-start sunrise, sunset and daylight checkpoints.`;

  const seasonalBody=`Across the 12 month-start snapshots, sunrise spans ${range(sunriseValues)} minutes and sunset spans ${range(sunsetValues)} minutes. The shortest sampled solar day appears in ${monthName(shortestDay.date)} at ${daylight(shortestDay)} minutes, while the longest appears in ${monthName(longestDay.date)} at ${daylight(longestDay)} minutes. The earliest month-start sunrise is ${earliest.sunrise} in ${monthName(earliest.date)}; the latest is ${latest.sunrise} in ${monthName(latest.date)}.`;
  const lunarBody=`The 12 local sunrise checkpoints form a ${lunar.key.replaceAll("-"," ")} pattern: ${lunar.states} distinct Paksha/Tithi states, ${lunar.nakshatras} Nakshatras and ${lunar.rashis} Moon-sign states appear at month start. Hindu-month labels span ${hinduMonths} distinct values and solar Rashi checkpoints span ${solarSigns}, while Moon illumination covers a ${moonRange}-point range.`;
  const festivalBody=festivals.length
    ? `${festival.text}. ${festival.activeMonths} Gregorian months contain maintained festival records; the strongest concentration is ${festival.peak}. These festival links inherit ${city.name}'s local Panchang context rather than being treated as date-only national cards.`
    : `No maintained festival record is stored for ${year}. The yearly page therefore keeps its local solar/lunar structure without manufacturing a festival distribution.`;

  return {
    title:`${city.name} ${year} local yearly signature`,
    body,
    seasonalTitle:`Annual solar pattern · ${season.key}`,
    seasonalBody,
    lunarTitle:`Month-start lunar pattern · ${lunar.key}`,
    lunarBody,
    festivalTitle:`Festival distribution · ${festival.key}`,
    festivalBody,
    facts:[
      {label:"Geographic setting",value:profile.geoContext},
      {label:"Solar-clock relation",value:profile.solarClockContext,note:profile.latitudeContext},
      {label:"Seasonality class",value:season.key,note:`Daylight spread ${range(daylightValues)} min`},
      {label:"Sunrise clock range",value:`${range(sunriseValues)} min`,note:`${earliest.sunrise} → ${latest.sunrise}`},
      {label:"Daylight extremes",value:`${daylight(shortestDay)} / ${daylight(longestDay)} min`,note:`${monthName(shortestDay.date)} → ${monthName(longestDay.date)}`},
      {label:"Month-start lunar class",value:lunar.key,note:`${lunar.states} Paksha/Tithi · ${lunar.nakshatras} Nakshatras`},
      {label:"Hindu-month variety",value:String(hinduMonths),note:`${solarSigns} solar Rashi states`},
      {label:"Moon illumination span",value:`${moonRange} pts`,note:"Across month-start snapshots"},
      {label:"Festival footprint",value:festival.key,note:`${festival.activeMonths} active Gregorian months`},
    ]
  };
}
