import type {City} from "./cities";
import {buildCityContentProfile} from "./city-content-profile";
import type {Festival} from "./festivals";
import type {Panchang} from "./panchang";
import type {FestivalLocalReference} from "./religious-integrity";

type Fact={label:string;value:string;note?:string};

export type FestivalCityContext={
  focusTitle:string;
  focusBody:string;
  title:string;
  body:string;
  secondaryBody:string;
  facts:Fact[];
};

function clockMinutes(value:string){
  const [h,m]=value.split(":").map(Number);
  return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:0;
}
function dayOffset(date:string|null,base:string){
  if(!date||date===base)return 0;
  const a=Date.parse(`${base}T06:00:00Z`),b=Date.parse(`${date}T06:00:00Z`);
  return Number.isFinite(a)&&Number.isFinite(b)?Math.round((b-a)/86400000):0;
}
function datedMinutes(value:string,date:string|null,base:string){return clockMinutes(value)+dayOffset(date,base)*1440;}
function daylightMinutes(data:Panchang){
  const start=clockMinutes(data.sunrise),end=clockMinutes(data.sunset);
  return end>=start?end-start:end+1440-start;
}
function dayPart(minutesFromSunrise:number,daylight:number){
  const ratio=daylight?minutesFromSunrise/daylight:0;
  if(ratio<0.18)return "opening daylight";
  if(ratio<0.36)return "morning";
  if(ratio<0.55)return "midday";
  if(ratio<0.76)return "afternoon";
  return "late daylight";
}
function transitionOrder(data:Panchang){
  const t=datedMinutes(data.tithiEnd,data.tithiEndDate,data.date);
  const n=datedMinutes(data.nakshatraEnd,data.nakshatraEndDate,data.date);
  if(Math.abs(t-n)<30)return {key:"near-synchronous",text:"Tithi and Nakshatra transitions occur in the same narrow clock band"};
  if(t<n)return {key:"tithi-first",text:"the Tithi changes before the Nakshatra"};
  return {key:"nakshatra-first",text:"the Nakshatra changes before the Tithi"};
}
function rahuProfile(data:Panchang){
  const sunrise=clockMinutes(data.sunrise),daylight=daylightMinutes(data);
  const start=Math.max(0,clockMinutes(data.rahu.start)-sunrise);
  return {key:dayPart(start,daylight),offset:start};
}
function favorableProfile(data:Panchang){
  const good=data.dayChoghadiya.filter(item=>item.effect==="good");
  if(!good.length)return {key:"none",text:"no favorable-labelled daytime Choghadiya",first:"—",last:"—"};
  const firstIndex=data.dayChoghadiya.indexOf(good[0]);
  const lastIndex=data.dayChoghadiya.indexOf(good[good.length-1]);
  const key=firstIndex<=1?"front-loaded":firstIndex<=3?"early-middle":firstIndex<=5?"late-middle":"back-loaded";
  return {key,text:`${key} favorable Choghadiya placement`,first:`${good[0].name} ${good[0].start}–${good[0].end}`,last:`${good[good.length-1].name} ${good[good.length-1].start}–${good[good.length-1].end}`};
}
function moonProfile(data:Panchang){
  if(data.moonrise==="—")return {key:"unavailable",text:"moonrise is not present in the local calculation"};
  const sunset=clockMinutes(data.sunset);
  let moon=datedMinutes(data.moonrise,data.moonriseDate,data.date);
  if(moon<sunset)moon+=1440;
  const delta=moon-sunset;
  if(delta<60)return {key:"near-sunset",text:"moonrise follows sunset within about an hour"};
  if(delta<180)return {key:"early-night",text:"moonrise falls in the early local night"};
  if(delta<360)return {key:"mid-night",text:"moonrise falls deeper into the first half of night"};
  return {key:"late-night",text:"moonrise arrives late relative to sunset"};
}

