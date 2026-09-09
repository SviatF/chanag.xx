import { getGscConnectionStatus } from "@/lib/gsc";
import { getDataSourceStatus } from "@/lib/data-sources";

export default function AdminSettings(){
  const gsc=getGscConnectionStatus();
  const sources=getDataSourceStatus();
  const vars=[
    ["ADMIN_PASSWORD",Boolean(process.env.ADMIN_PASSWORD),"Secret"],
    ["ADMIN_SESSION_SECRET",Boolean(process.env.ADMIN_SESSION_SECRET),"Secret"],
    ["GOOGLE_SERVICE_ACCOUNT_EMAIL",gsc.required.GOOGLE_SERVICE_ACCOUNT_EMAIL,"Variable / Secret"],
    ["GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",gsc.required.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,"Secret"],
    ["GSC_SITE_URL",gsc.required.GSC_SITE_URL,"Variable"],
    ["GA4_PROPERTY_ID",sources.ga4.configured,"Variable"],
    ["CLOUDFLARE_ACCOUNT_ID",Boolean(process.env.CLOUDFLARE_ACCOUNT_ID),"Variable"],
    ["CLOUDFLARE_ZONE_ID",Boolean(process.env.CLOUDFLARE_ZONE_ID),"Variable"],
    ["CLOUDFLARE_API_TOKEN",Boolean(process.env.CLOUDFLARE_API_TOKEN),"Secret"],
  ] as const;
  return <div className="admin-page">
    <header className="admin-page-head"><div><p className="admin-eyebrow">CONTROL PLANE SETTINGS</p><h1>Settings</h1><p>Runtime configuration health. Secret values are never rendered.</p></div></header>
    <section className="admin-panel"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Environment key</th><th>Type</th><th>Status</th></tr></thead><tbody>
      {vars.map(([key,ready,type])=><tr key={key}><td><strong>{key}</strong></td><td>{type}</td><td><span className={ready?"admin-badge active":"admin-badge watch"}>{ready?"READY":"NOT SET"}</span></td></tr>)}
    </tbody></table></div></section>
  </div>;
}
