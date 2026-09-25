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
  localityTitle:string;
  localityBody:string;
  chronologyTitle:string;
  chronologyBody:string;
  observanceTitle:string;
  observanceBody:string;
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
function daylightClass(minutes:number){
  if(minutes<700)return "compact solar day";
  if(minutes<730)return "short-balanced solar day";
  if(minutes<760)return "balanced solar day";
  if(minutes<790)return "long-balanced solar day";
  return "extended solar day";
}
function sunriseClass(value:string){
  const minutes=clockMinutes(value);
  if(minutes<350)return "very-early sunrise";
  if(minutes<365)return "early sunrise";
  if(minutes<380)return "near-six sunrise";
  if(minutes<395)return "post-six sunrise";
  return "late sunrise";
}
function transitionProfile(data:Panchang){
  const rise=clockMinutes(data.sunrise),daylight=daylightMinutes(data);
  const t=datedMinutes(data.tithiEnd,data.tithiEndDate,data.date);
  const n=datedMinutes(data.nakshatraEnd,data.nakshatraEndDate,data.date);
  const tPart=dayPart(Math.max(0,t-rise),daylight),nPart=dayPart(Math.max(0,n-rise),daylight);
  const delta=Math.abs(t-n);
  if(delta<30)return {key:"near-synchronous",text:`Tithi and Nakshatra transitions share the same narrow local clock band around ${tPart}`,tPart,nPart};
  if(t<n)return {key:"tithi-first",text:`Tithi changes first in ${tPart}; Nakshatra follows in ${nPart}`,tPart,nPart};
  return {key:"nakshatra-first",text:`Nakshatra changes first in ${nPart}; Tithi follows in ${tPart}`,tPart,nPart};
}
function rahuProfile(data:Panchang){
  const sunrise=clockMinutes(data.sunrise),daylight=daylightMinutes(data);
  const start=Math.max(0,clockMinutes(data.rahu.start)-sunrise);
  return {key:dayPart(start,daylight),offset:start};
}
function favorableProfile(data:Panchang){
  const good=data.dayChoghadiya.filter(item=>item.effect==="good");
  if(!good.length)return {key:"none",text:"no favorable-labelled daytime Choghadiya",first:"—",last:"—",count:0,firstSlot:-1,lastSlot:-1};
  const firstIndex=data.dayChoghadiya.indexOf(good[0]);
  const lastIndex=data.dayChoghadiya.indexOf(good[good.length-1]);
  const key=firstIndex<=1?"front-loaded":firstIndex<=3?"early-middle":firstIndex<=5?"late-middle":"back-loaded";
  return {key,text:`${key} favorable Choghadiya placement`,first:`${good[0].name} ${good[0].start}–${good[0].end}`,last:`${good[good.length-1].name} ${good[good.length-1].start}–${good[good.length-1].end}`,count:good.length,firstSlot:firstIndex+1,lastSlot:lastIndex+1};
}
function nightProfile(data:Panchang){
  const good=data.nightChoghadiya.filter(item=>item.effect==="good");
  const first=good[0];
  return {count:good.length,first:first?`${first.name} ${first.start}–${first.end}`:"none",firstSlot:first?data.nightChoghadiya.indexOf(first)+1:-1};
}
function moonProfile(data:Panchang){
  if(data.moonrise==="—")return {key:"unavailable",text:"moonrise is not present in the local calculation",delta:null as number|null};
  const sunset=clockMinutes(data.sunset);
  let moon=datedMinutes(data.moonrise,data.moonriseDate,data.date);
  if(moon<sunset)moon+=1440;
  const delta=moon-sunset;
  if(delta<60)return {key:"near-sunset",text:"moonrise follows sunset within about an hour",delta};
  if(delta<180)return {key:"early-night",text:"moonrise falls in the early local night",delta};
  if(delta<360)return {key:"mid-night",text:"moonrise falls deeper into the first half of night",delta};
  return {key:"late-night",text:"moonrise arrives late relative to sunset",delta};
}
function moonLight(value:number){
  if(value<20)return "very-low illumination";
  if(value<45)return "low-to-mid illumination";
  if(value<70)return "mid-to-bright illumination";
  if(value<90)return "bright illumination";
  return "near-full illumination";
}
function cityVariant(slug:string){let value=37;for(let i=0;i<slug.length;i++)value=(value*157+slug.charCodeAt(i)*(i+11))%104729;return value%6;}

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

