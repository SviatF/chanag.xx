import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export const dynamic="force-dynamic";

export default async function AdminLogin({searchParams}:{searchParams:Promise<{error?:string}>}){
  if(await isAdminAuthenticated())redirect("/admin");
  const query=await searchParams;
  const configured=isAdminConfigured();

  return <main className="admin-login">
    <section className="admin-login-card">
      <p className="admin-eyebrow">PANCHVANI CONTROL PLANE</p>
      <h1>Admin access</h1>
      <p>{configured?"Enter the admin password configured in Cloudflare secrets.":"Admin authentication is not configured yet."}</p>
      {configured?<form action="/api/admin/login" method="post">
        <label>Password<input type="password" name="password" autoComplete="current-password" required/></label>
        {query.error?<div className="admin-alert danger">Incorrect password.</div>:null}
        <button className="admin-primary" type="submit">Enter control plane →</button>
      </form>:<div className="admin-config-box">
        <strong>Required Cloudflare secret</strong>
        <code>ADMIN_PASSWORD</code>
        <small>Recommended additional secret: ADMIN_SESSION_SECRET</small>
      </div>}
    </section>
  </main>;
}
