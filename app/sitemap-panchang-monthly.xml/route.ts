import { cities } from "@/lib/cities";
import { urlset, xml } from "@/lib/xml";
import { phase1PriorityCities } from "@/lib/seo-policy";
export async function GET() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return xml(urlset(cities.filter(c=>phase1PriorityCities.includes(c.slug as any)).map((c) => "https://panchvani.com/calendar/" + c.slug + "/" + y + "/" + m)));
}
