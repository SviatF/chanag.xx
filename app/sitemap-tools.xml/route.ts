import {nakshatraNaming} from "@/lib/baby-names";
import {sitemapPriorityCities} from "@/lib/seo-sitemap";
import {expandedToolPath,expandedToolSlugs} from "@/lib/tool-expansion";
import {urlset,xml} from "@/lib/xml";

export async function GET(){
  const base="https://panchvani.com";
  const urls=[
    `${base}/tools`,
    `${base}/tools/moon-sign-calculator`,
    `${base}/tools/nakshatra-finder`,
    `${base}/tools/rahu-kalam-calculator`,
    ...expandedToolSlugs.map(slug=>`${base}${expandedToolPath(slug)}`),
    ...nakshatraNaming.map(n=>`${base}/tools/hindu-baby-names/${n.slug}`),
    ...sitemapPriorityCities.map(c=>`${base}/tools/choghadiya/${c.slug}`)
  ];
  return xml(urlset([...new Set(urls)]));
}
