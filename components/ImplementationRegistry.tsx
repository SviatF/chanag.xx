"use client";

import {useEffect,useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import type {OpportunityLifecycleRecord} from "@/lib/opportunity-lifecycle";
import {activeImplementation,implementationAttributionStatus,implementationCommitUrl,implementationReadyForShip} from "@/lib/seo-change-registry";

type Props={record:OpportunityLifecycleRecord;persisted:boolean;storageConfigured:boolean;};
type Draft={hypothesis:string;commitSha:string;prUrl:string;changedFiles:string;deployedUrl:string;versionLabel:string;note:string};
const EMPTY:Draft={hypothesis:"",commitSha:"",prUrl:"",changedFiles:"",deployedUrl:"",versionLabel:"",note:""};

function draftFrom(record:OpportunityLifecycleRecord):Draft{
  const active=activeImplementation(record);
  return {hypothesis:active?.hypothesis??"",commitSha:active?.commitSha??"",prUrl:active?.prUrl??"",changedFiles:active?.changedFiles.join("\n")??"",deployedUrl:active?.deployedUrl??"",versionLabel:active?.versionLabel??"",note:active?.note??""};
}

export default function ImplementationRegistry({record,persisted,storageConfigured}:Props){
  const router=useRouter();
  const active=activeImplementation(record);
  const attribution=implementationAttributionStatus(record);
  const [draft,setDraft]=useState<Draft>(()=>draftFrom(record));
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [forceNew,setForceNew]=useState(false);
  const editing=forceNew?null:active;
  const canEdit=forceNew||!active?.shippedAt;
  const ready=implementationReadyForShip(active);
  const commitUrl=active?implementationCommitUrl(active):null;
  const history=useMemo(()=>[...(record.implementations??[])].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),[record.implementations]);

  useEffect(()=>{
    if(forceNew)return;
    setDraft(draftFrom(record));
  },[record.updatedAt,record.activeImplementationId,forceNew]);

  function field(name:keyof Draft,value:string){setDraft(current=>({...current,[name]:value}));}

  async function save(){
    if(!storageConfigured||!persisted||busy||!canEdit)return;
    setBusy(true);setError(null);
    try{
      const response=await fetch("/api/admin/opportunities/implementation",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({key:record.key,id:editing?.id,expectedUpdatedAt:record.updatedAt,hypothesis:draft.hypothesis,commitSha:draft.commitSha,prUrl:draft.prUrl,changedFiles:draft.changedFiles,deployedUrl:draft.deployedUrl,versionLabel:draft.versionLabel,note:draft.note})});
      const json=await response.json() as {error?:string};
      if(!response.ok)throw new Error(json.error??`Implementation evidence update failed (${response.status})`);
      setForceNew(false);router.refresh();
    }catch(err){setError(err instanceof Error?err.message:"Unable to save implementation evidence.");}
    finally{setBusy(false);}
  }

  function startNew(){setForceNew(true);setDraft(EMPTY);setError(null);}
  function cancelNew(){setForceNew(false);setDraft(draftFrom(record));setError(null);}

  return <div className="admin-mini-list">
    <div><span className={`admin-badge ${attribution.status==="SHIPPED"||attribution.status==="READY"?"active":attribution.status==="UNATTRIBUTED"?"hold":"watch"}`}>{attribution.label}</span><small>{record.shippedAt&&!record.shippedImplementationId?"Historical/current launch has no implementation snapshot attached.":ready&&!active?.shippedAt?"Hypothesis + code reference + deployed URL are present; this implementation is attributable at SHIPPED.":active?.shippedAt?`Frozen at ${active.shippedAt.slice(0,10)}.`:"Add hypothesis, commit/PR and deployed URL before SHIPPED."}</small></div>

    {active?<div><b>{active.versionLabel||active.id}</b><small>{active.hypothesis}</small>{commitUrl?<small><a href={commitUrl} target="_blank" rel="noreferrer">Commit {active.commitSha}</a></small>:null}{active.prUrl?<small><a href={active.prUrl} target="_blank" rel="noreferrer">Pull request</a></small>:null}{active.deployedUrl?<small><a href={active.deployedUrl} target="_blank" rel="noreferrer">Deployed URL</a></small>:null}{active.changedFiles.length?<small>{active.changedFiles.length} changed file{active.changedFiles.length===1?"":"s"}: {active.changedFiles.slice(0,4).join(" · ")}{active.changedFiles.length>4?" …":""}</small>:null}</div>:null}

    {canEdit?<>
      {forceNew?<small><b>New iteration:</b> this creates a new immutable implementation record once shipped.</small>:null}
      <textarea rows={2} value={draft.hypothesis} onChange={event=>field("hypothesis",event.target.value)} placeholder="Implementation hypothesis — what change should move which SEO signal?" disabled={!storageConfigured||!persisted||busy}/>
      <input value={draft.commitSha} onChange={event=>field("commitSha",event.target.value)} placeholder="Commit SHA (7–40 hex)" disabled={!storageConfigured||!persisted||busy}/>
      <input value={draft.prUrl} onChange={event=>field("prUrl",event.target.value)} placeholder="PR URL (optional alternative to commit)" disabled={!storageConfigured||!persisted||busy}/>
      <textarea rows={2} value={draft.changedFiles} onChange={event=>field("changedFiles",event.target.value)} placeholder="Changed files — one per line" disabled={!storageConfigured||!persisted||busy}/>
      <input value={draft.deployedUrl} onChange={event=>field("deployedUrl",event.target.value)} placeholder="Deployed HTTPS URL" disabled={!storageConfigured||!persisted||busy}/>
      <input value={draft.versionLabel} onChange={event=>field("versionLabel",event.target.value)} placeholder="Version / release label (optional)" disabled={!storageConfigured||!persisted||busy}/>
      <textarea rows={2} value={draft.note} onChange={event=>field("note",event.target.value)} placeholder="Implementation note (optional)" disabled={!storageConfigured||!persisted||busy}/>
      <button type="button" className="admin-badge activate" onClick={save} disabled={!storageConfigured||!persisted||busy||!draft.hypothesis.trim()}>{busy?"Saving…":editing?"Update evidence":"Register implementation"}</button>{forceNew?<button type="button" className="admin-badge hold" onClick={cancelNew} disabled={busy}>Cancel</button>:null}
      {!persisted?<small>Move this opportunity into the persisted lifecycle first (for example REVIEW) before registering implementation evidence.</small>:null}
    </>:<button type="button" className="admin-badge watch" onClick={startNew}>Start next iteration evidence</button>}

    {error?<small>{error}</small>:null}
    {history.length>1?<div><b>Registry history</b><small>{history.map(item=>`${item.versionLabel||item.id}${item.shippedAt?` · shipped ${item.shippedAt.slice(0,10)}`:" · draft"}`).join(" | ")}</small></div>:null}
  </div>;
}
