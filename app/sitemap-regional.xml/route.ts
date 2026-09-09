import { cities } from "@/lib/cities";
import { urlset, xml } from "@/lib/xml";
export async function GET() {
  const langs = ["bengali","tamil","malayalam","gujarati","marathi"];
  const urls:string[] = [];
  for (const lang of langs) for (const city of cities.slice(0, 20)) {
    urls.push("https://panchang.in/regional/" + lang + "/" + city.slug);
  }
  return xml(urlset(urls));
}
