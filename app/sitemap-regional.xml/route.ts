import {urlset,xml} from "@/lib/xml";
import {
  regionalCitiesForLanguage,
  regionalIntentLinksForCity,
  regionalLanguageSlugs,
} from "@/lib/regional-seo";

export async function GET(){
  const base="https://panchvani.com";
  const urls:string[]=[];
  for(const language of regionalLanguageSlugs){
    const cities=regionalCitiesForLanguage(language);
    if(!cities.length)continue;
    urls.push(`${base}/regional/${language}`);
    for(const city of cities){
      urls.push(`${base}/regional/${language}/${city.slug}`);
      for(const item of regionalIntentLinksForCity(language,city))urls.push(`${base}${item.href}`);
    }
  }
  return xml(urlset([...new Set(urls)]));
}
