import {getGoldRateDataset,goldRateSitemapUrls} from "@/lib/gold-rate";
import {urlset,xml} from "@/lib/xml";

export async function GET(){
  const dataset=await getGoldRateDataset();
  return xml(urlset(goldRateSitemapUrls(dataset)));
}
