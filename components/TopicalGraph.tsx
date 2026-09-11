import Link from "next/link";
import type {TopicalGraphGroup} from "@/lib/topical-types";

export default function TopicalGraph({title="Explore related Panchvani",groupEyebrow="RELATED",groups}:{title?:string;groupEyebrow?:string;groups:TopicalGraphGroup[]}){
  const visible=groups.filter(group=>group.links.length);
  if(!visible.length)return null;

  return <nav className="wide-panel" aria-label={title}>
    <h2 className="page-title" style={{fontSize:32}}>{title}</h2>
    <div className="data-grid">
      {visible.map(group=><section className="data-card" key={group.title}>
        <small>{groupEyebrow}</small>
        <strong>{group.title}</strong>
        {group.description?<small>{group.description}</small>:null}
        <div className="pill-links">
          {group.links.map(link=><Link href={link.href} key={`${link.href}-${link.label}`} title={link.note}>{link.label}</Link>)}
        </div>
      </section>)}
    </div>
  </nav>;
}
