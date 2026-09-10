import OpportunityQueue from "@/components/OpportunityQueue";
import SeoLearningPanel from "@/components/SeoLearningPanel";
import {getGscConnectionStatus,getGscTrafficSnapshot} from "@/lib/gsc";
import {buildSearchOpportunities} from "@/lib/search-opportunities";
import {getOpportunityStoreStatus,readOpportunityLifecycleMap} from "@/lib/opportunity-store";
import {syncDueOpportunityOutcomes} from "@/lib/opportunity-outcome-sync";
import {readSeoAutopilotState,type SeoAutopilotRunState} from "@/lib/seo-autopilot-store";
import type {OpportunityLifecycleRecord} from "@/lib/opportunity-lifecycle";

export const dynamic="force-dynamic";

function statusClass(status:SeoAutopilotRunState["status"]){
  if(status==="SUCCESS")return "live";
  if(status==="PARTIAL")return "warn";
  return "danger";
}

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
  let autopilot:SeoAutopilotRunState|null=null;
  let autopilotError:string|null=null;

  if(storage.configured){
    try{
      [records,autopilot]=await Promise.all([readOpportunityLifecycleMap(),readSeoAutopilotState()]);
    }catch(error){storageError=error instanceof Error?error.message:"Unable to load lifecycle persistence.";}
  }

  // Admin refresh remains a fallback for due checkpoints. The daily Cron is the primary sync path.
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

  if(storage.configured&&!autopilot&&!storageError){
    try{autopilot=await readSeoAutopilotState();}
    catch(error){autopilotError=error instanceof Error?error.message:"Unable to load SEO Autopilot state.";}
  }

  const wonFlags=autopilot?.flags.filter(item=>item.recommendation==="WON").length??0;
  const iterationFlags=autopilot?.flags.filter(item=>item.recommendation==="ITERATE"||item.recommendation==="REGRESSED").length??0;

  return <div className="admin-page">
    <header className="admin-page-head">
      <div><p className="admin-eyebrow">SEO / EXECUTION</p><h1>Opportunity execution queue</h1><p>Detected → Review → Approved → Build → Shipped → Measuring → Won. SEO Autopilot runs daily at 08:00 IST; exact GSC outcome checkpoints are captured at 14, 28 and 56 days once final Search Console data is available.</p></div>
      <span className={`admin-status ${gsc.configured&&storage.configured?"live":"warn"}`}>{gsc.configured&&storage.configured?"AUTOPILOT READY":"SETUP REQUIRED"}</span>
    </header>

    {!gsc.configured?<div className="admin-alert warn"><strong>Search Console is not connected.</strong> Persisted lifecycle items can still be shown, but Autopilot cannot detect new opportunities or evaluate outcome checkpoints until GSC is configured.</div>:null}
    {gscError?<div className="admin-alert danger">{gscError}</div>:null}
    {autopilotError?<div className="admin-alert danger"><strong>Autopilot state unavailable.</strong> {autopilotError}</div>:null}
    {outcomeSyncError?<div className="admin-alert danger"><strong>Fallback outcome sync failed.</strong> {outcomeSyncError}</div>:null}
    {outcomeSynced?<div className="admin-alert"><strong>Fallback Outcome Intelligence updated.</strong> Captured {outcomeSynced} due checkpoint{outcomeSynced===1?"":"s"}{outcomePending?` · ${outcomePending} remain queued for the next Cron/admin sync.`:"."}</div>:null}

    <section className="admin-panel">
      <div className="admin-panel-head"><div><small>BACKGROUND SEO AUTOPILOT · DAILY 08:00 IST</small><h2>Autonomous monitoring status</h2></div>{autopilot?<span className={`admin-status ${statusClass(autopilot.status)}`}>{autopilot.status}</span>:<span className="admin-status warn">AWAITING FIRST RUN</span>}</div>
      {autopilot?<>
        <p className="admin-muted">Last {autopilot.trigger.toLowerCase()} run: {new Date(autopilot.completedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST · GSC window {autopilot.gscStartDate??"—"} → {autopilot.gscEndDate??"—"}. Autopilot detects and measures; it never auto-approves, auto-builds or auto-closes an opportunity as WON.</p>
        <section className="admin-kpis">
          <div className="admin-kpi"><small>Detected</small><strong>{autopilot.opportunitiesDetected}</strong><span>Actionable GSC opportunities</span></div>
          <div className="admin-kpi"><small>New queue items</small><strong>{autopilot.newlyPersisted}</strong><span>Persisted as DETECTED</span></div>
          <div className="admin-kpi"><small>Checkpoints</small><strong>{autopilot.checkpointsSynced}</strong><span>{autopilot.checkpointsPending} still pending</span></div>
          <div className="admin-kpi"><small>Outcome flags</small><strong>{autopilot.flags.length}</strong><span>{wonFlags} WON · {iterationFlags} need iteration</span></div>
        </section>
        {autopilot.flags.length?<div className="admin-mini-list">{autopilot.flags.slice(0,8).map(flag=><div key={`${flag.key}-${flag.checkpointDays}`}><span>{flag.label}</span><b>{flag.recommendation} · {flag.score}/100</b><small>{flag.checkpointDays}d checkpoint · {flag.reason}</small></div>)}</div>:<p className="admin-muted">No WON / ITERATE / REGRESSED outcome flags on the latest stored checkpoints.</p>}
        {autopilot.errors.length?<div className="admin-alert warn">{autopilot.errors.join(" · ")}</div>:null}
      </>:<p className="admin-muted">No background run state is stored yet. After the next deployed Cron invocation, this panel will show detection, checkpoint and outcome statistics.</p>}
    </section>

    <SeoLearningPanel records={records}/>
    <OpportunityQueue opportunities={opportunities} records={records} storageConfigured={storage.configured} storageError={storageError}/>
  </div>;
}
