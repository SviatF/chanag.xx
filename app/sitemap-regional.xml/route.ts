import { cities } from "@/lib/cities";
import { urlset, xml } from "@/lib/xml";
import { phase1PriorityCities } from "@/lib/seo-policy";
export async function GET() {
  const langs = ["bengali","tamil","malayalam","gujarati","marathi"];
  const urls:string[] = [];
  const code:Record<string,string>={bengali:"bn",tamil:"ta",malayalam:"ml",gujarati:"gu",marathi:"mr"};
  for (const lang of langs) for (const city of cities.filter(city=>phase1PriorityCities.includes(city.slug as any))) {
    if(city.language.includes(code[lang])) urls.push("https://panchvani.com/regional/" + lang + "/" + city.slug);
  }
  return xml(urlset(urls));
}
