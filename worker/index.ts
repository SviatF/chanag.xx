import handler from "vinext/server/fetch-handler";
import {runSeoAutopilot} from "../lib/seo-autopilot";
import {runGoldRatePipeline} from "../lib/gold-rate-pipeline";
import {getGoldRateStoreStatus} from "../lib/gold-rate-store";

type ScheduledEvent={scheduledTime:number;cron?:string};
type ExecutionContextLike={waitUntil(promise:Promise<unknown>):void};

const GOLD_RATE_CRON="17 * * * *";

async function runGoldRateScheduled(controller:ScheduledEvent){
  if(!getGoldRateStoreStatus().configured){
    console.log("GOLD_RATE_PIPELINE_SKIPPED",JSON.stringify({reason:"KV storage not configured",cron:controller.cron??null}));
    return;
  }
  const result=await runGoldRatePipeline(new Date(controller.scheduledTime));
  console.log("GOLD_RATE_PIPELINE_RUN",JSON.stringify({
    ok:result.ok,
    updatedAt:result.dataset?.updatedAt??null,
    mode:result.dataset?.status?.mode??null,
    error:result.error,
    cron:controller.cron??null,
  }));
}

async function runSeoScheduled(controller:ScheduledEvent){
  const state=await runSeoAutopilot(new Date(controller.scheduledTime),"CRON");
  console.log("SEO_AUTOPILOT_RUN",JSON.stringify({
    status:state.status,
    startedAt:state.startedAt,
    completedAt:state.completedAt,
    opportunitiesDetected:state.opportunitiesDetected,
    newlyPersisted:state.newlyPersisted,
    checkpointsSynced:state.checkpointsSynced,
    checkpointsPending:state.checkpointsPending,
    flags:state.flags.length,
    errors:state.errors.length,
    cron:controller.cron??null,
  }));
}

export default {
  fetch:handler.fetch,
  scheduled(controller:ScheduledEvent,_env:unknown,ctx:ExecutionContextLike){
    const run=(controller.cron===GOLD_RATE_CRON?runGoldRateScheduled(controller):runSeoScheduled(controller))
      .catch(error=>{
        const prefix=controller.cron===GOLD_RATE_CRON?"GOLD_RATE_PIPELINE_FAILED":"SEO_AUTOPILOT_FAILED";
        console.error(prefix,error instanceof Error?error.message:String(error));
        throw error;
      });
    ctx.waitUntil(run);
  },
};
