import { cities } from "@/lib/cities";
import { urlset, xml } from "@/lib/xml";
import { todayInIndia } from "@/lib/dates";
import { phase1PriorityCities } from "@/lib/seo-policy";
export async function GET() {
  const today = todayInIndia().toISOString().slice(0, 10);
  return xml(urlset(cities.filter(c=>phase1PriorityCities.includes(c.slug as any)).map((c) => "https://panchvani.com/panchang/" + c.slug + "/" + today)));
}
