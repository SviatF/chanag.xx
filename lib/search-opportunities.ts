import {supportedCities,type City} from "./cities";
import {allFestivals,festivalBySlugYear} from "./festivals";
import type {GscRow,GscTrafficSnapshot} from "./gsc";
import {
  detectRegionalSearchQuery,
  isRegionalIntentIndexable,
  regionalCityHubPath,
  regionalIntentPath,
  regionalIntentSeo,
  regionalLanguageHubPath,
  regionalLanguageSeo,
  type RegionalIntentSlug,
  type RegionalLanguageSlug,
  type RegionalSearchIntent,
} from "./regional-seo";
import {detectExpandedToolQuery,expandedToolPath,type ExpandedToolSlug} from "./tool-expansion";

export type SearchOpportunityStatus="NEW_CLUSTER"|"WRONG_LANDING"|"STRIKING_DISTANCE"|"LOW_CTR"|"NO_CLEAR_LANDING"|"COVERED";
export type SearchOpportunityAction="BUILD"|"ALIGN"|"STRENGTHEN"|"IMPROVE_SNIPPET"|"REVIEW"|"MONITOR";

export type SearchOpportunity={
  key:string;
  intent:string;
  label:string;
  topQuery:string;
  queryCount:number;
  city:string|null;
  clicks:number;
  impressions:number;
  ctr:number;
  position:number;
  currentLanding:string|null;
  recommendedPath:string;
  template:string;
  status:SearchOpportunityStatus;
  action:SearchOpportunityAction;
  score:number;
  reason:string;
};

type IntentResult={
  id:string;
  label:string;
  event?:"wedding"|"griha-pravesh"|"vehicle-purchase";
  festivalSlug?:string;
  regionalLanguage?:RegionalLanguageSlug;
  regionalIntent?:RegionalSearchIntent;
  expandedTool?:ExpandedToolSlug;
  template:string;
};

type QueryContext={
  raw:string;
  normalized:string;
  city:City|null;
  year:number;
  month:number|null;
  explicitYear:boolean;
  explicitMonth:boolean;
};

type Target={
  path:string;
  template:string;
  exists:boolean;
  activationOnly?:boolean;
  activationKey?:string;
  matches:(path:string)=>boolean;
};

const monthNames:Record<string,number>={
  january:1,jan:1,february:2,feb:2,march:3,mar:3,april:4,apr:4,may:5,june:6,jun:6,
  july:7,jul:7,august:8,aug:8,september:9,sep:9,sept:9,october:10,oct:10,november:11,nov:11,december:12,dec:12,
};

function normalize(value:string){
  return ` ${value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^\p{L}\p{N}]+/gu," ").trim()} `;
}

const cityMatchers=supportedCities
  .map(city=>({city,needle:normalize(city.name)}))
  .sort((a,b)=>b.needle.length-a.needle.length);

const festivalMatchers=[...new Map(allFestivals.map(f=>[f.slug,f])).values()]
  .flatMap(f=>[f.name,...f.regionalNames].map(term=>({slug:f.slug,needle:normalize(term)})))
  .sort((a,b)=>b.needle.length-a.needle.length);

function pathOnly(raw:string){
  try{return new URL(raw).pathname.replace(/\/$/,"")||"/";}catch{return (raw.split("?")[0]||"/").replace(/^https?:\/\/[^/]+/,"").replace(/\/$/,"")||"/";}
}

function monthFromQuery(normalized:string){
  for(const [name,month] of Object.entries(monthNames))if(normalized.includes(` ${name} `))return month;
  return null;
}

function queryContext(raw:string,asOf:string):QueryContext{
  const normalized=normalize(raw);
  const city=cityMatchers.find(item=>normalized.includes(item.needle))?.city??null;
  const explicitYearMatch=normalized.match(/\b(20\d{2})\b/);
  const explicitYear=Boolean(explicitYearMatch);
  const year=explicitYearMatch?Number(explicitYearMatch[1]):Number(asOf.slice(0,4));
  const month=monthFromQuery(normalized);
  return {raw,normalized,city,year,month,explicitYear,explicitMonth:month!==null};
}

