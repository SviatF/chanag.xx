import {urlset,xml} from "@/lib/xml";

export async function GET(){
  const base="https://panchvani.com";
  return xml(urlset([
    base+"/",
    base+"/cities",
    base+"/regional",
    base+"/about",
    base+"/methodology",
    base+"/accuracy",
    base+"/data-sources",
    base+"/editorial-policy",
    base+"/corrections",
    base+"/disclaimer",
    base+"/photo-credits"
  ]));
}
