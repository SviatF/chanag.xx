import type {City} from "./cities";
import type {Festival} from "./festivals";
import type {Panchang} from "./panchang";
import type {LunarMonthConventions} from "./calendar-conventions";
import type {FestivalLocalReference} from "./religious-integrity";
import {formatPanchangTime,formatWindow} from "./panchang";

export type FestivalCityQualityContent={
  directAnswer:string;
  directFacts:Array<{label:string;value:string;note?:string}>;
  ritualTitle:string;
  ritualBody:string;
  cityTitle:string;
  cityBody:string;
  regionalTitle:string;
  regionalBody:string|null;
  comparisonPrompt:string;
};

function clockMinutes(value:string){
  const [h,m]=value.split(":").map(Number);
  return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:0;
}
function daylightMinutes(data:Panchang){
  const start=clockMinutes(data.sunrise),end=clockMinutes(data.sunset);
  return end>=start?end-start:end+1440-start;
}
function humanDate(value:string){
  return new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"long",year:"numeric",weekday:"long",timeZone:"Asia/Kolkata"}).format(new Date(`${value}T06:00:00Z`));
}
function moonriseLabel(data:Panchang){
  return formatPanchangTime(data.moonrise,data.moonriseDate,data.date);
}
function favorableSummary(data:Panchang){
  const good=data.dayChoghadiya.filter(item=>item.effect==="good");
  if(!good.length)return "No daytime Choghadiya is labelled favorable in the calculated sequence.";
  const first=good[0],last=good[good.length-1];
  return `${good.length} favorable daytime Choghadiya periods are calculated; the first begins with ${first.name} at ${first.start}, and the last favorable period ends at ${last.end}.`;
}

const regionalContext:Record<string,Partial<Record<string,string>>>= {
  "West Bengal":{
    "shardiya-navratri":"In West Bengal, the autumn Navratri period is strongly associated with Durga Puja. Kolkata searches therefore often focus on the Durga Puja sequence as well as the Navratri start date.",
    dussehra:"In West Bengal, Vijayadashami closes the Durga Puja cycle and is commonly discussed through Bijoya Dashami observances. Kolkata-local Panchang timing remains separate from the shared festival date.",
    "bhai-dooj":"In West Bengal, Bhai Dooj is widely known as Bhai Phota, so the Kolkata page connects that regional name with the same local Panchang date.",
  },
  Gujarat:{
    "shardiya-navratri":"Gujarat gives the autumn Navratri period a distinctive public identity through Garba and Dandiya nights. Ahmedabad, Surat and Vadodara pages therefore pair the shared Navratri date with their own local Panchang timings.",
    "makar-sankranti":"In Gujarat, Makar Sankranti is widely known through Uttarayan celebrations. The festival identity is regional, while sunrise and Panchang values on this page are calculated for the selected city.",
    diwali:"Gujarati Diwali sits next to the Gujarati New Year cycle, making the local calendar context especially relevant in addition to the Lakshmi Puja date.",
  },
  Maharashtra:{
    "ganesh-chaturthi":"Ganesh Chaturthi has especially strong public and household observance across Maharashtra, including installation and Visarjan traditions. The city page focuses on the local Panchang behind that shared festival date.",
    diwali:"Maharashtra follows a multi-day Diwali cycle with local household traditions around the same lunar sequence; this page keeps the city timing layer distinct from the national festival date.",
    "bhai-dooj":"In Maharashtra, Bhai Dooj is commonly known as Bhau Beej, which gives the same lunar observance a distinct regional search vocabulary.",
  },
  Telangana:{
    "shardiya-navratri":"In Telangana, the Navratri period overlaps the Bathukamma festive season. Hyderabad users often encounter both traditions in the same autumn calendar window, while this page keeps the Panchang calculation tied to Hyderabad.",
    dussehra:"Telangana Dasara observance is often discussed with local traditions including Jammi/Shami worship. The shared Vijayadashami date is paired here with Hyderabad-specific Panchang values.",
    "ganesh-chaturthi":"Hyderabad has a major public Ganesh Chaturthi observance culture alongside household worship. The timing cards on this page remain calculated specifically for Hyderabad.",
  },
  "Tamil Nadu":{
    "makar-sankranti":"In Tamil Nadu, the mid-January solar festival period is identified primarily with Pongal. The Chennai page therefore sits at the intersection of the national Makar Sankranti date and Tamil regional festival vocabulary.",
    "shardiya-navratri":"Tamil Navratri is commonly associated with Golu/Kolu displays and the Saraswati-Ayudha Puja sequence. Chennai-local Panchang values give the regional observance its own timing context.",
    dussehra:"In Tamil Nadu, Vijayadashami follows the Saraswati and Ayudha Puja sequence and is associated with new learning and beginnings. The Chennai page supplies the local Panchang layer for that date.",
  },
  Karnataka:{
    dussehra:"Karnataka has a particularly visible Dasara tradition, most famously in Mysuru. Bengaluru uses the same maintained festival date here but receives its own local solar and Panchang timings.",
    "ganesh-chaturthi":"Ganesh Chaturthi is widely observed in Karnataka in both household and public settings; Bengaluru-specific solar timings distinguish this page from other city versions.",
  },
  Bihar:{
    "chhath-puja":"Chhath is one of Bihar's defining festival traditions, centered on offerings to the setting and rising Sun. Local sunset and the following sunrise are therefore especially meaningful city-level values.",
  },
  Jharkhand:{
    "chhath-puja":"Chhath has major observance across Jharkhand, with sunset and sunrise Arghya at the center of the ritual sequence. The local solar times are the key city-specific values on this page.",
  },
  "Uttar Pradesh":{
    "chhath-puja":"Eastern Uttar Pradesh has substantial Chhath observance, where the setting- and rising-Sun sequence makes local solar timings practically important.",
  },
};

