import { cities } from "@/lib/cities";
import { urlset, xml } from "@/lib/xml";
export async function GET() {
  const today = new Date().toISOString().slice(0, 10);
  return xml(urlset(cities.map((c) => "https://panchang.in/panchang/" + c.slug + "/" + today)));
}
