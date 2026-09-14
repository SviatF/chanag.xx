import {NextResponse} from "next/server";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {getGscSeoOsDatasetWithMeta} from "@/lib/gsc-seo-os";
import {getSeoTaskStoreStatus,readSeoTaskMap} from "@/lib/seo-task-store";

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
  const taskStorage=getSeoTaskStoreStatus();
  try{
    const [gsc,tasks]=await Promise.all([
      getGscSeoOsDatasetWithMeta(force),
      taskStorage.configured?readSeoTaskMap():Promise.resolve({}),
    ]);
    const taskSubrequests=taskStorage.configured?1:0;
    const subrequests=gsc.meta.upstreamSubrequests+gsc.meta.cacheOperations+taskSubrequests;
    const latencyMs=Math.round((performance.now()-started)*10)/10;
    const telemetry={cache:gsc.meta.cacheStatus,apiCalls:gsc.meta.apiCalls,upstreamSubrequests:subrequests,latencyMs};
    return NextResponse.json({dataset:gsc.dataset,tasks,taskStorage,telemetry},{headers:telemetryHeaders(telemetry.cache,telemetry.apiCalls,telemetry.upstreamSubrequests,latencyMs)});
  }catch(error){
    const latencyMs=Math.round((performance.now()-started)*10)/10;
    return NextResponse.json({error:error instanceof Error?error.message:"Unable to load SEO operating data.",taskStorage},{status:502,headers:telemetryHeaders("MISS",0,0,latencyMs)});
  }
}
