import Link from "next/link";
import type { ReactNode } from "react";
import { Bell, Search } from "lucide-react";
import AdminNav from "@/components/AdminNav";
import { getGscConnectionStatus } from "@/lib/gsc";
import { getDataSourceStatus } from "@/lib/data-sources";

export default function AdminShell({children}:{children:ReactNode}){
  const gsc=getGscConnectionStatus();
  const sources=getDataSourceStatus();
  const connected=Number(gsc.configured)+Number(sources.ga4.configured)+Number(sources.cloudflare.configured);
  const now=new Intl.DateTimeFormat("en-IN",{
    timeZone:"Asia/Kolkata",day:"2-digit",month:"short",year:"numeric",
    hour:"2-digit",minute:"2-digit",hour12:false
  }).format(new Date());

  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <Link className="admin-brand" href="/admin">
        <small>PANCHVANI</small>
        <strong>Control Plane</strong>
        <span>TRADITION MEETS TOMORROW</span>
      </Link>

      <AdminNav/>

      <div className="admin-sidebar-art" aria-hidden="true">
        <img src="/admin/heritage.webp" alt="" />
        <div className="admin-temple-mark">ॐ</div>
      </div>

      <div className="admin-sidebar-foot">
        <div className="admin-network-card">
          <span className="admin-network-orb">✦</span>
          <div><b>Panchvani Network</b><small>456 supported cities</small></div>
        </div>
        <Link href="/" target="_blank">Open public site ↗</Link>
        <form action="/api/admin/logout" method="post"><button type="submit">Sign out</button></form>
      </div>
    </aside>

    <div className="admin-workspace">
      <header className="admin-topbar">
        <form className="admin-global-search" action="/admin/search" method="get">
          <Search size={14}/>
          <input name="q" placeholder="Search cities, pages, festivals or rules…"/>
          <kbd>⌘ K</kbd>
        </form>
        <div className="admin-topbar-right">
          <span className={connected===3?"admin-status live":"admin-status warn"}>
            <i/>{connected===3?"All data sources connected":`${connected}/3 data sources connected`}
          </span>
          <time>{now} IST</time>
          <button className="admin-icon-button" aria-label="Notifications"><Bell size={15}/></button>
          <span className="admin-avatar">A</span>
          <div className="admin-user"><b>Admin</b><small>Panchvani</small></div>
        </div>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  </div>;
}
