import { cities } from "@/lib/cities";
import { urlset, xml } from "@/lib/xml";
export async function GET() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return xml(urlset(cities.map((c) => "https://panchang.in/calendar/" + c.slug + "/" + y + "/" + m)));
}
