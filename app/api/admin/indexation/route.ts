import {NextResponse} from "next/server";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {getGscConnectionStatus,getGscTrafficSnapshot} from "@/lib/gsc";
import {buildSearchOpportunities} from "@/lib/search-opportunities";
import {getOpportunityStoreStatus,readOpportunityLifecycleMap} from "@/lib/opportunity-store";
import {runIndexationIntelligence} from "@/lib/indexation-runner";

export const dynamic="force-dynamic";

export async function POST(){
  if(!(await isAdminAuthenticated()))return NextResponse.json({error:"Unauthorized"},{status:401});
  const storage=getOpportunityStoreStatus();
  const gsc=getGscConnectionStatus();
  if(!storage.configured)return NextResponse.json({error:"SEO opportunity KV storage is not configured."},{status:503});
  if(!gsc.configured)return NextResponse.json({error:"Google Search Console service account is not configured."},{status:503});
  try{
    const [records,snapshot]=await Promise.all([readOpportunityLifecycleMap(),getGscTrafficSnapshot()]);
    const opportunities=buildSearchOpportunities(snapshot);
    const state=await runIndexationIntelligence(snapshot,opportunities,records,new Date());
    return NextResponse.json({state});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Unable to refresh indexation intelligence."},{status:502});
  }
}