function ritualCopy(festival:Festival,data:Panchang,localReference:FestivalLocalReference){
  const tithiEnd=formatPanchangTime(data.tithiEnd,data.tithiEndDate,data.date);
  const nakshatraEnd=formatPanchangTime(data.nakshatraEnd,data.nakshatraEndDate,data.date);
  const abhijit=formatWindow(data.abhijit);
  switch(festival.slug){
    case "makar-sankranti":
      return {title:"Solar-day context for Makar Sankranti",body:`The useful city-specific layer is the local solar day: sunrise is ${data.sunrise} and sunset is ${data.sunset}. The page also records ${data.tithi} Tithi and ${data.nakshatra} Nakshatra so the solar festival date is not reduced to a generic national clock time.`};
    case "maha-shivaratri":
      return {title:"Night observance context",body:`Maha Shivaratri is a night-centered observance. On this city calculation, ${data.tithi} continues until ${tithiEnd}; sunset is ${data.sunset}, and the local night sequence should be read together with the Tithi transition rather than from a copied all-India timing.`};
    case "holi":
      return {title:"Holi day Panchang",body:`For the maintained Holi date, the city calculation shows ${data.tithi} until ${tithiEnd} and ${data.nakshatra} until ${nakshatraEnd}. This page is intentionally about the local festival-day Panchang; the preceding Holika Dahan evening is a separate timing question.`};
    case "chaitra-navratri":
    case "shardiya-navratri":
      return {title:"Navratri opening-day signals",body:`The opening day is calculated with ${data.tithi} Tithi until ${tithiEnd}, ${data.nakshatra} Nakshatra until ${nakshatraEnd}, sunrise at ${data.sunrise} and Abhijit at ${abhijit}. These are the local inputs needed for a future Ghatasthapana-specific rule engine; no invented universal window is substituted.`};
    case "rama-navami":
      return {title:"Rama Navami midday context",body:`Rama Navami timing is tied to Navami and a midday observance context. Here ${data.tithi} lasts until ${tithiEnd}; local sunrise is ${data.sunrise}, sunset ${data.sunset}, and the calculated Abhijit interval is ${abhijit}.`};
    case "hanuman-jayanti":
      return {title:"Hanuman Jayanti local day",body:`The city Panchang places ${data.tithi} at sunrise with the transition at ${tithiEnd}. Sunrise ${data.sunrise}, Nakshatra ${data.nakshatra} and the local lunar-month labels make this more specific than a date-only festival entry.`};
    case "akshaya-tritiya":
      return {title:"Akshaya Tritiya planning context",body:`Akshaya Tritiya is associated with auspicious starts and purchases. The city layer shows ${data.tithi} until ${tithiEnd}, Abhijit ${abhijit}, Rahu Kalam ${formatWindow(data.rahu)} and the full local Choghadiya sequence instead of treating one national time as universal.`};
    case "guru-purnima":
      return {title:"Purnima timing context",body:`Guru Purnima is anchored to the Purnima lunar state. This city calculation records ${data.tithi} until ${tithiEnd}, moonrise at ${moonriseLabel(data)} and ${data.nakshatra} until ${nakshatraEnd}.`};
    case "raksha-bandhan":
      return {title:"Rakhi timing inputs",body:`Raksha Bandhan is tied to Purnima, but a complete Rakhi window also depends on Bhadra handling. This page therefore exposes the factual city inputs—${data.tithi} until ${tithiEnd}, sunrise ${data.sunrise}, sunset ${data.sunset} and Rahu Kalam ${formatWindow(data.rahu)}—without manufacturing a Bhadra result that is not yet calculated.`};
    case "janmashtami":
      return {title:"Janmashtami night reference",body:`Janmashtami is centered on the local night. ${localReference?`${localReference.label} is ${localReference.value}. `:""}${data.tithi} lasts until ${tithiEnd}, while ${data.nakshatra} lasts until ${nakshatraEnd}; those transitions are more informative than a generic midnight-only statement.`};
    case "ganesh-chaturthi":
      return {title:"Ganesh Chaturthi midday context",body:`Ganesh Chaturthi's city timing question is primarily a local midday/Panchang problem. ${data.tithi} lasts until ${tithiEnd}, sunrise is ${data.sunrise}, sunset ${data.sunset}, and Abhijit is ${abhijit}. The page keeps those city values separate from the shared festival date.`};
    case "dussehra":
      return {title:"Vijayadashami local-day context",body:`For Vijayadashami, the useful city layer is the Tithi plus the local afternoon/daylight frame. ${data.tithi} lasts until ${tithiEnd}; sunrise is ${data.sunrise}, sunset ${data.sunset}, and Abhijit is ${abhijit}.`};
    case "karwa-chauth":
      return {title:"Karwa Chauth fasting span",body:`Karwa Chauth is unusually location-sensitive because the fast begins from local sunrise and is broken after Moonrise. ${localReference?`${localReference.label}: ${localReference.value}. `:""}The page also shows ${data.tithi} until ${tithiEnd}.`};
    case "dhanteras":
      return {title:"Dhanteras evening and purchase context",body:`Dhanteras combines Trayodashi, evening worship and purchase intent. This city page shows ${data.tithi} until ${tithiEnd}, sunset ${data.sunset}, Abhijit ${abhijit}, Rahu Kalam ${formatWindow(data.rahu)} and local favorable Choghadiya periods.`};
    case "diwali":
      return {title:"Diwali Lakshmi Puja context",body:`Diwali's city-specific value begins with local sunset and Amavasya overlap. ${localReference?`${localReference.label} is ${localReference.value}. `:""}${data.tithi} lasts until ${tithiEnd}; the page keeps that derived local reference distinct from a fully certified Lagna-based Puja window.`};
    case "govardhan-puja":
      return {title:"Govardhan Puja local Panchang",body:`Govardhan Puja follows the Diwali Amavasya sequence. The local page records ${data.tithi} until ${tithiEnd}, ${data.nakshatra} until ${nakshatraEnd}, sunrise ${data.sunrise} and the lunar-month labels for this city.`};
    case "bhai-dooj":
      return {title:"Bhai Dooj local Panchang",body:`Bhai Dooj is tied to Shukla Dwitiya in the post-Diwali sequence. The city calculation shows ${data.tithi} until ${tithiEnd}, ${data.nakshatra} until ${nakshatraEnd} and local sunrise ${data.sunrise}.`};
    case "chhath-puja":
      return {title:"Chhath solar timings",body:`Chhath is directly tied to offerings to the setting and rising Sun, so local solar timing is central rather than secondary. For this city, sunset is ${data.sunset}; the page also records sunrise ${data.sunrise} and the surrounding Panchang state.`};
    default:
      return {title:`${festival.name} local Panchang`,body:`The city calculation shows ${data.tithi} until ${tithiEnd}, ${data.nakshatra} until ${nakshatraEnd}, sunrise ${data.sunrise}, sunset ${data.sunset} and Rahu Kalam ${formatWindow(data.rahu)}.`};
  }
}

