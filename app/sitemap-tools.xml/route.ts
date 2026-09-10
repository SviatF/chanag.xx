import {nakshatraNaming} from "@/lib/baby-names";
import {sitemapPriorityCities} from "@/lib/seo-sitemap";
import {urlset,xml} from "@/lib/xml";

export async function GET(){
  const urls=[
    "https://panchvani.com/tools",
    "https://panchvani.com/tools/moon-sign-calculator",
    "https://panchvani.com/tools/nakshatra-finder",
    "https://panchvani.com/tools/rahu-kalam-calculator",
    ...nakshatraNaming.map(n=>`https://panchvani.com/tools/hindu-baby-names/${n.slug}`),
    ...sitemapPriorityCities.map(c=>`https://panchvani.com/tools/choghadiya/${c.slug}`)
  ];
  return xml(urlset(urls));
}
