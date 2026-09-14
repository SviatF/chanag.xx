import type {GscRow} from "./gsc";
import type {GscSeoOsDataset} from "./gsc-seo-os";
import type {SeoCommandTask,SeoTaskMap} from "./seo-task-store";

export type QueryCannibalizationRisk="NONE"|"LOW"|"MEDIUM"|"HIGH";
export type QueryStatus="TOP3"|"TOP10"|"QUICK_WIN"|"GROWING"|"DECLINING"|"CANNIBALIZATION"|"DO_NOT_TOUCH"|"WATCH";
export type SeoCommandAction="DO_NOW"|"SCALE"|"FIX"|"ANALYZE_INTENT"|"WAIT"|"DO_NOT_TOUCH";
export type SeoPriority="P0"|"P1"|"P2"|"WATCH";

export type QueryLanding={url:string;clicks:number;impressions:number;position:number;share:number};
export type QueryIntelligence={
  query:string;
  landingPage:string|null;
  clicks:number;
  impressions:number;
  ctr:number;
  position:number;
  current7Impressions:number;
  previous7Impressions:number;
  trendPct:number|null;
  positionChange:number|null;
  landingPages:QueryLanding[];
  primaryShare:number;
  cannibalizationRisk:QueryCannibalizationRisk;
  statuses:QueryStatus[];
  lockedUntil:string|null;
};

export type PageOpportunity={
  url:string;
  queryCount:number;
  impressions:number;
  clicks:number;
  ctr:number;
  position:number;
  top3:number;
  top10:number;
  top20:number;
  top50:number;
  topQuery:string;
  current7:SeoMetric;
  previous7:SeoMetric;
  trendPct:number|null;
  cannibalizationRisk:QueryCannibalizationRisk;
  score:number;
  priority:SeoPriority;
  action:SeoCommandAction;
  why:string;
  concreteAction:string;
  internalLinkCandidates:string[];
  task:SeoCommandTask|null;
};

export type SeoMetric={impressions:number;clicks:number;ctr:number;position:number};

const CANNIBALIZATION_MIN_TOTAL_IMPRESSIONS=12;
const CANNIBALIZATION_HIGH_MIN_TOTAL_IMPRESSIONS=20;
const CANNIBALIZATION_MIN_LANDING_IMPRESSIONS=3;
const CANNIBALIZATION_MIN_LANDING_SHARE=.15;
const CANNIBALIZATION_HIGH_SECONDARY_SHARE=.25;

function key(row:GscRow|undefined,index=0){return row?.keys?.[index]??"";}
function safePct(current:number,previous:number){if(previous<=0)return current>0?100:null;return ((current-previous)/previous)*100;}
function weightedPosition(rows:GscRow[]){const total=rows.reduce((sum,row)=>sum+(row.impressions??0),0);return total?rows.reduce((sum,row)=>sum+(row.position??0)*(row.impressions??0),0)/total:0;}
function metric(rows:GscRow[]):SeoMetric{const impressions=rows.reduce((sum,row)=>sum+(row.impressions??0),0);const clicks=rows.reduce((sum,row)=>sum+(row.clicks??0),0);return {impressions,clicks,ctr:impressions?clicks/impressions:0,position:impressions?weightedPosition(rows):0};}
function expectedCtr(position:number){if(position<=3)return .14;if(position<=5)return .08;if(position<=10)return .045;if(position<=20)return .018;if(position<=50)return .007;return .003;}
function clamp(value:number,min=0,max=100){return Math.max(min,Math.min(max,value));}
function category(url:string){try{const parts=new URL(url).pathname.split("/").filter(Boolean);return parts[0]??"home";}catch{const parts=url.split("/").filter(Boolean);return parts[0]??"home";}}
function activeTaskFor(tasks:SeoTaskMap,url:string,query?:string){return Object.values(tasks).find(task=>task.url===url&&(!query||task.query.toLowerCase()===query.toLowerCase())&&task.status!=="closed")??null;}
function isFuture(date:string){const time=new Date(date).getTime();return Number.isFinite(time)&&time>Date.now();}

