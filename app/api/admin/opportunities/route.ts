import {NextResponse} from "next/server";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {
  opportunityStages,
  transitionOpportunityLifecycle,
  type OpportunityContextSnapshot,
  type OpportunityMetricSnapshot,
  type OpportunityStage
} from "@/lib/opportunity-lifecycle";
import type {SearchOpportunityAction,SearchOpportunityStatus} from "@/lib/search-opportunities";
import {getOpportunityStoreStatus,readOpportunityLifecycleMap,writeOpportunityLifecycleMap} from "@/lib/opportunity-store";

export const dynamic="force-dynamic";

const opportunityStatuses=["NEW_CLUSTER","WRONG_LANDING","STRIKING_DISTANCE","LOW_CTR","NO_CLEAR_LANDING","COVERED"] as const satisfies readonly SearchOpportunityStatus[];
const opportunityActions=["BUILD","ALIGN","STRENGTHEN","IMPROVE_SNIPPET","REVIEW","MONITOR"] as const satisfies readonly SearchOpportunityAction[];

function unauthorized(){return NextResponse.json({error:"Unauthorized"},{status:401});}
function isStage(value:unknown):value is OpportunityStage{return typeof value==="string"&&opportunityStages.includes(value as OpportunityStage);}
function cleanText(value:unknown,max:number){return typeof value==="string"?value.trim().slice(0,max):undefined;}
function oneOf<T extends string>(value:unknown,allowed:readonly T[]){return typeof value==="string"&&allowed.includes(value as T)?value as T:undefined;}

function metrics(value:unknown):OpportunityMetricSnapshot|undefined{
  if(!value||typeof value!=="object")return undefined;
  const raw=value as Record<string,unknown>;
  const values=[raw.impressions,raw.clicks,raw.ctr,raw.position,raw.opportunityScore];
  if(values.some(item=>typeof item!=="number"||!Number.isFinite(item)))return undefined;
  return {
    capturedAt:cleanText(raw.capturedAt,64)??new Date().toISOString(),
    impressions:Math.max(0,Number(raw.impressions)),
    clicks:Math.max(0,Number(raw.clicks)),
    ctr:Math.max(0,Number(raw.ctr)),
    position:Math.max(0,Number(raw.position)),
    opportunityScore:Math.max(0,Math.min(100,Number(raw.opportunityScore)))
  };
}

function context(value:unknown):OpportunityContextSnapshot|undefined{
  if(!value||typeof value!=="object")return undefined;
  const raw=value as Record<string,unknown>;
  const label=cleanText(raw.label,160),topQuery=cleanText(raw.topQuery,300),recommendedPath=cleanText(raw.recommendedPath,500),template=cleanText(raw.template,200);
  if(!label||!topQuery||!recommendedPath||!template)return undefined;
  return {
    label,topQuery,recommendedPath,template,
    city:cleanText(raw.city,160)??null,
    intent:cleanText(raw.intent,200),
    status:oneOf(raw.status,opportunityStatuses),
    action:oneOf(raw.action,opportunityActions)
  };
}

export async function GET(){
  if(!(await isAdminAuthenticated()))return unauthorized();
  const storage=getOpportunityStoreStatus();
  if(!storage.configured)return NextResponse.json({storage,records:{}});
  try{
    const records=await readOpportunityLifecycleMap();
    return NextResponse.json({storage,records});
  }catch(error){
    return NextResponse.json({storage,error:error instanceof Error?error.message:"Unable to read opportunity lifecycle."},{status:502});
  }
}

export async function POST(request:Request){
  if(!(await isAdminAuthenticated()))return unauthorized();
  const storage=getOpportunityStoreStatus();
  if(!storage.configured)return NextResponse.json({error:"Opportunity persistence is not configured.",storage},{status:503});

  let body:Record<string,unknown>;
  try{body=await request.json() as Record<string,unknown>;}catch{return NextResponse.json({error:"Invalid JSON body."},{status:400});}
  const key=cleanText(body.key,500);
  const stage=body.stage;
  if(!key||!isStage(stage))return NextResponse.json({error:"Valid opportunity key and stage are required."},{status:400});

  try{
    const records=await readOpportunityLifecycleMap();
    const current=records[key];
    const expectedUpdatedAt=cleanText(body.expectedUpdatedAt,64);
    if(expectedUpdatedAt&&current?.updatedAt&&current.updatedAt!==expectedUpdatedAt){
      return NextResponse.json({error:"Opportunity changed in another session. Refresh before updating.",record:current},{status:409});
    }

    const now=new Date().toISOString();
    const next=transitionOpportunityLifecycle(current,key,stage,now,{
      owner:cleanText(body.owner,120),
      note:cleanText(body.note,1200),
      metrics:metrics(body.metrics),
      context:context(body.context)
    });
    records[key]=next;
    await writeOpportunityLifecycleMap(records);
    return NextResponse.json({record:next});
  }catch(error){
    const message=error instanceof Error?error.message:"Unable to update opportunity lifecycle.";
    const status=message.startsWith("Invalid opportunity transition")?400:502;
    return NextResponse.json({error:message},{status});
  }
}
