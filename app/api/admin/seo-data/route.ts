import {NextResponse} from "next/server";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {getGscSeoOsDataset} from "@/lib/gsc-seo-os";
import {getSeoTaskStoreStatus,readSeoTaskMap} from "@/lib/seo-task-store";

export const dynamic="force-dynamic";

export async function GET(request:Request){
  if(!(await isAdminAuthenticated()))return NextResponse.json({error:"Unauthorized"},{status:401});
  const url=new URL(request.url);
  const force=url.searchParams.get("refresh")==="1";
  const taskStorage=getSeoTaskStoreStatus();
  try{
    const [dataset,tasks]=await Promise.all([
      getGscSeoOsDataset(force),
      taskStorage.configured?readSeoTaskMap():Promise.resolve({}),
    ]);
    return NextResponse.json({dataset,tasks,taskStorage},{headers:{"cache-control":"private, no-store"}});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Unable to load SEO operating data.",taskStorage},{status:502,headers:{"cache-control":"private, no-store"}});
  }
}
