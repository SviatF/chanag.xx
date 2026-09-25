import type {City} from "./cities";
import {buildCityContentProfile} from "./city-content-profile";
import type {ChoghadiyaPeriod,Panchang} from "./panchang";

type Fact={label:string;value:string;note?:string};

export type ChoghadiyaCityContext={
  localityTitle:string;
  localityBody:string;
  boundaryTitle:string;
  boundaryBody:string;
  weekdayTitle:string;
  weekdayBody:string;
  facts:Fact[];
};

function clockMinutes(value:string){
  const [h,m]=value.split(":").map(Number);
  return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:0;
}

function periodMinutes(period:ChoghadiyaPeriod){
  const start=clockMinutes(period.start)+period.startDayOffset*1440;
  const end=clockMinutes(period.end)+period.endDayOffset*1440;
  return Math.max(0,end-start);
}

function meridianOffsetMinutes(lng:number){return Math.round((lng-82.5)*4);}
function signedMinutes(value:number){return `${value>0?"+":""}${value} min`;}
function meridianBand(value:number){
  if(value<=-35)return "far-west civil-clock band";
  if(value<=-22)return "western civil-clock band";
  if(value<=-10)return "west-of-meridian band";
  if(value<10)return "near-standard-meridian band";
  if(value<22)return "east-of-meridian band";
  return "far-east civil-clock band";
}
function latitudeBand(lat:number){
  if(lat<12)return "deep-southern tropical latitude";
  if(lat<16)return "southern peninsular latitude";
  if(lat<20)return "lower-Deccan latitude";
  if(lat<24)return "central-India latitude";
  if(lat<28)return "north-central latitude";
  return "northern latitude";
}
function names(periods:readonly ChoghadiyaPeriod[]){return periods.map(item=>item.name).join(" → ");}
function exact(periods:readonly ChoghadiyaPeriod[]){return periods.map(item=>`${item.name} ${item.start}–${item.end}`).join(" · ");}
function spread(periods:readonly ChoghadiyaPeriod[]){
  const values=periods.map(periodMinutes).filter(Boolean);
  if(!values.length)return {min:0,max:0,avg:0};
  return {min:Math.min(...values),max:Math.max(...values),avg:Math.round(values.reduce((a,b)=>a+b,0)/values.length)};
}
function variant(slug:string){let h=23;for(let i=0;i<slug.length;i++)h=(h*131+slug.charCodeAt(i)*(i+3))%65521;return h%5;}

export function buildChoghadiyaCityContext(data:Panchang,city:City):ChoghadiyaCityContext{
  const profile=buildCityContentProfile(city);
  const offset=meridianOffsetMinutes(city.lng);
  const band=meridianBand(offset);
  const latBand=latitudeBand(city.lat);
  const day=spread(data.dayChoghadiya);
  const night=spread(data.nightChoghadiya);
  const dayFirst=data.dayChoghadiya[0],dayLast=data.dayChoghadiya[data.dayChoghadiya.length-1];
  const nightFirst=data.nightChoghadiya[0],nightLast=data.nightChoghadiya[data.nightChoghadiya.length-1];
  const v=variant(city.slug);

  const localityBody=v===0
    ? `${profile.dailyContext} For this Choghadiya route, ${city.name} is treated as ${profile.geoContext} at ${city.lat.toFixed(2)}°N, ${city.lng.toFixed(2)}°E. Its longitude sits about ${Math.abs(offset)} solar minutes ${offset<0?"west":"east"} of India's 82.5°E standard meridian, placing it in the ${band}. That longitude frame explains why the same weekday labels can land on visibly different IST boundaries from cities farther east or west.`
    : v===1
      ? `${city.name}'s Choghadiya is not a renamed national timetable. The calculation belongs to ${profile.geoContext}, at ${city.lat.toFixed(2)}°N / ${city.lng.toFixed(2)}°E, with a longitude-only meridian displacement of ${signedMinutes(offset)} relative to 82.5°E. ${profile.dailyContext} In practice this means the local sunrise and sunset split the weekday sequence on ${city.name}'s own clock.`
      : v===2
        ? `The locality lens for ${city.name} starts with coordinates rather than city-name substitution: ${city.lat.toFixed(2)}°N, ${city.lng.toFixed(2)}°E in ${profile.geoContext}. This is the ${band}, roughly ${Math.abs(offset)} longitude-derived solar minutes ${offset<0?"behind":"ahead of"} the standard-meridian reference. ${profile.dailyContext}`
        : v===3
          ? `${profile.dailyContext} The coordinate anchor is ${city.lat.toFixed(2)}°N, ${city.lng.toFixed(2)}°E, which places ${city.name} in the ${band} and a ${latBand}. A Choghadiya label such as Labh or Amrit may match another city's weekday order, but the usable clock boundary remains tied to this local sunrise/sunset pair.`
          : `${city.name} combines a ${latBand} with the ${band}. Its exact anchor is ${city.lat.toFixed(2)}°N, ${city.lng.toFixed(2)}°E inside ${profile.geoContext}; longitude alone corresponds to ${signedMinutes(offset)} against India's standard meridian. ${profile.dailyContext} That is why Panchvani keeps this city's eight-part day and night grids separate.`;

  const boundaryBody=`Daytime runs from ${data.sunrise} to ${data.sunset}. Its eight Choghadiya periods range from ${day.min} to ${day.max} minutes, averaging ${day.avg}; the opening boundary is ${dayFirst?`${dayFirst.name} ${dayFirst.start}–${dayFirst.end}`:"unavailable"} and the closing boundary is ${dayLast?`${dayLast.name} ${dayLast.start}–${dayLast.end}`:"unavailable"}. Nighttime then ranges ${night.min}–${night.max} minutes per segment, averaging ${night.avg}; it opens with ${nightFirst?`${nightFirst.name} ${nightFirst.start}–${nightFirst.end}`:"unavailable"} and closes with ${nightLast?`${nightLast.name} ${nightLast.start}–${nightLast.end}`:"unavailable"}.`;

  const weekdayBody=`${data.weekday} fixes the Choghadiya name order, while ${city.name}'s solar boundaries fix the clock times. Day sequence: ${names(data.dayChoghadiya)}. Night sequence: ${names(data.nightChoghadiya)}. Exact local day chain: ${exact(data.dayChoghadiya)}. This separates weekday semantics from location-sensitive timing instead of treating every ${data.weekday} page as interchangeable.`;

  return {
    localityTitle:`${city.name} locality lens · ${band}`,
    localityBody,
    boundaryTitle:`Local boundary geometry · ${day.min}–${day.max} min daytime slots`,
    boundaryBody,
    weekdayTitle:`${data.weekday} sequence on the ${city.name} clock`,
    weekdayBody,
    facts:[
      {label:"Coordinate anchor",value:`${city.lat.toFixed(2)}°N · ${city.lng.toFixed(2)}°E`,note:profile.geoContext},
      {label:"Meridian relation",value:band,note:`Longitude-only offset ${signedMinutes(offset)} vs 82.5°E`},
      {label:"Latitude frame",value:latBand,note:profile.latitudeContext},
      {label:"Day segment spread",value:`${day.min}–${day.max} min`,note:`Average ${day.avg} min`},
      {label:"Night segment spread",value:`${night.min}–${night.max} min`,note:`Average ${night.avg} min`},
      {label:"Weekday engine",value:data.weekday,note:`${data.dayChoghadiya.length} day + ${data.nightChoghadiya.length} night periods`},
    ]
  };
}
