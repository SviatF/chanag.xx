import { cities } from "@/lib/cities";
import { festivalsForYear } from "@/lib/festivals";
import { phase1PriorityCities } from "@/lib/seo-policy";
import { urlset, xml } from "@/lib/xml";

export async function GET() {
  const base="https://panchvani.com";
  const priorityCities=cities.filter(city=>phase1PriorityCities.includes(city.slug as any));
  const urls:string[]=[
    base+"/festivals",
    base+"/festivals-calendar/2026",
    base+"/festivals-calendar/2027",
  ];

  for(const year of [2026,2027]){
    for(const festival of festivalsForYear(year)){
      urls.push(`${base}/festivals/${festival.slug}/${year}`);
      for(const city of priorityCities){
        urls.push(`${base}/festivals/${festival.slug}/${year}/${city.slug}`);
      }
    }
  }

  return xml(urlset(urls));
}
