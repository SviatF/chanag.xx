import type {OpportunityImplementationEvidence,OpportunityLifecycleRecord} from "./opportunity-lifecycle";

export type ImplementationEvidenceInput={
  id:string;
  hypothesis:string;
  commitSha?:string|null;
  prUrl?:string|null;
  changedFiles?:string[];
  deployedUrl?:string|null;
  versionLabel?:string|null;
  note?:string;
};

export function implementationHasCodeReference(item:OpportunityImplementationEvidence){
  return Boolean(item.commitSha||item.prUrl);
}

export function implementationReadyForShip(item:OpportunityImplementationEvidence|undefined|null){
  return Boolean(item&&item.hypothesis.trim()&&implementationHasCodeReference(item)&&item.deployedUrl);
}

export function activeImplementation(record:OpportunityLifecycleRecord){
  if(!record.activeImplementationId)return null;
  return record.implementations?.find(item=>item.id===record.activeImplementationId)??null;
}

export function shippedImplementation(record:OpportunityLifecycleRecord){
  if(!record.shippedImplementationId)return null;
  return record.implementations?.find(item=>item.id===record.shippedImplementationId)??null;
}

export function registerImplementationEvidence(
  record:OpportunityLifecycleRecord,
  input:ImplementationEvidenceInput,
  now:string
):OpportunityLifecycleRecord{
  const existing=record.implementations?.find(item=>item.id===input.id);
  if(existing?.shippedAt)throw new Error("Shipped implementation evidence is immutable. Register a new implementation for another iteration.");

  const evidence:OpportunityImplementationEvidence={
    id:input.id,
    hypothesis:input.hypothesis.trim(),
    commitSha:input.commitSha?.trim()||null,
    prUrl:input.prUrl?.trim()||null,
    changedFiles:[...new Set((input.changedFiles??[]).map(item=>item.trim()).filter(Boolean))],
    deployedUrl:input.deployedUrl?.trim()||null,
    versionLabel:input.versionLabel?.trim()||null,
    note:input.note?.trim()??"",
    createdAt:existing?.createdAt??now,
    updatedAt:now,
  };

  const implementations=[...(record.implementations??[]).filter(item=>item.id!==input.id),evidence]
    .sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
  return {...record,implementations,activeImplementationId:evidence.id,updatedAt:now};
}

export function implementationAttributionStatus(record:OpportunityLifecycleRecord){
  const active=activeImplementation(record);
  const shipped=shippedImplementation(record);
  if(record.shippedAt&&!shipped)return {status:"UNATTRIBUTED" as const,label:"Unattributed launch",implementation:null};
  if(shipped)return {status:"SHIPPED" as const,label:"Attributed launch",implementation:shipped};
  if(active&&implementationReadyForShip(active))return {status:"READY" as const,label:"Ready to ship",implementation:active};
  if(active)return {status:"DRAFT" as const,label:"Evidence draft",implementation:active};
  return {status:"MISSING" as const,label:"No implementation evidence",implementation:null};
}

export function implementationCommitUrl(item:OpportunityImplementationEvidence){
  return item.commitSha?`https://github.com/SviatF/chanag.xx/commit/${item.commitSha}`:null;
}
