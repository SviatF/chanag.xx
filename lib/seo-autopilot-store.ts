import {getOpportunityStoreStatus} from "./opportunity-store";

const AUTOPILOT_STORAGE_KEY="panchvani:seo-autopilot-state:v1";

export type SeoAutopilotFlag={
  key:string;
  label:string;
  recommendation:"WON"|"ITERATE"|"REGRESSED";
  score:number;
  checkpointDays:number;
  reason:string;
};

export type SeoAutopilotRunState={
  status:"SUCCESS"|"PARTIAL"|"FAILED";
  trigger:"CRON"|"MANUAL";
  startedAt:string;
  completedAt:string;
  gscStartDate:string|null;
  gscEndDate:string|null;
  opportunitiesDetected:number;
  newlyPersisted:number;
  checkpointsSynced:number;
  checkpointsPending:number;
  flags:SeoAutopilotFlag[];
  errors:string[];
};

function endpoint(){
  const status=getOpportunityStoreStatus();
  if(!status.configured)throw new Error("SEO opportunity KV storage is not configured.");
  const account=process.env.CLOUDFLARE_ACCOUNT_ID!;
  const namespace=process.env.SEO_OPPORTUNITY_KV_NAMESPACE_ID!;
  return `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/storage/kv/namespaces/${encodeURIComponent(namespace)}/values/${encodeURIComponent(AUTOPILOT_STORAGE_KEY)}`;
}

function headers(contentType=false){
  const token=process.env.CLOUDFLARE_API_TOKEN;
  if(!token)throw new Error("CLOUDFLARE_API_TOKEN is not configured.");
  return {authorization:`Bearer ${token}`,...(contentType?{"content-type":"application/json"}:{})};
}

export async function readSeoAutopilotState():Promise<SeoAutopilotRunState|null>{
  if(!getOpportunityStoreStatus().configured)return null;
  const response=await fetch(endpoint(),{headers:headers(),cache:"no-store"});
  if(response.status===404)return null;
  if(!response.ok){
    const text=await response.text();
    throw new Error(`Cloudflare KV autopilot read failed (${response.status}): ${text.slice(0,240)}`);
  }
  const raw=await response.text();
  if(!raw.trim())return null;
  try{return JSON.parse(raw) as SeoAutopilotRunState;}
  catch{throw new Error("Cloudflare KV autopilot payload is not valid JSON.");}
}

export async function writeSeoAutopilotState(state:SeoAutopilotRunState){
  if(!getOpportunityStoreStatus().configured)throw new Error("SEO opportunity KV storage is not configured.");
  const response=await fetch(endpoint(),{method:"PUT",headers:headers(true),body:JSON.stringify(state),cache:"no-store"});
  if(!response.ok){
    const text=await response.text();
    throw new Error(`Cloudflare KV autopilot write failed (${response.status}): ${text.slice(0,240)}`);
  }
}
