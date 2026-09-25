import type {City} from "./cities";
import {buildCityContentProfile} from "./city-content-profile";
import type {Festival} from "./festivals";
import type {Panchang} from "./panchang";

type Fact={label:string;value:string;note?:string};
type FestivalSummary=Pick<Festival,"name"|"slug"|"date">;

export type CalendarYearCityContext={
  title:string;body:string;seasonalTitle:string;seasonalBody:string;lunarTitle:string;lunarBody:string;festivalTitle:string;festivalBody:string;facts:Fact[];
};

function clockMinutes(value:string){const [h,m]=value.split(":").map(Number);return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:0;}
function daylight(entry:Panchang){const rise=clockMinutes(entry.sunrise),set=clockMinutes(entry.sunset);return set>=rise?set-rise:set+1440-rise;}
function average(values:number[]){return values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):0;}
function range(values:number[]){return values.length?Math.max(...values)-Math.min(...values):0;}
function monthName(value:string){const month=Number(value.slice(5,7));return new Intl.DateTimeFormat("en-IN",{month:"long",timeZone:"Asia/Kolkata"}).format(new Date(Date.UTC(2026,month-1,1,6)));}
function seasonalShape(snapshots:readonly Panchang[]){if(!snapshots.length)return {key:"unavailable",text:"no month-start solar sequence is available"};const spread=range(snapshots.map(daylight));if(spread<35)return {key:"low-seasonality",text:"a comparatively compact annual daylight swing"};if(spread<75)return {key:"moderate-seasonality",text:"a moderate annual daylight swing"};if(spread<115)return {key:"strong-seasonality",text:"a strong annual daylight swing"};return {key:"high-seasonality",text:"a very large annual daylight swing"};}
function lunarShape(snapshots:readonly Panchang[]){const states=new Set(snapshots.map(item=>`${item.paksha}:${item.tithi}`)).size,nakshatras=new Set(snapshots.map(item=>item.nakshatra)).size,rashis=new Set(snapshots.map(item=>item.rashi)).size;if(states<=5)return {key:"repeating-month-start-lunar-pattern",text:"month starts repeat a relatively small set of Paksha/Tithi states",states,nakshatras,rashis};if(states<=8)return {key:"mixed-month-start-lunar-pattern",text:"month starts rotate through a mixed set of lunar states",states,nakshatras,rashis};return {key:"high-variety-month-start-lunar-pattern",text:"month starts show high lunar-state variety across the year",states,nakshatras,rashis};}
function festivalShape(festivals:readonly FestivalSummary[]){
  if(!festivals.length)return {key:"no-maintained-festivals",text:"no maintained festival record is stored for this year",peak:"none",activeMonths:0};
  const counts=new Map<number,string[]>();for(const item of festivals){const month=Number(item.date.slice(5,7));counts.set(month,[...(counts.get(month)??[]),item.name]);}
  const active=[...counts.entries()].sort((a,b)=>a[0]-b[0]),max=Math.max(...active.map(([,items])=>items.length));
  const peak=active.filter(([,items])=>items.length===max).map(([month,items])=>`${new Intl.DateTimeFormat("en-IN",{month:"long",timeZone:"Asia/Kolkata"}).format(new Date(Date.UTC(2026,month-1,1,6)))}: ${items.join(", ")}`).join(" · ");
  if(active.length<=3)return {key:"festival-clustered",text:"festival coverage is concentrated in a small number of Gregorian months",peak,activeMonths:active.length};
  if(active.length<=7)return {key:"festival-banded",text:"festival coverage forms several distinct annual bands",peak,activeMonths:active.length};
  return {key:"festival-broad",text:"festival coverage is distributed broadly across the Gregorian year",peak,activeMonths:active.length};
}
function sunrisePhase(value:number){if(value<350)return "early-rise";if(value<370)return "near-six";if(value<390)return "post-six";return "late-rise";}
function narrativeKey(city:City){let hash=43;for(let i=0;i<city.slug.length;i++)hash=(hash*151+city.slug.charCodeAt(i)*(i+7))%65521;return hash;}