function classifyIntent(ctx:QueryContext):IntentResult|null{
  const q=ctx.normalized;
  const festival=festivalMatchers.find(item=>q.includes(item.needle));
  if(festival)return {id:`festival:${festival.slug}`,label:"Festival",festivalSlug:festival.slug,template:"Festival overview / local festival page"};

  const regionalQuery=detectRegionalSearchQuery(ctx.raw);
  if(regionalQuery){
    const language=regionalQuery.language;
    const intent=regionalQuery.intent;
    const intentLabel=intent==="panchang"?regionalLanguageSeo[language].label:regionalIntentSeo[intent].label;
    return {
      id:`regional:${language}:${intent}`,
      label:intent==="panchang"?regionalLanguageSeo[language].label:`${regionalLanguageSeo[language].label} ${intentLabel}`,
      regionalLanguage:language,
      regionalIntent:intent,
      template:intent==="panchang"?"Existing regional city Panchang":"Existing regional intent route · demand-gated index activation"
    };
  }

  const expandedTool=detectExpandedToolQuery(ctx.raw);
  if(expandedTool)return {id:`tool:${expandedTool.slug}`,label:expandedTool.name,expandedTool:expandedTool.slug,template:"Existing evergreen Panchang tool"};

  if(/ (ekadashi|एकादशी) /.test(q))return {id:"vrat:ekadashi",label:"Ekadashi",template:"Existing Vrat yearly hub + city pages"};
  if(/ (purnima|पूर्णिमा) /.test(q))return {id:"vrat:purnima",label:"Purnima",template:"Existing Vrat yearly hub + city pages"};
  if(/ (amavasya|अमावस्या) /.test(q))return {id:"vrat:amavasya",label:"Amavasya",template:"Existing Vrat yearly hub + city pages"};
  if(/ (choghadiya|chogadia|चौघड़िया|चौघडिया) /.test(q))return {id:"tool:choghadiya",label:"Choghadiya",template:"City Choghadiya tool"};
  if(/ (rahu kalam|rahu kaal|rahukaal|राहु काल|राहुकाल) /.test(q))return {id:"tool:rahu",label:"Rahu Kalam",template:"Daily Panchang / Rahu calculator"};
  if(/ (griha pravesh|graha pravesh|house warming|गृह प्रवेश) /.test(q))return {id:"muhurat:griha-pravesh",label:"Griha Pravesh Muhurat",event:"griha-pravesh",template:"Muhurat month / yearly hub"};
  if(/ (wedding muhurat|marriage muhurat|vivah muhurat|shaadi muhurat|विवाह मुहूर्त|शादी मुहूर्त) /.test(q))return {id:"muhurat:wedding",label:"Wedding Muhurat",event:"wedding",template:"Muhurat month / yearly hub"};
  if(/ (vehicle purchase|car purchase|bike purchase|vehicle muhurat|car muhurat|वाहन मुहूर्त) /.test(q))return {id:"muhurat:vehicle-purchase",label:"Vehicle Purchase Muhurat",event:"vehicle-purchase",template:"Muhurat month / yearly hub"};
  if(/ (moon sign|moon rashi|chandra rashi|चंद्र राशि) /.test(q))return {id:"tool:moon-sign",label:"Moon Sign",template:"Moon Sign calculator"};
  if(/ (nakshatra finder|birth nakshatra|janma nakshatra|जन्म नक्षत्र) /.test(q))return {id:"tool:nakshatra",label:"Nakshatra Finder",template:"Nakshatra finder"};
  if(/ (baby names|baby name|hindu baby names|हिंदू बेबी नाम|बच्चे का नाम) /.test(q))return {id:"content:baby-names",label:"Hindu Baby Names",template:"Baby names hub"};
  if(/ (panchang|panchangam|panjika|पंचांग) /.test(q))return {id:"daily:panchang",label:"Daily Panchang",template:"Daily city Panchang"};
  return null;
}

function startsWithPath(path:string,prefix:string){
  return path===prefix||path.startsWith(prefix+"/");
}

