import { cities } from "@/lib/cities";
import { urlset, xml } from "@/lib/xml";
import { todayInIndia } from "@/lib/dates";
export async function GET() {
  const today = todayInIndia().toISOString().slice(0, 10);
  return xml(urlset(cities.map((c) => "https://panchang.in/panchang/" + c.slug + "/" + today)));
}
