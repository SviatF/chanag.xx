import type {City} from "./cities";
import {supportedCities} from "./cities";
import type {Festival} from "./festivals";
import {festivalsForYear} from "./festivals";
import {knowledgeGraphLinks} from "./panchang-knowledge";
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

export function buildDailyTopicalGraph(city:City,date:Date,festival:Festival|null):TopicalGraphGroup[]{
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
    {title:"Understand today's values",description:"Read clear guides to the Panchang factors shown above.",links:knowledgeGraphLinks()},
    {title:"Plan important moments",description:"Review general Muhurat candidate pages using the same city-local Panchang engine.",links:primaryMuhuratLinks(city,year,month)},
    {title:"Next festival",description:"Continue from the daily Panchang into the next maintained festival page.",links:festival?[{href:`/festivals/${festival.slug}/${festival.year}/${city.slug}`,label:`${festival.name} ${festival.year} in ${city.name}`}]:[]},
    {title:`More ${city.state} and popular cities`,description:"Compare local Panchang pages on the same date.",links:peers.map(peer=>({href:`/panchang/${peer.slug}/${iso(date)}`,label:peer.name,note:`${iso(date)} Panchang in ${peer.name}`}))}
  ];
}

export function buildCalendarTopicalGraph(city:City,year:number,month:number,keyDates:{date:string;tithi:string}[]):TopicalGraphGroup[]{
  const monthSlug=pad(month);
  const peers=indexedPeerCities(city);
  const festivals=festivalsForYear(year).filter(f=>Number(f.date.slice(5,7))===month).slice(0,4);
  const regional=regionalLinksForCity(city);
  return [
    {title:"Key lunar dates",description:"Open daily Panchang pages for important lunar dates in this month.",links:keyDates.slice(0,4).map(item=>({href:`/panchang/${city.slug}/${item.date}`,label:`${item.tithi} · ${item.date}`}))},
    {title:"Calendar concepts",description:"Understand the lunar day, fortnight and month layers behind this calendar.",links:knowledgeGraphLinks(["panchang","tithi","paksha","hindu-months"])},
    {title:"Muhurat this month",description:"General city-specific planning candidates for major milestones.",links:primaryMuhuratLinks(city,year,monthSlug)},
    {title:"Festivals this month",description:"Open local festival pages with Panchang and observance context.",links:festivals.map(f=>({href:`/festivals/${f.slug}/${year}/${city.slug}`,label:f.name}))},
    {title:"Local timing & regional",description:"Keep the same city context across timing tools and regional Panchang pages.",links:[{href:`/tools/choghadiya/${city.slug}`,label:`Choghadiya in ${city.name}`},...regional]},
    {title:"Compare popular cities",description:"Monthly calendars for other major city pages.",links:peers.map(peer=>({href:`/calendar/${peer.slug}/${year}/${monthSlug}`,label:peer.name}))}
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
    {title:"Related planning",description:"Explore a relevant Muhurat planning page for the same month when available.",links:related},
    {title:"Local timing & regional",description:"Explore the same city's timing and regional calendar context.",links:[
      {href:`/tools/choghadiya/${city.slug}`,label:`Today's Choghadiya in ${city.name}`},
      ...regionalLinksForCity(city)
    ]},
    {title:"Festival in other cities",description:"Compare the same festival's local Panchang context in other major cities.",links:peers.map(peer=>({href:`/festivals/${festival.slug}/${festival.year}/${peer.slug}`,label:peer.name}))}
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
    {title:"Plan important moments",description:"Review general Muhurat candidates using the same city-local calculations.",links:primaryMuhuratLinks(city,year,month)},
    {title:"Regional Panchang",description:"Open available regional-language Panchang pages for this city.",links:regionalLinksForCity(city)},
    {title:"Choghadiya in other cities",description:"Compare today's local solar timing across major cities.",links:peers.map(peer=>({href:`/tools/choghadiya/${peer.slug}`,label:peer.name}))}
  ];
}

export function buildRegionalTopicalGraph(city:City,language:string,date:Date):TopicalGraphGroup[]{
  const {year,month}=monthPathParts(date);
  const otherRegional=regionalLinksForCity(city).filter(link=>!link.href.includes(`/regional/${language}/`));
  return [
    {title:"Core local Panchang",description:"Open the English daily and monthly city pages.",links:[
      {href:`/panchang/${city.slug}/${iso(date)}`,label:`English Daily Panchang · ${city.name}`},
      {href:`/calendar/${city.slug}/${year}/${month}`,label:`Monthly calendar · ${city.name}`},
      {href:`/tools/choghadiya/${city.slug}`,label:`Today's Choghadiya · ${city.name}`}
    ]},
    {title:"Other regional calendars",description:"Open other available language variants for this city.",links:otherRegional},
    {title:"Muhurat this month",description:"General planning pages using the same city-local calculations.",links:primaryMuhuratLinks(city,year,month)}
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
    {title:"Other Muhurat planning",description:"Explore other major planning categories for the same city and month.",links:primaryMuhuratLinks(city,year,monthSlug,event)},
    {title:"Festivals this month",description:"Open maintained festival pages using the same local Panchang context.",links:festivals.map(f=>({href:`/festivals/${f.slug}/${year}/${city.slug}`,label:f.name}))},
    {title:"Compare other cities",description:"Compare the same planning category in other major cities.",links:peerLinks}
  ];
}
