import Link from "next/link";
import type { ReactNode } from "react";

const nav=[
  ["Overview","/admin"],
  ["Traffic & Demand","/admin/traffic"],
  ["Cities","/admin/cities"],
  ["Festivals","/admin/festivals"],
  ["Muhurat Rules","/admin/muhurat"],
  ["System","/admin/system"],
] as const;

export default function AdminShell({children}:{children:ReactNode}){
  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <Link className="admin-brand" href="/admin">
        <small>PANCHANG</small>
        <strong>Control Plane</strong>
      </Link>
      <nav className="admin-nav">
        {nav.map(([label,href])=><Link href={href} key={href}>{label}</Link>)}
      </nav>
      <div className="admin-sidebar-foot">
        <Link href="/" target="_blank">Open public site ↗</Link>
        <form action="/api/admin/logout" method="post"><button type="submit">Sign out</button></form>
      </div>
    </aside>
    <main className="admin-main">{children}</main>
  </div>;
}
