"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, BarChart3, CalendarDays, Database, FileText,
  Gauge, MapPin, Network, Search, Settings, ShieldCheck, Sparkles
} from "lucide-react";

const primary=[
  ["Overview","/admin",Gauge],
  ["Traffic & Demand","/admin/traffic",BarChart3],
  ["Opportunity Queue","/admin/opportunities",Database],
  ["Cities","/admin/cities",MapPin],
  ["Festivals","/admin/festivals",CalendarDays],
  ["Muhurat Rules","/admin/muhurat",Sparkles],
] as const;

const operations=[
  ["Content","/admin/content",FileText],
  ["SEO & Indexing","/admin/seo",Search],
  ["Deployments","/admin/deployments",Network],
  ["Monitoring","/admin/monitoring",Activity],
  ["System","/admin/system",ShieldCheck],
  ["Settings","/admin/settings",Settings],
] as const;

function NavGroup({items}:{items:readonly (readonly [string,string,React.ComponentType<{size?:number;strokeWidth?:number}>])[]}){
  const pathname=usePathname();
  return <div className="admin-nav-group">
    {items.map(([label,href,Icon])=>{
      const active=href==="/admin"?pathname==="/admin":pathname.startsWith(href);
      return <Link href={href} key={href} className={active?"active":""}>
        <Icon size={15} strokeWidth={1.7}/><span>{label}</span>
      </Link>;
    })}
  </div>;
}

export default function AdminNav(){
  return <nav className="admin-nav">
    <NavGroup items={primary}/>
    <div className="admin-nav-divider"/>
    <NavGroup items={operations}/>
  </nav>;
}
