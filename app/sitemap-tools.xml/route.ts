import { cities } from "@/lib/cities";
import { nakshatraNaming } from "@/lib/baby-names";
import { phase1PriorityCities } from "@/lib/seo-policy";
import { urlset, xml } from "@/lib/xml";

export async function GET() {
  const urls=[
    "https://panchvani.com/tools",
    "https://panchvani.com/tools/moon-sign-calculator",
    "https://panchvani.com/tools/nakshatra-finder",
    "https://panchvani.com/tools/rahu-kalam-calculator",
    ...nakshatraNaming.map(n=>"https://panchvani.com/tools/hindu-baby-names/"+n.slug),
    ...cities.filter(c=>phase1PriorityCities.includes(c.slug as any)).map(c=>"https://panchvani.com/tools/choghadiya/"+c.slug)
  ];
  return xml(urlset(urls));
}
