import {getGscConnectionStatus,getGscTrafficSnapshot} from "./gsc";
import {opportunityContext,transitionOpportunityLifecycle,type OpportunityLifecycleRecord} from "./opportunity-lifecycle";
import {syncDueOpportunityOutcomes} from "./opportunity-outcome-sync";
import {getOpportunityStoreStatus,readOpportunityLifecycleMap,writeOpportunityLifecycleMap} from "./opportunity-store";
import {latestOutcomeCheckpoint} from "./outcome-intelligence";
import {buildSearchOpportunities,type SearchOpportunity} from "./search-opportunities";
import {writeSeoAutopilotState,type SeoAutopilotFlag,type SeoAutopilotRunState} from "./seo-autopilot-store";
import {buildSeoLearningLibrary,prioritizeOpportunityWithLearning} from "./seo-learning";
import {runIndexationIntelligence} from "./indexation-runner";

export const SEO_AUTOPILOT_MIN_SCORE=55;
export const SEO_AUTOPILOT_MIN_IMPRESSIONS=5;
export const SEO_AUTOPILOT_MAX_NEW_PER_RUN=40;

type LifecycleMap=Record<string,OpportunityLifecycleRecord>;

export function selectAutopilotCandidates(opportunities:SearchOpportunity[],records:LifecycleMap){
  const learning=buildSeoLearningLibrary(records);
  return opportunities
    .filter(item=>item.status!=="COVERED")
    .filter(item=>item.impressions>=SEO_AUTOPILOT_MIN_IMPRESSIONS&&item.score>=SEO_AUTOPILOT_MIN_SCORE)
    .filter(item=>!records[item.key])
    .sort((a,b)=>{
      const learnedA=prioritizeOpportunityWithLearning(a,learning).adjustedScore;
      const learnedB=prioritizeOpportunityWithLearning(b,learning).adjustedScore;
      return learnedB-learnedA||b.score-a.score||b.impressions-a.impressions||a.key.localeCompare(b.key);
    })
    .slice(0,SEO_AUTOPILOT_MAX_NEW_PER_RUN);
}

export function buildAutopilotFlags(records:LifecycleMap):SeoAutopilotFlag[]{
  const severity={REGRESSED:0,ITERATE:1,WON:2} as const;
  return Object.values(records)
    .flatMap(record=>{
      const outcome=latestOutcomeCheckpoint(record);
      if(!outcome||outcome.recommendation==="KEEP_MEASURING")return [];
      const recommendation=outcome.recommendation;
      return [{
        key:record.key,
        label:record.context?.label??record.key,
        recommendation,
        score:outcome.score,
        checkpointDays:outcome.days,
        reason:outcome.reason,
      } satisfies SeoAutopilotFlag];
    })
    .sort((a,b)=>severity[a.recommendation]-severity[b.recommendation]||b.score-a.score||a.key.localeCompare(b.key))
    .slice(0,30);
}

function failedState(startedAt:string,trigger:"CRON"|"MANUAL",errors:string[]):SeoAutopilotRunState{
  return {
    status:"FAILED",trigger,startedAt,completedAt:new Date().toISOString(),gscStartDate:null,gscEndDate:null,
    opportunitiesDetected:0,newlyPersisted:0,checkpointsSynced:0,checkpointsPending:0,flags:[],errors
  };
}

export async function runSeoAutopilot(asOf=new Date(),trigger:"CRON"|"MANUAL"="CRON"):Promise<SeoAutopilotRunState>{
  const startedAt=asOf.toISOString();
  const storage=getOpportunityStoreStatus();
  const gsc=getGscConnectionStatus();
  const configurationErrors:string[]=[];

  if(!storage.configured)configurationErrors.push("SEO opportunity KV storage is not configured.");
  if(!gsc.configured)configurationErrors.push("Google Search Console service account is not configured.");
  if(configurationErrors.length){
    const failed=failedState(startedAt,trigger,configurationErrors);
    if(storage.configured)await writeSeoAutopilotState(failed).catch(()=>{});
    throw new Error(configurationErrors.join(" "));
  }

  try{
    const errors:string[]=[];
    let records=await readOpportunityLifecycleMap();
    const snapshot=await getGscTrafficSnapshot();
    const opportunities=buildSearchOpportunities(snapshot);
    const actionable=opportunities.filter(item=>item.status!=="COVERED"&&item.impressions>=SEO_AUTOPILOT_MIN_IMPRESSIONS&&item.score>=SEO_AUTOPILOT_MIN_SCORE);
    const candidates=selectAutopilotCandidates(opportunities,records);
    const now=asOf.toISOString();

    if(candidates.length){
      // Re-read immediately before persistence to preserve manual queue changes made while GSC was loading.
      const latest=await readOpportunityLifecycleMap();
      let added=0;
      for(const item of candidates){
        if(latest[item.key])continue;
        latest[item.key]=transitionOpportunityLifecycle(undefined,item.key,"DETECTED",now,{context:opportunityContext(item)});
        added++;
      }
      if(added)await writeOpportunityLifecycleMap(latest);
      records=latest;
    }

    let checkpointsSynced=0;
    let checkpointsPending=0;
    try{
      const outcome=await syncDueOpportunityOutcomes(records,asOf);
      records=outcome.records;
      checkpointsSynced=outcome.synced;
      checkpointsPending=outcome.pending;
    }catch(error){
      errors.push(error instanceof Error?error.message:"Outcome checkpoint sync failed.");
      // Keep discovery persistence even if an exact checkpoint query fails.
      records=await readOpportunityLifecycleMap();
    }

    try{
      await runIndexationIntelligence(snapshot,opportunities,records,asOf);
    }catch(error){
      errors.push(error instanceof Error?`Indexation intelligence: ${error.message}`:"Indexation intelligence failed.");
    }

    const newlyPersisted=candidates.filter(item=>Boolean(records[item.key])&&records[item.key].createdAt===now).length;
    const state:SeoAutopilotRunState={
      status:errors.length?"PARTIAL":"SUCCESS",
      trigger,
      startedAt,
      completedAt:new Date().toISOString(),
      gscStartDate:snapshot.startDate,
      gscEndDate:snapshot.endDate,
      opportunitiesDetected:actionable.length,
      newlyPersisted,
      checkpointsSynced,
      checkpointsPending,
      flags:buildAutopilotFlags(records),
      errors,
    };
    await writeSeoAutopilotState(state);
    return state;
  }catch(error){
    const message=error instanceof Error?error.message:"Unknown SEO Autopilot runtime failure.";
    const failed=failedState(startedAt,trigger,[message]);
    await writeSeoAutopilotState(failed).catch(()=>{});
    throw error;
  }
}
