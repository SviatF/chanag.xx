"use client";

import {useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import {RefreshCw,Search} from "lucide-react";
import styles from "./UrlIndexationInventory.module.css";

export type UrlInventoryRow={
  url:string;
  status:"INDEXED"|"NOT_INDEXED"|"UNKNOWN";
  coverageState:string;
  lastCrawlTime:string|null;
  googleCanonical:string|null;
  inspectedAt:string|null;
};

type Filter="ALL"|"INDEXED"|"NOT_INDEXED"|"UNKNOWN";
const PAGE_SIZE=50;

function path(raw:string){try{return new URL(raw).pathname||"/";}catch{return raw;}}
function date(raw:string|null){if(!raw)return "—";const d=new Date(raw);return Number.isNaN(d.getTime())?"—":d.toLocaleString("en-IN",{timeZone:"Asia/Kolkata",day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});}

export default function UrlIndexationInventory({rows}:{rows:UrlInventoryRow[]}){
  const router=useRouter();
  const [filter,setFilter]=useState<Filter>("ALL");
  const [query,setQuery]=useState("");
  const [page,setPage]=useState(1);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState<string|null>(null);

  const filtered=useMemo(()=>{
    const q=query.trim().toLowerCase();
    return rows.filter(row=>(filter==="ALL"||row.status===filter)&&(!q||row.url.toLowerCase().includes(q)||row.coverageState.toLowerCase().includes(q)));
  },[rows,filter,query]);
  const pages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
  const safePage=Math.min(page,pages);
  const visible=filtered.slice((safePage-1)*PAGE_SIZE,safePage*PAGE_SIZE);
  const unknown=rows.filter(row=>row.status==="UNKNOWN").length;

  async function inspectNext(){
    if(busy||!unknown)return;
    setBusy(true);setMessage(null);
    try{
      const response=await fetch("/api/admin/indexation-inventory",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({batchSize:25})});
      const json=await response.json() as {error?:string;inspected?:number;remaining?:number;done?:boolean};
      if(!response.ok)throw new Error(json.error??`Inspection failed (${response.status})`);
      setMessage(json.done?"All sitemap URLs already have a stored inspection.":`Inspected ${json.inspected??0} URLs · ${json.remaining??0} awaiting inspection.`);
      router.refresh();
    }catch(error){setMessage(error instanceof Error?error.message:"Inspection failed.");}
    finally{setBusy(false);}
  }

  function choose(next:Filter){setFilter(next);setPage(1);}

  return <section className="admin-panel">
    <div className={`admin-panel-head ${styles.head}`}>
      <div><small>FULL SITEMAP INVENTORY</small><h2>Every indexable URL</h2><p>Stored URL Inspection state for every URL currently present in the live sitemap footprint.</p></div>
      <button className={styles.inspectButton} type="button" onClick={inspectNext} disabled={busy||!unknown}><RefreshCw size={14}/>{busy?"Inspecting 25…":unknown?"Inspect next 25":"Inspection complete"}</button>
    </div>

    <div className={styles.controls}>
      <div className={styles.filters}>
        {(["ALL","INDEXED","NOT_INDEXED","UNKNOWN"] as Filter[]).map(item=><button type="button" key={item} onClick={()=>choose(item)} className={filter===item?styles.active:""}>{item==="NOT_INDEXED"?"Not indexed":item==="UNKNOWN"?"Awaiting":item.charAt(0)+item.slice(1).toLowerCase()} <b>{item==="ALL"?rows.length:rows.filter(row=>row.status===item).length}</b></button>)}
      </div>
      <label className={styles.search}><Search size={14}/><input value={query} onChange={event=>{setQuery(event.target.value);setPage(1);}} placeholder="Search URL or coverage state…"/></label>
    </div>

    {message?<div className={styles.message}>{message}</div>:null}

    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead><tr><th>#</th><th>URL</th><th>Index status</th><th>Google coverage</th><th>Last crawl</th><th>Last inspection</th></tr></thead>
        <tbody>{visible.map((row,index)=><tr key={row.url}>
          <td>{(safePage-1)*PAGE_SIZE+index+1}</td>
          <td><a href={row.url} target="_blank" rel="noreferrer"><strong>{path(row.url)}</strong></a>{row.googleCanonical&&row.googleCanonical!==row.url?<small>Google canonical: {path(row.googleCanonical)}</small>:null}</td>
          <td><span className={`${styles.status} ${row.status==="INDEXED"?styles.indexed:row.status==="NOT_INDEXED"?styles.notIndexed:styles.unknown}`}>{row.status==="INDEXED"?"INDEXED":row.status==="NOT_INDEXED"?"NOT INDEXED":"AWAITING"}</span></td>
          <td><small>{row.coverageState||"Not inspected yet"}</small></td>
          <td><small>{date(row.lastCrawlTime)}</small></td>
          <td><small>{date(row.inspectedAt)}</small></td>
        </tr>)}</tbody>
      </table>
    </div>

    <div className={styles.pagination}><span>{filtered.length.toLocaleString("en-IN")} matching URLs</span><div><button type="button" disabled={safePage<=1} onClick={()=>setPage(value=>Math.max(1,value-1))}>← Prev</button><span>{safePage} / {pages}</span><button type="button" disabled={safePage>=pages} onClick={()=>setPage(value=>Math.min(pages,value+1))}>Next →</button></div></div>
  </section>;
}
