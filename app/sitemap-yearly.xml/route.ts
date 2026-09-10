import {sitemapPriorityCities} from "@/lib/seo-sitemap";
import {isYearlyCalendarIndexable,isYearlyMuhuratIndexable,primaryMuhuratEvents,yearlyIndexYears} from "@/lib/seo-policy";
import {cityCalendarYearPath,hinduCalendarYearPath,muhuratYearPath} from "@/lib/yearly-expansion";
import {urlset,xml} from "@/lib/xml";

export async function GET(){
  const base="https://panchvani.com";
  const urls:string[]=[];
  for(const year of yearlyIndexYears()){
    if(isYearlyCalendarIndexable(year))urls.push(`${base}${hinduCalendarYearPath(year)}`);
    for(const city of sitemapPriorityCities){
      if(isYearlyCalendarIndexable(year,city.slug))urls.push(`${base}${cityCalendarYearPath(city,year)}`);
    }
    for(const event of primaryMuhuratEvents){
      if(isYearlyMuhuratIndexable(event,year))urls.push(`${base}${muhuratYearPath(event,year)}`);
    }
  }
  return xml(urlset(urls));
}