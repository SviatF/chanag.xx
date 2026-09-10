import handler from "vinext/server/fetch-handler";
import {runSeoAutopilot} from "../lib/seo-autopilot";

type ScheduledEvent={scheduledTime:number;cron?:string};
type ExecutionContextLike={waitUntil(promise:Promise<unknown>):void};

export default {
  fetch:handler.fetch,
  scheduled(controller:ScheduledEvent,_env:unknown,ctx:ExecutionContextLike){
    const run=runSeoAutopilot(new Date(controller.scheduledTime),"CRON")
      .then(state=>{
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
      })
      .catch(error=>{
        console.error("SEO_AUTOPILOT_FAILED",error instanceof Error?error.message:String(error));
        throw error;
      });
    ctx.waitUntil(run);
  },
};
