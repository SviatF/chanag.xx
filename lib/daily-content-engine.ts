import type {City} from "./cities";
import {buildCityContentProfile} from "./city-content-profile";
import type {Panchang,TimeWindow} from "./panchang";
import {formatPanchangTime,formatWindow} from "./panchang";

type LunarLabels={amantaLabel:string;purnimantaLabel:string};
type Fact={label:string;value:string;note?:string};
type TransitionProfile={key:string;label:string;text:string};
type RahuProfile={key:string;label:string;text:string;offset:number};
type SolarProfile={key:string;label:string};
type LunarProfile={key:string;label:string;text:string};

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

function clockMinutes(value:string){const [h,m]=value.split(":").map(Number);return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:0;}
function daylightMinutes(data:Panchang){const start=clockMinutes(data.sunrise),end=clockMinutes(data.sunset);return end>=start?end-start:end+1440-start;}
function windowMinutes(window:TimeWindow){const start=clockMinutes(window.start),end=clockMinutes(window.end);return end>=start?end-start:end+1440-start;}
function humanDate(value:string){return new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"long",year:"numeric",weekday:"long",timeZone:"Asia/Kolkata"}).format(new Date(`${value}T06:00:00Z`));}
function integerWords(value:number){const n=Math.max(0,Math.round(value));if(n<20)return units[n];if(n<100){const t=Math.floor(n/10),u=n%10;return u?`${tens[t]}-${units[u]}`:tens[t];}return String(n);}
function oneDecimalWords(value:number){const rounded=Math.round(Math.abs(value)*10)/10;const whole=Math.floor(rounded);const decimal=Math.round((rounded-whole)*10);return decimal?`${integerWords(whole)} point ${units[decimal]}`:integerWords(whole);}
function nextTithiLabel(data:Panchang){if(data.tithi==="Purnima")return "Pratipada · Krishna Paksha";if(data.tithi==="Amavasya")return "Pratipada · Shukla Paksha";if(data.tithi==="Chaturdashi")return data.paksha==="Shukla"?"Purnima · Shukla Paksha":"Amavasya · Krishna Paksha";const index=commonTithis.indexOf(data.tithi);return index>=0&&index<commonTithis.length-1?`${commonTithis[index+1]} · ${data.paksha} Paksha`:"the next lunar Tithi";}
function nextNakshatraLabel(data:Panchang){const index=nakshatras.indexOf(data.nakshatra);return index>=0?nakshatras[(index+1)%nakshatras.length]:"the next Nakshatra";}

