import approvalsRegistry from "@/config/gold-rate-city-approvals.json";
import {goldRateIndexCitySlugs,parseGoldRateDataset} from "./gold-rate";
import {getGoldRateValidationLog} from "./gold-rate-validation-log";

export type GoldRateDataProbe={
  configured:boolean;
  mode:"external-override"|"native-kv";
  endpointHost:string|null;
  reachable:boolean|null;
  validDataset:boolean|null;
  status:number|null;
  error:string|null;
};

function approvedSlugs(){
  const approvals=approvalsRegistry.approvals as Record<string,{approved?:boolean;approvedAt?:string;reason?:string;evidence?:string}>;
  return approvalsRegistry.candidates.filter(slug=>approvals[slug]?.approved===true);
}

async function probeExternalDataUrl():Promise<GoldRateDataProbe>{
  const url=process.env.GOLD_RATE_DATA_URL?.trim();
  if(!url)return {configured:false,mode:"native-kv",endpointHost:null,reachable:null,validDataset:null,status:null,error:null};
  let host:string|null=null;
  try{host=new URL(url).host;}catch{return {configured:true,mode:"external-override",endpointHost:null,reachable:false,validDataset:false,status:null,error:"GOLD_RATE_DATA_URL is not a valid URL."};}
  try{
    const headers:Record<string,string>={accept:"application/json"};
    if(process.env.GOLD_RATE_DATA_TOKEN)headers.authorization=`Bearer ${process.env.GOLD_RATE_DATA_TOKEN}`;
    const response=await fetch(url,{headers,cache:"no-store",signal:AbortSignal.timeout(5000)});
    if(!response.ok)return {configured:true,mode:"external-override",endpointHost:host,reachable:false,validDataset:false,status:response.status,error:`HTTP ${response.status}`};
    const validDataset=Boolean(parseGoldRateDataset(await response.json()));
    return {configured:true,mode:"external-override",endpointHost:host,reachable:true,validDataset,status:response.status,error:validDataset?null:"Response is not a valid Gold Rate dataset."};
  }catch(error){
    return {configured:true,mode:"external-override",endpointHost:host,reachable:false,validDataset:false,status:null,error:error instanceof Error?error.message:String(error)};
  }
}

export async function getGoldRateIndexingReadiness(now=new Date(),probeDataUrl=true){
  const [log,dataProbe]=await Promise.all([
    getGoldRateValidationLog(now),
    probeDataUrl?probeExternalDataUrl():Promise.resolve<GoldRateDataProbe>({configured:Boolean(process.env.GOLD_RATE_DATA_URL),mode:process.env.GOLD_RATE_DATA_URL?"external-override":"native-kv",endpointHost:null,reachable:null,validDataset:null,status:null,error:null}),
  ]);
  const configuredIndexCities=goldRateIndexCitySlugs();
  const approved=approvedSlugs();
  const approvedSet=new Set(approved);
  const unapprovedConfigured=configuredIndexCities.filter(slug=>!approvedSet.has(slug));
  const recentRunEvidence=log.recentRuns;
  const recentRunsObserved=recentRunEvidence.length;
  const indexingExplicitlyFalse=process.env.GOLD_RATE_INDEXING_ENABLED==="false";
  const transportReady=dataProbe.mode==="external-override"?Boolean(dataProbe.reachable&&dataProbe.validDataset):log.store.configured;

  return {
    checkedAt:now.toISOString(),
    dataProbe,
    kv:{
      configured:log.store.configured,
      usingSharedSeoNamespace:log.store.usingSharedSeoNamespace,
      usingDedicatedToken:log.store.usingDedicatedToken,
      namespaceConfigured:Boolean(log.store.namespaceId),
      missing:log.store.missing,
    },
    cronEvidence:{
      recentRunsObserved,
      hasThreeRuns:recentRunsObserved>=3,
      hasFiveRuns:recentRunsObserved>=5,
      runs:recentRunEvidence,
      note:"Persisted hourly observations prove pipeline executions. Cloudflare runtime-log verification is still a separate manual production check.",
    },
    safety:{
      indexingExplicitlyFalse,
      indexingRawValue:process.env.GOLD_RATE_INDEXING_ENABLED??null,
      transportReady,
    },
    demandApproval:{
      candidateCount:approvalsRegistry.candidates.length,
      approvedCount:approved.length,
      approvedCities:approved,
      configuredIndexCities,
      unapprovedConfigured,
      ready:configuredIndexCities.length>0&&unapprovedConfigured.length===0&&configuredIndexCities.every(slug=>approvedSet.has(slug)),
      generatedEnv:`GOLD_RATE_INDEX_CITIES=${approved.join(",")}`,
    },
    validation:log.summary,
    comparableBasis:log.comparableBasis,
    pipeline:log.pipeline,
    entries:log.entries,
  };
}