function targetFor(intent:IntentResult,ctx:QueryContext):Target{
  const city=ctx.city;
  const citySlug=city?.slug;
  const month=ctx.month?String(ctx.month).padStart(2,"0"):null;

  if(intent.regionalLanguage&&intent.regionalIntent){
    const language=intent.regionalLanguage;
    const regionalIntent=intent.regionalIntent;
    if(regionalIntent==="panchang"){
      const expected=city?regionalCityHubPath(language,city):regionalLanguageHubPath(language);
      return {path:expected,template:intent.template,exists:true,matches:path=>startsWithPath(path,expected)};
    }
    if(!city){
      const expected=regionalLanguageHubPath(language);
      return {path:expected,template:"Regional language hub with timing discovery",exists:true,matches:path=>startsWithPath(path,expected)};
    }
    const expected=regionalIntentPath(language,city,regionalIntent as RegionalIntentSlug);
    const indexable=isRegionalIntentIndexable(language,city,regionalIntent);
    return {
      path:expected,
      template:intent.template,
      exists:true,
      activationOnly:!indexable,
      activationKey:`${language}:${city.slug}:${regionalIntent}`,
      matches:path=>startsWithPath(path,expected)
    };
  }

  if(intent.expandedTool){
    const expected=expandedToolPath(intent.expandedTool);
    return {path:expected,template:intent.template,exists:true,matches:path=>path===expected};
  }
  if(intent.id==="daily:panchang"){
    const expected=citySlug?`/panchang/${citySlug}`:"/";
    return {path:expected,template:intent.template,exists:true,matches:path=>citySlug?startsWithPath(path,expected):path==="/"};
  }
  if(intent.id==="tool:rahu"){
    const expected=citySlug?`/panchang/${citySlug}`:"/tools/rahu-kalam-calculator";
    return {path:expected,template:intent.template,exists:true,matches:path=>citySlug?startsWithPath(path,expected)||path==="/tools/rahu-kalam-calculator":path==="/tools/rahu-kalam-calculator"};
  }
  if(intent.id==="tool:choghadiya"){
    const expected=citySlug?`/tools/choghadiya/${citySlug}`:"/tools/choghadiya";
    return {path:expected,template:intent.template,exists:true,matches:path=>startsWithPath(path,expected)};
  }
  if(intent.id==="tool:moon-sign"){
    const expected="/tools/moon-sign-calculator";
    return {path:expected,template:intent.template,exists:true,matches:path=>path===expected};
  }
  if(intent.id==="tool:nakshatra"){
    const expected="/tools/nakshatra-finder";
    return {path:expected,template:intent.template,exists:true,matches:path=>path===expected};
  }
  if(intent.id==="content:baby-names"){
    const expected="/tools/hindu-baby-names";
    return {path:expected,template:intent.template,exists:false,matches:path=>startsWithPath(path,expected)};
  }
  if(intent.event){
    if(month){
      const expected=citySlug?`/muhurat/${intent.event}/${ctx.year}/${month}/${citySlug}`:`/muhurat/${intent.event}/${ctx.year}/${month}`;
      return {path:expected,template:"Existing monthly Muhurat template",exists:true,matches:path=>startsWithPath(path,expected)};
    }
    const expected=citySlug?`/muhurat/${intent.event}/${ctx.year}/${citySlug}`:`/muhurat/${intent.event}/${ctx.year}`;
    return {path:expected,template:"NEW yearly Muhurat hub",exists:false,matches:path=>startsWithPath(path,expected)};
  }
  if(intent.festivalSlug){
    const existing=festivalBySlugYear(intent.festivalSlug,ctx.year);
    const expected=citySlug?`/festivals/${intent.festivalSlug}/${ctx.year}/${citySlug}`:`/festivals/${intent.festivalSlug}/${ctx.year}`;
    return {path:expected,template:existing?intent.template:"Extend festival year dataset",exists:Boolean(existing),matches:path=>startsWithPath(path,expected)};
  }
  if(intent.id.startsWith("vrat:")){
    const slug=intent.id.split(":")[1];
    const expected=citySlug?`/vrat/${slug}/${ctx.year}/${citySlug}`:`/vrat/${slug}/${ctx.year}`;
    return {path:expected,template:"Existing Vrat yearly hub + city pages",exists:true,matches:path=>startsWithPath(path,expected)};
  }

  return {path:"/",template:"Manual review",exists:true,matches:path=>path==="/"};
}