function focusCopy(festival:Festival,data:Panchang,localReference:FestivalLocalReference){
  const ref=localReference?`${localReference.label}: ${localReference.value}. `:"";
  switch(festival.slug){
    case "makar-sankranti":return {title:"Solar-day festival focus",body:`Makar Sankranti is read here through the local solar day: sunrise ${data.sunrise}, sunset ${data.sunset}, and the surrounding ${data.tithi} / ${data.nakshatra} Panchang state.`};
    case "maha-shivaratri":return {title:"Night-vigil festival focus",body:`Maha Shivaratri centers the local night. Sunset ${data.sunset}, the ${data.tithi} transition and the night Choghadiya sequence define this city's festival-day clock.`};
    case "holi":return {title:"Holi daytime focus",body:`Holi's city layer is the daylight Panchang after the preceding Holika Dahan evening: ${data.tithi}, ${data.nakshatra}, sunrise ${data.sunrise} and sunset ${data.sunset}.`};
    case "chaitra-navratri":
    case "shardiya-navratri":return {title:"Navratri opening-day focus",body:`The opening-day profile combines ${data.tithi}, ${data.nakshatra}, sunrise ${data.sunrise}, Abhijit ${data.abhijit?`${data.abhijit.start}–${data.abhijit.end}`:"—"} and the local daytime sequence.`};
    case "rama-navami":return {title:"Rama Navami midday focus",body:`Rama Navami is evaluated against the local midday frame. Sunrise ${data.sunrise}, sunset ${data.sunset}, ${data.tithi} and Abhijit ${data.abhijit?`${data.abhijit.start}–${data.abhijit.end}`:"—"} provide that city clock.`};
    case "hanuman-jayanti":return {title:"Hanuman Jayanti sunrise focus",body:`The local sunrise checkpoint carries ${data.tithi} with ${data.nakshatra}; the transition clock and daylight sequence form the city-specific festival profile.`};
    case "akshaya-tritiya":return {title:"Akshaya Tritiya planning focus",body:`The local planning picture combines ${data.tithi}, Abhijit ${data.abhijit?`${data.abhijit.start}–${data.abhijit.end}`:"—"}, Rahu Kalam ${data.rahu.start}–${data.rahu.end} and favorable daytime Choghadiya.`};
    case "guru-purnima":return {title:"Guru Purnima lunar focus",body:`Purnima context is read through the local Tithi transition, ${data.nakshatra} and moonrise ${data.moonrise}; the city timing shows how that full-moon day unfolds locally.`};
    case "raksha-bandhan":return {title:"Raksha Bandhan day focus",body:`The local Raksha Bandhan profile combines Purnima-day Panchang, sunrise ${data.sunrise}, sunset ${data.sunset}, Rahu Kalam ${data.rahu.start}–${data.rahu.end} and the route's Bhadra-status field.`};
    case "janmashtami":return {title:"Janmashtami night focus",body:`${ref}The local night is anchored by sunset ${data.sunset}, ${data.tithi}, ${data.nakshatra} and the Nishita-positioned reference inside the night span.`};
    case "ganesh-chaturthi":return {title:"Ganesh Chaturthi midday focus",body:`The local festival day combines Chaturthi-state timing with sunrise ${data.sunrise}, sunset ${data.sunset} and the city's midday/Abhijit frame.`};
    case "dussehra":return {title:"Vijayadashami afternoon focus",body:`The city-specific Vijayadashami layer is the local afternoon frame: ${data.tithi}, sunrise ${data.sunrise}, sunset ${data.sunset}, Rahu Kalam and the favorable daytime sequence.`};
    case "karwa-chauth":return {title:"Karwa Chauth fasting-day focus",body:`${ref}The local fasting-day clock runs from sunrise through moonrise, with ${data.tithi} and the evening lunar timing defining the city's practical sequence.`};
    case "dhanteras":return {title:"Dhanteras evening focus",body:`Dhanteras combines the local Trayodashi-day state with sunset ${data.sunset}, Rahu Kalam ${data.rahu.start}–${data.rahu.end}, Abhijit and favorable daytime windows.`};
    case "diwali":return {title:"Diwali sunset and Pradosh focus",body:`${ref}The city layer begins at local sunset ${data.sunset} and combines the Amavasya-state transition with the Pradosh-positioned evening reference.`};
    case "govardhan-puja":return {title:"Govardhan Puja morning focus",body:`The post-Diwali local Panchang combines ${data.tithi}, ${data.nakshatra}, sunrise ${data.sunrise} and the city's morning/daylight sequence.`};
    case "bhai-dooj":return {title:"Bhai Dooj daytime focus",body:`The local Dwitiya-day profile combines ${data.tithi}, ${data.nakshatra}, sunrise ${data.sunrise} and the city's daytime timing sequence.`};
    case "chhath-puja":return {title:"Chhath solar-axis focus",body:`Chhath is especially solar-time sensitive: local sunset ${data.sunset} and sunrise ${data.sunrise} anchor the city page, with the surrounding Panchang state providing the lunar context.`};
    default:return {title:`${festival.name} local timing focus`,body:`The city profile combines ${data.tithi}, ${data.nakshatra}, sunrise ${data.sunrise}, sunset ${data.sunset} and the local daytime sequence.`};
  }
}

