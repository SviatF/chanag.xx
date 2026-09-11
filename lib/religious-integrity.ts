import type {Festival} from "./festivals";
import type {Panchang} from "./panchang";

export type IntegritySource={label:string;url:string;note:string};
export type FestivalRuleProfile={
  title:string;
  ruleSummary:string;
  criteria:string[];
  localReference:string;
  exactness:"derived-reference"|"context-only";
  limitations:string[];
  sources:IntegritySource[];
};

const sources={
  diwali:{label:"Drik Panchang · Lakshmi Puja methodology",url:"https://www.drikpanchang.com/festivals/lakshmipuja/festivals-lakshmipuja-timings.html",note:"Pradosh Kaal with Amavasya; exact Lakshmi Puja Muhurat also considers Sthir Lagna."},
  raksha:{label:"Drik Panchang · Raksha Bandhan methodology",url:"https://www.drikpanchang.com/festivals/raksha-bandhan/raksha-bandhan-date-time.html",note:"Shravana Purnima, avoid Bhadra; Aparahna is preferred and Pradosh is an alternative."},
  janmashtami:{label:"Drik Panchang · Krishna Janmashtami methodology",url:"https://www.drikpanchang.com/dashavatara/lord-krishna/krishna-janmashtami-date-time.html",note:"Ashtami/Nishita framework with tradition-specific handling of Rohini and fasting/parana rules."},
  karwa:{label:"Drik Panchang · Karwa Chauth methodology",url:"https://www.drikpanchang.com/festivals/karwa-chauth/karwa-chauth-date-time.html",note:"Krishna Chaturthi observance with fasting from sunrise and breaking after local moonrise."},
  marriage:{label:"Drik Panchang · Marriage Muhurat benchmark",url:"https://www.drikpanchang.com/shubh-dates/shubh-marriage-dates-with-muhurat.html",note:"Demonstrates that full Panchang Shuddhi considers more than Tithi and Nakshatra, including Yoga/Karana and other exclusions."},
  griha:{label:"Drik Panchang · Griha Pravesh benchmark",url:"https://www.drikpanchang.com/shubh-dates/griha-pravesh-dates-with-muhurat.html",note:"Demonstrates weekday, Tithi, Nakshatra, Adhika month and planetary-combustion exclusions in a fuller Shuddhi process."},
} satisfies Record<string,IntegritySource>;

const festivalProfiles:Record<string,FestivalRuleProfile>={
  diwali:{
    title:"Lakshmi Puja rule profile",
    ruleSummary:"For household Lakshmi Puja, Pradosh Kaal is the primary local solar period; the exact ritual Muhurat additionally depends on Amavasya overlap and, in common practice, Sthir Lagna.",
    criteria:["Kartika/Diwali Amavasya observance","Pradosh Kaal after local sunset","Exact Lakshmi Puja selection requires Amavasya overlap","Sthir Lagna is not yet calculated by Panchvani"],
    localReference:"Panchvani can derive the local Pradosh reference from sunset, but it does not certify an exact Lakshmi Puja Muhurat without Lagna validation.",
    exactness:"derived-reference",
    limitations:["No Lagna/Sthir Lagna calculation in the current festival engine","No claim that Choghadiya alone is a Lakshmi Puja Muhurat"],
    sources:[sources.diwali],
  },
  "raksha-bandhan":{
    title:"Rakhi timing rule profile",
    ruleSummary:"Raksha Bandhan is tied to Shravana Purnima. Bhadra is traditionally avoided; Aparahna is preferred, with Pradosh used when Aparahna is unavailable.",
    criteria:["Purnima observance","Avoid Bhadra","Prefer Aparahna","Pradosh can be used when Aparahna is unavailable"],
    localReference:"Panchvani shows the local Panchang context but does not yet certify a Rakhi Muhurat because a full Bhadra interval engine is not exposed on this route.",
    exactness:"context-only",
    limitations:["Exact Bhadra start/end is not certified here","No universal Rakhi window is generated from generic Choghadiya"],
    sources:[sources.raksha],
  },
  janmashtami:{
    title:"Janmashtami rule profile",
    ruleSummary:"Krishna Janmashtami is an Ashtami observance centered on Nishita; Rohini and fasting/parana handling can differ between Smarta, Vaishnava and institutional traditions.",
    criteria:["Krishna Paksha Ashtami","Nishita/night observance","Rohini can be relevant depending on tradition","Parana rules differ by tradition"],
    localReference:"Panchvani can derive a local Nishita reference from the night length, but the page does not label that reference as a universal Janmashtami Puja Muhurat.",
    exactness:"derived-reference",
    limitations:["Smarta/Vaishnava selection differences are not collapsed into one rule","Rohini-specific prioritization is not used to certify the festival date"],
    sources:[sources.janmashtami],
  },
  "karwa-chauth":{
    title:"Karwa Chauth rule profile",
    ruleSummary:"Karwa Chauth is observed on Krishna Paksha Chaturthi; the fast traditionally runs from sunrise until sighting and offering to the local Moon at night.",
    criteria:["Krishna Paksha Chaturthi","Sunrise-based fasting day","Local moonrise is operationally important","Month label differs by Amanta/Purnimanta convention"],
    localReference:"Panchvani exposes local sunrise and moonrise as the practical fasting reference. It does not replace family or sampradaya-specific Puja practice.",
    exactness:"derived-reference",
    limitations:["Moon sighting itself can be affected by local weather/horizon","Puja procedure is not inferred from astronomy"],
    sources:[sources.karwa],
  },
};

