import {GET as getCoreSitemap} from "@/app/sitemap-core.xml/route";
import {GET as getFestivalsSitemap} from "@/app/sitemap-festivals.xml/route";
import {GET as getKnowledgeSitemap} from "@/app/sitemap-knowledge.xml/route";
import {GET as getMuhuratSitemap} from "@/app/sitemap-muhurat.xml/route";
import {GET as getDailySitemap} from "@/app/sitemap-panchang-daily.xml/route";
import {GET as getMonthlySitemap} from "@/app/sitemap-panchang-monthly.xml/route";
import {GET as getRegionalSitemap} from "@/app/sitemap-regional.xml/route";
import {GET as getToolsSitemap} from "@/app/sitemap-tools.xml/route";
import {GET as getVratSitemap} from "@/app/sitemap-vrat.xml/route";
import {GET as getYearlySitemap} from "@/app/sitemap-yearly.xml/route";

export type LiveSitemapFeed={name:string;url:string;urls:number;items:string[];ok:boolean;error:string|null};
export type LiveSitemapSnapshot={totalUrls:number;allUrls:string[];feeds:LiveSitemapFeed[];okFeeds:number;failedFeeds:number;checkedAt:string};

const BASE="https://panchvani.com";

const LOCAL_FEEDS=[
  ["sitemap-core.xml",getCoreSitemap],
  ["sitemap-festivals.xml",getFestivalsSitemap],
  ["sitemap-knowledge.xml",getKnowledgeSitemap],
  ["sitemap-muhurat.xml",getMuhuratSitemap],
  ["sitemap-panchang-daily.xml",getDailySitemap],
  ["sitemap-panchang-monthly.xml",getMonthlySitemap],
  ["sitemap-regional.xml",getRegionalSitemap],
  ["sitemap-tools.xml",getToolsSitemap],
  ["sitemap-vrat.xml",getVratSitemap],
  ["sitemap-yearly.xml",getYearlySitemap],
] as const;

function extractLocs(xml:string){
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match=>match[1]?.trim()).filter((value):value is string=>Boolean(value));
}

export async function getLiveSitemapSnapshot():Promise<LiveSitemapSnapshot>{
  const checkedAt=new Date().toISOString();
  const results=await Promise.allSettled(LOCAL_FEEDS.map(async ([name,handler])=>{
    const response=await handler();
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const body=await response.text();
    const items=extractLocs(body);
    return {name,url:`${BASE}/${name}`,urls:items.length,items,ok:true,error:null} satisfies LiveSitemapFeed;
  }));

  const feeds:LiveSitemapFeed[]=results.map((result,index)=>{
    const name=LOCAL_FEEDS[index][0];
    return result.status==="fulfilled"
      ?result.value
      :{name,url:`${BASE}/${name}`,urls:0,items:[],ok:false,error:result.reason instanceof Error?result.reason.message:"Unable to build sitemap"};
  });
  const allUrls=[...new Set(feeds.flatMap(feed=>feed.items))];

  return {
    totalUrls:allUrls.length,
    allUrls,
    feeds,
    okFeeds:feeds.filter(feed=>feed.ok).length,
    failedFeeds:feeds.filter(feed=>!feed.ok).length,
    checkedAt,
  };
}
