import { urlset, xml } from "@/lib/xml";
export async function GET() {
  return xml(urlset(["https://panchvani.com/festivals-calendar/2026"]));
}
