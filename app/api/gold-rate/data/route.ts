import {NextResponse} from "next/server";
import {getStoredGoldRatePublicDataset} from "@/lib/gold-rate-pipeline";

export const dynamic="force-dynamic";

export async function GET(){
  try{
    const dataset=await getStoredGoldRatePublicDataset();
    if(!dataset)return NextResponse.json({error:"Gold Rate dataset is not available yet."},{status:503,headers:{"Cache-Control":"no-store"}});
    return NextResponse.json(dataset,{headers:{"Cache-Control":"public, max-age=300, s-maxage=300, stale-while-revalidate=1800"}});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Gold Rate dataset is temporarily unavailable."},{status:503,headers:{"Cache-Control":"no-store"}});
  }
}
