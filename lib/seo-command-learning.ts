import type {PageOpportunity} from "./seo-operating-system";
import type {SeoCommandTask,SeoTaskMap,SeoTaskResult} from "./seo-task-store";

export const commandLearningPatterns=[
  "CONTENT_STRENGTHENING",
  "INTERNAL_LINK_REINFORCEMENT",
  "SNIPPET_OPTIMIZATION",
  "LANDING_ALIGNMENT",
  "TECHNICAL_INDEXING"
] as const;
export type SeoCommandLearningPattern=typeof commandLearningPatterns[number];
export type SeoCommandLearningSignal="PROVEN"|"PROMISING"|"MIXED"|"NEGATIVE"|"INSUFFICIENT";

export type SeoCommandLearningSample={
  taskId:string;
  pattern:SeoCommandLearningPattern;
  result:Exclude<SeoTaskResult,null|"low_data">;
  score:number;
  measuredAt:string;
  observationDays:number;
};

export type SeoCommandPatternStats={
  pattern:SeoCommandLearningPattern;
  samples:number;
  positives:number;
  neutrals:number;
  negatives:number;
  winRate:number;
  avgOutcomeScore:number;
  avgObservationDays:number;
  confidence:number;
  signal:SeoCommandLearningSignal;
};

export type SeoCommandLearningLibrary={
  measuredTasks:number;
  samples:SeoCommandLearningSample[];
  patterns:SeoCommandPatternStats[];
};

export type SeoCommandLearningPriority={
  baseScore:number;
  adjustedScore:number;
  delta:number;
  pattern:SeoCommandLearningPattern|null;
  signal:SeoCommandLearningSignal|"NO_HISTORY";
  confidence:number;
  rationale:string;
};

function clamp(value:number,min:number,max:number){return Math.max(min,Math.min(max,value));}
function average(values:number[]){return values.length?values.reduce((sum,value)=>sum+value,0)/values.length:0;}
function normalize(value:string){return value.toLowerCase().replace(/[_-]+/g," ");}
function observationDays(task:SeoCommandTask){
  const start=Date.parse(task.completedAt),end=Date.parse(task.measuredAt??task.closedAt??task.updatedAt);
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<start)return 10;
  return Math.max(1,Math.round((end-start)/(24*60*60*1000)));
}

export function commandPatternsForTask(task:SeoCommandTask):SeoCommandLearningPattern[]{
  const patterns=new Set<SeoCommandLearningPattern>();
  const action=task.actionType.toUpperCase();
  const haystack=normalize(`${task.recommendation} ${task.reviewerNote}`);

  if(action==="FIX"||/cannibali|landing|intent conflict|primary url|query to page|query-to-page/.test(haystack))patterns.add("LANDING_ALIGNMENT");
  if(/internal link|contextual link|anchor|topical link/.test(haystack))patterns.add("INTERNAL_LINK_REINFORCEMENT");
  if(/title|meta description|snippet|ctr/.test(haystack))patterns.add("SNIPPET_OPTIMIZATION");
  if(/canonical|robots|sitemap|index|redirect|crawl/.test(haystack))patterns.add("TECHNICAL_INDEXING");
  if(action==="DO_NOW"||action==="SCALE"||/supporting|section|content|faq|copy|answer/.test(haystack))patterns.add("CONTENT_STRENGTHENING");

  return [...patterns];
}

function signalFor(stats:Omit<SeoCommandPatternStats,"signal">):SeoCommandLearningSignal{
  if(stats.samples<3||stats.avgObservationDays<9)return "INSUFFICIENT";
  if(stats.winRate>=.66&&stats.avgOutcomeScore>=70&&stats.negatives===0)return "PROVEN";
  if(stats.winRate>=.5&&stats.avgOutcomeScore>=60&&stats.negatives<=Math.max(1,Math.floor(stats.samples*.2)))return "PROMISING";
  if(stats.negatives/stats.samples>=.4||stats.avgOutcomeScore<40)return "NEGATIVE";
  return "MIXED";
}

