import { cityCandidates } from "./city-candidates";
import { coreCities, supportedCities } from "./cities";
import { phase1PriorityCities } from "./seo-policy";
import type { GscTrafficSnapshot } from "./gsc";

export type DemandRecommendation="ACTIVE"|"ACTIVATE"|"WATCH"|"HOLD";

export type CityDemand={
  slug:string;
  name:string;
  state:string;
  population:number;
  core:boolean;
  priority:boolean;
  queryClicks:number;
  queryImpressions:number;
  pageClicks:number;
  pageImpressions:number;
  matchedQueries:number;
  averagePosition:number;
  score:number;
  recommendation:DemandRecommendation;
};

const populationMap=new Map(cityCandidates.map(city=>[city.slug,city.population]));
const coreSet=new Set(coreCities.map(city=>city.slug));
const prioritySet=new Set<string>(phase1PriorityCities);
const supportedSlugSet=new Set(supportedCities.map(city=>city.slug));

function normalize(value:string){
  return " "+value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g," ").trim()+" ";
}

const cityMatchers=supportedCities
  .map(city=>({slug:city.slug,name:normalize(city.name)}))
  .sort((a,b)=>b.name.length-a.name.length);

function cityFromQuery(query:string){
  const normalized=normalize(query);
  return cityMatchers.find(city=>normalized.includes(city.name))?.slug;
}

function cityFromPage(raw:string){
  try{
    const url=new URL(raw);
    const parts=url.pathname.split("/").filter(Boolean);
    return parts.find(part=>supportedSlugSet.has(part));
  }catch{
    const parts=raw.split("?")[0].split("/").filter(Boolean);
    return parts.find(part=>supportedSlugSet.has(part));
  }
}

export function buildCityDemand(snapshot:GscTrafficSnapshot):CityDemand[]{
  type Aggregate={
    queryClicks:number;
    queryImpressions:number;
    pageClicks:number;
    pageImpressions:number;
    matchedQueries:Set<string>;
    weightedPosition:number;
    positionImpressions:number;
  };

  const aggregates=new Map<string,Aggregate>();
  const get=(slug:string)=>{
    const existing=aggregates.get(slug);
    if(existing)return existing;
    const created:Aggregate={
      queryClicks:0,queryImpressions:0,pageClicks:0,pageImpressions:0,
      matchedQueries:new Set(),weightedPosition:0,positionImpressions:0,
    };
    aggregates.set(slug,created);
    return created;
  };

  for(const row of snapshot.queries){
    const query=row.keys?.[0]??"";
    const slug=cityFromQuery(query);
    if(!slug)continue;
    const item=get(slug);
    item.queryClicks+=row.clicks??0;
    item.queryImpressions+=row.impressions??0;
    item.matchedQueries.add(query);
    item.weightedPosition+=(row.position??0)*(row.impressions??0);
    item.positionImpressions+=row.impressions??0;
  }

  for(const row of snapshot.pages){
    const page=row.keys?.[0]??"";
    const slug=cityFromPage(page);
    if(!slug)continue;
    const item=get(slug);
    item.pageClicks+=row.clicks??0;
    item.pageImpressions+=row.impressions??0;
    item.weightedPosition+=(row.position??0)*(row.impressions??0);
    item.positionImpressions+=row.impressions??0;
  }

  return supportedCities.map(city=>{
    const a=aggregates.get(city.slug)??{
      queryClicks:0,queryImpressions:0,pageClicks:0,pageImpressions:0,
      matchedQueries:new Set<string>(),weightedPosition:0,positionImpressions:0,
    };
    const impressions=a.queryImpressions+a.pageImpressions;
    const clicks=a.queryClicks+a.pageClicks;
    const population=populationMap.get(city.slug)??0;
    const populationBonus=population?Math.min(10,Math.max(0,(Math.log10(population)-5)*8)):0;
    const trafficScore=Math.min(45,Math.log10(impressions+1)*14);
    const clickScore=Math.min(30,Math.log10(clicks+1)*15);
    const queryScore=Math.min(15,a.matchedQueries.size*1.5);
    const score=Math.round(Math.min(100,trafficScore+clickScore+queryScore+populationBonus));
    const priority=prioritySet.has(city.slug);
    const recommendation:DemandRecommendation=
      priority?"ACTIVE":
      score>=55||impressions>=1000?"ACTIVATE":
      score>=25||impressions>=200?"WATCH":"HOLD";

    return {
      slug:city.slug,
      name:city.name,
      state:city.state,
      population,
      core:coreSet.has(city.slug),
      priority,
      queryClicks:a.queryClicks,
      queryImpressions:a.queryImpressions,
      pageClicks:a.pageClicks,
      pageImpressions:a.pageImpressions,
      matchedQueries:a.matchedQueries.size,
      averagePosition:a.positionImpressions?a.weightedPosition/a.positionImpressions:0,
      score,
      recommendation,
    };
  }).sort((a,b)=>b.score-a.score||b.population-a.population);
}
