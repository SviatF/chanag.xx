import {urlset,xml} from "@/lib/xml";
import {
  regionalCitiesForLanguage,
  regionalIntentLinksForCity,
  regionalLanguageSlugs,
} from "@/lib/regional-seo";

export async function GET(){
  const base="https://panchvani.com";
  const urls:string[]=[`${base}/regional`];
  for(const language of regionalLanguageSlugs){
    urls.push(`${base}/regional/${language}`);
    for(const city of regionalCitiesForLanguage(language)){
      urls.push(`${base}/regional/${language}/${city.slug}`);
      for(const item of regionalIntentLinksForCity(language,city))urls.push(`${base}${item.href}`);
    }
  }
  return xml(urlset([...new Set(urls)]));
}
