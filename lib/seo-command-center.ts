import type {GscTrafficSnapshot} from "./gsc";
import type {SeoIndexationRunState} from "./indexation-store";
import type {OpportunityLifecycleRecord} from "./opportunity-lifecycle";
import {lifecycleForOpportunity} from "./opportunity-lifecycle";
import {latestOutcomeCheckpoint} from "./outcome-intelligence";
import type {SearchOpportunity} from "./search-opportunities";
import {buildSeoActionPlan} from "./seo-action-intelligence";
import {implementationAttributionStatus} from "./seo-change-registry";
import {buildSeoLearningLibrary,prioritizeOpportunityWithLearning} from "./seo-learning";
import {supportedCities} from "./cities";
import {isPriorityCity} from "./seo-policy";
import type {SeoAutopilotRunState} from "./seo-autopilot-store";

export type SeoCommandHealth="HEALTHY"|"ATTENTION"|"CRITICAL"|"NO_DATA";
export type SeoCommandActionPriority="P0"|"P1"|"P2"|"P3";
export type SeoCommandAction={
  id:string;
  priority:SeoCommandActionPriority;
  type:"INDEXATION"|"OUTCOME"|"OPPORTUNITY"|"CITY_EXPANSION";
  title:string;
  detail:string;
  target:string|null;
  score:number;
};

export type SeoCityExpansionCandidate={
  city:string;
  slug:string;
  impressions:number;
  clicks:number;
  opportunities:number;
  maxScore:number;
  statuses:string[];
};

export type SeoCommandCenterModel={
  health:SeoCommandHealth;
  healthReason:string;
  traffic:{
    available:boolean;
    clicks:number;clicksChangePct:number|null;
    impressions:number;impressionsChangePct:number|null;
    ctr:number;ctrDeltaPoints:number|null;
    position:number;positionImprovement:number|null;
    period:string|null;
  };
  pipeline:{total:number;detected:number;review:number;approved:number;build:number;shipped:number;measuring:number;won:number;rejected:number};
  outcomes:{wins:number;iterations:number;regressions:number;measuring:number};
  implementations:{attributedLaunches:number;unattributedLaunches:number};
  learning:{measuredImplementations:number;proven:number;promising:number;negative:number};
  indexation:{available:boolean;inspected:number;healthy:number;critical:number;high:number;canonicalMismatches:number;crawlBlocks:number;fetchErrors:number;lastRun:string|null};
  opportunities:{actionable:number;p0:number;p1:number;learningAdjusted:number};
  cityExpansion:SeoCityExpansionCandidate[];
  nextActions:SeoCommandAction[];
  autopilot:{status:string|null;completedAt:string|null;errors:number};
};

function pct(before:number,after:number){return before>0?((after-before)/before)*100:after>0?null:0;}
function cityForName(name:string|null){if(!name)return null;const key=name.trim().toLowerCase();return supportedCities.find(city=>city.name.toLowerCase()===key)??null;}
function commandPriorityRank(priority:SeoCommandActionPriority){return {P0:0,P1:1,P2:2,P3:3}[priority];}

export function buildCityExpansionCandidates(opportunities:SearchOpportunity[]){
  const map=new Map<string,SeoCityExpansionCandidate>();
  for(const item of opportunities){
    const city=cityForName(item.city);
    if(!city||isPriorityCity(city.slug)||item.status==="COVERED")continue;
    const current=map.get(city.slug)??{city:city.name,slug:city.slug,impressions:0,clicks:0,opportunities:0,maxScore:0,statuses:[]};
    current.impressions+=item.impressions;
    current.clicks+=item.clicks;
    current.opportunities++;
    current.maxScore=Math.max(current.maxScore,item.score);
    if(!current.statuses.includes(item.status))current.statuses.push(item.status);
    map.set(city.slug,current);
  }
  return [...map.values()].sort((a,b)=>b.impressions-a.impressions||b.maxScore-a.maxScore||a.slug.localeCompare(b.slug)).slice(0,12);
}

