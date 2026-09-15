import {NextResponse} from "next/server";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {getGscSeoOsDatasetWithMeta} from "@/lib/gsc-seo-os";
import {getSeoTaskStoreStatus,readSeoTaskMap,writeSeoTaskMap,type SeoTaskMap} from "@/lib/seo-task-store";
import {bindGscStoreFromCloudflareEnv} from "@/lib/cloudflare-bindings";
import {buildPageOpportunities} from "@/lib/seo-operating-system";
import {reconcileSeoTaskOutcomes} from "@/lib/seo-task-outcomes";
import {buildSeoCommandLearningLibrary} from "@/lib/seo-command-learning";

export const dynamic="force-dynamic";

function telemetryHeaders(cache:string,apiCalls:number,subrequests:number,latencyMs:number){
  return {
    "cache-control":"private, no-store",
    "x-cache":cache,
    "x-api-calls":String(apiCalls),
    "x-upstream-subrequests":String(subrequests),
    "x-endpoint-latency-ms":String(latencyMs),
    "server-timing":`seo-data;dur=${latencyMs}`,
  };
}

export async function GET(request:Request){
  const started=performance.now();
  if(!(await isAdminAuthenticated()))return NextResponse.json({error:"Unauthorized"},{status:401,headers:{"cache-control":"private, no-store"}});
  const url=new URL(request.url);
  const force=url.searchParams.get("refresh")==="1";
  try{
    // Resolve Cloudflare bindings first. SEO tasks can reuse the same native KV
    // namespace as the daily GSC snapshot, under a separate storage key.
    await bindGscStoreFromCloudflareEnv();
    const taskStorage=getSeoTaskStoreStatus();
    const [gsc,storedTasks]=await Promise.all([
      getGscSeoOsDatasetWithMeta(force),
      taskStorage.configured?readSeoTaskMap():Promise.resolve({} as SeoTaskMap),
    ]);

    // The daily GSC snapshot is also the measurement clock for completed SEO changes.
    // A due task is evaluated at most once per snapshot; low-data tasks may be retried
    // on a later daily snapshot, while a non-low-data verdict is frozen for learning.
    const pageMetrics=buildPageOpportunities(gsc.dataset,storedTasks);
    const metricsByUrl=new Map(pageMetrics.map(page=>[page.url,page.current7]));
    const reconciled=reconcileSeoTaskOutcomes(storedTasks,metricsByUrl,new Date().toISOString(),gsc.dataset.generatedAt);
    if(taskStorage.configured&&reconciled.changed)await writeSeoTaskMap(reconciled.tasks);
    const learning=buildSeoCommandLearningLibrary(reconciled.tasks);

    const taskSubrequests=taskStorage.configured?1:0;
    const taskWriteSubrequests=taskStorage.configured&&reconciled.changed?1:0;
    const subrequests=gsc.meta.upstreamSubrequests+gsc.meta.cacheOperations+taskSubrequests+taskWriteSubrequests;
    const latencyMs=Math.round((performance.now()-started)*10)/10;
    const telemetry={cache:gsc.meta.cacheStatus,apiCalls:gsc.meta.apiCalls,upstreamSubrequests:subrequests,latencyMs};
    return NextResponse.json({dataset:gsc.dataset,tasks:reconciled.tasks,learning,taskStorage,telemetry},{headers:telemetryHeaders(telemetry.cache,telemetry.apiCalls,telemetry.upstreamSubrequests,latencyMs)});
  }catch(error){
    const latencyMs=Math.round((performance.now()-started)*10)/10;
    return NextResponse.json({error:error instanceof Error?error.message:"Unable to load SEO operating data."},{status:502,headers:telemetryHeaders("MISS",0,0,latencyMs)});
  }
}
