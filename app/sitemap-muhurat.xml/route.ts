import { cities } from "@/lib/cities";
import { muhuratRules } from "@/lib/muhurat";
import { urlset, xml } from "@/lib/xml";
import { phase1PriorityCities, primaryMuhuratEvents } from "@/lib/seo-policy";
export async function GET() {
  const urls:string[] = [];
  for (const event of Object.keys(muhuratRules).filter(event=>primaryMuhuratEvents.includes(event as any))) {
    urls.push("https://panchang.in/muhurat/" + event + "/2026/09");
    for (const city of cities.filter(city=>phase1PriorityCities.includes(city.slug as any))) {
      urls.push("https://panchang.in/muhurat/" + event + "/2026/09/" + city.slug);
    }
  }
  return xml(urlset(urls));
}
