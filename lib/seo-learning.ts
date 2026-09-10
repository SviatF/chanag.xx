import type {
  OpportunityImplementationEvidence,
  OpportunityLifecycleRecord,
  OpportunityOutcomeCheckpoint,
  OpportunityOutcomeRecommendation
} from "./opportunity-lifecycle";
import type {SearchOpportunity,SearchOpportunityAction,SearchOpportunityStatus} from "./search-opportunities";

export const seoLearningPatterns=[
  "NEW_CLUSTER_BUILD",
  "LANDING_ALIGNMENT",
  "CONTENT_STRENGTHENING",
  "SNIPPET_OPTIMIZATION",
  "INTERNAL_LINK_REINFORCEMENT",
  "TECHNICAL_INDEXING"
] as const;
export type SeoLearningPattern=typeof seoLearningPatterns[number];
export type SeoPatternSignal="PROVEN"|"PROMISING"|"MIXED"|"NEGATIVE"|"INSUFFICIENT";

export type SeoLearningSample={
  opportunityKey:string;
  implementationId:string;
  pattern:SeoLearningPattern;
  checkpointDays:14|28|56;
  score:number;
  recommendation:OpportunityOutcomeRecommendation;
  clicksChangePct:number|null;
  impressionsChangePct:number|null;
  ctrDeltaPoints:number;
  positionImprovement:number|null;
  landingAligned:boolean;
  shippedAt:string;
};

export type SeoPatternStats={
  pattern:SeoLearningPattern;
  samples:number;
  wins:number;
  iterations:number;
  regressions:number;
  avgCheckpointDays:number;
  avgOutcomeScore:number;
  avgClicksChangePct:number|null;
  avgImpressionsChangePct:number|null;
  avgCtrDeltaPoints:number;
  avgPositionImprovement:number|null;
  landingAlignmentRate:number;
  winRate:number;
  confidence:number;
  signal:SeoPatternSignal;
};

export type SeoLearningLibrary={
  attributedImplementations:number;
  measuredImplementations:number;
  samples:SeoLearningSample[];
  patterns:SeoPatternStats[];
};

export type SeoLearningPriority={
  baseScore:number;
  adjustedScore:number;
  delta:number;
  pattern:SeoLearningPattern|null;
  confidence:number;
  signal:SeoPatternSignal|"NO_HISTORY";
  rationale:string;
};

function clamp(value:number,min:number,max:number){return Math.max(min,Math.min(max,value));}
function average(values:number[]){return values.length?values.reduce((sum,value)=>sum+value,0)/values.length:0;}
function nullableAverage(values:(number|null)[]){const clean=values.filter((value):value is number=>value!==null&&Number.isFinite(value));return clean.length?average(clean):null;}
function normalizeText(value:string){return value.toLowerCase().replace(/[_-]+/g," ");}

function latestOutcomeForImplementation(record:OpportunityLifecycleRecord,implementationId:string){
  return (record.outcomes??[])
    .filter(item=>item.implementationId===implementationId)
    .slice()
    .sort((a,b)=>b.days-a.days)[0]??null;
}

function primaryPattern(status:SearchOpportunityStatus|undefined,action:SearchOpportunityAction|undefined):SeoLearningPattern|null{
  if(status==="NEW_CLUSTER"||action==="BUILD")return "NEW_CLUSTER_BUILD";
  if(status==="WRONG_LANDING"||action==="ALIGN")return "LANDING_ALIGNMENT";
  if(status==="LOW_CTR"||action==="IMPROVE_SNIPPET")return "SNIPPET_OPTIMIZATION";
  if(status==="STRIKING_DISTANCE"||action==="STRENGTHEN")return "CONTENT_STRENGTHENING";
  return null;
}

