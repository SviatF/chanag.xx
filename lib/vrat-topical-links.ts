import type {City} from "./cities";
import {supportedCities} from "./cities";
import {activeIndexCitySlugs,isVratIndexable,primaryVratTypes} from "./seo-policy";
import type {TopicalGraphGroup} from "./topical-types";
import {vratDefinitions,type VratOccurrence,type VratSlug} from "./vrat";

function activeCities(){
  const active=new Set(activeIndexCitySlugs());
  return supportedCities.filter(city=>active.has(city.slug));
}

function peerCities(city:City,limit=4){
  const peers=activeCities().filter(item=>item.slug!==city.slug);
  return [...peers.filter(item=>item.state===city.state),...peers.filter(item=>item.state!==city.state)].slice(0,limit);
}

export function buildVratTopicalGraph(
  city:City,
  vrat:VratSlug,
  year:number,
  rows:VratOccurrence[],
  scope:"baseline"|"city"="city"
):TopicalGraphGroup[]{
  const monthLinks=[...new Set(rows.map(item=>item.date.slice(0,7)))].slice(0,6).map(value=>{
    const [y,m]=value.split("-");
    return {href:`/calendar/${city.slug}/${y}/${m}`,label:`${city.name} calendar · ${m}/${y}`};
  });
  const dateLinks=rows.slice(0,6).map(item=>({href:`/panchang/${city.slug}/${item.date}`,label:`${item.date} · ${item.paksha} ${item.tithi}`}));
  const siblingLinks=primaryVratTypes.filter(slug=>slug!==vrat&&isVratIndexable(slug,year,scope==="city"?city.slug:undefined)).map(slug=>({
    href:scope==="city"?`/vrat/${slug}/${year}/${city.slug}`:`/vrat/${slug}/${year}`,
    label:`${vratDefinitions[slug].name} ${year}`
  }));
  const comparisonLinks=scope==="city"
    ? peerCities(city).filter(peer=>isVratIndexable(vrat,year,peer.slug)).map(peer=>({href:`/vrat/${vrat}/${year}/${peer.slug}`,label:peer.name}))
    : activeCities().filter(peer=>isVratIndexable(vrat,year,peer.slug)).slice(0,8).map(peer=>({href:`/vrat/${vrat}/${year}/${peer.slug}`,label:peer.name}));

  return [
    {title:"Exact Panchang dates",description:"Open the full city Panchang for individual sunrise observations.",links:dateLinks},
    {title:"Monthly context",description:"Review the surrounding lunar month and adjacent Tithi dates.",links:monthLinks},
    {title:"Other lunar observances",description:"Move between the three core yearly lunar-reference clusters.",links:siblingLinks},
    {title:scope==="city"?"Compare priority cities":"Local city calendars",description:"Equivalent sunrise-based references in actively indexed cities.",links:comparisonLinks}
  ];
}
