import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE="panchang_admin_session";

function hash(value:string){
  return createHash("sha256").update(value).digest("hex");
}

export function isAdminConfigured(){
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function verifyAdminPassword(input:string){
  const expected=process.env.ADMIN_PASSWORD??"";
  if(!expected||!input)return false;
  const a=Buffer.from(hash(input));
  const b=Buffer.from(hash(expected));
  return a.length===b.length&&timingSafeEqual(a,b);
}

export function adminSessionToken(){
  const password=process.env.ADMIN_PASSWORD??"";
  const secret=process.env.ADMIN_SESSION_SECRET??password;
  return hash(`panchang-admin:${password}:${secret}`);
}

export async function isAdminAuthenticated(){
  if(!isAdminConfigured())return false;
  const jar=await cookies();
  const actual=jar.get(ADMIN_COOKIE)?.value??"";
  const expected=adminSessionToken();
  if(!actual||actual.length!==expected.length)return false;
  return timingSafeEqual(Buffer.from(actual),Buffer.from(expected));
}

export async function requireAdmin(){
  if(!(await isAdminAuthenticated()))redirect("/admin/login");
}