function normalizeQuery(value:string){
  return value.toLowerCase().trim().replace(/^https?:\/\//,"").replace(/\/$/,"").replace(/\s+/g," ");
}

/**
 * Pure site-navigation queries are not SEO intent conflicts. Google can legitimately
 * return several Panchvani pages for a query such as "panchvani" without those pages
 * competing for the same non-brand search intent.
 */
function isBrandNavigationQuery(query:string){
  const normalized=normalizeQuery(query);
  return normalized==="panchvani"||
    normalized==="panch vani"||
    normalized==="panchvani.com"||
    normalized==="www.panchvani.com"||
    normalized==="panchvani website"||
    normalized==="panchvani site";
}

function queryRowsByQuery(rows:GscRow[]){
  const map=new Map<string,GscRow[]>();
  for(const row of rows){const q=key(row);if(!q)continue;const list=map.get(q)??[];list.push(row);map.set(q,list);}
  return map;
}

function pageRows(rows:GscRow[]){
  const map=new Map<string,GscRow[]>();
  for(const row of rows){const page=key(row,1);if(!page)continue;const list=map.get(page)??[];list.push(row);map.set(page,list);}
  return map;
}

function queryMetricMap(rows:GscRow[]){const map=new Map<string,GscRow>();for(const row of rows){const q=key(row);if(q)map.set(q,row);}return map;}
function actionableRows(rows:GscRow[]){return rows.filter(row=>!isBrandNavigationQuery(key(row)));}

function cannibalizationRiskForQuery(query:string,landingPages:QueryLanding[],totalLandingImpressions:number):QueryCannibalizationRisk{
  if(isBrandNavigationQuery(query))return "NONE";
  if(totalLandingImpressions<CANNIBALIZATION_MIN_TOTAL_IMPRESSIONS)return "NONE";

  const meaningful=landingPages.filter(page=>page.impressions>=CANNIBALIZATION_MIN_LANDING_IMPRESSIONS&&page.share>=CANNIBALIZATION_MIN_LANDING_SHARE);
  if(meaningful.length<2)return "NONE";

  const primary=meaningful[0];
  const secondary=meaningful[1];
  if(!primary||!secondary)return "NONE";
  if(totalLandingImpressions>=CANNIBALIZATION_HIGH_MIN_TOTAL_IMPRESSIONS&&primary.share<=.6&&secondary.share>=CANNIBALIZATION_HIGH_SECONDARY_SHARE)return "HIGH";
  if(primary.share<.8&&secondary.share>=CANNIBALIZATION_MIN_LANDING_SHARE)return "MEDIUM";
  return "LOW";
}

export function buildQueryIntelligence(dataset:GscSeoOsDataset,tasks:SeoTaskMap):QueryIntelligence[]{
  const q28=queryMetricMap(dataset.current28d.queries);
  const q7=queryMetricMap(dataset.current7d.queries);
  const prev7=queryMetricMap(dataset.previous7d.queries);
  const qp28=queryRowsByQuery(dataset.current28d.queryPages);
  const output:QueryIntelligence[]=[];

  for(const [query,row] of q28){
    const landings=(qp28.get(query)??[]).slice().sort((a,b)=>(b.impressions??0)-(a.impressions??0)||(b.clicks??0)-(a.clicks??0));
    const totalLandingImpressions=landings.reduce((sum,item)=>sum+(item.impressions??0),0);
    const landingPages:QueryLanding[]=landings.map(item=>({
      url:key(item,1),clicks:item.clicks??0,impressions:item.impressions??0,position:item.position??0,
      share:totalLandingImpressions?(item.impressions??0)/totalLandingImpressions:0,
    }));
    const primary=landingPages[0]??null;
    const primaryShare=primary?.share??0;
    const cannibalizationRisk=cannibalizationRiskForQuery(query,landingPages,totalLandingImpressions);
    const current7=q7.get(query);const previous=prev7.get(query);
    const current7Impressions=current7?.impressions??0,previous7Impressions=previous?.impressions??0;
    const trendPct=safePct(current7Impressions,previous7Impressions);
    const positionChange=current7&&previous&&current7Impressions+previous7Impressions>=3?(previous.position??0)-(current7.position??0):null;
    const task=primary?activeTaskFor(tasks,primary.url,query):null;
    const statuses:QueryStatus[]=[];
    const brandNavigation=isBrandNavigationQuery(query);

    if(task&&task.status!=="closed")statuses.push("DO_NOT_TOUCH");
    if(!brandNavigation&&(cannibalizationRisk==="HIGH"||cannibalizationRisk==="MEDIUM"))statuses.push("CANNIBALIZATION");
    if(row.position<=3)statuses.push("TOP3");else if(row.position<=10)statuses.push("TOP10");
    if(!brandNavigation&&row.impressions>=3&&row.position>=4&&row.position<=20)statuses.push("QUICK_WIN");
    if(!brandNavigation&&current7Impressions>=3&&((trendPct??0)>=40||(positionChange??0)>=3))statuses.push("GROWING");
    if(!brandNavigation&&previous7Impressions>=5&&((trendPct!==null&&trendPct<=-40)||(positionChange!==null&&positionChange<=-8)))statuses.push("DECLINING");
    if(!statuses.length)statuses.push("WATCH");

    output.push({query,landingPage:primary?.url??null,clicks:row.clicks??0,impressions:row.impressions??0,ctr:row.ctr??0,position:row.position??0,current7Impressions,previous7Impressions,trendPct,positionChange,landingPages,primaryShare,cannibalizationRisk,statuses,lockedUntil:task&&isFuture(task.verifyAt)?task.verifyAt:null});
  }
  return output.sort((a,b)=>b.impressions-a.impressions||a.position-b.position||a.query.localeCompare(b.query));
}

function pageMetricsFromQueryPages(rows:GscRow[]){const groups=pageRows(rows);const map=new Map<string,SeoMetric>();for(const [page,list] of groups)map.set(page,metric(list));return map;}

function scoreOpportunity(impressions:number,position:number,ctr:number,maxImpressions:number){
  if(impressions<=0)return 0;
  const demand=maxImpressions>1?Math.log1p(impressions)/Math.log1p(maxImpressions):1;
  const proximity=position<=3?.2:position<=10?.82:position<=20?1:position<=30?.7:position<=50?.45:.2;
  const expected=expectedCtr(position);const headroom=expected?clamp((expected-ctr)/expected,0,1):0;
  const confidence=impressions<3?.15:impressions<5?.4:impressions<10?.65:impressions<20?.82:1;
  return Math.round(clamp((demand*.35+proximity*.4+headroom*.25)*100*confidence));
}

function priority(score:number,impressions:number):SeoPriority{if(score>=75&&impressions>=10)return "P0";if(score>=55&&impressions>=5)return "P1";if(score>=35&&impressions>=3)return "P2";return "WATCH";}
function decline(current:SeoMetric,previous:SeoMetric){const pct=safePct(current.impressions,previous.impressions);const positionWorsened=current.impressions+previous.impressions>=5&&current.position-previous.position>=8;return previous.impressions>=5&&((pct!==null&&pct<=-40)||positionWorsened);}
function trend(current:SeoMetric,previous:SeoMetric){return safePct(current.impressions,previous.impressions);}

function cannibalizationForPage(url:string,queries:QueryIntelligence[]){
  const involved=queries.filter(query=>{
    if(query.cannibalizationRisk!=="HIGH"&&query.cannibalizationRisk!=="MEDIUM")return false;
    const landing=query.landingPages.find(page=>page.url===url);
    return Boolean(landing&&landing.impressions>=CANNIBALIZATION_MIN_LANDING_IMPRESSIONS&&landing.share>=CANNIBALIZATION_MIN_LANDING_SHARE);
  });
  return involved.some(item=>item.cannibalizationRisk==="HIGH")?"HIGH":involved.length?"MEDIUM":"NONE" as QueryCannibalizationRisk;
}

function commandAction(position:number,impressions:number,cannibalization:QueryCannibalizationRisk,isDeclining:boolean,task:SeoCommandTask|null):SeoCommandAction{
  if(task&&task.status!=="closed")return "DO_NOT_TOUCH";
  if(cannibalization==="HIGH"||isDeclining)return "FIX";
  if(impressions<=2)return "WAIT";
  if(position<=3)return "SCALE";
  if(position<=10&&impressions>=3)return "SCALE";
  if(position<=20&&impressions>=3)return "DO_NOW";
  if(position<=50&&impressions>=5)return "DO_NOW";
  if(position<=100&&impressions>=10)return "ANALYZE_INTENT";
  return "WAIT";
}

function reason(action:SeoCommandAction,page:{position:number;impressions:number;ctr:number;topQuery:string;cannibalization:QueryCannibalizationRisk;task:SeoCommandTask|null}){
  if(action==="DO_NOT_TOUCH")return `Зміна вже в observation. Не чіпай сторінку до ${page.task?new Date(page.task.verifyAt).toLocaleDateString("uk-UA"):"перевірки"}.`;
  if(action==="FIX"&&page.cannibalization!=="NONE")return `Один або кілька запитів мають достатній GSC evidence і реально конкурують між landing pages. Ризик канібалізації: ${page.cannibalization}.`;
  if(action==="FIX")return "Сигнал сторінки погіршується: impressions або позиція суттєво просіли відносно попереднього тижня.";
  if(action==="SCALE")return `Сторінка вже близько або всередині TOP10 при повторному non-brand попиті (${page.impressions} показів).`;
  if(action==="DO_NOW")return `Позиція ${page.position.toFixed(1)} при повторних non-brand показах — реальна зона швидкого SEO-приросту.`;
  if(action==="ANALYZE_INTENT")return `Google тестує сторінку по query “${page.topQuery}”, але релевантність ще слабка. Спочатку перевір intent.`;
  return "Даних по non-brand intent поки недостатньо для безпечної SEO-зміни. Накопичуємо сигнал.";
}

function actionText(action:SeoCommandAction,page:{topQuery:string;position:number;cannibalization:QueryCannibalizationRisk},links:string[]){
  if(action==="DO_NOT_TOUCH")return "Не внось нові SEO-зміни до завершення observation window.";
  if(action==="FIX"&&page.cannibalization!=="NONE")return "Перевір конкретні competing landing pages для non-brand query, обери primary URL і лише після ручної перевірки intent прибери дублювання. Не роби redirect навмання.";
  if(action==="FIX")return "Перевір freshness, intent і втрату релевантності. Не переписуй Title/H1 навмання; спочатку знайди причину падіння.";
  if(action==="SCALE")return `Не переписуй ядро сторінки. Підсиль supporting content${links.length?` і contextual internal links із реально пов’язаних кандидатів: ${links.join(", ")}`:""}.`;
  if(action==="DO_NOW")return `Додай точну supporting section під query “${page.topQuery}”${links.length?` і contextual internal links із ${links.join(", ")}`:""}, якщо це відповідає intent.`;
  if(action==="ANALYZE_INTENT")return `Перевір intent query “${page.topQuery}”. Якщо сторінка відповідає intent — додай одну точну секцію; якщо ні — не форсуй keyword у Title/H1.`;
  return "Чекати. Не оптимізувати сторінку на основі brand navigation або слабкого GSC evidence.";
}

function sharedActionableQueryCount(left:GscRow[],right:GscRow[]){
  const leftQueries=new Set(left.map(row=>key(row)).filter(Boolean));
  const rightQueries=new Set(right.map(row=>key(row)).filter(Boolean));
  let count=0;
  for(const query of leftQueries)if(rightQueries.has(query))count++;
  return count;
}

export function buildPageOpportunities(dataset:GscSeoOsDataset,tasks:SeoTaskMap):PageOpportunity[]{
  const queryIntel=buildQueryIntelligence(dataset,tasks);
  const current28Groups=pageRows(dataset.current28d.queryPages);
  const current7=pageMetricsFromQueryPages(actionableRows(dataset.current7d.queryPages));
  const previous7=pageMetricsFromQueryPages(actionableRows(dataset.previous7d.queryPages));

  const base=[...current28Groups.entries()].map(([url,rows])=>{
    const decisionRows=actionableRows(rows);
    const m=metric(decisionRows);
    const c7=current7.get(url)??{impressions:0,clicks:0,ctr:0,position:0};
    const p7=previous7.get(url)??{impressions:0,clicks:0,ctr:0,position:0};
    const sorted=decisionRows.slice().sort((a,b)=>(b.impressions??0)-(a.impressions??0)||(b.clicks??0)-(a.clicks??0));
    const topQuery=key(sorted[0])||"—";
    const uniqueQueries=new Map<string,GscRow>();
    for(const row of decisionRows){const q=key(row);const prev=uniqueQueries.get(q);if(!prev||(row.impressions??0)>(prev.impressions??0))uniqueQueries.set(q,row);}
    const qRows=[...uniqueQueries.values()];
    return {url,rows:decisionRows,m,c7,p7,topQuery,qRows};
  });

  const maxImpressions=Math.max(...base.map(item=>item.m.impressions),1);
  const linkPool=base.slice().sort((a,b)=>b.m.impressions-a.m.impressions||b.m.clicks-a.m.clicks);

  return base.map(item=>{
    const canRisk=cannibalizationForPage(item.url,queryIntel);
    const task=activeTaskFor(tasks,item.url);
    const isDeclining=decline(item.c7,item.p7);
    const score=scoreOpportunity(item.m.impressions,item.m.position,item.m.ctr,maxImpressions);
    const action=commandAction(item.m.position,item.m.impressions,canRisk,isDeclining,task);
    const related=linkPool
      .filter(candidate=>candidate.url!==item.url&&category(candidate.url)===category(item.url)&&candidate.m.impressions>0)
      .map(candidate=>({candidate,overlap:sharedActionableQueryCount(item.qRows,candidate.qRows)}))
      .filter(row=>row.overlap>0)
      .sort((a,b)=>b.overlap-a.overlap||b.candidate.m.impressions-a.candidate.m.impressions)
      .slice(0,3)
      .map(row=>row.candidate.url);

    return {
      url:item.url,
      queryCount:item.qRows.length,
      impressions:item.m.impressions,
      clicks:item.m.clicks,
      ctr:item.m.ctr,
      position:item.m.position,
      top3:item.qRows.filter(row=>(row.position??0)<=3).length,
      top10:item.qRows.filter(row=>(row.position??0)<=10).length,
      top20:item.qRows.filter(row=>(row.position??0)<=20).length,
      top50:item.qRows.filter(row=>(row.position??0)<=50).length,
      topQuery:item.topQuery,
      current7:item.c7,
      previous7:item.p7,
      trendPct:trend(item.c7,item.p7),
      cannibalizationRisk:canRisk,
      score,
      priority:priority(score,item.m.impressions),
      action,
      why:reason(action,{position:item.m.position,impressions:item.m.impressions,ctr:item.m.ctr,topQuery:item.topQuery,cannibalization:canRisk,task}),
      concreteAction:actionText(action,{topQuery:item.topQuery,position:item.m.position,cannibalization:canRisk},related),
      internalLinkCandidates:related,
      task,
    } satisfies PageOpportunity;
  }).sort((a,b)=>{
    const order:Record<SeoCommandAction,number>={FIX:0,DO_NOW:1,SCALE:2,ANALYZE_INTENT:3,WAIT:4,DO_NOT_TOUCH:5};
    return order[a.action]-order[b.action]||b.score-a.score||b.impressions-a.impressions;
  });
}

export function actionLabel(action:SeoCommandAction){return ({DO_NOW:"КАЧАТИ ЗАРАЗ",SCALE:"МАСШТАБУВАТИ",FIX:"ВИПРАВИТИ",ANALYZE_INTENT:"РОЗІБРАТИ INTENT",WAIT:"СПОСТЕРЕЖЕННЯ",DO_NOT_TOUCH:"НЕ ЧІПАТИ"} as const)[action];}

export function evaluateTask(task:SeoCommandTask,current:SeoMetric|null):SeoTaskResultLike{
  if(!current||current.impressions<3)return "low_data";
  const b=task.baseline;
  const imprPct=safePct(current.impressions,b.impressions);
  const posImprovement=b.position-current.position;
  if(current.clicks>b.clicks||posImprovement>=3||(b.impressions>=3&&imprPct!==null&&imprPct>=30))return "positive";
  if((b.impressions>=5&&imprPct!==null&&imprPct<=-40)||posImprovement<=-5)return "negative";
  return "neutral";
}

type SeoTaskResultLike="positive"|"neutral"|"negative"|"low_data";