function observanceAxis(festival:Festival,data:Panchang,localReference:FestivalLocalReference,moon:ReturnType<typeof moonProfile>,night:ReturnType<typeof nightProfile>){
  const reference=localReference?`${localReference.label} is ${localReference.value}. `:"";
  const rituals=festival.rituals.length?festival.rituals.join(" · "):"No ritual list is stored";
  switch(festival.slug){
    case "makar-sankranti":return {title:"Solar observance axis",body:`The maintained festival definition is solar rather than a generic lunar-date card. The local page therefore emphasizes sunrise, sunset and the ${data.solarRashi} solar-sign state while retaining the surrounding ${data.tithi} / ${data.nakshatra} Panchang. Stored observance themes: ${rituals}.`};
    case "maha-shivaratri":return {title:"Night chronology axis",body:`This observance is night-centered. ${moon.text}; the night grid contains ${night.count} favorable-labelled Choghadiya periods, with the first at ${night.first}. The ${data.tithi} transition remains the lunar boundary to read against that local night.`};
    case "holi":return {title:"Day-after-evening axis",body:`The maintained Holi page describes the daylight festival following the preceding Holika Dahan evening. Its city-specific layer is therefore the local sunrise-state and daytime progression rather than an invented Holika Dahan window. Stored observance themes: ${rituals}.`};
    case "chaitra-navratri":
    case "shardiya-navratri":return {title:"Opening-day Navratri axis",body:`This route represents the opening-day Panchang. Sunrise-state Tithi, Nakshatra and Abhijit are exposed as local inputs; no festival-specific Ghatasthapana window is generated here. Stored observance themes: ${rituals}.`};
    case "rama-navami":return {title:"Midday Rama Navami axis",body:`Rama Navami is stored with a midday observance rule. The local solar-day midpoint and Abhijit context therefore carry more meaning here than a generic all-day clock. Stored observance themes: ${rituals}.`};
    case "hanuman-jayanti":return {title:"Sunrise checkpoint axis",body:`The useful city distinction is the lunar state present at local sunrise and how long it persists afterward. The route keeps ${data.tithi}, ${data.nakshatra} and their transition order tied to this city's dawn. Stored observance themes: ${rituals}.`};
    case "akshaya-tritiya":return {title:"Planning-day axis",body:`The page separates the maintained Akshaya Tritiya date from local planning signals such as Abhijit, Rahu and favorable Choghadiya. Those signals describe the city day; they are not collapsed into a single universal purchase window. Stored observance themes: ${rituals}.`};
    case "guru-purnima":return {title:"Full-moon-day axis",body:`Guru Purnima is represented through its Purnima-day lunar state. ${moon.text}, while Moon illumination is ${moonLight(data.moonIllumination)}. The city page therefore exposes both the sunrise checkpoint and the local evening lunar clock.`};
    case "raksha-bandhan":return {title:"Purnima + Bhadra-status axis",body:`${reference}The route keeps the Purnima-day local Panchang and the stored Bhadra status separate from daytime timing signals. It does not manufacture a Bhadra interval from Choghadiya or Rahu data.`};
    case "janmashtami":return {title:"Nishita/night axis",body:`${reference}${moon.text}. The route uses the derived local night reference together with Ashtami/Nakshatra timing; it does not turn that reference into a universal tradition-independent Puja certification.`};
    case "ganesh-chaturthi":return {title:"Midday Chaturthi axis",body:`Ganesh Chaturthi is stored with a midday rule, so the city page reads Chaturthi persistence against the local solar day and Abhijit context. Stored observance themes: ${rituals}.`};
    case "dussehra":return {title:"Vijayadashami daylight axis",body:`The useful city layer is the Vijayadashami Tithi inside the local daylight frame. Its transition order, afternoon placement and favorable-period structure distinguish the city timing without inventing a separate exact Aparahna rule.`};
    case "karwa-chauth":return {title:"Sunrise-to-moonrise fasting axis",body:`${reference}${moon.text}. This makes the route unusually dependent on both local dawn and the evening Moon clock, while the lunar Tithi remains the observance-day state.`};
    case "dhanteras":return {title:"Trayodashi evening axis",body:`Dhanteras combines the local Trayodashi state with evening and purchase context. Sunset, Rahu, Abhijit and favorable Choghadiya are shown as separate city signals rather than merged into one universal purchase Muhurat.`};
    case "diwali":return {title:"Amavasya + Pradosh axis",body:`${reference}The city page reads the Amavasya transition against local sunset and the derived Pradosh reference. That local reference remains distinct from a full Lagna-based Lakshmi Puja selection.`};
    case "govardhan-puja":return {title:"Post-Amavasya morning axis",body:`Govardhan Puja follows the Diwali lunar sequence, so the local value comes from the sunrise Tithi/Nakshatra state and its morning transition order. Stored observance themes: ${rituals}.`};
    case "bhai-dooj":return {title:"Dwitiya daytime axis",body:`The local route is anchored to the post-Diwali Dwitiya state at sunrise and its daytime persistence. Stored observance themes: ${rituals}.`};
    case "chhath-puja":return {title:"Setting-Sun / rising-Sun axis",body:`Chhath's stored observance description is explicitly solar. The city page therefore treats sunset and sunrise as first-order local signals, with the lunar Panchang supplying surrounding context rather than replacing that solar axis.`};
    default:return {title:`${festival.name} observance axis`,body:`The maintained festival definition lists ${rituals}. The city page ties those themes to the local sunrise-state, transition order and solar-day timing without adding an unstored ritual rule.`};
  }
}

