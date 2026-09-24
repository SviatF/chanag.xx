import type {City} from "./cities";
import type {Panchang,TimeWindow} from "./panchang";
import {formatPanchangTime,formatWindow} from "./panchang";

type LunarLabels={amantaLabel:string;purnimantaLabel:string};
type Fact={label:string;value:string;note?:string};

export type DailyPanchangQualityContent={
  directAnswer:string;
  facts:Fact[];
  fingerprintTitle:string;
  fingerprintBody:string;
  transitionTitle:string;
  transitionBody:string;
  solarTitle:string;
  solarBody:string;
  lunarTitle:string;
  lunarBody:string;
};

const commonTithis=["Pratipada","Dvitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami","Navami","Dashami","Ekadashi","Dwadashi","Trayodashi","Chaturdashi"];
const nakshatras=["Ashwini","Bharani","Krittika","Rohini","Mrigashirsha","Ardra","Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"];
const units=["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
const tens=["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];

function clockMinutes(value:string){
  const [hours,minutes]=value.split(":").map(Number);
  return Number.isFinite(hours)&&Number.isFinite(minutes)?hours*60+minutes:0;
}
function daylightMinutes(data:Panchang){
  const start=clockMinutes(data.sunrise),end=clockMinutes(data.sunset);
  return end>=start?end-start:end+1440-start;
}
function windowMinutes(window:TimeWindow){
  const start=clockMinutes(window.start),end=clockMinutes(window.end);
  return end>=start?end-start:end+1440-start;
}
function humanDate(value:string){
  return new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"long",year:"numeric",weekday:"long",timeZone:"Asia/Kolkata"}).format(new Date(`${value}T06:00:00Z`));
}
function integerWords(value:number){
  const n=Math.max(0,Math.round(value));
  if(n<20)return units[n];
  if(n<100){const t=Math.floor(n/10),u=n%10;return u?`${tens[t]}-${units[u]}`:tens[t];}
  return String(n);
}
function oneDecimalWords(value:number){
  const rounded=Math.round(Math.abs(value)*10)/10;
  const whole=Math.floor(rounded);
  const decimal=Math.round((rounded-whole)*10);
  return decimal?`${integerWords(whole)} point ${units[decimal]}`:integerWords(whole);
}
function nextTithiLabel(data:Panchang){
  if(data.tithi==="Purnima")return "Pratipada · Krishna Paksha";
  if(data.tithi==="Amavasya")return "Pratipada · Shukla Paksha";
  if(data.tithi==="Chaturdashi")return data.paksha==="Shukla"?"Purnima · Shukla Paksha":"Amavasya · Krishna Paksha";
  const index=commonTithis.indexOf(data.tithi);
  return index>=0&&index<commonTithis.length-1?`${commonTithis[index+1]} · ${data.paksha} Paksha`:"the next lunar Tithi";
}
function nextNakshatraLabel(data:Panchang){
  const index=nakshatras.indexOf(data.nakshatra);
  return index>=0?nakshatras[(index+1)%nakshatras.length]:"the next Nakshatra";
}

