import {getGoldRateStoreStatus,setGoldRateKvBinding} from "../lib/gold-rate-store";
import type {GoldRateKvBinding} from "../lib/gold-rate-store";
import {getGscDailyStoreStatus,setGscDailyKvBinding} from "../lib/gsc-daily-store";
import type {GscDailyKvBinding} from "../lib/gsc-daily-store";
import {isGscDailyCron,shouldRunGscDailyAtKyivMidnight} from "../lib/kyiv-midnight-cron";
import {servePublicWithEdgeCache} from "../lib/public-edge-cache";

type ScheduledEvent={scheduledTime:number;cron?:string};
type ExecutionContextLike={waitUntil(promise:Promise<unknown>):void};
type WorkerEnv={
  GOLD_RATE_KV?:GoldRateKvBinding;
  GSC_SNAPSHOT_KV?:GscDailyKvBinding;
  PUBLIC_EDGE_CACHE_VERSION?:string;
};

const GOLD_RATE_CRON="17 * * * *";
const SEO_AUTOPILOT_CRON="30 2 * * *";
// Deliberately independent from the Cloudflare deployment/version id.
// Admin-only deploys must not cold-flush every public HTML cache entry.
// Bump this value (or set PUBLIC_EDGE_CACHE_VERSION) only when a deliberate
// public HTML cache invalidation is required.
const DEFAULT_PUBLIC_EDGE_CACHE_VERSION="public-v1";

let vinextHandlerPromise:Promise<typeof import("vinext/server/fetch-handler")>|null=null;
function loadVinextHandler(){
  vinextHandlerPromise??=import("vinext/server/fetch-handler");
  return vinextHandlerPromise;
}

function publicEdgeCacheVersion(env:WorkerEnv){
  return env?.PUBLIC_EDGE_CACHE_VERSION?.trim()||DEFAULT_PUBLIC_EDGE_CACHE_VERSION;
}

function bindRuntimeStorage(env:WorkerEnv){
  setGoldRateKvBinding(env?.GOLD_RATE_KV);
  // Reuse the already-connected Panchvani KV namespace until a dedicated
  // GSC_SNAPSHOT_KV binding is added. Distinct storage keys keep datasets isolated.
  setGscDailyKvBinding(env?.GSC_SNAPSHOT_KV??env?.GOLD_RATE_KV);
}

async function runGoldRateScheduled(controller:ScheduledEvent){
  if(!getGoldRateStoreStatus().configured){
    console.log("GOLD_RATE_PIPELINE_SKIPPED",JSON.stringify({reason:"KV storage not configured",cron:controller.cron??null}));
    return;
  }
  const {runGoldRatePipeline}=await import("../lib/gold-rate-pipeline");
  const result=await runGoldRatePipeline(new Date(controller.scheduledTime));
  console.log("GOLD_RATE_PIPELINE_RUN",JSON.stringify({ok:result.ok,updatedAt:result.dataset?.updatedAt??null,mode:result.dataset?.status?.mode??null,error:result.error,cron:controller.cron??null}));
}

async function runGscDailyScheduled(controller:ScheduledEvent){
  if(!getGscDailyStoreStatus().configured){
    console.log("GSC_DAILY_SNAPSHOT_SKIPPED",JSON.stringify({reason:"KV storage not configured",cron:controller.cron??null}));
    return;
  }
  const {refreshGscDailySnapshot}=await import("../lib/gsc-daily-refresh");
  const result=await refreshGscDailySnapshot(new Date(controller.scheduledTime));
  console.log("GSC_DAILY_SNAPSHOT_RUN",JSON.stringify({
    refreshedAt:result.snapshot.refreshedAt,
    finalDataThrough:result.snapshot.finalDataThrough,
    searchAnalyticsCalls:result.searchAnalyticsCalls,
    apiCalls:result.apiCalls,
    upstreamSubrequests:result.upstreamSubrequests,
    cron:controller.cron??null,
    localSchedule:"00:00 Europe/Kyiv",
  }));
}

async function runSeoScheduled(controller:ScheduledEvent){
  const {runSeoAutopilot}=await import("../lib/seo-autopilot");
  const state=await runSeoAutopilot(new Date(controller.scheduledTime),"CRON");
  console.log("SEO_AUTOPILOT_RUN",JSON.stringify({status:state.status,startedAt:state.startedAt,completedAt:state.completedAt,opportunitiesDetected:state.opportunitiesDetected,newlyPersisted:state.newlyPersisted,checkpointsSynced:state.checkpointsSynced,checkpointsPending:state.checkpointsPending,flags:state.flags.length,errors:state.errors.length,cron:controller.cron??null}));
}

export default {
  fetch(request:Request,env:WorkerEnv,ctx:ExecutionContextLike){
    bindRuntimeStorage(env);
    return servePublicWithEdgeCache(
      request,
      publicEdgeCacheVersion(env),
      ctx,
      async()=>{
        const {default:handler}=await loadVinextHandler();
        return handler.fetch(request,env,ctx);
      },
    );
  },
  scheduled(controller:ScheduledEvent,env:WorkerEnv,ctx:ExecutionContextLike){
    bindRuntimeStorage(env);
    const cron=controller.cron??"";
    const gscDailyCron=isGscDailyCron(cron);
    let run:Promise<unknown>;

    if(cron===GOLD_RATE_CRON){
      run=runGoldRateScheduled(controller);
    }else if(gscDailyCron){
      if(shouldRunGscDailyAtKyivMidnight(cron,controller.scheduledTime)){
        run=runGscDailyScheduled(controller);
      }else{
        console.log("GSC_DAILY_SNAPSHOT_SKIPPED",JSON.stringify({reason:"candidate UTC trigger is not 00:00 in Europe/Kyiv",cron,scheduledTime:new Date(controller.scheduledTime).toISOString()}));
        run=Promise.resolve();
      }
    }else if(cron===SEO_AUTOPILOT_CRON){
      run=runSeoScheduled(controller);
    }else{
      run=Promise.resolve();
    }

    ctx.waitUntil(run.catch(error=>{
      const prefix=cron===GOLD_RATE_CRON?"GOLD_RATE_PIPELINE_FAILED":gscDailyCron?"GSC_DAILY_SNAPSHOT_FAILED":"SEO_AUTOPILOT_FAILED";
      console.error(prefix,error instanceof Error?error.message:String(error));
      throw error;
    }));
  },
};
