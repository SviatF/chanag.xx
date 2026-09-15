import {NextResponse} from "next/server";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {bindGscStoreFromCloudflareEnv} from "@/lib/cloudflare-bindings";
import {normalizeSeoRevalidationPath} from "@/lib/seo-revalidation";
import {getSeoTaskStoreStatus,readSeoTaskMap,seoTaskId,writeSeoTaskMap,type SeoCommandTask,type SeoTaskBaseline,type SeoTaskResult} from "@/lib/seo-task-store";

export const dynamic="force-dynamic";

function text(value:unknown,max:number){return typeof value==="string"?value.trim().slice(0,max):"";}
function baseline(value:unknown):SeoTaskBaseline|null{
  if(!value||typeof value!=="object")return null;
  const raw=value as Record<string,unknown>;
  const values=[raw.impressions,raw.clicks,raw.ctr,raw.position];
  if(values.some(item=>typeof item!=="number"||!Number.isFinite(item)))return null;
  return {impressions:Math.max(0,Number(raw.impressions)),clicks:Math.max(0,Number(raw.clicks)),ctr:Math.max(0,Number(raw.ctr)),position:Math.max(0,Number(raw.position))};
}
function result(value:unknown):SeoTaskResult{return value==="positive"||value==="neutral"||value==="negative"||value==="low_data"?value:null;}
function addDays(date:Date,days:number){const next=new Date(date);next.setUTCDate(next.getUTCDate()+days);return next;}

export async function GET(){
  if(!(await isAdminAuthenticated()))return NextResponse.json({error:"Unauthorized"},{status:401});
  await bindGscStoreFromCloudflareEnv();
  const storage=getSeoTaskStoreStatus();
  if(!storage.configured)return NextResponse.json({storage,tasks:{}});
  try{return NextResponse.json({storage,tasks:await readSeoTaskMap()});}
  catch(error){return NextResponse.json({storage,error:error instanceof Error?error.message:"Unable to read SEO tasks."},{status:502});}
}

export async function POST(request:Request){
  if(!(await isAdminAuthenticated()))return NextResponse.json({error:"Unauthorized"},{status:401});
  await bindGscStoreFromCloudflareEnv();
  const storage=getSeoTaskStoreStatus();
  if(!storage.configured)return NextResponse.json({error:"SEO task persistence is not configured.",storage},{status:503});

  let body:Record<string,unknown>;
  try{body=await request.json() as Record<string,unknown>;}catch{return NextResponse.json({error:"Invalid JSON body."},{status:400});}
  const action=text(body.action,32);

  try{
    const tasks=await readSeoTaskMap();
    const now=new Date();
    const nowIso=now.toISOString();

    if(action==="observe"){
      const url=text(body.url,700),query=text(body.query,400),actionType=text(body.actionType,80),recommendation=text(body.recommendation,160);
      const base=baseline(body.baseline);
      if(!url||!query||!actionType||!recommendation||!base)return NextResponse.json({error:"url, query, actionType, recommendation and baseline are required."},{status:400});

      const revalidatedAt=text(body.revalidatedAt,80);
      const revalidatedPath=text(body.revalidatedPath,700);
      if(Boolean(revalidatedAt)!==Boolean(revalidatedPath))return NextResponse.json({error:"revalidatedAt and revalidatedPath must be supplied together."},{status:400});
      if(revalidatedAt){
        const expectedPath=normalizeSeoRevalidationPath(url);
        if(revalidatedPath!==expectedPath)return NextResponse.json({error:"Revalidated path does not match the observation URL."},{status:400});
        const timestamp=Date.parse(revalidatedAt);
        if(!Number.isFinite(timestamp)||timestamp>now.getTime()+60_000||now.getTime()-timestamp>10*60_000)return NextResponse.json({error:"Revalidation timestamp is invalid or stale."},{status:400});
      }

      const id=seoTaskId(url,query);
      const task:SeoCommandTask={id,url,query,actionType,recommendation,status:"observation",baseline:base,completedAt:nowIso,verifyAt:addDays(now,10).toISOString(),result:null,reviewerNote:text(body.reviewerNote,1200),commitSha:text(body.commitSha,80)||null,...(revalidatedAt?{revalidatedAt,revalidatedPath}:{}),updatedAt:nowIso};
      tasks[id]=task;
      await writeSeoTaskMap(tasks);
      return NextResponse.json({task});
    }

    const id=text(body.id,1200);
    if(!id||!tasks[id])return NextResponse.json({error:"Existing task id is required."},{status:404});
    const current=tasks[id];

    if(action==="close"){
      const next:SeoCommandTask={...current,status:"closed",result:result(body.result),closedAt:nowIso,updatedAt:nowIso};
      tasks[id]=next;
      await writeSeoTaskMap(tasks);
      return NextResponse.json({task:next});
    }

    if(action==="restore"){
      if(!current.closedAt||now.getTime()-new Date(current.closedAt).getTime()>12*60*60*1000)return NextResponse.json({error:"Only tasks closed in the last 12 hours can be restored."},{status:400});
      const next:SeoCommandTask={...current,status:new Date(current.verifyAt).getTime()<=now.getTime()?"review_ready":"observation",result:null,closedAt:undefined,updatedAt:nowIso};
      tasks[id]=next;
      await writeSeoTaskMap(tasks);
      return NextResponse.json({task:next});
    }

    if(action==="snooze"){
      const days=Math.max(1,Math.min(30,Number(body.days)||7));
      const next:SeoCommandTask={...current,status:"snoozed",snoozedUntil:addDays(now,days).toISOString(),updatedAt:nowIso};
      tasks[id]=next;
      await writeSeoTaskMap(tasks);
      return NextResponse.json({task:next});
    }

    return NextResponse.json({error:"Unsupported task action."},{status:400});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Unable to update SEO task."},{status:502});}
}