export function buildFestivalCityQualityContent(festival:Festival,city:City,data:Panchang,lunar:LunarMonthConventions,localReference:FestivalLocalReference):FestivalCityQualityContent{
  const daylight=daylightMinutes(data);
  const tithiEnd=formatPanchangTime(data.tithiEnd,data.tithiEndDate,data.date);
  const nakshatraEnd=formatPanchangTime(data.nakshatraEnd,data.nakshatraEndDate,data.date);
  const ritual=ritualCopy(festival,data,localReference);
  const regional=regionalContext[city.state]?.[festival.slug]??null;
  const directAnswer=`${festival.name} ${festival.year} in ${city.name} falls on ${humanDate(festival.date)}. On the local calculation, sunrise is ${data.sunrise}, sunset is ${data.sunset}, ${data.tithi} Tithi continues until ${tithiEnd}, and ${data.nakshatra} Nakshatra continues until ${nakshatraEnd}.`;
  const directFacts=[
    {label:"Festival date",value:humanDate(festival.date),note:`${city.name}, ${city.state}`},
    {label:"Tithi transition",value:`${data.tithi} → ${tithiEnd}`,note:`${data.paksha} Paksha`},
    {label:"Nakshatra transition",value:`${data.nakshatra} → ${nakshatraEnd}`,note:`Pada ${data.nakshatraPada}`},
    {label:"Local solar day",value:`${data.sunrise}–${data.sunset}`,note:`${daylight} minutes of daylight`},
    {label:"Rahu Kalam",value:formatWindow(data.rahu),note:`Calculated from ${city.name} daylight`},
    {label:"Lunar month",value:lunar.amantaLabel,note:`Purnimanta: ${lunar.purnimantaLabel}`},
  ];
  if(localReference)directFacts.push({label:localReference.label,value:localReference.value,note:"Festival-specific local reference"});

  return {
    directAnswer,
    directFacts,
    ritualTitle:ritual.title,
    ritualBody:ritual.body,
    cityTitle:`What changes specifically in ${city.name}`,
    cityBody:`${city.name}'s festival page is calculated from its own sunrise, sunset, lunar transitions and local time windows. The daylight span on ${festival.date} is ${daylight} minutes. ${favorableSummary(data)} Moonrise is ${moonriseLabel(data)}. These values are the page's city fingerprint and should not be copied from another location.`,
    regionalTitle:`${festival.name} in ${city.state}`,
    regionalBody:regional,
    comparisonPrompt:`When comparing ${festival.name} across cities, compare the Tithi/Nakshatra transition clock times, local sunrise and sunset, Rahu Kalam, Moonrise and any festival-specific reference—not just the shared calendar date.`,
  };
}
