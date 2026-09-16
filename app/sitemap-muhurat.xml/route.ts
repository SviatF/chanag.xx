import {muhuratRules} from "@/lib/muhurat";
import {isMuhuratMonthIndexable,primaryMuhuratEvents} from "@/lib/seo-policy";
import {indexableMuhuratMonths,sitemapPriorityCities} from "@/lib/seo-sitemap";
import {urlset,xml} from "@/lib/xml";

export async function GET(){
  const urls:string[]=[];
  const months=indexableMuhuratMonths();
  for(const event of Object.keys(muhuratRules).filter(event=>primaryMuhuratEvents.includes(event as any))){
    for(const item of months){
      if(isMuhuratMonthIndexable(event,item.year,item.month))urls.push(`https://panchvani.com/muhurat/${event}/${item.year}/${item.slug}`);
      for(const city of sitemapPriorityCities){
        if(isMuhuratMonthIndexable(event,item.year,item.month,city.slug))urls.push(`https://panchvani.com/muhurat/${event}/${item.year}/${item.slug}/${city.slug}`);
      }
    }
  }
  return xml(urlset(urls));
}