const genericProfile:FestivalRuleProfile={
  title:"Festival observance profile",
  ruleSummary:"This page provides a maintained festival date plus local Panchang context. Panchvani does not convert a generic sunrise/midday/sunset category into an exact ritual Muhurat.",
  criteria:["Maintained festival date record","Local Tithi/Nakshatra context","Local sunrise and sunset"],
  localReference:"Use the local Panchang values as context; exact ritual timing can require festival-specific rules not yet encoded for this observance.",
  exactness:"context-only",
  limitations:["No generic timing window is presented as an exact ritual Muhurat"],
  sources:[],
};

export function getFestivalRuleProfile(festival:Festival){
  return festivalProfiles[festival.slug]??genericProfile;
}

const pad=(n:number)=>String(n).padStart(2,"0");
const toMinutes=(value:string)=>{const [h,m]=value.split(":").map(Number);return h*60+m;};
const displayMinutes=(value:number)=>{const dayOffset=Math.floor(value/1440);const normalized=((Math.round(value)%1440)+1440)%1440;return `${pad(Math.floor(normalized/60))}:${pad(normalized%60)}${dayOffset>0?" next day":""}`;};

export type FestivalLocalReference={label:string;value:string;note:string}|null;

export function getFestivalLocalReference(festival:Festival,data:Panchang):FestivalLocalReference{
  if(festival.slug==="diwali"){
    const sunset=toMinutes(data.sunset);
    return {label:"Pradosh reference",value:`${displayMinutes(sunset)} — ${displayMinutes(sunset+144)}`,note:"Local sunset-based Pradosh reference only. Exact Lakshmi Puja Muhurat still requires Amavasya overlap and Sthir Lagna validation."};
  }
  if(festival.slug==="janmashtami"){
    const sunset=toMinutes(data.sunset);
    const last=data.nightChoghadiya[data.nightChoghadiya.length-1];
    if(!last)return null;
    let nextSunrise=toMinutes(last.end)+(last.endDayOffset?1440:0);
    if(nextSunrise<=sunset)nextSunrise+=1440;
    const night=nextSunrise-sunset;
    const center=sunset+night/2;
    const muhurta=night/15;
    return {label:"Nishita reference",value:`${displayMinutes(center-muhurta/2)} — ${displayMinutes(center+muhurta/2)}`,note:"Derived from the middle Muhurta of the local night. Tradition-specific Ashtami/Rohini selection still governs exact observance."};
  }
  if(festival.slug==="karwa-chauth"){
    const moonrise=data.moonrise==="—"?"not available":`${data.moonrise}${data.moonriseDate&&data.moonriseDate!==data.date?` · ${data.moonriseDate}`:""}`;
    return {label:"Fasting reference",value:`Sunrise ${data.sunrise} → Moonrise ${moonrise}`,note:"Local astronomical reference for the fasting span; actual moon sighting and Puja practice remain tradition-dependent."};
  }
  if(festival.slug==="raksha-bandhan"){
    return {label:"Rakhi timing status",value:"Bhadra check required",note:"Panchvani does not certify a Rakhi Muhurat until the complete local Bhadra interval is available on this route."};
  }
  return null;
}

export const muhuratBenchmarkSources=[sources.marriage,sources.griha];

export const muhuratExcludedFactors=[
  "Weekday restrictions where applicable",
  "Yoga and Karana prohibitions beyond the current clean-window filter",
  "Adhika Maas / Kshaya Maas restrictions by ceremony",
  "Guru/Shukra Asta and other planetary-combustion rules",
  "Lagna and ceremony-specific ascendant rules",
  "Tara Bala, Chandra Bala and personal horoscope compatibility",
  "Sampradaya, regional and family-specific ritual rules",
] as const;

export const muhuratScreeningStatement="Panchvani currently provides a deterministic Tithi + Nakshatra screening profile and local planning windows. It is not a complete Panchang Shuddhi or a personalized ceremony certification.";