function transitionClass(time:string,endDate:string|null,date:string,sunrise:string,sunset:string){
  if(endDate&&endDate>date)return {key:"next-civil-date",label:"next-date transition",text:"continues beyond the current civil date"};
  const value=clockMinutes(time),rise=clockMinutes(sunrise),set=clockMinutes(sunset);
  const noon=rise+(set-rise)/2;
  if(value<rise+180)return {key:"early-morning",label:"early-day transition",text:"changes in the early part of the local solar day"};
  if(value<noon)return {key:"late-morning",label:"pre-midday transition",text:"changes before the midpoint of local daylight"};
  if(value<noon+180)return {key:"afternoon",label:"afternoon transition",text:"changes in the afternoon band"};
  if(value<set)return {key:"late-day",label:"late-day transition",text:"changes late in the daylight span"};
  return {key:"after-sunset",label:"post-sunset transition",text:"remains active through sunset before changing"};
}
function solarDayClass(minutes:number){
  if(minutes<705)return {key:"compact",label:"compact daylight day"};
  if(minutes<725)return {key:"short-balanced",label:"short-balanced daylight day"};
  if(minutes<745)return {key:"balanced",label:"balanced daylight day"};
  if(minutes<765)return {key:"long-balanced",label:"long-balanced daylight day"};
  return {key:"extended",label:"extended daylight day"};
}
function rahuClass(data:Panchang,daylight:number){
  const offset=Math.max(0,clockMinutes(data.rahu.start)-clockMinutes(data.sunrise));
  const share=daylight?offset/daylight:0;
  if(share<0.18)return {key:"opening",label:"opening-day Rahu",text:"near the opening fifth of daylight",offset};
  if(share<0.34)return {key:"morning",label:"morning Rahu",text:"inside the morning third of daylight",offset};
  if(share<0.5)return {key:"midday",label:"midday Rahu",text:"around the middle of the solar day",offset};
  if(share<0.68)return {key:"afternoon",label:"afternoon Rahu",text:"inside the afternoon section of daylight",offset};
  return {key:"late",label:"late-day Rahu",text:"toward the final third of daylight",offset};
}
function lunarPhaseClass(data:Panchang){
  const value=data.moonIllumination;
  if(value<=15)return {key:"dark-moon",label:"dark-moon phase",text:"a low-light lunar state close to the dark end of the cycle"};
  if(value<=35)return {key:data.paksha==="Shukla"?"waxing-crescent":"waning-crescent",label:data.paksha==="Shukla"?"waxing-crescent phase":"waning-crescent phase",text:"a crescent-weighted illumination state"};
  if(value<=65)return {key:data.paksha==="Shukla"?"waxing-half":"waning-half",label:data.paksha==="Shukla"?"waxing half-lit phase":"waning half-lit phase",text:"a middle-illumination lunar state"};
  if(value<=85)return {key:data.paksha==="Shukla"?"waxing-gibbous":"waning-gibbous",label:data.paksha==="Shukla"?"waxing-gibbous phase":"waning-gibbous phase",text:"a bright gibbous lunar state"};
  return {key:"near-full",label:"near-full phase",text:"a high-illumination state close to the bright end of the cycle"};
}
function choghadiyaProfile(data:Panchang){
  const favorable=data.dayChoghadiya.filter(item=>item.effect==="good");
  const first=favorable[0];
  const last=favorable[favorable.length-1];
  const firstIndex=first?data.dayChoghadiya.indexOf(first):-1;
  const lastIndex=last?data.dayChoghadiya.indexOf(last):-1;
  const shape=firstIndex<0?"no-favorable-entry":firstIndex<=1?"front-loaded":firstIndex<=3?"early-middle":firstIndex<=5?"late-middle":"back-loaded";
  return {favorable,first,last,firstIndex,lastIndex,shape};
}
function geoProfile(city:City){
  const standardMeridian=82.5;
  const solarOffset=Math.round((city.lng-standardMeridian)*4);
  const relation=solarOffset<0?"west of":solarOffset>0?"east of":"on";
  const offsetText=solarOffset===0?"essentially aligned with":`${integerWords(Math.abs(solarOffset))} solar minutes ${relation}`;
  const latitudeBand=city.lat<15?"southern tropical belt":city.lat<21?"lower tropical belt":city.lat<26?"central tropical belt":city.lat<30?"upper tropical belt":"northern subtropical belt";
  return {
    solarOffset,
    latitudeBand,
    coordinatePhrase:`about ${oneDecimalWords(city.lat)} degrees north and ${oneDecimalWords(city.lng)} degrees east`,
    meridianPhrase:`${offsetText} India's IST standard meridian`,
  };
}

