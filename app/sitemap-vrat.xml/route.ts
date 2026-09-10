import {todayInIndia} from "@/lib/dates";
import {isVratIndexable} from "@/lib/seo-policy";
import {sitemapPriorityCities} from "@/lib/seo-sitemap";
import {vratSlugs} from "@/lib/vrat";
import {urlset,xml} from "@/lib/xml";

export async function GET(){
  const base="https://panchvani.com";
  const current=todayInIndia().getUTCFullYear();
  const years=[current-1,current,current+1,current+2];
  const urls:string[]=[`${base}/vrat`];

  for(const year of years){
    for(const vrat of vratSlugs){
      if(isVratIndexable(vrat,year))urls.push(`${base}/vrat/${vrat}/${year}`);
      for(const city of sitemapPriorityCities){
        if(isVratIndexable(vrat,year,city.slug))urls.push(`${base}/vrat/${vrat}/${year}/${city.slug}`);
      }
    }
  }
  return xml(urlset(urls));
}