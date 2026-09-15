import {festivalsForYear} from "@/lib/festivals";
import {festivalIndexYears,festivalPageIsIndexable} from "@/lib/festival-expansion";
import {festivalCityLastmod} from "@/lib/sitemap-freshness";
import {sitemapPriorityCities} from "@/lib/seo-sitemap";
import {type SitemapUrlEntry,urlset,xml} from "@/lib/xml";

export async function GET(){
  const base="https://panchvani.com";
  const years=festivalIndexYears();
  const urls:SitemapUrlEntry[]=[base+"/festivals",...years.map(year=>`${base}/festivals-calendar/${year}`)];

  for(const year of years){
    for(const festival of festivalsForYear(year)){
      if(!festivalPageIsIndexable(festival.slug,year))continue;
      urls.push(`${base}/festivals/${festival.slug}/${year}`);
      for(const city of sitemapPriorityCities){
        const path=`/festivals/${festival.slug}/${year}/${city.slug}`;
        const lastmod=festivalCityLastmod(path);
        urls.push(lastmod?{loc:`${base}${path}`,lastmod}:`${base}${path}`);
      }
    }
  }

  return xml(urlset(urls));
}
