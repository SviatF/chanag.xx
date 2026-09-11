import {NextResponse} from "next/server";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {getGscConnectionStatus,getGscUrlInspections} from "@/lib/gsc";
import {getOpportunityStoreStatus} from "@/lib/opportunity-store";
import {getLiveSitemapSnapshot} from "@/lib/sitemap-live";
import {mergeUrlIndexationInventory,readUrlIndexationInventory,writeUrlIndexationInventory} from "@/lib/indexation-inventory-store";

export const dynamic="force-dynamic";

const DEFAULT_BATCH=25;
const MAX_BATCH=25;
const STALE_AFTER_MS=14*24*60*60*1000;

function stale(inspectedAt:string|undefined){
  if(!inspectedAt)return true;
  const time=new Date(inspectedAt).getTime();
  return Number.isNaN(time)||Date.now()-time>STALE_AFTER_MS;
}

export async function POST(request:Request){
  if(!(await isAdminAuthenticated()))return NextResponse.json({error:"Unauthorized"},{status:401});
  const gsc=getGscConnectionStatus();
  const storage=getOpportunityStoreStatus();
  if(!gsc.configured)return NextResponse.json({error:"Google Search Console service account is not configured."},{status:503});
  if(!storage.configured)return NextResponse.json({error:"SEO opportunity KV storage is not configured."},{status:503});

  try{
    let requested=DEFAULT_BATCH;
    try{
      const body=await request.json() as {batchSize?:number};
      if(typeof body.batchSize==="number"&&Number.isFinite(body.batchSize))requested=Math.floor(body.batchSize);
    }catch{}
    const batchSize=Math.max(1,Math.min(MAX_BATCH,requested));

    const [sitemap,current]=await Promise.all([getLiveSitemapSnapshot(),readUrlIndexationInventory()]);
    const unknown=sitemap.allUrls.filter(url=>!current.records[url]);
    const staleKnown=sitemap.allUrls.filter(url=>current.records[url]&&stale(current.records[url]?.inspectedAt));
    const candidates=[...unknown,...staleKnown].slice(0,batchSize);

    if(!candidates.length)return NextResponse.json({done:true,inspected:0,total:sitemap.totalUrls,known:Object.keys(current.records).length,state:current});

    const inspection=await getGscUrlInspections(candidates,4);
    const next=mergeUrlIndexationInventory(current,inspection.rows,inspection.errors);
    await writeUrlIndexationInventory(next);
    const sitemapSet=new Set(sitemap.allUrls);
    const knownInSitemap=Object.keys(next.records).filter(url=>sitemapSet.has(url)).length;

    return NextResponse.json({done:false,requested:candidates.length,inspected:inspection.rows.length,errors:inspection.errors,total:sitemap.totalUrls,known:knownInSitemap,remaining:Math.max(0,sitemap.totalUrls-knownInSitemap)});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Unable to refresh URL indexation inventory."},{status:502});
  }
}
