import {getOpportunityStoreStatus} from "./opportunity-store";
import type {GscIndexInspection} from "./gsc";

const STORAGE_KEY="panchvani:url-indexation-inventory:v1";

export type UrlIndexationRecord=GscIndexInspection;
export type UrlIndexationInventoryState={
  version:1;
  updatedAt:string;
  records:Record<string,UrlIndexationRecord>;
  errors:string[];
};

function endpoint(){
  const status=getOpportunityStoreStatus();
  if(!status.configured)throw new Error("SEO opportunity KV storage is not configured.");
  const account=process.env.CLOUDFLARE_ACCOUNT_ID!;
  const namespace=process.env.SEO_OPPORTUNITY_KV_NAMESPACE_ID!;
  return `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/storage/kv/namespaces/${encodeURIComponent(namespace)}/values/${encodeURIComponent(STORAGE_KEY)}`;
}

function headers(contentType=false){
  const token=process.env.CLOUDFLARE_API_TOKEN;
  if(!token)throw new Error("CLOUDFLARE_API_TOKEN is not configured.");
  return {authorization:`Bearer ${token}`,...(contentType?{"content-type":"application/json"}:{})};
}

export function emptyUrlIndexationInventory():UrlIndexationInventoryState{
  return {version:1,updatedAt:new Date(0).toISOString(),records:{},errors:[]};
}

export async function readUrlIndexationInventory():Promise<UrlIndexationInventoryState>{
  if(!getOpportunityStoreStatus().configured)return emptyUrlIndexationInventory();
  const response=await fetch(endpoint(),{headers:headers(),cache:"no-store"});
  if(response.status===404)return emptyUrlIndexationInventory();
  if(!response.ok){const text=await response.text();throw new Error(`Cloudflare KV URL inventory read failed (${response.status}): ${text.slice(0,240)}`);}
  const raw=await response.text();
  if(!raw.trim())return emptyUrlIndexationInventory();
  try{
    const parsed=JSON.parse(raw) as UrlIndexationInventoryState;
    return {version:1,updatedAt:parsed.updatedAt??new Date(0).toISOString(),records:parsed.records??{},errors:parsed.errors??[]};
  }catch{throw new Error("Cloudflare KV URL inventory payload is not valid JSON.");}
}

export async function writeUrlIndexationInventory(state:UrlIndexationInventoryState){
  if(!getOpportunityStoreStatus().configured)throw new Error("SEO opportunity KV storage is not configured.");
  const response=await fetch(endpoint(),{method:"PUT",headers:headers(true),body:JSON.stringify(state),cache:"no-store"});
  if(!response.ok){const text=await response.text();throw new Error(`Cloudflare KV URL inventory write failed (${response.status}): ${text.slice(0,240)}`);}
}

export function classifyIndexationRecord(record:UrlIndexationRecord|undefined):"INDEXED"|"NOT_INDEXED"|"UNKNOWN"{
  if(!record)return "UNKNOWN";
  if(record.verdict==="PASS")return "INDEXED";
  const coverage=record.coverageState.toLowerCase();
  if(record.verdict==="FAIL"||record.verdict==="NEUTRAL"||/not indexed|currently not indexed|discovered|excluded|crawled/.test(coverage))return "NOT_INDEXED";
  return "UNKNOWN";
}

export function mergeUrlIndexationInventory(current:UrlIndexationInventoryState,rows:GscIndexInspection[],errors:string[]=[]):UrlIndexationInventoryState{
  const records={...current.records};
  for(const row of rows)records[row.inspectedUrl]=row;
  return {version:1,updatedAt:new Date().toISOString(),records,errors:[...errors].slice(-50)};
}
