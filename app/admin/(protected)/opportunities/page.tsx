import OpportunityQueue from "@/components/OpportunityQueue";
import {getGscConnectionStatus,getGscTrafficSnapshot} from "@/lib/gsc";
import {buildSearchOpportunities} from "@/lib/search-opportunities";
import {getOpportunityStoreStatus,readOpportunityLifecycleMap} from "@/lib/opportunity-store";
import type {OpportunityLifecycleRecord} from "@/lib/opportunity-lifecycle";

export const dynamic="force-dynamic";

export default async function OpportunityExecutionPage(){
  const gsc=getGscConnectionStatus();
  const storage=getOpportunityStoreStatus();
  let records:Record<string,OpportunityLifecycleRecord>={};
  let storageError:string|null=null;
  let opportunities=await Promise.resolve([] as ReturnType<typeof buildSearchOpportunities>);
  let gscError:string|null=null;

  if(storage.configured){
    try{records=await readOpportunityLifecycleMap();}
    catch(error){storageError=error instanceof Error?error.message:"Unable to load lifecycle persistence.";}
  }

  if(gsc.configured){
    try{opportunities=buildSearchOpportunities(await getGscTrafficSnapshot());}
    catch(error){gscError=error instanceof Error?error.message:"Unable to load Search Console opportunities.";}
  }

  return <div className="admin-page">
    <header className="admin-page-head">
      <div><p className="admin-eyebrow">SEO / EXECUTION</p><h1>Opportunity execution queue</h1><p>Detected → Review → Approved → Build → Shipped → Measuring → Won. Search demand and execution state remain separate so evidence can update without erasing project history.</p></div>
      <span className={`admin-status ${gsc.configured&&storage.configured?"live":"warn"}`}>{gsc.configured&&storage.configured?"LIVE PIPELINE":"SETUP REQUIRED"}</span>
    </header>

    {!gsc.configured?<div className="admin-alert warn"><strong>Search Console is not connected.</strong> Persisted lifecycle items can still be shown, but new opportunities cannot be detected until GSC is configured.</div>:null}
    {gscError?<div className="admin-alert danger">{gscError}</div>:null}

    <OpportunityQueue opportunities={opportunities} records={records} storageConfigured={storage.configured} storageError={storageError}/>
  </div>;
}
