import {getGscOutcomeComparisons,type GscOutcomeRequest} from "./gsc";
import {appendOutcomeCheckpoint,dueOutcomeCheckpoints,evaluateOutcomeCheckpoint} from "./outcome-intelligence";
import type {OpportunityLifecycleRecord} from "./opportunity-lifecycle";
import {readOpportunityLifecycleMap,writeOpportunityLifecycleMap} from "./opportunity-store";

const MAX_CHECKPOINTS_PER_SYNC=6;

type LifecycleMap=Record<string,OpportunityLifecycleRecord>;

type DueTask={
  key:string;
  days:14|28|56;
  shippedAt:string;
  query:string;
};

export async function syncDueOpportunityOutcomes(records:LifecycleMap,asOf=new Date()){
  const due:DueTask[]=[];
  for(const record of Object.values(records)){
    if(!record.shippedAt||!record.context?.topQuery)continue;
    for(const days of dueOutcomeCheckpoints(record,asOf)){
      due.push({key:record.key,days,shippedAt:record.shippedAt,query:record.context.topQuery});
    }
  }

  due.sort((a,b)=>a.shippedAt.localeCompare(b.shippedAt)||a.days-b.days);
  const batch=due.slice(0,MAX_CHECKPOINTS_PER_SYNC);
  if(!batch.length)return {records,synced:0,pending:due.length};

  const requests:GscOutcomeRequest[]=batch.map(item=>({key:item.key,query:item.query,shippedAt:item.shippedAt,days:item.days}));
  const comparisons=await getGscOutcomeComparisons(requests);

  // Re-read before writing so a human lifecycle update made while GSC was being queried is preserved.
  const latest=await readOpportunityLifecycleMap();
  let synced=0;
  const evaluatedAt=asOf.toISOString();

  for(const task of batch){
    const record=latest[task.key];
    if(!record||record.shippedAt!==task.shippedAt||record.stage==="REJECTED")continue;
    if((record.outcomes??[]).some(item=>item.days===task.days))continue;
    const comparison=comparisons[`${task.key}:${task.days}`];
    if(!comparison)continue;
    const checkpoint=evaluateOutcomeCheckpoint(record,comparison,task.days,evaluatedAt);
    latest[task.key]=appendOutcomeCheckpoint(record,checkpoint);
    synced++;
  }

  if(synced)await writeOpportunityLifecycleMap(latest);
  return {records:latest,synced,pending:Math.max(0,due.length-synced)};
}
