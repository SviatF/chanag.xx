import {festivalsByYear,festivalsForYear} from "@/lib/festivals";
import {sitemapPriorityCities} from "@/lib/seo-sitemap";
import {urlset,xml} from "@/lib/xml";

export async function GET(){
  const base="https://panchvani.com";
  const years=Object.keys(festivalsByYear).map(Number).sort((a,b)=>a-b);
  const urls:string[]=[base+"/festivals",...years.map(year=>`${base}/festivals-calendar/${year}`)];

  for(const year of years){
    for(const festival of festivalsForYear(year)){
      urls.push(`${base}/festivals/${festival.slug}/${year}`);
      for(const city of sitemapPriorityCities){
        urls.push(`${base}/festivals/${festival.slug}/${year}/${city.slug}`);
      }
    }
  }

  return xml(urlset(urls));
}
