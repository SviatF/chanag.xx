import type {City} from "./cities";
import {supportedCities} from "./cities";
import type {Festival} from "./festivals";
import {festivalsForYear} from "./festivals";
import {activeIndexCitySlugs,isMuhuratIndexable,isRegionalIndexable,primaryMuhuratEvents} from "./seo-policy";
import type {TopicalGraphGroup,TopicalGraphLink} from "./topical-types";

const eventLabels:Record<string,string>={
  wedding:"Wedding Muhurat",
  "griha-pravesh":"Griha Pravesh",
  "vehicle-purchase":"Vehicle Purchase"
};

const regionalLanguages=[
  {slug:"bengali",code:"bn",label:"Bengali Panjika"},
  {slug:"tamil",code:"ta",label:"Tamil Panchangam"},
  {slug:"malayalam",code:"ml",label:"Malayalam Panchangam"},
  {slug:"gujarati",code:"gu",label:"Gujarati Calendar"},
  {slug:"marathi",code:"mr",label:"Marathi Panchang"}
] as const;

function pad(value:number){return String(value).padStart(2,"0");}
function iso(date:Date){return date.toISOString().slice(0,10);}
function monthPathParts(date:Date){return {year:date.getUTCFullYear(),month:pad(date.getUTCMonth()+1)};}

function activeCities(){
  const active=new Set(activeIndexCitySlugs());
  return supportedCities.filter(city=>active.has(city.slug));
}

export function indexedPeerCities(city:City,limit=4){
  const active=activeCities().filter(item=>item.slug!==city.slug);
  const sameState=active.filter(item=>item.state===city.state);
  const others=active.filter(item=>item.state!==city.state);
  return [...sameState,...others].slice(0,limit);
}

export function regionalLinksForCity(city:City):TopicalGraphLink[]{
  return regionalLanguages
    .filter(item=>city.language.includes(item.code)&&isRegionalIndexable(item.slug,city))
    .map(item=>({href:`/regional/${item.slug}/${city.slug}`,label:item.label,note:`Regional Panchang for ${city.name}`}));
}

export function primaryMuhuratLinks(city:City,year:number,month:string,currentEvent?:string):TopicalGraphLink[]{
  return primaryMuhuratEvents
    .filter(event=>event!==currentEvent&&isMuhuratIndexable(event,city.slug))
    .map(event=>({href:`/muhurat/${event}/${year}/${month}/${city.slug}`,label:eventLabels[event]??event.replaceAll("-"," "),note:`${eventLabels[event]??event} for ${city.name}`}));
}

export function buildDailyTopicalGraph(city:City,date:Date,festival:Festival):TopicalGraphGroup[]{
  const prev=new Date(date);prev.setUTCDate(prev.getUTCDate()-1);
  const next=new Date(date);next.setUTCDate(next.getUTCDate()+1);
  const {year,month}=monthPathParts(date);
  const peers=indexedPeerCities(city);
  const regional=regionalLinksForCity(city);

  return [
    {title:"Navigate the day",description:"Move through nearby dates and the monthly calendar.",links:[
      {href:`/panchang/${city.slug}/${iso(prev)}`,label:"Previous day"},
      {href:`/calendar/${city.slug}/${year}/${month}`,label:`${city.name} monthly calendar`},
      {href:`/panchang/${city.slug}/${iso(next)}`,label:"Next day"}
    ]},
    {title:"Timing tools",description:"Use the same local solar context for practical timing.",links:[
      {href:`/tools/choghadiya/${city.slug}`,label:`Today's Choghadiya in ${city.name}`},
      ...regional
    ]},
    {title:"Plan important moments",description:"Event pages use the same city-local Panchang engine.",links:primaryMuhuratLinks(city,year,month)},
    {title:"Next festival",description:"Continue from the daily Panchang into the upcoming festival context.",links:[
      {href:`/festivals/${festival.slug}/${festival.year}/${city.slug}`,label:`${festival.name} ${festival.year} in ${city.name}`}
    ]},
    {title:`More ${city.state} and priority cities`,description:"Comparable local Panchang pages on the same date.",links:peers.map(peer=>({href:`/panchang/${peer.slug}/${iso(date)}`,label:peer.name,note:`${iso(date)} Panchang in ${peer.name}`}))}
  ];
}

export function buildCalendarTopicalGraph(city:City,year:number,month:number,keyDates:{date:string;tithi:string}[]):TopicalGraphGroup[]{
  const monthSlug=pad(month);
  const peers=indexedPeerCities(city);
  const festivals=festivalsForYear(year).filter(f=>Number(f.date.slice(5,7))===month).slice(0,4);
  const regional=regionalLinksForCity(city);
  return [
    {title:"Key lunar dates",description:"Jump from the monthly view into high-intent daily Panchang pages.",links:keyDates.slice(0,4).map(item=>({href:`/panchang/${city.slug}/${item.date}`,label:`${item.tithi} · ${item.date}`}))},
    {title:"Muhurat this month",description:"Ranked city-specific planning dates for primary events.",links:primaryMuhuratLinks(city,year,monthSlug)},
    {title:"Festivals this month",description:"Open local festival Panchang and Puja timing pages.",links:festivals.map(f=>({href:`/festivals/${f.slug}/${year}/${city.slug}`,label:f.name}))},
    {title:"Local timing & regional",description:"Keep the same city context across utility and regional pages.",links:[{href:`/tools/choghadiya/${city.slug}`,label:`Choghadiya in ${city.name}`},...regional]},
    {title:"Compare priority cities",description:"Monthly calendars for other actively indexed cities.",links:peers.map(peer=>({href:`/calendar/${peer.slug}/${year}/${monthSlug}`,label:peer.name}))}
  ];
}

