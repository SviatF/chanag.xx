import { cities } from "@/lib/cities";
import { muhuratRules } from "@/lib/muhurat";
import { urlset, xml } from "@/lib/xml";
export async function GET() {
  const urls:string[] = [];
  for (const event of Object.keys(muhuratRules)) {
    urls.push("https://panchang.in/muhurat/" + event + "/2026/09");
    for (const city of cities.slice(0, 20)) {
      urls.push("https://panchang.in/muhurat/" + event + "/2026/09/" + city.slug);
    }
  }
  return xml(urlset(urls));
}
