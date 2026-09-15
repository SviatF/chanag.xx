import {nakshatraNaming} from "@/lib/baby-names";
import {sitemapFreshnessDates} from "@/lib/sitemap-freshness";
import {sitemapPriorityCities} from "@/lib/seo-sitemap";
import {expandedToolPath,expandedToolSlugs} from "@/lib/tool-expansion";
import {type SitemapUrlEntry,urlset,xml} from "@/lib/xml";

export async function GET(){
  const base="https://panchvani.com";
  const {today}=sitemapFreshnessDates();
  const urls=[
    `${base}/tools`,
    `${base}/tools/choghadiya`,
    `${base}/tools/hindu-baby-names`,
    `${base}/tools/moon-sign-calculator`,
    `${base}/tools/nakshatra-finder`,
    `${base}/tools/rahu-kalam-calculator`,
    ...expandedToolSlugs.map(slug=>`${base}${expandedToolPath(slug)}`),
    ...nakshatraNaming.map(n=>`${base}/tools/hindu-baby-names/${n.slug}`),
    ...sitemapPriorityCities.map(c=>`${base}/tools/choghadiya/${c.slug}`)
  ];
  const liveToday=new Set([
    `${base}/tools/choghadiya`,
    `${base}/tools/nakshatra-today`,
    `${base}/tools/moon-phase`,
    ...sitemapPriorityCities.map(c=>`${base}/tools/choghadiya/${c.slug}`),
  ]);
  const entries:SitemapUrlEntry[]=[...new Set(urls)].map(loc=>liveToday.has(loc)?{loc,lastmod:today}:loc);
  return xml(urlset(entries));
}
