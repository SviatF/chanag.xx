import {buildGoldRateValidationSummary,type GoldRatePipelineState,type GoldRateValidationEntry} from "./gold-rate-pipeline";
import {getGoldRateStoreStatus,readGoldRatePipelineState} from "./gold-rate-store";

export const GOLD_RATE_COMPARABLE_BASIS={
  calculated:"Panchvani 24K estimate before GST, per gram",
  benchmark:"IBJA 999 benchmark, GST-exclusive, converted from per 10g to per gram",
  confirmation:"Comparable basis: pre-GST 24K per gram vs GST-exclusive IBJA 999 per gram",
} as const;

function emptyState(now:Date):GoldRatePipelineState{
  return {version:1,startedAt:now.toISOString(),lastAttemptAt:null,lastSuccessAt:null,lastError:null,observations:[],validations:[]};
}

function normalize(raw:GoldRatePipelineState|null,now:Date):GoldRatePipelineState{
  if(raw&&raw.version===1&&Array.isArray(raw.observations)&&Array.isArray(raw.validations))return raw;
  return emptyState(now);
}

function sortedValidations(entries:GoldRateValidationEntry[]){return [...entries].sort((a,b)=>a.date.localeCompare(b.date));}

export async function getGoldRateValidationLog(now=new Date()){
  const store=getGoldRateStoreStatus();
  const state=normalize(await readGoldRatePipelineState<GoldRatePipelineState>(),now);
  const entries=sortedValidations(state.validations);
  const recentRuns=[...state.observations]
    .sort((a,b)=>b.at.localeCompare(a.at))
    .slice(0,5)
    .map(item=>({
      at:item.at,
      spotSource:item.spotSource,
      fxSource:item.fxSource,
      calculatedPreGst24kPerGram:item.benchmarkComparable24k,
      domestic24kPerGram:item.rates["24k"],
    }));
  return {
    store,
    pipeline:{
      startedAt:state.startedAt,
      lastAttemptAt:state.lastAttemptAt,
      lastSuccessAt:state.lastSuccessAt,
      lastError:state.lastError,
      hourlyObservations:state.observations.length,
    },
    summary:buildGoldRateValidationSummary(entries,now),
    comparableBasis:GOLD_RATE_COMPARABLE_BASIS,
    entries,
    recentRuns,
  };
}