function directAnswer(city:City,data:Panchang,tithi:{key:string},rahu:{key:string}){
  const date=humanDate(data.date);
  if(tithi.key==="next-civil-date")return `${date} in ${city.name} begins with ${data.tithi} Tithi in ${data.paksha} Paksha and ${data.nakshatra} Nakshatra. The Tithi survives into the next civil date, while Rahu Kalam falls at ${formatWindow(data.rahu)}.`;
  if(rahu.key==="opening"||rahu.key==="morning")return `${city.name} opens ${date} with ${data.tithi} Tithi and ${data.nakshatra} Nakshatra; today's Rahu Kalam arrives relatively early at ${formatWindow(data.rahu)}, with sunrise ${data.sunrise} and sunset ${data.sunset}.`;
  if(rahu.key==="late")return `On ${date}, ${city.name} has ${data.tithi} Tithi, ${data.nakshatra} Nakshatra and a late-day Rahu Kalam at ${formatWindow(data.rahu)}. Local sunrise is ${data.sunrise} and sunset is ${data.sunset}.`;
  return `${date} in ${city.name} carries ${data.tithi} Tithi (${data.paksha}), ${data.nakshatra} Nakshatra and ${rahu.key}-phase Rahu Kalam ${formatWindow(data.rahu)} between local sunrise ${data.sunrise} and sunset ${data.sunset}.`;
}

