import {sitemapFeedLastmod,sitemapFeedNames} from "@/lib/sitemap-freshness";
import {sitemapindex,xml} from "@/lib/xml";

export async function GET(){
  const base="https://panchvani.com";
  return xml(sitemapindex(sitemapFeedNames.map(name=>({
    loc:`${base}/${name}`,
    lastmod:sitemapFeedLastmod(name),
  }))));
}
