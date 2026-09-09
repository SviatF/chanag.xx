import { festivals2026 } from "@/lib/festivals";
import { urlset, xml } from "@/lib/xml";
export async function GET() {
  return xml(urlset(festivals2026.map((f) => "https://panchang.in/festivals/" + f.slug + "/2026")));
}