export function buildFestivalCityContext(festival:Festival,city:City,data:Panchang,localReference:FestivalLocalReference):FestivalCityContext{
  const profile=buildCityContentProfile(city);
  const daylight=daylightMinutes(data);
  const transitions=transitionOrder(data);
  const rahu=rahuProfile(data);
  const favorable=favorableProfile(data);
  const moon=moonProfile(data);
  const focus=focusCopy(festival,data,localReference);
  const geoLead=profile.geoContext;
  const body=festival.pujaRule==="night"
    ? `${city.name}'s ${festival.name} page belongs to ${geoLead}, with a ${profile.latitudeContext}. Its local solar clock is ${profile.solarClockContext}; for this night-centered observance, ${moon.text} and ${transitions.text}.`
    : festival.pujaRule==="sunset"
      ? `${city.name} places ${festival.name} in ${geoLead}. The city is ${profile.solarClockContext}, so sunset-led observance timing uses this city's own evening clock; ${transitions.text}, while Rahu begins in ${rahu.key}.`
      : festival.pujaRule==="midday"
        ? `For ${festival.name}, ${city.name}'s defining local layer is a midday calculation in ${geoLead}. The ${profile.latitudeContext} and ${profile.solarClockContext} shape a ${daylight}-minute solar day; favorable Choghadiya is ${favorable.key}.`
        : festival.pujaRule==="sunrise"
          ? `${city.name}'s sunrise-led ${festival.name} profile is anchored in ${geoLead}. The city has a ${profile.latitudeContext} and is ${profile.solarClockContext}; after sunrise, ${transitions.text} and Rahu falls in ${rahu.key}.`
          : `${festival.name} in ${city.name} is calculated for ${geoLead}. Across its ${daylight}-minute local solar day, ${transitions.text}; favorable Choghadiya is ${favorable.key}, and Rahu sits in ${rahu.key}.`;
  const secondaryBody=`The page's local signature is ${profile.signature}. On the festival date, ${moon.text}; the first favorable daytime period is ${favorable.first} and the last is ${favorable.last}. This combines geographic context with the actual Panchang sequence rather than relying on the shared festival date alone.`;
  return {
    focusTitle:focus.title,
    focusBody:focus.body,
    title:`${city.name} festival-day signature`,
    body,
    secondaryBody,
    facts:[
      {label:"Geographic setting",value:profile.geoContext},
      {label:"Latitude profile",value:profile.latitudeContext},
      {label:"Solar-clock relation",value:profile.solarClockContext},
      {label:"Transition order",value:transitions.key,note:transitions.text},
      {label:"Rahu position",value:rahu.key,note:`${rahu.offset} min after sunrise`},
      {label:"Favorable-day shape",value:favorable.key,note:`${favorable.first} → ${favorable.last}`},
      {label:"Moonrise relation",value:moon.key,note:moon.text},
    ]
  };
}