function transitionClass(time:string,endDate:string|null,date:string,sunrise:string,sunset:string):TransitionProfile{
  if(endDate&&endDate>date)return {key:"next-civil-date",label:"next-date transition",text:"continues beyond the current civil date"};
  const value=clockMinutes(time),rise=clockMinutes(sunrise),set=clockMinutes(sunset),noon=rise+(set-rise)/2;
  if(value<rise+180)return {key:"early-morning",label:"early-day transition",text:"changes in the early part of the local solar day"};
  if(value<noon)return {key:"late-morning",label:"pre-midday transition",text:"changes before the midpoint of local daylight"};
  if(value<noon+180)return {key:"afternoon",label:"afternoon transition",text:"changes in the afternoon band"};
  if(value<set)return {key:"late-day",label:"late-day transition",text:"changes late in the daylight span"};
  return {key:"after-sunset",label:"post-sunset transition",text:"remains active through sunset before changing"};
}
function solarDayClass(minutes:number):SolarProfile{if(minutes<705)return {key:"compact",label:"compact daylight day"};if(minutes<725)return {key:"short-balanced",label:"short-balanced daylight day"};if(minutes<745)return {key:"balanced",label:"balanced daylight day"};if(minutes<765)return {key:"long-balanced",label:"long-balanced daylight day"};return {key:"extended",label:"extended daylight day"};}
function rahuClass(data:Panchang,daylight:number):RahuProfile{const offset=Math.max(0,clockMinutes(data.rahu.start)-clockMinutes(data.sunrise));const share=daylight?offset/daylight:0;if(share<0.18)return {key:"opening",label:"opening-day Rahu",text:"near the opening fifth of daylight",offset};if(share<0.34)return {key:"morning",label:"morning Rahu",text:"inside the morning third of daylight",offset};if(share<0.5)return {key:"midday",label:"midday Rahu",text:"around the middle of the solar day",offset};if(share<0.68)return {key:"afternoon",label:"afternoon Rahu",text:"inside the afternoon section of daylight",offset};return {key:"late",label:"late-day Rahu",text:"toward the final third of daylight",offset};}
function lunarPhaseClass(data:Panchang):LunarProfile{const value=data.moonIllumination;if(value<=15)return {key:"dark-moon",label:"dark-moon phase",text:"a low-light lunar state close to the dark end of the cycle"};if(value<=35)return {key:data.paksha==="Shukla"?"waxing-crescent":"waning-crescent",label:data.paksha==="Shukla"?"waxing-crescent phase":"waning-crescent phase",text:"a crescent-weighted illumination state"};if(value<=65)return {key:data.paksha==="Shukla"?"waxing-half":"waning-half",label:data.paksha==="Shukla"?"waxing half-lit phase":"waning half-lit phase",text:"a middle-illumination lunar state"};if(value<=85)return {key:data.paksha==="Shukla"?"waxing-gibbous":"waning-gibbous",label:data.paksha==="Shukla"?"waxing-gibbous phase":"waning-gibbous phase",text:"a bright gibbous lunar state"};return {key:"near-full",label:"near-full phase",text:"a high-illumination state close to the bright end of the cycle"};}
function choghadiyaProfile(data:Panchang){const favorable=data.dayChoghadiya.filter(item=>item.effect==="good");const first=favorable[0],last=favorable[favorable.length-1];const firstIndex=first?data.dayChoghadiya.indexOf(first):-1,lastIndex=last?data.dayChoghadiya.indexOf(last):-1;const shape=firstIndex<0?"no-favorable-entry":firstIndex<=1?"front-loaded":firstIndex<=3?"early-middle":firstIndex<=5?"late-middle":"back-loaded";return {favorable,first,last,firstIndex,lastIndex,shape};}
function geoProfile(city:City){const solarOffset=Math.round((city.lng-82.5)*4);const relation=solarOffset<0?"west of":solarOffset>0?"east of":"on";const offsetText=solarOffset===0?"essentially aligned with":`${integerWords(Math.abs(solarOffset))} solar minutes ${relation}`;const latitudeBand=city.lat<15?"southern tropical belt":city.lat<21?"lower tropical belt":city.lat<26?"central tropical belt":city.lat<30?"upper tropical belt":"northern subtropical belt";return {solarOffset,latitudeBand,coordinatePhrase:`about ${oneDecimalWords(city.lat)} degrees north and ${oneDecimalWords(city.lng)} degrees east`,meridianPhrase:`${offsetText} India's IST standard meridian`};}
function cityNarrativeKey(city:City){let hash=23;for(let index=0;index<city.slug.length;index++)hash=(hash*137+city.slug.charCodeAt(index)*(index+11))%104729;return hash;}

function directAnswer(city:City,data:Panchang,tithi:TransitionProfile,rahu:RahuProfile){
  const date=humanDate(data.date);
  if(tithi.key==="next-civil-date")return `${date} in ${city.name} begins with ${data.tithi} Tithi in ${data.paksha} Paksha and ${data.nakshatra} Nakshatra. The Tithi survives into the next civil date, while Rahu Kalam falls at ${formatWindow(data.rahu)}.`;
  if(rahu.key==="opening"||rahu.key==="morning")return `${city.name} opens ${date} with ${data.tithi} Tithi and ${data.nakshatra} Nakshatra; today's Rahu Kalam arrives relatively early at ${formatWindow(data.rahu)}, with sunrise ${data.sunrise} and sunset ${data.sunset}.`;
  if(rahu.key==="late")return `On ${date}, ${city.name} has ${data.tithi} Tithi, ${data.nakshatra} Nakshatra and a late-day Rahu Kalam at ${formatWindow(data.rahu)}. Local sunrise is ${data.sunrise} and sunset is ${data.sunset}.`;
  return `${date} in ${city.name} carries ${data.tithi} Tithi (${data.paksha}), ${data.nakshatra} Nakshatra and ${rahu.key}-phase Rahu Kalam ${formatWindow(data.rahu)} between local sunrise ${data.sunrise} and sunset ${data.sunset}.`;
}

