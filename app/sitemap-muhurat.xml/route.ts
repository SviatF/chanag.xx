import {muhuratRules} from "@/lib/muhurat";
import {isMonthlyMuhuratIndexable,isMuhuratIndexable,primaryMuhuratEvents} from "@/lib/seo-policy";
import {rollingMonths,sitemapPriorityCities} from "@/lib/seo-sitemap";
import {urlset,xml} from "@/lib/xml";

export async function GET(){
  const urls:string[]=[];
  const months=rollingMonths(0,12);
  for(const event of Object.keys(muhuratRules).filter(event=>primaryMuhuratEvents.includes(event as any))){
    if(!isMuhuratIndexable(event))continue;
    for(const item of months){
      if(isMonthlyMuhuratIndexable(event,item.year,item.month))urls.push(`https://panchvani.com/muhurat/${event}/${item.year}/${item.slug}`);
      for(const city of sitemapPriorityCities){
        if(isMonthlyMuhuratIndexable(event,item.year,item.month,city.slug))urls.push(`https://panchvani.com/muhurat/${event}/${item.year}/${item.slug}/${city.slug}`);
      }
    }
  }
  return xml(urlset(urls));
}
