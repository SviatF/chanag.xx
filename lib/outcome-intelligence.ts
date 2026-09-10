import type {GscOutcomeComparison} from "./gsc";
import type {
  OpportunityCheckpointDays,
  OpportunityLifecycleRecord,
  OpportunityOutcomeCheckpoint,
  OpportunityOutcomeRecommendation,
  OpportunityOutcomeSignal,
  OpportunityOutcomeWindow
} from "./opportunity-lifecycle";

export const outcomeCheckpointDays=[14,28,56] as const satisfies readonly OpportunityCheckpointDays[];
export const GSC_FINALITY_LAG_DAYS=2;

function clamp(value:number,min:number,max:number){return Math.max(min,Math.min(max,value));}
function iso(date:Date){return date.toISOString().slice(0,10);}
function shift(date:Date,days:number){const next=new Date(date);next.setUTCDate(next.getUTCDate()+days);return next;}
function pctChange(before:number,after:number){return before>0?((after-before)/before)*100:after>0?null:0;}

function pathOnly(raw:string|null){
  if(!raw)return null;
  try{return new URL(raw).pathname.replace(/\/$/,"")||"/";}
  catch{return raw.split("?")[0].replace(/^https?:\/\/[^/]+/,"").replace(/\/$/,"")||"/";}
}

export function landingMatchesRecommendation(landing:string|null,recommendedPath:string){
  const current=pathOnly(landing);
  const expected=pathOnly(recommendedPath);
  if(!current||!expected)return false;
  if(expected==="/")return current==="/";
  return current===expected||current.startsWith(expected+"/");
}

export function checkpointReadyAt(shippedAt:string,days:OpportunityCheckpointDays){
  const shipped=new Date(`${shippedAt.slice(0,10)}T00:00:00Z`);
  if(Number.isNaN(shipped.getTime()))throw new Error("Invalid shippedAt date for outcome checkpoint.");
  return iso(shift(shipped,days-1+GSC_FINALITY_LAG_DAYS));
}

export function dueOutcomeCheckpoints(record:OpportunityLifecycleRecord,asOf=new Date()):OpportunityCheckpointDays[]{
  if(!record.shippedAt||record.stage==="REJECTED")return [];
  const existing=new Set((record.outcomes??[]).map(item=>item.days));
  const today=iso(asOf);
  return outcomeCheckpointDays.filter(days=>!existing.has(days)&&today>=checkpointReadyAt(record.shippedAt!,days));
}

export function nextOutcomeCheckpoint(record:OpportunityLifecycleRecord,asOf=new Date()){
  if(!record.shippedAt)return null;
  const existing=new Set((record.outcomes??[]).map(item=>item.days));
  const next=outcomeCheckpointDays.find(days=>!existing.has(days));
  if(!next)return null;
  const readyAt=checkpointReadyAt(record.shippedAt,next);
  return {days:next,readyAt,due:iso(asOf)>=readyAt};
}

function copyWindow(window:GscOutcomeComparison["pre"]):OpportunityOutcomeWindow{return {...window};}

function scoreOutcome(pre:OpportunityOutcomeWindow,post:OpportunityOutcomeWindow,landingAligned:boolean,clicksChangePct:number|null,impressionsChangePct:number|null,ctrDeltaPoints:number,positionImprovement:number|null){
  if(post.impressions<5)return 20;
  let score=50;
  score+=landingAligned?15:-20;
  if(clicksChangePct===null)score+=post.clicks>0?15:0;
  else if(clicksChangePct>=50)score+=15;
  else if(clicksChangePct>=20)score+=10;
  else if(clicksChangePct<=-40)score-=15;
  else if(clicksChangePct<=-20)score-=9;
  if(impressionsChangePct===null)score+=post.impressions>=10?10:0;
  else if(impressionsChangePct>=40)score+=10;
  else if(impressionsChangePct>=15)score+=6;
  else if(impressionsChangePct<=-35)score-=10;
  else if(impressionsChangePct<=-15)score-=6;
  if(ctrDeltaPoints>=2)score+=10;
  else if(ctrDeltaPoints>=.5)score+=6;
  else if(ctrDeltaPoints<=-2)score-=10;
  else if(ctrDeltaPoints<=-.5)score-=5;
  if(positionImprovement!==null){
    if(positionImprovement>=5)score+=15;
    else if(positionImprovement>=2)score+=10;
    else if(positionImprovement<=-5)score-=15;
    else if(positionImprovement<=-2)score-=10;
    if(post.position>0&&post.position<=10)score+=5;
  }
  return Math.round(clamp(score,0,100));
}

