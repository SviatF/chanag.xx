import { urlset, xml } from "@/lib/xml";
export async function GET() {
  return xml(urlset([
    "https://panchang.in/tools",
    "https://panchang.in/tools/moon-sign-calculator",
    "https://panchang.in/tools/nakshatra-finder",
    "https://panchang.in/tools/rahu-kalam-calculator",
    "https://panchang.in/tools/hindu-baby-names/ashwini"
  ]));
}