function implementationPatterns(record:OpportunityLifecycleRecord,implementation:OpportunityImplementationEvidence){
  const patterns=new Set<SeoLearningPattern>();
  const primary=primaryPattern(record.context?.status,record.context?.action);
  if(primary)patterns.add(primary);

  const haystack=normalizeText([
    implementation.hypothesis,
    implementation.note,
    ...implementation.changedFiles
  ].join(" "));

  if(/internal link|anchor|topical link|topical graph|pagerank/.test(haystack))patterns.add("INTERNAL_LINK_REINFORCEMENT");
  if(/title|snippet|meta description|ctr/.test(haystack))patterns.add("SNIPPET_OPTIMIZATION");
  if(/canonical|robots|sitemap|indexing|indexable|noindex|route validation|redirect/.test(haystack))patterns.add("TECHNICAL_INDEXING");
  if(/content|copy|section|answer|faq|summary|explanation/.test(haystack))patterns.add("CONTENT_STRENGTHENING");
  if(/landing|cannibali|ownership|query to page|query-to-page/.test(haystack))patterns.add("LANDING_ALIGNMENT");
  if(/new cluster|new page|new route|new template|page family/.test(haystack))patterns.add("NEW_CLUSTER_BUILD");

  return [...patterns];
}

function signalFor(stats:Omit<SeoPatternStats,"signal">):SeoPatternSignal{
  if(stats.samples<3||stats.avgCheckpointDays<24)return "INSUFFICIENT";
  if(stats.winRate>=.66&&stats.avgOutcomeScore>=70&&stats.regressions===0)return "PROVEN";
  if(stats.winRate>=.45&&stats.avgOutcomeScore>=62&&stats.regressions<=Math.max(1,Math.floor(stats.samples*.2)))return "PROMISING";
  if(stats.regressions/stats.samples>=.4||stats.avgOutcomeScore<40)return "NEGATIVE";
  return "MIXED";
}

function statsFor(pattern:SeoLearningPattern,samples:SeoLearningSample[]):SeoPatternStats{
  const related=samples.filter(sample=>sample.pattern===pattern);
  const wins=related.filter(sample=>sample.recommendation==="WON").length;
  const iterations=related.filter(sample=>sample.recommendation==="ITERATE").length;
  const regressions=related.filter(sample=>sample.recommendation==="REGRESSED").length;
  const samplesCount=related.length;
  const avgCheckpointDays=average(related.map(sample=>sample.checkpointDays));
  const avgOutcomeScore=average(related.map(sample=>sample.score));
  const avgClicksChangePct=nullableAverage(related.map(sample=>sample.clicksChangePct));
  const avgImpressionsChangePct=nullableAverage(related.map(sample=>sample.impressionsChangePct));
  const avgCtrDeltaPoints=average(related.map(sample=>sample.ctrDeltaPoints));
  const avgPositionImprovement=nullableAverage(related.map(sample=>sample.positionImprovement));
  const landingAlignmentRate=samplesCount?related.filter(sample=>sample.landingAligned).length/samplesCount:0;
  const winRate=samplesCount?wins/samplesCount:0;
  // Confidence grows with sample size and maturity, but is intentionally capped before a large history exists.
  const maturity=clamp(avgCheckpointDays/56,0,1);
  const volume=clamp(samplesCount/8,0,1);
  const confidence=Math.round((maturity*.45+volume*.55)*100);
  const base={
    pattern,samples:samplesCount,wins,iterations,regressions,avgCheckpointDays,avgOutcomeScore,
    avgClicksChangePct,avgImpressionsChangePct,avgCtrDeltaPoints,avgPositionImprovement,
    landingAlignmentRate,winRate,confidence
  };
  return {...base,signal:signalFor(base)};
}

