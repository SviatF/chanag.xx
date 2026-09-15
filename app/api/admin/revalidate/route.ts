import {revalidatePath} from "next/cache";
import {NextResponse} from "next/server";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {normalizeSeoRevalidationPath} from "@/lib/seo-revalidation";

export const dynamic="force-dynamic";

export async function POST(request:Request){
  if(!(await isAdminAuthenticated()))return NextResponse.json({error:"Unauthorized"},{status:401});

  let body:Record<string,unknown>;
  try{body=await request.json() as Record<string,unknown>;}catch{return NextResponse.json({error:"Invalid JSON body."},{status:400});}

  let path:string;
  try{path=normalizeSeoRevalidationPath(body.url);}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Invalid revalidation target."},{status:400});}

  try{
    revalidatePath(path);
    return NextResponse.json({ok:true,path,revalidatedAt:new Date().toISOString()});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Unable to revalidate page."},{status:500});
  }
}
