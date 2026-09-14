import {NextResponse} from "next/server";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {refreshGscDailySnapshot,type GscDailyRefreshResult} from "@/lib/gsc-daily-refresh";
import {readGscDailySnapshot} from "@/lib/gsc-daily-store";

export const dynamic="force-dynamic";

const RECENT_REFRESH_MS=2*60*1000;
let manualRefreshInflight:Promise<GscDailyRefreshResult>|null=null;

export async function POST(){
  const started=performance.now();
  if(!(await isAdminAuthenticated())){
    return NextResponse.json({error:"Unauthorized"},{status:401,headers:{"cache-control":"private, no-store"}});
  }

  try{
    // Cross-isolate duplicate guard: if another click/instance refreshed very recently,
    // reuse the persisted snapshot instead of spending another GSC query budget.
    const existing=await readGscDailySnapshot(true);
    if(existing.snapshot){
      const age=Date.now()-new Date(existing.snapshot.refreshedAt).getTime();
      if(Number.isFinite(age)&&age>=0&&age<RECENT_REFRESH_MS){
        const latencyMs=Math.round((performance.now()-started)*10)/10;
        return NextResponse.json({
          ok:true,
          reused:true,
          refreshedAt:existing.snapshot.refreshedAt,
          finalDataThrough:existing.snapshot.finalDataThrough,
          apiCalls:0,
          searchAnalyticsCalls:0,
          upstreamSubrequests:existing.subrequests,
          latencyMs,
        },{headers:{"cache-control":"private, no-store","x-api-calls":"0","x-upstream-subrequests":String(existing.subrequests),"x-endpoint-latency-ms":String(latencyMs)}});
      }
    }

    if(!manualRefreshInflight){
      manualRefreshInflight=refreshGscDailySnapshot(new Date()).finally(()=>{manualRefreshInflight=null;});
    }
    const result=await manualRefreshInflight;
    const latencyMs=Math.round((performance.now()-started)*10)/10;
    const upstreamSubrequests=existing.subrequests+result.upstreamSubrequests;
    return NextResponse.json({
      ok:true,
      reused:false,
      refreshedAt:result.snapshot.refreshedAt,
      finalDataThrough:result.snapshot.finalDataThrough,
      apiCalls:result.apiCalls,
      searchAnalyticsCalls:result.searchAnalyticsCalls,
      upstreamSubrequests,
      latencyMs,
    },{headers:{"cache-control":"private, no-store","x-api-calls":String(result.apiCalls),"x-upstream-subrequests":String(upstreamSubrequests),"x-endpoint-latency-ms":String(latencyMs)}});
  }catch(error){
    const latencyMs=Math.round((performance.now()-started)*10)/10;
    return NextResponse.json({error:error instanceof Error?error.message:"Unable to refresh GSC snapshot.",latencyMs},{status:502,headers:{"cache-control":"private, no-store","x-endpoint-latency-ms":String(latencyMs)}});
  }
}
