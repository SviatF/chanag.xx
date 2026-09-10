import {festivalsForYear} from "@/lib/festivals";
import {festivalIndexYears,festivalPageIsIndexable} from "@/lib/festival-expansion";
import {sitemapPriorityCities} from "@/lib/seo-sitemap";
import {urlset,xml} from "@/lib/xml";

export async function GET(){
  const base="https://panchvani.com";
  const years=festivalIndexYears();
  const urls:string[]=[base+"/festivals",...years.map(year=>`${base}/festivals-calendar/${year}`)];

  for(const year of years){
    for(const festival of festivalsForYear(year)){
      if(!festivalPageIsIndexable(festival.slug,year))continue;
      urls.push(`${base}/festivals/${festival.slug}/${year}`);
      for(const city of sitemapPriorityCities){
        urls.push(`${base}/festivals/${festival.slug}/${year}/${city.slug}`);
      }
    }
  }

  return xml(urlset(urls));
}