export function buildFestivalCityContext(festival:Festival,city:City,data:Panchang,localReference:FestivalLocalReference):FestivalCityContext{
  const profile=buildCityContentProfile(city);
  const daylight=daylightMinutes(data);
  const transitions=transitionProfile(data);
  const rahu=rahuProfile(data);
  const favorable=favorableProfile(data);
  const night=nightProfile(data);
  const moon=moonProfile(data);
  const focus=focusCopy(festival,data,localReference);
  const observance=observanceAxis(festival,data,localReference,moon,night);
  const geoLead=profile.geoContext;
  const variant=cityVariant(city.slug);
  const solarShape=`${sunriseClass(data.sunrise)} + ${daylightClass(daylight)}`;

  const body=festival.pujaRule==="night"
    ? `${city.name}'s ${festival.name} page belongs to ${geoLead}, with a ${profile.latitudeContext}. Its local solar clock is ${profile.solarClockContext}; for this night-centered observance, ${moon.text} and ${transitions.text}.`
    : festival.pujaRule==="sunset"
      ? `${city.name} places ${festival.name} in ${geoLead}. The city is ${profile.solarClockContext}, so sunset-led observance timing uses this city's own evening clock; ${transitions.text}, while Rahu begins in ${rahu.key}.`
      : festival.pujaRule==="midday"
        ? `For ${festival.name}, ${city.name}'s defining local layer is a midday calculation in ${geoLead}. The ${profile.latitudeContext} and ${profile.solarClockContext} shape a ${daylightClass(daylight)}; favorable Choghadiya is ${favorable.key}.`
        : festival.pujaRule==="sunrise"
          ? `${city.name}'s sunrise-led ${festival.name} profile is anchored in ${geoLead}. The city has a ${profile.latitudeContext} and is ${profile.solarClockContext}; after sunrise, ${transitions.text} and Rahu falls in ${rahu.key}.`
          : `${festival.name} in ${city.name} is calculated for ${geoLead}. Across its ${daylightClass(daylight)}, ${transitions.text}; favorable Choghadiya is ${favorable.key}, and Rahu sits in ${rahu.key}.`;

  const secondaryBody=`The local timing shape is ${solarShape}. ${moon.text}; the first favorable daytime period is ${favorable.first} and the last is ${favorable.last}. Rahu starts in the ${rahu.key} segment of daylight. These signals come from the actual city Panchang rather than from the shared festival date alone.`;

  const localityBody=variant===0
    ? `${profile.dailyContext} For ${festival.name}, that city-level timing frame is carried into the festival date: ${solarShape}, ${transitions.key} transition order and ${rahu.key} Rahu placement. The festival date may be shared nationally, but the sunrise checkpoint and every daylight-derived clock remain local.`
    : variant===1
      ? `${profile.dailyContext} On ${festival.name}, the practical result is a ${solarShape} local day. The lunar transitions resolve as ${transitions.key}; favorable Choghadiya is ${favorable.key}. This is why another city in the same state is not substituted even when the maintained festival date is identical.`
      : variant===2
        ? `${profile.dailyContext} The festival layer preserves that geography instead of flattening it into an all-India timetable. On this date the city produces ${solarShape}; Rahu sits in ${rahu.key}, while the Tithi/Nakshatra chronology is ${transitions.key}.`
        : variant===3
          ? `${profile.dailyContext} That local clock becomes the base for ${festival.name}: sunrise and sunset define a ${daylightClass(daylight)}, the transition sequence is ${transitions.key}, and the favorable daytime grid is ${favorable.key}. Nearby cities can therefore share the festival but not the complete timing fingerprint.`
          : variant===4
            ? `${profile.dailyContext} For this festival date, the city-specific evidence is the combined shape ${solarShape}, ${transitions.key} lunar hand-off and ${favorable.key} favorable-period placement. The route keeps those local signals attached to ${geoLead}.`
            : `${profile.dailyContext} ${festival.name} is then read through the city's own ${solarShape} day, ${rahu.key} Rahu phase and ${transitions.key} lunar-transition order. The city identity is therefore present in the actual chronology, not only in the heading.`;

  const chronologyBody=variant%3===0
    ? `Local sunrise is ${data.sunrise} and sunset is ${data.sunset}. ${transitions.text}. Rahu starts ${rahu.offset} minutes after sunrise in ${rahu.key}; ${favorable.count} daytime periods carry a favorable label, beginning in slot ${favorable.firstSlot>0?favorable.firstSlot:"—"} and ending in slot ${favorable.lastSlot>0?favorable.lastSlot:"—"}. Moon state: ${moon.text}.`
    : variant%3===1
      ? `The festival-day clock opens at ${data.sunrise} and closes its daylight span at ${data.sunset}. Tithi occupies the ${transitions.tPart} transition band while Nakshatra occupies ${transitions.nPart}; the order is ${transitions.key}. The favorable-day shape is ${favorable.key}, and the night contains ${night.count} favorable-labelled periods.`
      : `Read the chronology from dawn forward: ${sunriseClass(data.sunrise)}, then Rahu in ${rahu.key}, then a ${favorable.key} favorable-period pattern. Lunar turnover is ${transitions.key}: ${transitions.text}. After sunset, ${moon.text}; the first favorable night period is ${night.first}.`;

  return {
    focusTitle:focus.title,
    focusBody:focus.body,
    title:`${city.name} festival-day signature`,
    body,
    secondaryBody,
    localityTitle:`${city.name} locality lens for ${festival.name}`,
    localityBody,
    chronologyTitle:`Festival-day chronology · ${transitions.key}`,
    chronologyBody,
    observanceTitle:observance.title,
    observanceBody:observance.body,
    facts:[
      {label:"Geographic setting",value:profile.geoContext,note:profile.dailyContext},
      {label:"Latitude profile",value:profile.latitudeContext},
      {label:"Solar-clock relation",value:profile.solarClockContext},
      {label:"Solar-day shape",value:solarShape,note:`${data.sunrise} → ${data.sunset}`},
      {label:"Transition order",value:transitions.key,note:transitions.text},
      {label:"Rahu position",value:rahu.key,note:`${rahu.offset} min after sunrise`},
      {label:"Favorable-day shape",value:favorable.key,note:`${favorable.first} → ${favorable.last}`},
      {label:"Favorable-night entry",value:night.first,note:`${night.count} favorable night periods`},
      {label:"Moonrise relation",value:moon.key,note:moon.text},
      {label:"Moon-light state",value:moonLight(data.moonIllumination),note:`${data.paksha} Paksha`},
      {label:"Festival rule axis",value:festival.pujaRule,note:localReference?`${localReference.label}: ${localReference.value}`:"No extra derived local reference"},
    ]
  };
}
