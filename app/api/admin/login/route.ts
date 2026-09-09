import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminSessionToken, isAdminConfigured, verifyAdminPassword } from "@/lib/admin-auth";

export async function POST(request:Request){
  const form=await request.formData();
  const password=String(form.get("password")??"");

  if(!isAdminConfigured()){
    return NextResponse.redirect(new URL("/admin/login?error=config",request.url),303);
  }

  if(!verifyAdminPassword(password)){
    return NextResponse.redirect(new URL("/admin/login?error=1",request.url),303);
  }

  const response=NextResponse.redirect(new URL("/admin",request.url),303);
  response.cookies.set(ADMIN_COOKIE,adminSessionToken(),{
    httpOnly:true,
    secure:process.env.NODE_ENV==="production",
    sameSite:"strict",
    path:"/",
    maxAge:60*60*12,
  });
  return response;
}
