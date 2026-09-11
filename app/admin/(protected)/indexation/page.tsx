import Link from "next/link";
import {CheckCircle2,Clock3,Database,SearchX} from "lucide-react";
import {getLiveSitemapSnapshot} from "@/lib/sitemap-live";
import {classifyIndexationRecord,readUrlIndexationInventory} from "@/lib/indexation-inventory-store";
import UrlIndexationInventory,{type UrlInventoryRow} from "@/components/UrlIndexationInventory";

export const dynamic="force-dynamic";

function n(value:number){return value.toLocaleString("en-IN");}

export default async function IndexationInventoryPage(){
  let error:string|null=null;
  let rows:UrlInventoryRow[]=[];
  let checkedAt:string|null=null;
  let inventoryUpdated:string|null=null;

  try{
    const [sitemap,inventory]=await Promise.all([getLiveSitemapSnapshot(),readUrlIndexationInventory()]);
    checkedAt=sitemap.checkedAt;
    inventoryUpdated=inventory.updatedAt;
    rows=sitemap.allUrls.map(url=>{
      const record=inventory.records[url];
      return {
        url,
        status:classifyIndexationRecord(record),
        coverageState:record?.coverageState??"",
        lastCrawlTime:record?.lastCrawlTime??null,
        googleCanonical:record?.googleCanonical??null,
        inspectedAt:record?.inspectedAt??null,
      };
    });
  }catch(cause){error=cause instanceof Error?cause.message:"Unable to load URL indexation inventory.";}

  const indexed=rows.filter(row=>row.status==="INDEXED").length;
  const notIndexed=rows.filter(row=>row.status==="NOT_INDEXED").length;
  const awaiting=rows.filter(row=>row.status==="UNKNOWN").length;
  const inspected=rows.length-awaiting;
  const inspectedCoverage=rows.length?inspected/rows.length:0;

  return <div className="admin-page">
    <header className="admin-page-head">
      <div><p className="admin-eyebrow">GOOGLE INDEX INVENTORY</p><h1>URL Indexation</h1><p>One control surface for every URL in the live sitemap footprint and its stored Google URL Inspection state.</p></div>
      <Link href="/admin/seo">SEO & Indexing →</Link>
    </header>

    {error?<div className="admin-alert danger">{error}</div>:null}

    <section className="admin-kpis">
      <article className="admin-kpi admin-kpi-rich"><div className="admin-kpi-icon"><Database size={19}/></div><div><small>Sitemap URLs</small><strong>{n(rows.length)}</strong><span>Current live indexable footprint</span></div></article>
      <article className="admin-kpi admin-kpi-rich"><div className="admin-kpi-icon"><CheckCircle2 size={19}/></div><div><small>Known indexed</small><strong>{n(indexed)}</strong><span>Google URL Inspection verdict PASS</span></div></article>
      <article className="admin-kpi admin-kpi-rich"><div className="admin-kpi-icon"><SearchX size={19}/></div><div><small>Known not indexed</small><strong>{n(notIndexed)}</strong><span>Inspected URLs with non-indexed state</span></div></article>
      <article className="admin-kpi admin-kpi-rich"><div className="admin-kpi-icon"><Clock3 size={19}/></div><div><small>Awaiting inspection</small><strong>{n(awaiting)}</strong><span>{rows.length?`${(inspectedCoverage*100).toFixed(1)}% inspection coverage`:"No sitemap inventory"}</span></div></article>
    </section>

    <section className="admin-panel">
      <div className="admin-panel-head"><div><small>IMPORTANT</small><h2>What these totals mean</h2></div><span>{inspected}/{rows.length} inspected</span></div>
      <p>Google Search Console does not expose a bulk API that returns the exact index status of every sitemap URL in one call. <strong>Known indexed</strong> and <strong>Known not indexed</strong> are confirmed URL Inspection results. <strong>Awaiting inspection</strong> is intentionally not counted as “not indexed”. The control plane fills this inventory in controlled 25-URL batches and preserves results between runs.</p>
      <p className="admin-muted">Live sitemap checked: {checkedAt?new Date(checkedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"}):"—"} IST · Inventory updated: {inventoryUpdated&&new Date(inventoryUpdated).getTime()>0?new Date(inventoryUpdated).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"}):"never"} IST.</p>
    </section>

    <UrlIndexationInventory rows={rows}/>
  </div>;
}
