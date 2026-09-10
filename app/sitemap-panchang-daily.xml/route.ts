import {urlset,xml} from "@/lib/xml";
import {isDailyIndexable} from "@/lib/seo-policy";
import {rollingDailyDates,sitemapPriorityCities} from "@/lib/seo-sitemap";

export async function GET(){
  const urls:string[]=[];
  for(const city of sitemapPriorityCities){
    for(const date of rollingDailyDates(14,45)){
      if(isDailyIndexable(city.slug,date))urls.push(`https://panchvani.com/panchang/${city.slug}/${date}`);
    }
  }
  return xml(urlset(urls));
}
