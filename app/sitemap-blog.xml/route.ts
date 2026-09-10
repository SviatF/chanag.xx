import {urlset,xml} from "@/lib/xml";

export async function GET(){
  return xml(urlset([]));
}
