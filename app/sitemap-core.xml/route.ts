import {sitemapFreshnessDates} from "@/lib/sitemap-freshness";
import {urlset,xml} from "@/lib/xml";

export async function GET(){
  const base="https://panchvani.com";
  const {today}=sitemapFreshnessDates();
  return xml(urlset([
    {loc:base+"/",lastmod:today},
    base+"/cities",
    base+"/regional",
    base+"/muhurat",
    base+"/about",
    base+"/methodology",
    base+"/accuracy",
    base+"/data-sources",
    base+"/editorial-policy",
    base+"/corrections",
    base+"/disclaimer",
    base+"/photo-credits"
  ]));
}