function statsFor(pattern:SeoCommandLearningPattern,samples:SeoCommandLearningSample[]):SeoCommandPatternStats{
  const related=samples.filter(sample=>sample.pattern===pattern);
  const positives=related.filter(sample=>sample.result==="positive").length;
  const neutrals=related.filter(sample=>sample.result==="neutral").length;
  const negatives=related.filter(sample=>sample.result==="negative").length;
  const samplesCount=related.length;
  const avgOutcomeScore=average(related.map(sample=>sample.score));
  const avgObservationDays=average(related.map(sample=>sample.observationDays));
  const winRate=samplesCount?positives/samplesCount:0;
  const maturity=clamp(avgObservationDays/14,0,1);
  const volume=clamp(samplesCount/8,0,1);
  const confidence=Math.round((maturity*.45+volume*.55)*100);
  const base={pattern,samples:samplesCount,positives,neutrals,negatives,winRate,avgOutcomeScore,avgObservationDays,confidence};
  return {...base,signal:signalFor(base)};
}

export function buildSeoCommandLearningLibrary(tasks:SeoTaskMap):SeoCommandLearningLibrary{
  const samples:SeoCommandLearningSample[]=[];
  let measuredTasks=0;
  for(const task of Object.values(tasks)){
    if(!task.result||task.result==="low_data"||!task.outcome)continue;
    measuredTasks++;
    for(const pattern of commandPatternsForTask(task)){
      samples.push({taskId:task.id,pattern,result:task.result,score:task.outcome.score,measuredAt:task.outcome.measuredAt,observationDays:observationDays(task)});
    }
  }
  const patterns=commandLearningPatterns.map(pattern=>statsFor(pattern,samples)).filter(item=>item.samples>0).sort((a,b)=>{
    const order:Record<SeoCommandLearningSignal,number>={PROVEN:0,PROMISING:1,MIXED:2,NEGATIVE:3,INSUFFICIENT:4};
    return order[a.signal]-order[b.signal]||b.confidence-a.confidence||b.avgOutcomeScore-a.avgOutcomeScore;
  });
  return {measuredTasks,samples,patterns};
}

export function commandLearningPatternForPage(page:PageOpportunity):SeoCommandLearningPattern|null{
  if(page.action==="FIX")return "LANDING_ALIGNMENT";
  if(page.action==="DO_NOW"||page.action==="SCALE")return "CONTENT_STRENGTHENING";
  return null;
}

export function prioritizePageWithCommandLearning(page:PageOpportunity,library:SeoCommandLearningLibrary):SeoCommandLearningPriority{
  const pattern=commandLearningPatternForPage(page);
  if(!pattern)return {baseScore:page.score,adjustedScore:page.score,delta:0,pattern:null,signal:"NO_HISTORY",confidence:0,rationale:"No comparable command-center learning pattern is defined for this action."};
  const stats=library.patterns.find(item=>item.pattern===pattern);
  if(!stats)return {baseScore:page.score,adjustedScore:page.score,delta:0,pattern,signal:"NO_HISTORY",confidence:0,rationale:`No measured ${pattern.replaceAll("_"," ").toLowerCase()} cycles yet.`};
  if(stats.signal==="INSUFFICIENT")return {baseScore:page.score,adjustedScore:page.score,delta:0,pattern,signal:stats.signal,confidence:stats.confidence,rationale:`${stats.samples} measured cycle${stats.samples===1?"":"s"}; at least 3 mature observations are required before learning changes priority.`};

  let delta=stats.signal==="PROVEN"?8:stats.signal==="PROMISING"?5:stats.signal==="NEGATIVE"?-7:0;
  delta=Math.round(delta*clamp(stats.confidence/70,.45,1));
  return {
    baseScore:page.score,
    adjustedScore:Math.round(clamp(page.score+delta,0,100)),
    delta,
    pattern,
    signal:stats.signal,
    confidence:stats.confidence,
    rationale:`Historical ${pattern.replaceAll("_"," ").toLowerCase()}: ${stats.positives}/${stats.samples} positive, avg outcome ${stats.avgOutcomeScore.toFixed(0)}/100, ${stats.confidence}% confidence.`
  };
}
