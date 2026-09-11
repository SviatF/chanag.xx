export type LiveSitemapFeed={name:string;url:string;urls:number;ok:boolean;error:string|null};
export type LiveSitemapSnapshot={totalUrls:number;feeds:LiveSitemapFeed[];okFeeds:number;failedFeeds:number;checkedAt:string};

const BASE="https://panchvani.com";

function extractLocs(xml:string){
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match=>match[1]?.trim()).filter((value):value is string=>Boolean(value));
}

export async function getLiveSitemapSnapshot():Promise<LiveSitemapSnapshot>{
  const checkedAt=new Date().toISOString();
  const indexResponse=await fetch(`${BASE}/sitemap.xml`,{cache:"no-store",headers:{accept:"application/xml,text/xml;q=0.9,*/*;q=0.8"}});
  if(!indexResponse.ok)throw new Error(`Sitemap index returned HTTP ${indexResponse.status}.`);
  const indexXml=await indexResponse.text();
  const sitemapUrls=extractLocs(indexXml);
  if(!sitemapUrls.length)throw new Error("Sitemap index contains no child sitemap URLs.");

  const results=await Promise.allSettled(sitemapUrls.map(async url=>{
    const response=await fetch(url,{cache:"no-store",headers:{accept:"application/xml,text/xml;q=0.9,*/*;q=0.8"}});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const body=await response.text();
    return {name:new URL(url).pathname.replace(/^\//,""),url,urls:extractLocs(body).length,ok:true,error:null} satisfies LiveSitemapFeed;
  }));

  const feeds:LiveSitemapFeed[]=results.map((result,index)=>result.status==="fulfilled"
    ?result.value
    :{name:new URL(sitemapUrls[index]).pathname.replace(/^\//,""),url:sitemapUrls[index],urls:0,ok:false,error:result.reason instanceof Error?result.reason.message:"Unable to fetch sitemap"});

  return {
    totalUrls:feeds.reduce((sum,feed)=>sum+feed.urls,0),
    feeds,
    okFeeds:feeds.filter(feed=>feed.ok).length,
    failedFeeds:feeds.filter(feed=>!feed.ok).length,
    checkedAt,
  };
}