type LandingAggregate={url:string;clicks:number;impressions:number;weightedPosition:number};
function buildLandingMap(rows:GscRow[]){
  const byQuery=new Map<string,Map<string,LandingAggregate>>();
  for(const row of rows){
    const query=row.keys?.[0];
    const page=row.keys?.[1];
    if(!query||!page)continue;
    const q=normalize(query);
    let pages=byQuery.get(q);
    if(!pages){pages=new Map();byQuery.set(q,pages);}
    const existing=pages.get(page)??{url:page,clicks:0,impressions:0,weightedPosition:0};
    existing.clicks+=row.clicks??0;
    existing.impressions+=row.impressions??0;
    existing.weightedPosition+=(row.position??0)*(row.impressions??0);
    pages.set(page,existing);
  }
  const best=new Map<string,{url:string;path:string;clicks:number;impressions:number;position:number}>();
  for(const [query,pages] of byQuery){
    const sorted=[...pages.values()].sort((a,b)=>b.impressions-a.impressions||b.clicks-a.clicks);
    const row=sorted[0];
    if(row)best.set(query,{url:row.url,path:pathOnly(row.url),clicks:row.clicks,impressions:row.impressions,position:row.impressions?row.weightedPosition/row.impressions:0});
  }
  return best;
}

function ctrBenchmark(position:number){
  if(position<=1.5)return .20;
  if(position<=3)return .10;
  if(position<=5)return .06;
  if(position<=10)return .03;
  return .01;
}

function classifyStatus(target:Target,currentLanding:string|null,position:number,ctr:number):SearchOpportunityStatus{
  if(target.activationOnly)return "NEW_CLUSTER";
  if(!target.exists)return "NEW_CLUSTER";
  if(!currentLanding)return "NO_CLEAR_LANDING";
  if(!target.matches(pathOnly(currentLanding)))return "WRONG_LANDING";
  if(position>8&&position<=25)return "STRIKING_DISTANCE";
  if(position<=10&&ctr<ctrBenchmark(position))return "LOW_CTR";
  return "COVERED";
}

function actionFor(status:SearchOpportunityStatus):SearchOpportunityAction{
  if(status==="NEW_CLUSTER")return "BUILD";
  if(status==="WRONG_LANDING")return "ALIGN";
  if(status==="STRIKING_DISTANCE")return "STRENGTHEN";
  if(status==="LOW_CTR")return "IMPROVE_SNIPPET";
  if(status==="NO_CLEAR_LANDING")return "REVIEW";
  return "MONITOR";
}

function scoreOpportunity(impressions:number,queryCount:number,position:number,ctr:number,status:SearchOpportunityStatus){
  const demand=Math.min(50,Math.log10(impressions+1)*16);
  const positionScore=position<=3?4:position<=10?15:position<=20?24:position<=40?18:10;
  const statusBonus:Record<SearchOpportunityStatus,number>={NEW_CLUSTER:24,WRONG_LANDING:22,STRIKING_DISTANCE:18,LOW_CTR:16,NO_CLEAR_LANDING:14,COVERED:0};
  const ctrGap=Math.max(0,ctrBenchmark(position)-ctr);
  const ctrScore=Math.min(8,ctrGap*100);
  const breadth=Math.min(8,Math.log2(queryCount+1)*3);
  return Math.round(Math.min(100,demand+positionScore+statusBonus[status]+ctrScore+breadth));
}