export function buildCalendarYearCityContext(city:City,year:number,snapshots:readonly Panchang[],festivals:readonly FestivalSummary[]):CalendarYearCityContext{
  const profile=buildCityContentProfile(city);
  if(!snapshots.length){return {title:`${city.name} ${year} yearly local signature`,body:`No month-start snapshots are available for ${year}. The page still belongs to ${profile.geoContext}, a ${profile.latitudeContext} with a solar clock ${profile.solarClockContext}. ${profile.dailyContext}`,seasonalTitle:"Seasonal solar structure",seasonalBody:"No month-start solar series is available to classify annual daylight movement.",lunarTitle:"Month-start lunar structure",lunarBody:"No month-start lunar checkpoints are available.",festivalTitle:"Festival distribution",festivalBody:"No maintained festival records are attached to this empty yearly state.",facts:[{label:"Geographic setting",value:profile.geoContext},{label:"Latitude profile",value:profile.latitudeContext},{label:"Solar-clock relation",value:profile.solarClockContext}]};}

  const sunriseValues=snapshots.map(item=>clockMinutes(item.sunrise)),sunsetValues=snapshots.map(item=>clockMinutes(item.sunset)),daylightValues=snapshots.map(daylight);
  const earliest=[...snapshots].sort((a,b)=>clockMinutes(a.sunrise)-clockMinutes(b.sunrise))[0],latest=[...snapshots].sort((a,b)=>clockMinutes(b.sunrise)-clockMinutes(a.sunrise))[0],longestDay=[...snapshots].sort((a,b)=>daylight(b)-daylight(a))[0],shortestDay=[...snapshots].sort((a,b)=>daylight(a)-daylight(b))[0];
  const season=seasonalShape(snapshots),lunar=lunarShape(snapshots),festival=festivalShape(festivals),sunriseMode=sunrisePhase(average(sunriseValues)),moonRange=range(snapshots.map(item=>item.moonIllumination)),hinduMonths=new Set(snapshots.map(item=>item.hinduMonth)).size,solarSigns=new Set(snapshots.map(item=>item.solarRashi)).size,variant=narrativeKey(city)%6;
  const solarSpread=`sunrise range ${range(sunriseValues)} minutes, sunset range ${range(sunsetValues)} minutes and daylight range ${range(daylightValues)} minutes`;

  const body=variant===0
    ? `${city.name}'s ${year} calendar is a yearly expression of ${profile.geoContext}. The city sits in a ${profile.latitudeContext} and is ${profile.solarClockContext}; its month-start samples therefore resolve to ${season.text} with a ${sunriseMode} average sunrise character. ${profile.dailyContext}`
    : variant===1
      ? `The annual calendar for ${city.name} begins with its local solar geography, not a national fixed clock. ${profile.geoContext} supplies the regional frame, while ${profile.solarClockContext} and the ${profile.latitudeContext} determine the seasonal movement. Across ${year}, the sampled year produces ${season.key} and ${sunriseMode} month-start dawns. ${profile.dailyContext}`
      : variant===2
        ? `Read ${city.name}'s ${year} hub as twelve local sunrise checkpoints tied to ${profile.geoContext}. Its ${profile.latitudeContext} gives the year ${season.text}; its civil solar timing is ${profile.solarClockContext}. Together those features form a ${sunriseMode} month-start clock profile rather than a copied all-India yearly shell. ${profile.dailyContext}`
        : variant===3
          ? `For ${city.name}, yearly calendar structure is anchored in ${profile.geoContext}. The solar clock is ${profile.solarClockContext}, and the latitude regime is ${profile.latitudeContext}. The twelve month-start dates expose ${season.key} seasonality and a ${sunriseMode} average dawn class. ${profile.dailyContext}`
          : variant===4
            ? `${year} in ${city.name} preserves a city-specific annual timing frame: ${profile.geoContext}, ${profile.latitudeContext}, ${profile.solarClockContext}. The resulting month-start sequence has ${season.text} and a ${sunriseMode} sunrise profile. ${profile.dailyContext}`
            : `The local-year signature for ${city.name} starts with place — ${profile.geoContext}. Because its solar clock is ${profile.solarClockContext} within a ${profile.latitudeContext}, the twelve month-start checkpoints form ${season.text}; their average sunrise class is ${sunriseMode}. ${profile.dailyContext}`;

  const seasonalBody=variant%3===0
    ? `The solar series is summarized by ${solarSpread}. The shortest sampled day falls in ${monthName(shortestDay.date)} at ${daylight(shortestDay)} minutes; the longest is ${monthName(longestDay.date)} at ${daylight(longestDay)} minutes. Earliest month-start sunrise is ${earliest.sunrise} in ${monthName(earliest.date)}, while the latest is ${latest.sunrise} in ${monthName(latest.date)}. This is the city's annual daylight geometry rather than a latitude-free calendar statistic.`
    : variant%3===1
      ? `Seasonality can be read from four concrete extremes. ${monthName(earliest.date)} supplies the earliest sampled sunrise at ${earliest.sunrise}; ${monthName(latest.date)} supplies the latest at ${latest.sunrise}. ${monthName(shortestDay.date)} has the shortest sampled daylight span, ${daylight(shortestDay)} minutes, whereas ${monthName(longestDay.date)} reaches ${daylight(longestDay)} minutes. In aggregate the year has ${solarSpread}.`
      : `The annual solar fingerprint is not one average time. Sunrise varies by ${range(sunriseValues)} minutes, sunset by ${range(sunsetValues)}, and sampled daylight by ${range(daylightValues)}. The day-length floor occurs in ${monthName(shortestDay.date)}, the ceiling in ${monthName(longestDay.date)}; the dawn extrema run from ${earliest.sunrise} in ${monthName(earliest.date)} to ${latest.sunrise} in ${monthName(latest.date)}.`;

  const lunarBody=variant<=1
    ? `Month-start lunar checkpoints form a ${lunar.key.replaceAll("-"," ")} pattern. Across the twelve sampled dawns, ${lunar.states} distinct Paksha/Tithi combinations, ${lunar.nakshatras} Nakshatras and ${lunar.rashis} Moon-sign states appear. Hindu-month naming spans ${hinduMonths} values, solar Rashi spans ${solarSigns}, and Moon illumination covers a ${moonRange}-point range. These are twelve separate local sunrise states rather than a generic list of month names.`
    : variant<=3
      ? `The lunar layer changes independently from the seasonal solar layer. The month-start set contains ${lunar.states} Paksha/Tithi states, ${lunar.nakshatras} Nakshatras and ${lunar.rashis} lunar Rashi states, producing a ${lunar.key} structure. Across the same checkpoints there are ${hinduMonths} Hindu-month labels, ${solarSigns} solar Rashi values and a ${moonRange}-point illumination spread.`
      : `At each Gregorian month start, the page samples the lunar state at ${city.name}'s local sunrise. Those twelve checkpoints yield ${lunar.states} Paksha/Tithi combinations, ${lunar.nakshatras} Nakshatras, ${lunar.rashis} Moon signs and ${hinduMonths} Hindu-month labels. With ${solarSigns} solar Rashi states and a ${moonRange}-point illumination span, the annual lunar sequence is classified as ${lunar.key}.`;

  const festivalBody=festivals.length
    ? variant%2===0
      ? `${festival.text}. Maintained festival records occupy ${festival.activeMonths} Gregorian months, with the strongest concentration at ${festival.peak}. Each city festival link inherits ${city.name}'s local Panchang context, so the annual distribution acts as a topical map over the city's twelve-month solar/lunar sequence rather than a detached national event list.`
      : `Festival density adds a third annual layer beside solar seasonality and lunar month-start states. The maintained set is ${festival.key}: ${festival.activeMonths} Gregorian months contain records, and the peak concentration is ${festival.peak}. These links resolve back into ${city.name}'s local festival pages instead of replacing the city's yearly context with date-only cards.`
    : `No maintained festival record is stored for ${year}. The yearly page therefore keeps its local solar and lunar structure without manufacturing a festival distribution.`;

  return {
    title:`${city.name} ${year} local yearly signature`,body,
    seasonalTitle:`Annual solar pattern · ${season.key}`,seasonalBody,
    lunarTitle:`Month-start lunar pattern · ${lunar.key}`,lunarBody,
    festivalTitle:`Festival distribution · ${festival.key}`,festivalBody,
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
