import { CheckCircle2, Cloud, GitBranch } from "lucide-react";
import { getDataSourceStatus } from "@/lib/data-sources";

export default function Deployments(){
  const sources=getDataSourceStatus();
  return <div className="admin-page">
    <header className="admin-page-head"><div><p className="admin-eyebrow">BUILD & DEPLOY</p><h1>Deployments</h1><p>Production architecture and release-health control surface.</p></div></header>
    <section className="admin-grid-two">
      <article className="admin-panel"><div className="admin-production"><GitBranch size={18}/><span><b>GitHub quality pipeline</b><small>Compatibility → regression → Next build → vinext bundle</small></span></div><div className="admin-system-list"><div><CheckCircle2/><span>Regression suite</span><b className="ok">Enabled</b></div><div><CheckCircle2/><span>Next.js reference build</span><b className="ok">Enabled</b></div><div><CheckCircle2/><span>Cloudflare vinext bundle</span><b className="ok">Enabled</b></div></div></article>
      <article className="admin-panel"><div className="admin-production"><Cloud size={18}/><span><b>Cloudflare runtime</b><small>Workers + vinext production delivery</small></span></div><p>{sources.cloudflare.configured?"Cloudflare analytics credentials are configured; runtime analytics integration can now be enabled.":"Deploy history, Worker errors, edge requests and cache telemetry require Cloudflare Analytics API access."}</p></article>
    </section>
  </div>;
}