function reasonFor(status:SearchOpportunityStatus,target:Target,current:string|null,position:number,ctr:number){
  if(target.activationOnly)return `The regional intent route already exists but is intentionally noindex until demand review. Approve ${target.activationKey??"this language:city:intent combination"} through SEO_EXTRA_REGIONAL_INTENTS only if GSC evidence justifies activation.`;
  if(status==="NEW_CLUSTER")return `Demand exists for a page family Panchvani does not currently expose. Recommended template: ${target.template}.`;
  if(status==="WRONG_LANDING")return `Google is sending this intent to ${current?pathOnly(current):"another page"} instead of the expected landing page.`;
  if(status==="STRIKING_DISTANCE")return `The correct landing page is ranking around position ${position.toFixed(1)} and is within realistic striking distance of page-one visibility.`;
  if(status==="LOW_CTR")return `The correct page ranks at ${position.toFixed(1)} but CTR is only ${(ctr*100).toFixed(2)}%, below the internal benchmark for that position.`;
  if(status==="NO_CLEAR_LANDING")return `The query has GSC demand but no clear query-to-page row in the current snapshot; inspect before creating new content.`;
  return `The current landing page matches the detected search intent.`;
}

export function buildSearchOpportunities(snapshot:GscTrafficSnapshot):SearchOpportunity[]{
  const landingMap=buildLandingMap(snapshot.queryPages??[]);
  type Aggregate={
    intent:IntentResult;
    target:Target;
    city:string|null;
    clicks:number;
    impressions:number;
    weightedPosition:number;
    queries:Set<string>;
    topQuery:string;
    topQueryImpressions:number;
    topCurrentLanding:string|null;
  };
  const aggregates=new Map<string,Aggregate>();

  for(const row of snapshot.queries){
    const query=row.keys?.[0]?.trim();
    if(!query||!(row.impressions>0))continue;
    const ctx=queryContext(query,snapshot.endDate);
    const intent=classifyIntent(ctx);
    if(!intent)continue;
    const target=targetFor(intent,ctx);
    const city=ctx.city?.slug??null;
    const timeKey=intent.event&&!ctx.explicitMonth?`${ctx.year}:annual`:intent.event?`${ctx.year}:${ctx.month}`:intent.festivalSlug?`${ctx.year}`:intent.id.startsWith("vrat:")?`${ctx.year}`:"evergreen";
    const key=`${intent.id}:${city??"india"}:${timeKey}`;
    const current=landingMap.get(normalize(query));
    const existing=aggregates.get(key)??{
      intent,target,city,clicks:0,impressions:0,weightedPosition:0,queries:new Set<string>(),topQuery:query,topQueryImpressions:-1,topCurrentLanding:null
    };
    existing.clicks+=row.clicks??0;
    existing.impressions+=row.impressions??0;
    existing.weightedPosition+=(row.position??0)*(row.impressions??0);
    existing.queries.add(query);
    if((row.impressions??0)>existing.topQueryImpressions){
      existing.topQuery=query;
      existing.topQueryImpressions=row.impressions??0;
      existing.topCurrentLanding=current?.url??null;
      existing.target=target;
    }
    aggregates.set(key,existing);
  }

  return [...aggregates.entries()].map(([key,item])=>{
    const position=item.impressions?item.weightedPosition/item.impressions:0;
    const ctr=item.impressions?item.clicks/item.impressions:0;
    const status=classifyStatus(item.target,item.topCurrentLanding,position,ctr);
    return {
      key,
      intent:item.intent.id,
      label:item.intent.label,
      topQuery:item.topQuery,
      queryCount:item.queries.size,
      city:item.city,
      clicks:item.clicks,
      impressions:item.impressions,
      ctr,
      position,
      currentLanding:item.topCurrentLanding?pathOnly(item.topCurrentLanding):null,
      recommendedPath:item.target.path,
      template:item.target.template,
      status,
      action:item.target.activationOnly?"REVIEW":actionFor(status),
      score:scoreOpportunity(item.impressions,item.queries.size,position,ctr,status),
      reason:reasonFor(status,item.target,item.topCurrentLanding,position,ctr),
    } satisfies SearchOpportunity;
  }).sort((a,b)=>b.score-a.score||b.impressions-a.impressions||a.label.localeCompare(b.label));
}
