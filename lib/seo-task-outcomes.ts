import {evaluateTask,type SeoMetric} from "./seo-operating-system";
import type {SeoCommandTask,SeoTaskMap,SeoTaskOutcome} from "./seo-task-store";

function clamp(value:number,min=0,max=100){return Math.max(min,Math.min(max,value));}
function safePct(current:number,previous:number){if(previous<=0)return current>0?100:null;return ((current-previous)/previous)*100;}
function finiteDate(value:string){const time=Date.parse(value);return Number.isFinite(time)?time:null;}

export function buildSeoTaskOutcome(task:SeoCommandTask,current:SeoMetric|null,measuredAt:string,measurementSnapshotAt:string):SeoTaskOutcome{
  const metric=current??{impressions:0,clicks:0,ctr:0,position:0};
  const impressionsChangePct=safePct(metric.impressions,task.baseline.impressions);
  const clicksChangePct=safePct(metric.clicks,task.baseline.clicks);
  const ctrDeltaPoints=(metric.ctr-task.baseline.ctr)*100;
  const positionImprovement=metric.impressions>0&&task.baseline.position>0?task.baseline.position-metric.position:null;

  let score=50;
  if(metric.clicks>task.baseline.clicks)score+=20;else if(metric.clicks<task.baseline.clicks)score-=15;
  if(impressionsChangePct!==null){if(impressionsChangePct>=30)score+=15;else if(impressionsChangePct<=-40)score-=15;else if(impressionsChangePct>0)score+=5;else if(impressionsChangePct<0)score-=5;}
  if(ctrDeltaPoints>=.3)score+=10;else if(ctrDeltaPoints<=-.3)score-=10;
  if(positionImprovement!==null){if(positionImprovement>=3)score+=20;else if(positionImprovement<=-5)score-=20;else if(positionImprovement>=1)score+=8;else if(positionImprovement<=-2)score-=8;}

  return {measuredAt,measurementSnapshotAt,metric,impressionsChangePct,clicksChangePct,ctrDeltaPoints,positionImprovement,score:Math.round(clamp(score))};
}

export function reconcileSeoTaskOutcomes(tasks:SeoTaskMap,metricsByUrl:Map<string,SeoMetric>,nowIso:string,measurementSnapshotAt:string){
  const now=finiteDate(nowIso);
  if(now===null)throw new Error("Invalid SEO task reconciliation timestamp.");
  const snapshot=finiteDate(measurementSnapshotAt);
  if(snapshot===null)throw new Error("Invalid SEO measurement snapshot timestamp.");

  let changed=false;
  const measuredIds:string[]=[];
  const next:SeoTaskMap={...tasks};

  for(const [id,task] of Object.entries(tasks)){
    if(task.status==="closed")continue;
    const verifyAt=finiteDate(task.verifyAt);
    if(verifyAt===null||verifyAt>now)continue;
    const snoozedUntil=task.snoozedUntil?finiteDate(task.snoozedUntil):null;
    if(task.status==="snoozed"&&snoozedUntil!==null&&snoozedUntil>now)continue;
    if(task.result&&task.result!=="low_data"&&task.outcome)continue;
    if(task.measurementSnapshotAt===measurementSnapshotAt)continue;

    const metric=metricsByUrl.get(task.url)??null;
    const result=evaluateTask(task,metric);
    const outcome=buildSeoTaskOutcome(task,metric,nowIso,measurementSnapshotAt);
    next[id]={
      ...task,
      status:"review_ready",
      result,
      measuredAt:nowIso,
      measurementSnapshotAt,
      outcome,
      snoozedUntil:undefined,
      updatedAt:nowIso,
    };
    changed=true;
    measuredIds.push(id);
  }

  return {tasks:changed?next:tasks,changed,measuredIds};
}