function signalFor(score:number,post:OpportunityOutcomeWindow):OpportunityOutcomeSignal{
  if(post.impressions<5)return "NO_DATA";
  if(score>=68)return "WINNING";
  if(score<=35)return "DOWN";
  return "MIXED";
}

function recommendationFor(days:OpportunityCheckpointDays,score:number,signal:OpportunityOutcomeSignal,landingAligned:boolean):OpportunityOutcomeRecommendation{
  if(signal==="NO_DATA")return days===56?"ITERATE":"KEEP_MEASURING";
  if(!landingAligned)return "ITERATE";
  if(signal==="DOWN")return "REGRESSED";
  if(days>=28&&signal==="WINNING"&&score>=70)return "WON";
  if(days===56&&score>=60)return "WON";
  if(days===56)return "ITERATE";
  return "KEEP_MEASURING";
}

function reasonFor(days:OpportunityCheckpointDays,signal:OpportunityOutcomeSignal,recommendation:OpportunityOutcomeRecommendation,landingAligned:boolean,post:OpportunityOutcomeWindow,positionImprovement:number|null){
  if(signal==="NO_DATA")return `${days}-day window has too little GSC volume for a reliable outcome; ${recommendation==="ITERATE"?"the 56-day horizon is complete, so review intent, indexing and demand assumptions.":"keep measuring until the next checkpoint."}`;
  if(!landingAligned)return `The top post-launch landing is ${pathOnly(post.topLanding)??"unknown"}, not the recommended target. Fix query-to-page alignment before calling this a win.`;
  if(recommendation==="WON")return `The recommended landing owns the query and the ${days}-day post-launch window shows a strong combined gain${positionImprovement!==null?` with ${positionImprovement.toFixed(1)} positions of improvement`:""}. Human confirmation can close the lifecycle as WON.`;
  if(recommendation==="REGRESSED")return `The recommended landing is aligned, but the combined post-launch metrics materially regressed. Re-open implementation diagnosis instead of waiting passively.`;
  if(recommendation==="ITERATE")return `The full ${days}-day horizon is available without a strong enough outcome. Iterate content, internal linking, snippet or intent match before another measurement cycle.`;
  return `The ${days}-day checkpoint is not conclusive enough to close. Preserve the implementation and compare again at the next horizon.`;
}

export function evaluateOutcomeCheckpoint(record:OpportunityLifecycleRecord,comparison:GscOutcomeComparison,days:OpportunityCheckpointDays,evaluatedAt=new Date().toISOString()):OpportunityOutcomeCheckpoint{
  if(!record.context)throw new Error("Opportunity context is required for outcome evaluation.");
  const pre=copyWindow(comparison.pre);
  const post=copyWindow(comparison.post);
  const landingAligned=landingMatchesRecommendation(post.topLanding,record.context.recommendedPath);
  const clicksChangePct=pctChange(pre.clicks,post.clicks);
  const impressionsChangePct=pctChange(pre.impressions,post.impressions);
  const ctrDeltaPoints=(post.ctr-pre.ctr)*100;
  const positionImprovement=pre.impressions>0&&post.impressions>0?pre.position-post.position:null;
  const score=scoreOutcome(pre,post,landingAligned,clicksChangePct,impressionsChangePct,ctrDeltaPoints,positionImprovement);
  const signal=signalFor(score,post);
  const recommendation=recommendationFor(days,score,signal,landingAligned);
  return {
    days,
    evaluatedAt,
    implementationId:record.shippedImplementationId,
    pre,
    post,
    landingAligned,
    clicksChangePct,
    impressionsChangePct,
    ctrDeltaPoints,
    positionImprovement,
    score,
    signal,
    recommendation,
    reason:reasonFor(days,signal,recommendation,landingAligned,post,positionImprovement)
  };
}

export function appendOutcomeCheckpoint(record:OpportunityLifecycleRecord,checkpoint:OpportunityOutcomeCheckpoint):OpportunityLifecycleRecord{
  if((record.outcomes??[]).some(item=>item.days===checkpoint.days))return record;
  return {...record,outcomes:[...(record.outcomes??[]),checkpoint].sort((a,b)=>a.days-b.days)};
}

export function latestOutcomeCheckpoint(record:OpportunityLifecycleRecord){
  return (record.outcomes??[]).slice().sort((a,b)=>b.days-a.days)[0]??null;
}
