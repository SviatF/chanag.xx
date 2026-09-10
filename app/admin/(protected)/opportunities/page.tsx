import OpportunityQueue from "@/components/OpportunityQueue";
import {getGscConnectionStatus,getGscTrafficSnapshot} from "@/lib/gsc";
import {buildSearchOpportunities} from "@/lib/search-opportunities";
import {getOpportunityStoreStatus,readOpportunityLifecycleMap} from "@/lib/opportunity-store";
import {syncDueOpportunityOutcomes} from "@/lib/opportunity-outcome-sync";
import type {OpportunityLifecycleRecord} from "@/lib/opportunity-lifecycle";

export const dynamic="force-dynamic";

export default async function OpportunityExecutionPage(){
  const gsc=getGscConnectionStatus();
  const storage=getOpportunityStoreStatus();
  let records:Record<string,OpportunityLifecycleRecord>={};
  let storageError:string|null=null;
  let opportunities=await Promise.resolve([] as ReturnType<typeof buildSearchOpportunities>);
  let gscError:string|null=null;
  let outcomeSyncError:string|null=null;
  let outcomeSynced=0;
  let outcomePending=0;

  if(storage.configured){
    try{records=await readOpportunityLifecycleMap();}
    catch(error){storageError=error instanceof Error?error.message:"Unable to load lifecycle persistence.";}
  }

  if(gsc.configured&&storage.configured&&!storageError){
    try{
      const result=await syncDueOpportunityOutcomes(records);
      records=result.records;
      outcomeSynced=result.synced;
      outcomePending=result.pending;
    }catch(error){outcomeSyncError=error instanceof Error?error.message:"Unable to sync outcome checkpoints.";}
  }

  if(gsc.configured){
    try{opportunities=buildSearchOpportunities(await getGscTrafficSnapshot());}
    catch(error){gscError=error instanceof Error?error.message:"Unable to load Search Console opportunities.";}
  }

  return <div className="admin-page">
    <header className="admin-page-head">
      <div><p className="admin-eyebrow">SEO / EXECUTION</p><h1>Opportunity execution queue</h1><p>Detected → Review → Approved → Build → Shipped → Measuring → Won. Exact GSC outcome checkpoints are captured at 14, 28 and 56 days after launch once final Search Console data is available.</p></div>
      <span className={`admin-status ${gsc.configured&&storage.configured?"live":"warn"}`}>{gsc.configured&&storage.configured?"LIVE PIPELINE":"SETUP REQUIRED"}</span>
    </header>

    {!gsc.configured?<div className="admin-alert warn"><strong>Search Console is not connected.</strong> Persisted lifecycle items can still be shown, but new opportunities and outcome checkpoints cannot be evaluated until GSC is configured.</div>:null}
    {gscError?<div className="admin-alert danger">{gscError}</div>:null}
    {outcomeSyncError?<div className="admin-alert danger"><strong>Outcome sync failed.</strong> {outcomeSyncError}</div>:null}
    {outcomeSynced?<div className="admin-alert"><strong>Outcome Intelligence updated.</strong> Captured {outcomeSynced} due checkpoint{outcomeSynced===1?"":"s"}{outcomePending?` · ${outcomePending} remain queued for the next admin refresh.`:"."}</div>:null}

    <OpportunityQueue opportunities={opportunities} records={records} storageConfigured={storage.configured} storageError={storageError}/>
  </div>;
}
