import {isRegionalIndexable} from "@/lib/seo-policy";
import {sitemapPriorityCities} from "@/lib/seo-sitemap";
import {urlset,xml} from "@/lib/xml";

const languages=["bengali","tamil","malayalam","gujarati","marathi"];

export async function GET(){
  const urls:string[]=[];
  for(const language of languages){
    for(const city of sitemapPriorityCities){
      if(isRegionalIndexable(language,city))urls.push(`https://panchvani.com/regional/${language}/${city.slug}`);
    }
  }
  return xml(urlset(urls));
}