export function buildSeoCommandCenter(input:{
  snapshot:GscTrafficSnapshot|null;
  opportunities:SearchOpportunity[];
  records:Record<string,OpportunityLifecycleRecord>;
  indexation:SeoIndexationRunState|null;
  autopilot:SeoAutopilotRunState|null;
}):SeoCommandCenterModel{
  const {snapshot,opportunities,records,indexation,autopilot}=input;
  const recordRows=Object.values(records);
  const learning=buildSeoLearningLibrary(records);
  const pipelineCount=(stage:string)=>recordRows.filter(record=>record.stage===stage).length;
  const latestOutcomes=recordRows.map(latestOutcomeCheckpoint).filter((item):item is NonNullable<typeof item>=>Boolean(item));
  const wins=latestOutcomes.filter(item=>item.recommendation==="WON").length;
  const iterations=latestOutcomes.filter(item=>item.recommendation==="ITERATE").length;
  const regressions=latestOutcomes.filter(item=>item.recommendation==="REGRESSED").length;
  const attributedLaunches=recordRows.filter(record=>implementationAttributionStatus(record).status==="SHIPPED").length;
  const unattributedLaunches=recordRows.filter(record=>implementationAttributionStatus(record).status==="UNATTRIBUTED").length;

  const scored=opportunities.filter(item=>item.status!=="COVERED").map(item=>{
    const record=lifecycleForOpportunity(item.key,records[item.key]);
    const plan=buildSeoActionPlan({opportunity:item,record});
    const learned=prioritizeOpportunityWithLearning(item,learning);
    return {item,record,plan,learned};
  });
  const p0=scored.filter(row=>row.plan.priority==="P0").length;
  const p1=scored.filter(row=>row.plan.priority==="P1").length;
  const learningAdjusted=scored.filter(row=>row.learned.delta!==0).length;
  const cityExpansion=buildCityExpansionCandidates(opportunities);

  const actions:SeoCommandAction[]=[];
  for(const finding of indexation?.findings??[]){
    if(finding.severity!=="CRITICAL"&&finding.severity!=="HIGH")continue;
    actions.push({id:`index:${finding.url}`,priority:"P0",type:"INDEXATION",title:`${finding.issue.replaceAll("_"," ")}: ${new URL(finding.url).pathname}`,detail:finding.action,target:finding.url,score:finding.severity==="CRITICAL"?100:95});
  }
  for(const record of recordRows){
    const outcome=latestOutcomeCheckpoint(record);if(!outcome)continue;
    if(outcome.recommendation==="REGRESSED")actions.push({id:`outcome:${record.key}`,priority:"P0",type:"OUTCOME",title:`Regression: ${record.context?.label??record.key}`,detail:outcome.reason,target:record.context?.recommendedPath??null,score:94});
    else if(outcome.recommendation==="ITERATE")actions.push({id:`outcome:${record.key}`,priority:"P1",type:"OUTCOME",title:`Iterate: ${record.context?.label??record.key}`,detail:outcome.reason,target:record.context?.recommendedPath??null,score:82});
  }
  for(const row of scored){
    if(row.plan.priority!=="P0"&&row.plan.priority!=="P1")continue;
    actions.push({id:`opp:${row.item.key}`,priority:row.plan.priority,type:"OPPORTUNITY",title:row.plan.headline,detail:`${row.item.topQuery} · ${Math.round(row.item.impressions)} impressions · adjusted ${row.learned.adjustedScore}/100. ${row.learned.rationale}`,target:row.item.recommendedPath,score:row.learned.adjustedScore});
  }
  for(const city of cityExpansion.slice(0,5)){
    actions.push({id:`city:${city.slug}`,priority:city.impressions>=500?"P1":"P2",type:"CITY_EXPANSION",title:`Review city activation: ${city.city}`,detail:`${Math.round(city.impressions)} impressions across ${city.opportunities} actionable cluster${city.opportunities===1?"":"s"}; max raw opportunity ${city.maxScore}/100.`,target:null,score:Math.min(90,city.maxScore+Math.round(Math.log10(city.impressions+1)*4))});
  }
  const nextActions=actions.sort((a,b)=>commandPriorityRank(a.priority)-commandPriorityRank(b.priority)||b.score-a.score||a.id.localeCompare(b.id)).slice(0,15);

  const critical=indexation?.summary.critical??0;
  const high=indexation?.summary.high??0;
  let health:SeoCommandHealth="HEALTHY";
  let healthReason="No critical SEO control-plane issue is present in the latest available signals.";
  if(!snapshot&&!indexation&&!recordRows.length){health="NO_DATA";healthReason="No GSC, indexation or lifecycle evidence is currently available.";}
  else if(critical>0||regressions>0){health="CRITICAL";healthReason=`${critical} critical indexation issue${critical===1?"":"s"} and ${regressions} measured regression${regressions===1?"":"s"} require priority review.`;}
  else if(high>0||iterations>0||p0>0){health="ATTENTION";healthReason=`${high} high indexation issue${high===1?"":"s"}, ${iterations} iteration signal${iterations===1?"":"s"}, and ${p0} P0 action${p0===1?"":"s"} are active.`;}

  const traffic=snapshot?{
    available:true,
    clicks:snapshot.current.clicks,clicksChangePct:pct(snapshot.previous.clicks,snapshot.current.clicks),
    impressions:snapshot.current.impressions,impressionsChangePct:pct(snapshot.previous.impressions,snapshot.current.impressions),
    ctr:snapshot.current.ctr,ctrDeltaPoints:(snapshot.current.ctr-snapshot.previous.ctr)*100,
    position:snapshot.current.position,positionImprovement:snapshot.previous.position&&snapshot.current.position?snapshot.previous.position-snapshot.current.position:null,
    period:`${snapshot.startDate} → ${snapshot.endDate}`
  }:{available:false,clicks:0,clicksChangePct:null,impressions:0,impressionsChangePct:null,ctr:0,ctrDeltaPoints:null,position:0,positionImprovement:null,period:null};

  return {
    health,healthReason,traffic,
    pipeline:{total:recordRows.length,detected:pipelineCount("DETECTED"),review:pipelineCount("REVIEW"),approved:pipelineCount("APPROVED"),build:pipelineCount("BUILD"),shipped:pipelineCount("SHIPPED"),measuring:pipelineCount("MEASURING"),won:pipelineCount("WON"),rejected:pipelineCount("REJECTED")},
    outcomes:{wins,iterations,regressions,measuring:latestOutcomes.filter(item=>item.recommendation==="KEEP_MEASURING").length},
    implementations:{attributedLaunches,unattributedLaunches},
    learning:{measuredImplementations:learning.measuredImplementations,proven:learning.patterns.filter(item=>item.signal==="PROVEN").length,promising:learning.patterns.filter(item=>item.signal==="PROMISING").length,negative:learning.patterns.filter(item=>item.signal==="NEGATIVE").length},
    indexation:{available:Boolean(indexation),inspected:indexation?.summary.inspected??0,healthy:indexation?.summary.healthy??0,critical,high,canonicalMismatches:indexation?.summary.canonicalMismatches??0,crawlBlocks:indexation?.summary.crawlBlocks??0,fetchErrors:indexation?.summary.fetchErrors??0,lastRun:indexation?.completedAt??null},
    opportunities:{actionable:scored.length,p0,p1,learningAdjusted},cityExpansion,nextActions,
    autopilot:{status:autopilot?.status??null,completedAt:autopilot?.completedAt??null,errors:autopilot?.errors.length??0}
  };
}
