import {getGscUrlInspections,type GscTrafficSnapshot} from "./gsc";
import type {OpportunityLifecycleRecord} from "./opportunity-lifecycle";
import type {SearchOpportunity} from "./search-opportunities";
import {analyzeIndexInspections,selectIndexInspectionCandidates,summarizeIndexation} from "./indexation-intelligence";
import {writeSeoIndexationState,type SeoIndexationRunState} from "./indexation-store";

export async function runIndexationIntelligence(
  snapshot:GscTrafficSnapshot,
  opportunities:SearchOpportunity[],
  records:Record<string,OpportunityLifecycleRecord>,
  asOf=new Date()
):Promise<SeoIndexationRunState>{
  const startedAt=asOf.toISOString();
  const candidates=selectIndexInspectionCandidates(snapshot,opportunities,records);
  try{
    const inspection=await getGscUrlInspections(candidates.map(item=>item.url));
    const findings=analyzeIndexInspections(inspection.rows,candidates,asOf);
    const summary=summarizeIndexation(findings);
    const state:SeoIndexationRunState={
      status:inspection.errors.length?"PARTIAL":"SUCCESS",
      startedAt,
      completedAt:new Date().toISOString(),
      candidates:candidates.length,
      inspected:findings.length,
      summary,
      findings,
      errors:inspection.errors
    };
    await writeSeoIndexationState(state);
    return state;
  }catch(error){
    const message=error instanceof Error?error.message:"Unknown URL Inspection failure.";
    const state:SeoIndexationRunState={
      status:"FAILED",startedAt,completedAt:new Date().toISOString(),candidates:candidates.length,inspected:0,
      summary:{inspected:0,healthy:0,critical:0,high:0,medium:0,info:0,indexedPass:0,canonicalMismatches:0,crawlBlocks:0,fetchErrors:0},
      findings:[],errors:[message]
    };
    await writeSeoIndexationState(state).catch(()=>{});
    throw error;
  }
}