export function buildDailyPanchangQualityContent(city:City,data:Panchang,lunar:LunarLabels):DailyPanchangQualityContent{
  const daylight=daylightMinutes(data);
  const solar=solarDayClass(daylight);
  const rahu=rahuClass(data,daylight);
  const phase=lunarPhaseClass(data);
  const choghadiya=choghadiyaProfile(data);
  const geo=geoProfile(city);
  const tithiTransition=transitionClass(data.tithiEnd,data.tithiEndDate,data.date,data.sunrise,data.sunset);
  const nakshatraTransition=transitionClass(data.nakshatraEnd,data.nakshatraEndDate,data.date,data.sunrise,data.sunset);
  const tithiEnd=formatPanchangTime(data.tithiEnd,data.tithiEndDate,data.date);
  const nakshatraEnd=formatPanchangTime(data.nakshatraEnd,data.nakshatraEndDate,data.date);
  const rahuDuration=windowMinutes(data.rahu);
  const tithiBeforeNakshatra=(data.tithiEndDate??data.date)<(data.nakshatraEndDate??data.date)||((data.tithiEndDate??data.date)===(data.nakshatraEndDate??data.date)&&clockMinutes(data.tithiEnd)<=clockMinutes(data.nakshatraEnd));
  const transitionOrder=tithiBeforeNakshatra?"Tithi-first":"Nakshatra-first";

  const fingerprintBody=geo.solarOffset<=-30
    ? `${city.name} sits in the ${geo.latitudeBand}, ${geo.coordinatePhrase}, placing its local solar clock ${geo.meridianPhrase}. That western solar position combines with a ${solar.label}; at sunrise the calendar state is ${data.tithi} + ${data.nakshatra} + ${data.yoga} + ${data.karana}.`
    : geo.solarOffset<0
      ? `The ${city.name} day is framed by the ${geo.latitudeBand} at ${geo.coordinatePhrase}. Its solar clock runs ${geo.meridianPhrase}, producing a ${solar.label}; the sunrise-state bundle is ${data.tithi}, ${data.nakshatra}, ${data.yoga} Yoga and ${data.karana} Karana.`
      : `At ${geo.coordinatePhrase}, ${city.name} lies in the ${geo.latitudeBand} and its local solar clock is ${geo.meridianPhrase}. Today's ${solar.label} begins with ${data.tithi} Tithi, ${data.nakshatra} Nakshatra, ${data.yoga} Yoga and ${data.karana} Karana.`;

  const transitionBody=transitionOrder==="Tithi-first"
    ? `${data.tithi} is the first major lunar label to change: it ${tithiTransition.text} at ${tithiEnd}, advancing to ${nextTithiLabel(data)}. ${data.nakshatra} follows at ${nakshatraEnd}, where the sequence moves to ${nextNakshatraLabel(data)}. This gives the day a Tithi-first transition order rather than two static all-day labels.`
    : `${data.nakshatra} changes before the Tithi on this local date. Its ${nakshatraTransition.label} occurs at ${nakshatraEnd}, advancing to ${nextNakshatraLabel(data)}; ${data.tithi} then reaches its ${tithiTransition.label} at ${tithiEnd} and moves to ${nextTithiLabel(data)}.`;

  const solarBody=rahu.key==="opening"||rahu.key==="morning"
    ? `The ${daylight}-minute daylight span is ${solar.key} in profile. Rahu Kalam begins ${rahu.offset} minutes after sunrise and therefore sits ${rahu.text}; Yamaganda is ${formatWindow(data.yamaganda)} and Gulika is ${formatWindow(data.gulika)}. The daytime Choghadiya is ${choghadiya.shape}, with ${choghadiya.favorable.length} favorable-labelled periods.`
    : rahu.key==="late"
      ? `A ${solar.label} of ${daylight} minutes pushes today's Rahu placement toward the later part of local daylight: ${formatWindow(data.rahu)}. Yamaganda ${formatWindow(data.yamaganda)} and Gulika ${formatWindow(data.gulika)} occupy earlier comparison bands, while the Choghadiya sequence is ${choghadiya.shape}.`
      : `Sunrise ${data.sunrise} and sunset ${data.sunset} create ${daylight} minutes of daylight, classified here as ${solar.key}. Rahu Kalam sits ${rahu.text} for ${rahuDuration} minutes. The first favorable Choghadiya appears in slot ${choghadiya.firstIndex+1} and the last in slot ${choghadiya.lastIndex+1}, giving the day a ${choghadiya.shape} favorable pattern.`;

  const lunarBody=phase.key==="dark-moon"||phase.key==="near-full"
    ? `${data.paksha} Paksha is paired with ${phase.label} at ${data.moonIllumination}% illumination. The Moon is in ${data.rashi}; Amanta reckoning gives ${lunar.amantaLabel}, while Purnimanta gives ${lunar.purnimantaLabel}. The contrast in month names is a calendar-convention difference applied to the same lunar state.`
    : `${phase.label[0].toUpperCase()+phase.label.slice(1)} defines the Moon context at ${data.moonIllumination}% illumination, with the Moon in ${data.rashi}. The local day belongs to ${data.paksha} Paksha: Amanta month ${lunar.amantaLabel}, Purnimanta month ${lunar.purnimantaLabel}. This ${phase.text} sits alongside ${data.solarRashi} as the solar Rashi.`;

  return {
    directAnswer:directAnswer(city,data,tithiTransition,rahu),
    facts:[
      {label:"Solar geography",value:geo.latitudeBand,note:geo.meridianPhrase},
      {label:"Daylight profile",value:solar.key,note:`${daylight} min · ${data.sunrise}–${data.sunset}`},
      {label:"Lunar transition order",value:transitionOrder,note:`Tithi ${tithiEnd} · Nakshatra ${nakshatraEnd}`},
      {label:"Rahu position",value:rahu.label,note:`${rahu.offset} min after sunrise`},
      {label:"Choghadiya shape",value:choghadiya.shape,note:choghadiya.first&&choghadiya.last?`${choghadiya.first.name} → ${choghadiya.last.name}`:"No favorable-labelled period"},
      {label:"Lunar light profile",value:phase.label,note:`${data.moonIllumination}% · ${data.rashi}`},
    ],
    fingerprintTitle:`${city.name} day fingerprint · ${solar.key} / ${transitionOrder.toLowerCase()} / ${choghadiya.shape}`,
    fingerprintBody,
    transitionTitle:`Transition structure · ${transitionOrder} / ${tithiTransition.key} / ${nakshatraTransition.key}`,
    transitionBody,
    solarTitle:`Solar timing structure · ${rahu.label} / ${choghadiya.shape}`,
    solarBody,
    lunarTitle:`Lunar context · ${phase.label} / ${data.paksha} Paksha`,
    lunarBody,
  };
}
