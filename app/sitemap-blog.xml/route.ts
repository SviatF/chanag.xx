import { urlset, xml } from "@/lib/xml";
export async function GET() {
  return xml(urlset(["https://panchang.in/festivals-calendar/2026"]));
}
