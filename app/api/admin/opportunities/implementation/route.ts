import {NextResponse} from "next/server";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {readOpportunityLifecycleMap,writeOpportunityLifecycleMap,getOpportunityStoreStatus} from "@/lib/opportunity-store";
import {registerImplementationEvidence} from "@/lib/seo-change-registry";

export const dynamic="force-dynamic";

function unauthorized(){return NextResponse.json({error:"Unauthorized"},{status:401});}
function cleanText(value:unknown,max:number){return typeof value==="string"?value.trim().slice(0,max):undefined;}
function validCommit(value:string|undefined){return !value||/^[0-9a-f]{7,40}$/i.test(value);}
function validPrUrl(value:string|undefined){
  if(!value)return true;
  try{const url=new URL(value);return url.protocol==="https:"&&url.hostname==="github.com"&&/^\/SviatF\/chanag\.xx\/pull\/\d+\/?$/.test(url.pathname);}catch{return false;}
}
function validDeployUrl(value:string|undefined){if(!value)return true;try{return new URL(value).protocol==="https:";}catch{return false;}}
function files(value:unknown){
  const list=Array.isArray(value)?value:typeof value==="string"?value.split(/[\n,]+/):[];
  return [...new Set(list.filter((item):item is string=>typeof item==="string").map(item=>item.trim()).filter(Boolean).slice(0,40).map(item=>item.slice(0,300)))];
}

export async function POST(request:Request){
  if(!(await isAdminAuthenticated()))return unauthorized();
  const storage=getOpportunityStoreStatus();
  if(!storage.configured)return NextResponse.json({error:"Opportunity persistence is not configured.",storage},{status:503});

  let body:Record<string,unknown>;
  try{body=await request.json() as Record<string,unknown>;}catch{return NextResponse.json({error:"Invalid JSON body."},{status:400});}

  const key=cleanText(body.key,500);
  const hypothesis=cleanText(body.hypothesis,1200);
  const commitSha=cleanText(body.commitSha,40);
  const prUrl=cleanText(body.prUrl,500);
  const deployedUrl=cleanText(body.deployedUrl,500);
  if(!key||!hypothesis)return NextResponse.json({error:"Opportunity key and implementation hypothesis are required."},{status:400});
  if(!validCommit(commitSha))return NextResponse.json({error:"Commit SHA must be 7–40 hexadecimal characters."},{status:400});
  if(!validPrUrl(prUrl))return NextResponse.json({error:"PR URL must point to a pull request in SviatF/chanag.xx."},{status:400});
  if(!validDeployUrl(deployedUrl))return NextResponse.json({error:"Deployed URL must be a valid HTTPS URL."},{status:400});

  try{
    const records=await readOpportunityLifecycleMap();
    const current=records[key];
    if(!current)return NextResponse.json({error:"Track the opportunity before registering implementation evidence."},{status:404});
    const expectedUpdatedAt=cleanText(body.expectedUpdatedAt,64);
    if(expectedUpdatedAt&&current.updatedAt!==expectedUpdatedAt){
      return NextResponse.json({error:"Opportunity changed in another session. Refresh before updating implementation evidence.",record:current},{status:409});
    }
    const now=new Date().toISOString();
    const id=cleanText(body.id,100)??`impl-${Date.now().toString(36)}`;
    const next=registerImplementationEvidence(current,{
      id,
      hypothesis,
      commitSha:commitSha??null,
      prUrl:prUrl??null,
      changedFiles:files(body.changedFiles),
      deployedUrl:deployedUrl??null,
      versionLabel:cleanText(body.versionLabel,200)??null,
      note:cleanText(body.note,1200)??"",
    },now);
    records[key]=next;
    await writeOpportunityLifecycleMap(records);
    return NextResponse.json({record:next,implementation:next.implementations?.find(item=>item.id===id)});
  }catch(error){
    const message=error instanceof Error?error.message:"Unable to register implementation evidence.";
    return NextResponse.json({error:message},{status:message.startsWith("Shipped implementation evidence")?400:502});
  }
}
