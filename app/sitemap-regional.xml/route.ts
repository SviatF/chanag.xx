import {sitemapFreshnessDates} from "@/lib/sitemap-freshness";
import {type SitemapUrlEntry,urlset,xml} from "@/lib/xml";
import {
  regionalCitiesForLanguage,
  regionalIntentLinksForCity,
  regionalLanguageSlugs,
} from "@/lib/regional-seo";

export async function GET(){
  const base="https://panchvani.com";
  const {today}=sitemapFreshnessDates();
  const urls=new Map<string,SitemapUrlEntry>();
  for(const language of regionalLanguageSlugs){
    const cities=regionalCitiesForLanguage(language);
    if(!cities.length)continue;
    const languageHub=`${base}/regional/${language}`;
    urls.set(languageHub,languageHub);
    for(const city of cities){
      const cityHub=`${base}/regional/${language}/${city.slug}`;
      urls.set(cityHub,{loc:cityHub,lastmod:today});
      for(const item of regionalIntentLinksForCity(language,city)){
        const loc=`${base}${item.href}`;
        urls.set(loc,{loc,lastmod:today});
      }
    }
  }
  return xml(urlset([...urls.values()]));
}
