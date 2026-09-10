import {muhuratRules} from "@/lib/muhurat";
import {isMuhuratIndexable,primaryMuhuratEvents} from "@/lib/seo-policy";
import {rollingMonths,sitemapPriorityCities} from "@/lib/seo-sitemap";
import {urlset,xml} from "@/lib/xml";

export async function GET(){
  const urls:string[]=[];
  const months=rollingMonths(0,12);
  for(const event of Object.keys(muhuratRules).filter(event=>primaryMuhuratEvents.includes(event as any))){
    if(!isMuhuratIndexable(event))continue;
    for(const item of months){
      urls.push(`https://panchvani.com/muhurat/${event}/${item.year}/${item.slug}`);
      for(const city of sitemapPriorityCities){
        if(isMuhuratIndexable(event,city.slug))urls.push(`https://panchvani.com/muhurat/${event}/${item.year}/${item.slug}/${city.slug}`);
      }
    }
  }
  return xml(urlset(urls));
}
