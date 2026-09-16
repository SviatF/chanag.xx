import {urlset,xml} from "@/lib/xml";
import {isMonthlyIndexable} from "@/lib/seo-policy";
import {indexableCalendarMonths,sitemapPriorityCities} from "@/lib/seo-sitemap";

export async function GET(){
  const urls:string[]=[];
  for(const city of sitemapPriorityCities){
    for(const item of indexableCalendarMonths()){
      if(isMonthlyIndexable(city.slug,item.year,item.month))urls.push(`https://panchvani.com/calendar/${city.slug}/${item.year}/${item.slug}`);
    }
  }
  return xml(urlset(urls));
}
