import {NextResponse} from "next/server";
import {supportedCities} from "@/lib/cities";

export const revalidate=86400;

export async function GET(){
  return NextResponse.json(supportedCities,{
    headers:{
      "Cache-Control":"public, max-age=3600, s-maxage=604800, stale-while-revalidate=2592000"
    }
  });
}
