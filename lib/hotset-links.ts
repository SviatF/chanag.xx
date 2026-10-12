import {allFestivals,type Festival} from "./festivals";
import {festivalPageIsIndexable} from "./festival-expansion";
import {primaryMuhuratEvents,primaryVratTypes} from "./seo-policy";
import {sitemapPriorityCities} from "./seo-sitemap";
import {todayInIndia} from "./dates";

export type HotsetCityLink={
  slug:string;
  name:string;
  state:string;
  href:string;
};

export type CityHotsetRow={
  slug:string;
  name:string;
  state:string;
  todayHref:string;
  monthHref:string;
  yearHref:string;
};

function monthSlug(reference:Date){return String(reference.getUTCMonth()+1).padStart(2,"0");}
function isoDay(reference:Date){return reference.toISOString().slice(0,10);}

export function currentCityHotset(reference:Date=todayInIndia()):CityHotsetRow[]{
  const day=isoDay(reference);
  const year=reference.getUTCFullYear();
  const month=monthSlug(reference);
  return sitemapPriorityCities.map(city=>({
    slug:city.slug,
    name:city.name,
    state:city.state,
    todayHref:`/panchang/${city.slug}/${day}`,
    monthHref:`/calendar/${city.slug}/${year}/${month}`,
    yearHref:`/calendar/${city.slug}/${year}`,
  }));
}

export function currentMuhuratHotset(reference:Date=todayInIndia()){
  const year=reference.getUTCFullYear();
  const month=monthSlug(reference);
  return primaryMuhuratEvents.map(event=>({
    event,
    parentHref:`/muhurat/${event}/${year}/${month}`,
    cityLinks:sitemapPriorityCities.map(city=>({
      slug:city.slug,
      name:city.name,
      state:city.state,
      href:`/muhurat/${event}/${year}/${month}/${city.slug}`,
    } satisfies HotsetCityLink))
  }));
}

export function currentVratHotset(reference:Date=todayInIndia()){
  const year=reference.getUTCFullYear();
  return primaryVratTypes.map(vrat=>({
    vrat,
    parentHref:`/vrat/${vrat}/${year}`,
    cityLinks:sitemapPriorityCities.map(city=>({
      slug:city.slug,
      name:city.name,
      state:city.state,
      href:`/vrat/${vrat}/${year}/${city.slug}`,
    } satisfies HotsetCityLink))
  }));
}

export function upcomingFestivalHotset(reference:Date=todayInIndia(),limit=2){
  const day=isoDay(reference);
  return allFestivals
    .filter(item=>item.date>=day&&festivalPageIsIndexable(item.slug,item.year))
    .slice(0,limit)
    .map((festival:Festival)=>({
      festival,
      parentHref:`/festivals/${festival.slug}/${festival.year}`,
      cityLinks:sitemapPriorityCities.map(city=>({
        slug:city.slug,
        name:city.name,
        state:city.state,
        href:`/festivals/${festival.slug}/${festival.year}/${city.slug}`,
      } satisfies HotsetCityLink))
    }));
}

export function homepageHotset(reference:Date=todayInIndia(),citySlug="mumbai"){
  const year=reference.getUTCFullYear();
  const month=monthSlug(reference);
  const day=isoDay(reference);
  const city=sitemapPriorityCities.find(item=>item.slug===citySlug)??sitemapPriorityCities[0];
  const nextFestivals=upcomingFestivalHotset(reference,2);
  return [
    {label:`${city.name} today`,href:`/panchang/${city.slug}/${day}`},
    {label:`${city.name} ${year} calendar`,href:`/calendar/${city.slug}/${year}`},
    {label:`${city.name} current month`,href:`/calendar/${city.slug}/${year}/${month}`},
    ...primaryMuhuratEvents.map(event=>({label:`${event} this month`,href:`/muhurat/${event}/${year}/${month}`})),
    ...primaryVratTypes.map(vrat=>({label:`${vrat} ${year}`,href:`/vrat/${vrat}/${year}`})),
    ...nextFestivals.map(item=>({label:item.festival.name,href:item.parentHref}))
  ];
}
