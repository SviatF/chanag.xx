import {NextResponse} from "next/server";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {getGoldRatePipelineStatus,recordGoldRateValidation} from "@/lib/gold-rate-pipeline";
import {getGoldRateStoreStatus} from "@/lib/gold-rate-store";

export const dynamic="force-dynamic";

async function authorized(){return isAdminAuthenticated();}

export async function GET(){
  if(!(await authorized()))return NextResponse.json({error:"Unauthorized"},{status:401});
  if(!getGoldRateStoreStatus().configured)return NextResponse.json({error:"Gold Rate KV storage is not configured."},{status:503});
  try{return NextResponse.json({state:await getGoldRatePipelineStatus()},{headers:{"Cache-Control":"no-store"}});}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Unable to read Gold Rate validation status."},{status:502});}
}

export async function POST(request:Request){
  if(!(await authorized()))return NextResponse.json({error:"Unauthorized"},{status:401});
  if(!getGoldRateStoreStatus().configured)return NextResponse.json({error:"Gold Rate KV storage is not configured."},{status:503});
  try{
    const body=await request.json() as {date?:unknown;ibja999Per10g?:unknown;note?:unknown};
    if(typeof body.date!=="string"||typeof body.ibja999Per10g!=="number")return NextResponse.json({error:"date (YYYY-MM-DD) and numeric ibja999Per10g are required."},{status:400});
    const result=await recordGoldRateValidation({date:body.date,ibja999Per10g:body.ibja999Per10g,note:typeof body.note==="string"?body.note:undefined});
    return NextResponse.json({result},{headers:{"Cache-Control":"no-store"}});
  }catch(error){
    const message=error instanceof Error?error.message:"Unable to record Gold Rate validation.";
    const status=/must|No calculated|positive|YYYY-MM-DD/.test(message)?400:502;
    return NextResponse.json({error:message},{status});
  }
}
