import type {SearchOpportunity} from "./search-opportunities";

export const opportunityStages=["DETECTED","REVIEW","APPROVED","BUILD","SHIPPED","MEASURING","WON","REJECTED"] as const;
export type OpportunityStage=typeof opportunityStages[number];

export type OpportunityMetricSnapshot={
  capturedAt:string;
  impressions:number;
  clicks:number;
  ctr:number;
  position:number;
  opportunityScore:number;
};

export type OpportunityContextSnapshot={
  label:string;
  topQuery:string;
  city:string|null;
  recommendedPath:string;
  template:string;
};

export type OpportunityLifecycleEvent={
  from:OpportunityStage;
  to:OpportunityStage;
  at:string;
  note?:string;
};

export type OpportunityLifecycleRecord={
  key:string;
  stage:OpportunityStage;
  owner:string;
  note:string;
  createdAt:string;
  updatedAt:string;
  approvedAt?:string;
  buildStartedAt?:string;
  shippedAt?:string;
  measuringAt?:string;
  closedAt?:string;
  baseline?:OpportunityMetricSnapshot;
  context?:OpportunityContextSnapshot;
  history:OpportunityLifecycleEvent[];
};

const allowedTransitions:Record<OpportunityStage,OpportunityStage[]>={
  DETECTED:["REVIEW","REJECTED"],
  REVIEW:["APPROVED","REJECTED","DETECTED"],
  APPROVED:["BUILD","REVIEW","REJECTED"],
  BUILD:["SHIPPED","APPROVED","REJECTED"],
  SHIPPED:["MEASURING","BUILD"],
  MEASURING:["WON","BUILD","REJECTED"],
  WON:["MEASURING"],
  REJECTED:["REVIEW"]
};

export function lifecycleForOpportunity(key:string,stored?:OpportunityLifecycleRecord,now=new Date().toISOString()):OpportunityLifecycleRecord{
  return stored??{
    key,
    stage:"DETECTED",
    owner:"",
    note:"",
    createdAt:now,
    updatedAt:now,
    history:[]
  };
}

export function canTransitionOpportunity(from:OpportunityStage,to:OpportunityStage){
  return from===to||allowedTransitions[from].includes(to);
}

export function nextOpportunityStages(stage:OpportunityStage){
  return allowedTransitions[stage];
}

export function opportunityMetrics(opportunity:SearchOpportunity,at=new Date().toISOString()):OpportunityMetricSnapshot{
  return {
    capturedAt:at,
    impressions:opportunity.impressions,
    clicks:opportunity.clicks,
    ctr:opportunity.ctr,
    position:opportunity.position,
    opportunityScore:opportunity.score
  };
}

export function opportunityContext(opportunity:SearchOpportunity):OpportunityContextSnapshot{
  return {
    label:opportunity.label,
    topQuery:opportunity.topQuery,
    city:opportunity.city,
    recommendedPath:opportunity.recommendedPath,
    template:opportunity.template
  };
}

export function transitionOpportunityLifecycle(
  stored:OpportunityLifecycleRecord|undefined,
  key:string,
  nextStage:OpportunityStage,
  now:string,
  options:{owner?:string;note?:string;metrics?:OpportunityMetricSnapshot;context?:OpportunityContextSnapshot}={}
):OpportunityLifecycleRecord{
  const current=lifecycleForOpportunity(key,stored,now);
  if(!canTransitionOpportunity(current.stage,nextStage)){
    throw new Error(`Invalid opportunity transition: ${current.stage} → ${nextStage}`);
  }

  const changed=current.stage!==nextStage;
  const next:OpportunityLifecycleRecord={
    ...current,
    stage:nextStage,
    owner:options.owner??current.owner,
    note:options.note??current.note,
    context:options.context??current.context,
    updatedAt:now,
    history:changed?[...current.history,{from:current.stage,to:nextStage,at:now,note:options.note||undefined}]:current.history
  };

  if(nextStage==="APPROVED"&&!next.approvedAt)next.approvedAt=now;
  if(nextStage==="BUILD"&&!next.buildStartedAt)next.buildStartedAt=now;
  if(nextStage==="SHIPPED"){
    next.shippedAt=now;
    if(options.metrics)next.baseline=options.metrics;
  }
  if(nextStage==="MEASURING"){
    next.measuringAt=now;
    if(!next.baseline&&options.metrics)next.baseline=options.metrics;
  }
  if(nextStage==="WON"||nextStage==="REJECTED")next.closedAt=now;
  else delete next.closedAt;

  return next;
}

export type OpportunityMeasurement={
  baseline:OpportunityMetricSnapshot;
  current:OpportunityMetricSnapshot;
  clicksDelta:number;
  impressionsDelta:number;
  ctrDeltaPoints:number;
  positionImprovement:number;
  signal:"WINNING"|"MIXED"|"DOWN"|"EARLY";
};

export function measureOpportunity(record:OpportunityLifecycleRecord,opportunity:SearchOpportunity,at=new Date().toISOString()):OpportunityMeasurement|null{
  if(!record.baseline)return null;
  const current=opportunityMetrics(opportunity,at);
  const clicksDelta=current.clicks-record.baseline.clicks;
  const impressionsDelta=current.impressions-record.baseline.impressions;
  const ctrDeltaPoints=(current.ctr-record.baseline.ctr)*100;
  const positionImprovement=record.baseline.position-current.position;
  const positive=Number(clicksDelta>0)+Number(impressionsDelta>0)+Number(ctrDeltaPoints>0.2)+Number(positionImprovement>1);
  const negative=Number(clicksDelta<0)+Number(impressionsDelta<0)+Number(ctrDeltaPoints<-0.2)+Number(positionImprovement<-1);
  const signal:OpportunityMeasurement["signal"]=
    record.stage==="SHIPPED"?"EARLY":positive>=3?"WINNING":negative>=3?"DOWN":"MIXED";
  return {baseline:record.baseline,current,clicksDelta,impressionsDelta,ctrDeltaPoints,positionImprovement,signal};
}
