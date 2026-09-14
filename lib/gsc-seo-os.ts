import type {GscRow,GscSummary} from "./gsc";
import {readGscDailySnapshot} from "./gsc-daily-store";
import type {RuntimeCacheStatus} from "./worker-data-cache";

export type GscSeoRange={
  startDate:string;
  endDate:string;
  summary:GscSummary;
  queries:GscRow[];
  queryPages:GscRow[];
};

export type GscSeoOsDataset={
  siteUrl:string;
  generatedAt:string;
  current7d:GscSeoRange;
  previous7d:GscSeoRange;
  current28d:GscSeoRange&{pages:GscRow[];countries:GscRow[];daily:GscRow[]};
  previous28d:{startDate:string;endDate:string;summary:GscSummary};
};

export type GscSeoRuntimeMeta={
  cacheStatus:RuntimeCacheStatus;
  apiCalls:number;
  upstreamSubrequests:number;
  cacheOperations:number;
};

// Admin reads never call Google Search Console directly. The only Search Analytics
// work happens in the once-daily scheduled snapshot refresh.
export const GSC_COMMAND_CENTER_QUERY_BUDGET=0;

export async function getGscSeoOsDatasetWithMeta(force=false):Promise<{dataset:GscSeoOsDataset;meta:GscSeoRuntimeMeta}>{
  const stored=await readGscDailySnapshot(force);
  if(!stored.snapshot)throw new Error("Daily GSC snapshot is not available yet. It will populate after the scheduled refresh.");
  return {
    dataset:stored.snapshot.dataset,
    meta:{cacheStatus:"HIT",apiCalls:0,upstreamSubrequests:0,cacheOperations:stored.subrequests},
  };
}

export async function getGscSeoOsDataset(force=false):Promise<GscSeoOsDataset>{
  return (await getGscSeoOsDatasetWithMeta(force)).dataset;
}
