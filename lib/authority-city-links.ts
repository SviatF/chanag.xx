import {festivalPageIsIndexable} from "./festival-expansion";
import {isMonthlyMuhuratIndexable,isVratIndexable,isYearlyCalendarIndexable} from "./seo-policy";
import {sitemapPriorityCities} from "./seo-sitemap";

export type AuthorityCityLink={
  slug:string;
  name:string;
  state:string;
  href:string;
};

function link(slug:string,name:string,state:string,href:string):AuthorityCityLink{
  return {slug,name,state,href};
}

export function cityYearAuthorityLinks(year:number):AuthorityCityLink[]{
  return sitemapPriorityCities
    .filter(city=>isYearlyCalendarIndexable(year,city.slug))
    .map(city=>link(city.slug,city.name,city.state,`/calendar/${city.slug}/${year}`));
}

export function festivalCityAuthorityLinks(festival:string,year:number):AuthorityCityLink[]{
  if(!festivalPageIsIndexable(festival,year))return [];
  return sitemapPriorityCities.map(city=>
    link(city.slug,city.name,city.state,`/festivals/${festival}/${year}/${city.slug}`)
  );
}

export function muhuratCityAuthorityLinks(event:string,year:number,month:number):AuthorityCityLink[]{
  const monthSlug=String(month).padStart(2,"0");
  return sitemapPriorityCities
    .filter(city=>isMonthlyMuhuratIndexable(event,year,month,city.slug))
    .map(city=>link(city.slug,city.name,city.state,`/muhurat/${event}/${year}/${monthSlug}/${city.slug}`));
}

export function vratCityAuthorityLinks(vrat:string,year:number):AuthorityCityLink[]{
  return sitemapPriorityCities
    .filter(city=>isVratIndexable(vrat,year,city.slug))
    .map(city=>link(city.slug,city.name,city.state,`/vrat/${vrat}/${year}/${city.slug}`));
}