export function buildFestivalTopicalGraph(city:City,festival:Festival):TopicalGraphGroup[]{
  const month=festival.date.slice(5,7);
  const peers=indexedPeerCities(city);
  const related=festival.relatedMuhurat&&isMuhuratIndexable(festival.relatedMuhurat,city.slug)
    ? [{href:`/muhurat/${festival.relatedMuhurat}/${festival.year}/${month}/${city.slug}`,label:`Related ${eventLabels[festival.relatedMuhurat]??festival.relatedMuhurat.replaceAll("-"," ")}`}]
    : [];
  return [
    {title:"Festival date context",description:"Open the exact local Panchang and its monthly calendar.",links:[
      {href:`/panchang/${city.slug}/${festival.date}`,label:`Full Panchang · ${festival.date}`},
      {href:`/calendar/${city.slug}/${festival.year}/${month}`,label:`${city.name} calendar · ${month}/${festival.year}`}
    ]},
    {title:"Related planning",description:"Only indexable primary Muhurat clusters are linked for PageRank.",links:related},
    {title:"Local timing & regional",description:"Explore the same city's timing and regional context.",links:[
      {href:`/tools/choghadiya/${city.slug}`,label:`Today's Choghadiya in ${city.name}`},
      ...regionalLinksForCity(city)
    ]},
    {title:"Festival in other priority cities",description:"Equivalent local festival pages in actively indexed cities.",links:peers.map(peer=>({href:`/festivals/${festival.slug}/${festival.year}/${peer.slug}`,label:peer.name}))}
  ];
}

export function buildChoghadiyaTopicalGraph(city:City,date:Date):TopicalGraphGroup[]{
  const {year,month}=monthPathParts(date);
  const peers=indexedPeerCities(city);
  return [
    {title:"Today's Panchang",description:"Move from the timing tool to the full local daily context.",links:[
      {href:`/panchang/${city.slug}/${iso(date)}`,label:`Full Panchang in ${city.name}`},
      {href:`/calendar/${city.slug}/${year}/${month}`,label:`${city.name} monthly calendar`}
    ]},
    {title:"Plan important moments",description:"Use the same city-local timing engine for Muhurat planning.",links:primaryMuhuratLinks(city,year,month)},
    {title:"Regional Panchang",description:"Available indexed regional calendars for this city.",links:regionalLinksForCity(city)},
    {title:"Choghadiya in other priority cities",description:"Compare today's local solar timing across active cities.",links:peers.map(peer=>({href:`/tools/choghadiya/${peer.slug}`,label:peer.name}))}
  ];
}

export function buildRegionalTopicalGraph(city:City,language:string,date:Date):TopicalGraphGroup[]{
  const {year,month}=monthPathParts(date);
  const otherRegional=regionalLinksForCity(city).filter(link=>!link.href.includes(`/regional/${language}/`));
  return [
    {title:"Core local Panchang",description:"Return to the English daily and monthly city pages.",links:[
      {href:`/panchang/${city.slug}/${iso(date)}`,label:`English Daily Panchang · ${city.name}`},
      {href:`/calendar/${city.slug}/${year}/${month}`,label:`Monthly calendar · ${city.name}`},
      {href:`/tools/choghadiya/${city.slug}`,label:`Today's Choghadiya · ${city.name}`}
    ]},
    {title:"Other regional calendars",description:"Only relevant indexed language variants are surfaced.",links:otherRegional},
    {title:"Muhurat this month",description:"Primary planning pages using the same city-local calculations.",links:primaryMuhuratLinks(city,year,month)}
  ];
}

export function buildMuhuratTopicalGraph(city:City,event:string,year:number,month:number):TopicalGraphGroup[]{
  const monthSlug=pad(month);
  const peers=indexedPeerCities(city);
  const festivals=festivalsForYear(year).filter(f=>Number(f.date.slice(5,7))===month).slice(0,4);
  const peerLinks=isMuhuratIndexable(event,city.slug)
    ? peers.filter(peer=>isMuhuratIndexable(event,peer.slug)).map(peer=>({href:`/muhurat/${event}/${year}/${monthSlug}/${peer.slug}`,label:peer.name}))
    : [];
  return [
    {title:"Local Panchang context",description:"Connect the planning shortlist back to its daily and monthly calculation sources.",links:[
      {href:`/panchang/${city.slug}`,label:`Today's Panchang · ${city.name}`},
      {href:`/calendar/${city.slug}/${year}/${monthSlug}`,label:`${city.name} calendar · ${monthSlug}/${year}`},
      {href:`/tools/choghadiya/${city.slug}`,label:`Today's Choghadiya · ${city.name}`}
    ]},
    {title:"Other primary Muhurat",description:"Adjacent planning intents for the same city and month.",links:primaryMuhuratLinks(city,year,monthSlug,event)},
    {title:"Festivals this month",description:"Relevant festival pages using the same local Panchang context.",links:festivals.map(f=>({href:`/festivals/${f.slug}/${year}/${city.slug}`,label:f.name}))},
    {title:"Compare priority cities",description:"Equivalent event pages in other actively indexed cities.",links:peerLinks}
  ];
}