export function buildDailyPanchangQualityContent(city:City,data:Panchang,lunar:LunarLabels):DailyPanchangQualityContent{
  const daylight=daylightMinutes(data),solar=solarDayClass(daylight),rahu=rahuClass(data,daylight),phase=lunarPhaseClass(data),choghadiya=choghadiyaProfile(data),geo=geoProfile(city),cityProfile=buildCityContentProfile(city);
  const tithiTransition=transitionClass(data.tithiEnd,data.tithiEndDate,data.date,data.sunrise,data.sunset),nakshatraTransition=transitionClass(data.nakshatraEnd,data.nakshatraEndDate,data.date,data.sunrise,data.sunset);
  const tithiEnd=formatPanchangTime(data.tithiEnd,data.tithiEndDate,data.date),nakshatraEnd=formatPanchangTime(data.nakshatraEnd,data.nakshatraEndDate,data.date),rahuDuration=windowMinutes(data.rahu);
  const tithiBeforeNakshatra=(data.tithiEndDate??data.date)<(data.nakshatraEndDate??data.date)||((data.tithiEndDate??data.date)===(data.nakshatraEndDate??data.date)&&clockMinutes(data.tithiEnd)<=clockMinutes(data.nakshatraEnd));
  const transitionOrder=tithiBeforeNakshatra?"Tithi-first":"Nakshatra-first",key=cityNarrativeKey(city),variant=key%5;
  const favorableRange=choghadiya.first&&choghadiya.last?`${choghadiya.first.name} ${choghadiya.first.start} through ${choghadiya.last.name} ${choghadiya.last.end}`:"no favorable-labelled daytime period";

  const placeLead=variant===0
    ? `The local frame is ${cityProfile.geoContext}, a ${cityProfile.latitudeContext} where the solar clock is ${cityProfile.solarClockContext}.`
    : variant===1
      ? `Read this date from ${cityProfile.geoContext}: ${city.name} is ${cityProfile.solarClockContext} within a ${cityProfile.latitudeContext}.`
      : variant===2
        ? `At ${geo.coordinatePhrase}, ${city.name} belongs to ${cityProfile.geoContext}; its solar position is ${geo.meridianPhrase}.`
        : variant===3
          ? `${city.name}'s day is anchored to ${cityProfile.geoContext}. The city sits in a ${cityProfile.latitudeContext} and is ${cityProfile.solarClockContext}.`
          : `The geographic baseline for this Panchang is ${cityProfile.geoContext}, with ${city.name} operating on a solar clock ${cityProfile.solarClockContext}.`;
  const fingerprintBody=`${placeLead} ${cityProfile.dailyContext} At sunrise, the combined state is ${data.tithi} Tithi, ${data.nakshatra} Nakshatra, ${data.yoga} Yoga and ${data.karana} Karana inside a ${solar.label}. That bundle links the lunar state to this city's own dawn rather than treating the day as an all-India timestamp.`;

  const transitionBody=variant===0
    ? `${transitionOrder} defines the lunar hand-off sequence. ${data.tithi} reaches a ${tithiTransition.key} boundary at ${tithiEnd} and moves to ${nextTithiLabel(data)}; ${data.nakshatra} reaches a ${nakshatraTransition.key} boundary at ${nakshatraEnd} and moves to ${nextNakshatraLabel(data)}. The two clocks are independent, so the sunrise labels should not be read as fixed until midnight.`
    : variant===1
      ? `Two different boundaries shape the civil day. The Tithi transition is ${tithiTransition.label} at ${tithiEnd}; the Nakshatra transition is ${nakshatraTransition.label} at ${nakshatraEnd}. Their order is ${transitionOrder}, which tells you which lunar label changes first after ${city.name}'s local sunrise.`
      : variant===2
        ? `The sunrise state evolves in a ${transitionOrder.toLowerCase()} pattern. ${data.tithi} ${tithiTransition.text} at ${tithiEnd}, while ${data.nakshatra} ${nakshatraTransition.text} at ${nakshatraEnd}. After those hand-offs the sequence becomes ${nextTithiLabel(data)} and ${nextNakshatraLabel(data)} rather than preserving the opening labels for the whole civil date.`
        : variant===3
          ? `Boundary order is more useful here than a static label list: ${transitionOrder}. ${data.tithi} ends at ${tithiEnd} (${tithiTransition.key}); ${data.nakshatra} ends at ${nakshatraEnd} (${nakshatraTransition.key}). That creates a two-stage local lunar timeline tied to ${city.name}'s dawn checkpoint.`
          : `Today's two lunar clocks do not move together. ${data.tithi} hands off to ${nextTithiLabel(data)} at ${tithiEnd}, and ${data.nakshatra} hands off to ${nextNakshatraLabel(data)} at ${nakshatraEnd}. The resulting ${transitionOrder.toLowerCase()} sequence is the main transition signature for the date.`;

  const solarBody=variant===0
    ? `The ${daylight}-minute solar day is classified as ${solar.key}. Rahu begins ${rahu.offset} minutes after sunrise and sits ${rahu.text} for ${rahuDuration} minutes. Choghadiya is ${choghadiya.shape}, with ${choghadiya.favorable.length} favorable-labelled periods spanning ${favorableRange}. Yamaganda ${formatWindow(data.yamaganda)} and Gulika ${formatWindow(data.gulika)} remain separate local exclusion clocks.`
    : variant===1
      ? `Sunrise ${data.sunrise} to sunset ${data.sunset} produces a ${solar.label}. Inside that frame Rahu occupies ${formatWindow(data.rahu)} and the favorable Choghadiya pattern is ${choghadiya.shape}. The first-to-last favorable-labelled range is ${favorableRange}; Yamaganda and Gulika are evaluated separately rather than merged into the Choghadiya labels.`
      : variant===2
        ? `Today's timing grid starts with ${daylight} minutes of local daylight. Rahu is ${rahu.label}, beginning ${rahu.offset} minutes after sunrise, while the day Choghadiya resolves to a ${choghadiya.shape} structure with ${choghadiya.favorable.length} favorable segments. The visible favorable span is ${favorableRange}, distinct from the Rahu/Yamaganda/Gulika exclusion layer.`
        : variant===3
          ? `A ${solar.key} daylight profile provides the geometry for the timing windows. Rahu falls ${rahu.text} at ${formatWindow(data.rahu)}; the Choghadiya pattern is ${choghadiya.shape}. Across the day, ${favorableRange} describes the good-labelled range, while Yamaganda ${formatWindow(data.yamaganda)} and Gulika ${formatWindow(data.gulika)} supply independent avoidance intervals.`
          : `The local solar frame is ${solar.label}, from ${data.sunrise} to ${data.sunset}. Rahu lasts ${rahuDuration} minutes and begins ${rahu.offset} minutes after sunrise. Choghadiya contributes a ${choghadiya.shape} favorable pattern with ${choghadiya.favorable.length} good-labelled segments, so the intraday result is read as a combination of solar geometry, weekday labels and exclusions.`;

  const lunarBody=variant===0
    ? `${phase.label[0].toUpperCase()+phase.label.slice(1)} describes the Moon-light state, with the Moon in ${data.rashi} during ${data.paksha} Paksha and the Sun in ${data.solarRashi}. Month naming then separates by convention: Amanta gives ${lunar.amantaLabel}; Purnimanta gives ${lunar.purnimantaLabel}. Both names refer to the same astronomical day.`
    : variant===1
      ? `The lunar side of the fingerprint is ${phase.key}: ${phase.text}. The Moon occupies ${data.rashi} and the date sits in ${data.paksha} Paksha, while ${data.solarRashi} is the solar Rashi. Amanta reckoning calls the month ${lunar.amantaLabel}; Purnimanta calls it ${lunar.purnimantaLabel}, reflecting different month-end conventions.`
      : variant===2
        ? `For lunar context, ${data.paksha} Paksha combines with a ${phase.label} and Moon-sign ${data.rashi}. The Sun is in ${data.solarRashi}. The same state maps to ${lunar.amantaLabel} under Amanta and ${lunar.purnimantaLabel} under Purnimanta, so the month-name difference is calendrical rather than astronomical.`
        : variant===3
          ? `Moon illumination places the day in the ${phase.key} class, alongside ${data.rashi} as lunar Rashi and ${data.solarRashi} as solar Rashi. ${data.paksha} Paksha supplies the waxing/waning direction. Regional month reckoning then yields ${lunar.amantaLabel} in Amanta and ${lunar.purnimantaLabel} in Purnimanta.`
          : `The lunar signature combines ${phase.label}, ${data.paksha} Paksha and Moon-sign ${data.rashi}. The corresponding solar sign is ${data.solarRashi}. Calendar convention creates the final naming split: ${lunar.amantaLabel} for Amanta and ${lunar.purnimantaLabel} for Purnimanta, without changing the underlying Moon position.`;

  return {
    directAnswer:directAnswer(city,data,tithiTransition,rahu),
    facts:[
      {label:"Local geographic frame",value:cityProfile.geoContext,note:cityProfile.solarClockContext},
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
