import {knowledgePagePath,knowledgeTopicSlugs} from "@/lib/panchang-knowledge";
import {urlset,xml} from "@/lib/xml";

export async function GET(){
  const base="https://panchvani.com";
  return xml(urlset([`${base}/knowledge`,...knowledgeTopicSlugs.map(slug=>`${base}${knowledgePagePath(slug)}`)]));
}