export function buildSeoLearningLibrary(records:Record<string,OpportunityLifecycleRecord>):SeoLearningLibrary{
  const samples:SeoLearningSample[]=[];
  let attributedImplementations=0;
  let measuredImplementations=0;

  for(const record of Object.values(records)){
    for(const implementation of record.implementations??[]){
      if(!implementation.shippedAt)continue;
      attributedImplementations++;
      const outcome=latestOutcomeForImplementation(record,implementation.id);
      if(!outcome)continue;
      measuredImplementations++;
      for(const pattern of implementationPatterns(record,implementation)){
        samples.push({
          opportunityKey:record.key,
          implementationId:implementation.id,
          pattern,
          checkpointDays:outcome.days,
          score:outcome.score,
          recommendation:outcome.recommendation,
          clicksChangePct:outcome.clicksChangePct,
          impressionsChangePct:outcome.impressionsChangePct,
          ctrDeltaPoints:outcome.ctrDeltaPoints,
          positionImprovement:outcome.positionImprovement,
          landingAligned:outcome.landingAligned,
          shippedAt:implementation.shippedAt
        });
      }
    }
  }

  const patterns=seoLearningPatterns
    .map(pattern=>statsFor(pattern,samples))
    .filter(stats=>stats.samples>0)
    .sort((a,b)=>{
      const signalOrder:Record<SeoPatternSignal,number>={PROVEN:0,PROMISING:1,MIXED:2,NEGATIVE:3,INSUFFICIENT:4};
      return signalOrder[a.signal]-signalOrder[b.signal]||b.confidence-a.confidence||b.avgOutcomeScore-a.avgOutcomeScore||a.pattern.localeCompare(b.pattern);
    });

  return {attributedImplementations,measuredImplementations,samples,patterns};
}

export function learningPatternForOpportunity(opportunity:SearchOpportunity):SeoLearningPattern|null{
  return primaryPattern(opportunity.status,opportunity.action);
}

export function prioritizeOpportunityWithLearning(opportunity:SearchOpportunity,library:SeoLearningLibrary):SeoLearningPriority{
  const pattern=learningPatternForOpportunity(opportunity);
  if(!pattern)return {baseScore:opportunity.score,adjustedScore:opportunity.score,delta:0,pattern:null,confidence:0,signal:"NO_HISTORY",rationale:"No comparable historical implementation pattern is defined for this opportunity."};
  const stats=library.patterns.find(item=>item.pattern===pattern);
  if(!stats)return {baseScore:opportunity.score,adjustedScore:opportunity.score,delta:0,pattern,confidence:0,signal:"NO_HISTORY",rationale:`No measured ${pattern.replaceAll("_"," ").toLowerCase()} implementations exist yet.`};
  if(stats.signal==="INSUFFICIENT")return {
    baseScore:opportunity.score,adjustedScore:opportunity.score,delta:0,pattern,confidence:stats.confidence,signal:stats.signal,
    rationale:`${stats.samples} historical sample${stats.samples===1?"":"s"} exist, but the library waits for at least 3 sufficiently mature implementations before changing priority.`
  };

  let delta=0;
  if(stats.signal==="PROVEN")delta=10;
  else if(stats.signal==="PROMISING")delta=6;
  else if(stats.signal==="NEGATIVE")delta=-8;
  else if(stats.signal==="MIXED")delta=0;
  // Scale adjustments down when evidence confidence is still moderate.
  delta=Math.round(delta*clamp(stats.confidence/70,.45,1));
  const adjustedScore=Math.round(clamp(opportunity.score+delta,0,100));
  return {
    baseScore:opportunity.score,adjustedScore,delta,pattern,confidence:stats.confidence,signal:stats.signal,
    rationale:`Historical ${pattern.replaceAll("_"," ").toLowerCase()} pattern: ${stats.signal.toLowerCase()}, ${stats.wins}/${stats.samples} wins, avg outcome ${stats.avgOutcomeScore.toFixed(0)}/100 at ${stats.avgCheckpointDays.toFixed(0)}d average horizon.`
  };
}

export function latestAttributedOutcome(record:OpportunityLifecycleRecord,implementationId:string):OpportunityOutcomeCheckpoint|null{
  return latestOutcomeForImplementation(record,implementationId);
}
