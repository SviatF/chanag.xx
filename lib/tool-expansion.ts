import {findCityBySlug,supportedCities,type City} from "./cities";
import {todayInIndia} from "./dates";
import type {Panchang} from "./panchang";
import {parseIsoRouteDate} from "./route-validation";

export const expandedToolSlugs=[
  "tithi-finder",
  "nakshatra-today",
  "moon-phase",
  "hindu-month-finder",
  "panchang-date-lookup",
] as const;
export type ExpandedToolSlug=typeof expandedToolSlugs[number];

export type ExpandedToolDefinition={
  slug:ExpandedToolSlug;
  name:string;
  shortName:string;
  description:string;
  kicker:string;
  submitLabel:string;
  querySignals:string[];
};

export const expandedTools:Record<ExpandedToolSlug,ExpandedToolDefinition>={
  "tithi-finder":{
    slug:"tithi-finder",name:"Tithi Finder",shortName:"Tithi Finder",kicker:"LUNAR DAY TOOL",submitLabel:"Find Tithi →",
    description:"Find the Hindu lunar day (Tithi), Paksha and transition time for any supported Indian city and date.",
    querySignals:["tithi finder","tithi today","today tithi","tithi calculator","hindu tithi today","aaj ki tithi","आज की तिथि","तिथि आज"]
  },
  "nakshatra-today":{
    slug:"nakshatra-today",name:"Nakshatra Today",shortName:"Nakshatra Today",kicker:"LUNAR MANSION TOOL",submitLabel:"Find Nakshatra →",
    description:"Find today's or any date's Nakshatra, Pada and transition time from the location-aware Panchang engine.",
    querySignals:["nakshatra today","today nakshatra","nakshatra for date","nakshatra calculator today","aaj ka nakshatra","आज का नक्षत्र","नक्षत्र आज"]
  },
  "moon-phase":{
    slug:"moon-phase",name:"Moon Phase Today",shortName:"Moon Phase",kicker:"LUNAR PHASE TOOL",submitLabel:"Check Moon Phase →",
    description:"Check the Moon phase, illumination, Paksha and Tithi for any supported Indian city and date.",
    querySignals:["moon phase today","moon phase india","moon phase calculator","today moon phase","lunar phase today","चंद्रमा की कला","चंद्र चरण"]
  },
  "hindu-month-finder":{
    slug:"hindu-month-finder",name:"Hindu Month Finder",shortName:"Hindu Month Finder",kicker:"HINDU CALENDAR TOOL",submitLabel:"Find Hindu Month →",
    description:"Find the Amanta Hindu lunar month, Tithi and Samvat context for a selected city and date.",
    querySignals:["hindu month today","hindu month finder","hindu month calculator","which hindu month","current hindu month","hindu calendar month","आज कौन सा हिंदू महीना"]
  },
  "panchang-date-lookup":{
    slug:"panchang-date-lookup",name:"Panchang Date Lookup",shortName:"Panchang Lookup",kicker:"DATE LOOKUP",submitLabel:"Look Up Panchang →",
    description:"Look up Tithi, Nakshatra, Yoga, Karana, sunrise, sunset and timing windows for a selected city and date.",
    querySignals:["panchang date lookup","panchang for date","panchang lookup","old date panchang","panchang calculator date","panchang by date"]
  }
};

const defaultCity=supportedCities[0];

export function isExpandedToolSlug(value:string):value is ExpandedToolSlug{return expandedToolSlugs.includes(value as ExpandedToolSlug);}
export function expandedToolPath(slug:ExpandedToolSlug){return `/tools/${slug}`;}

export function resolveToolCity(raw:string|undefined):City{
  if(!raw)return defaultCity;
  return findCityBySlug(raw)??defaultCity;
}

export function resolveToolDate(raw:string|undefined){
  if(raw){const parsed=parseIsoRouteDate(raw);if(parsed)return parsed;}
  return todayInIndia();
}

export function toolDateIso(date:Date){return date.toISOString().slice(0,10);}

function normalize(value:string){return ` ${value.toLowerCase().normalize("NFKC").replace(/[^\p{L}\p{N}]+/gu," ").trim()} `;}

export function detectExpandedToolQuery(rawQuery:string):ExpandedToolDefinition|null{
  const query=normalize(rawQuery);
  let best:{tool:ExpandedToolDefinition;signalLength:number}|null=null;
  for(const slug of expandedToolSlugs){
    const tool=expandedTools[slug];
    for(const signal of tool.querySignals){
      const needle=normalize(signal);
      if(query.includes(needle)&&(!best||needle.length>best.signalLength))best={tool,signalLength:needle.length};
    }
  }
  return best?.tool??null;
}

export type MoonPhaseName="New Moon"|"Waxing Crescent"|"First Quarter"|"Waxing Gibbous"|"Full Moon"|"Waning Gibbous"|"Last Quarter"|"Waning Crescent";

export function moonPhaseName(data:Pick<Panchang,"tithi"|"paksha"|"moonIllumination">):MoonPhaseName{
  if(data.tithi==="Amavasya"||data.moonIllumination<=2)return "New Moon";
  if(data.tithi==="Purnima"||data.moonIllumination>=98)return "Full Moon";
  const waxing=data.paksha==="Shukla";
  if(data.moonIllumination>=45&&data.moonIllumination<=55)return waxing?"First Quarter":"Last Quarter";
  if(data.moonIllumination<50)return waxing?"Waxing Crescent":"Waning Crescent";
  return waxing?"Waxing Gibbous":"Waning Gibbous";
}

export function toolHubJsonLd(tool:ExpandedToolDefinition){return {"@context":"https://schema.org","@type":"WebApplication","name":tool.name,"applicationCategory":"LifestyleApplication","operatingSystem":"Web","url":`https://panchvani.com${expandedToolPath(tool.slug)}`};}
