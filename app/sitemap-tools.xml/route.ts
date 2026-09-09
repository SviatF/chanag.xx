import { cities } from "@/lib/cities";
import { nakshatraNaming } from "@/lib/baby-names";
import { phase1PriorityCities } from "@/lib/seo-policy";
import { urlset, xml } from "@/lib/xml";

export async function GET() {
  const urls=[
    "https://panchang.in/tools",
    "https://panchang.in/tools/moon-sign-calculator",
    "https://panchang.in/tools/nakshatra-finder",
    "https://panchang.in/tools/rahu-kalam-calculator",
    ...nakshatraNaming.map(n=>"https://panchang.in/tools/hindu-baby-names/"+n.slug),
    ...cities.filter(c=>phase1PriorityCities.includes(c.slug as any)).map(c=>"https://panchang.in/tools/choghadiya/"+c.slug)
  ];
  return xml(urlset(urls));
}
