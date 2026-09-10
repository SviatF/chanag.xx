import {describe,expect,it} from "vitest";
import type {GscTrafficSnapshot} from "../lib/gsc";
import type {OpportunityLifecycleRecord} from "../lib/opportunity-lifecycle";
import type {SearchOpportunity} from "../lib/search-opportunities";
import type {SeoIndexationRunState} from "../lib/indexation-store";
import {buildSeoCommandCenter,buildCityExpansionCandidates} from "../lib/seo-command-center";

function snapshot():GscTrafficSnapshot{
  return {siteUrl:"sc-domain:panchvani.com",startDate:"2026-08-12",endDate:"2026-09-08",previousStartDate:"2026-07-15",previousEndDate:"2026-08-11",current:{clicks:120,impressions:12000,ctr:.01,position:9},previous:{clicks:80,impressions:8000,ctr:.01,position:11},pages:[],queries:[],queryPages:[],daily:[]};
}

function opportunity(city="Mumbai"):SearchOpportunity{
  const slug=city.toLowerCase().replaceAll(" ","-");
  return {key:`tool:choghadiya:${slug}`,intent:"tool:choghadiya",label:"Choghadiya",topQuery:`choghadiya ${city}`,queryCount:4,city,clicks:5,impressions:600,ctr:.008,position:8,currentLanding:`https://panchvani.com/panchang/${slug}`,recommendedPath:`/tools/choghadiya/${slug}`,template:"City Choghadiya tool",status:"WRONG_LANDING",action:"ALIGN",score:88,reason:"wrong landing"};
}

function indexation():SeoIndexationRunState{
  return {status:"SUCCESS",startedAt:"2026-09-10T00:00:00Z",completedAt:"2026-09-10T00:01:00Z",candidates:1,inspected:1,summary:{inspected:1,healthy:0,critical:1,high:0,medium:0,info:0,indexedPass:0,canonicalMismatches:0,crawlBlocks:0,fetchErrors:1},findings:[{url:"https://panchvani.com/tools/choghadiya/mumbai",source:"OPPORTUNITY",severity:"CRITICAL",issue:"FETCH_ERROR",verdict:"FAIL",coverageState:"Server error",pageFetchState:"SERVER_ERROR",indexingState:"INDEXING_ALLOWED",robotsTxtState:"ALLOWED",googleCanonical:null,userCanonical:"https://panchvani.com/tools/choghadiya/mumbai",lastCrawlTime:null,crawlAgeDays:null,sitemapCount:1,action:"Fix the fetch/HTTP response first.",evidence:"server error",inspectedAt:"2026-09-10T00:01:00Z"}],errors:[]};
}

function record():OpportunityLifecycleRecord{
  return {key:"test",stage:"MEASURING",owner:"",note:"",createdAt:"2026-08-01T00:00:00Z",updatedAt:"2026-09-01T00:00:00Z",shippedAt:"2026-08-01T00:00:00Z",context:{label:"Choghadiya",topQuery:"choghadiya mumbai",city:"Mumbai",recommendedPath:"/tools/choghadiya/mumbai",template:"City Choghadiya tool",intent:"tool:choghadiya",status:"WRONG_LANDING",action:"ALIGN"},implementations:[{id:"impl",hypothesis:"align landing",commitSha:"abcdef1",prUrl:null,changedFiles:["app/page.tsx"],deployedUrl:"https://panchvani.com/tools/choghadiya/mumbai",versionLabel:"v1",note:"",createdAt:"2026-08-01T00:00:00Z",updatedAt:"2026-08-01T00:00:00Z",shippedAt:"2026-08-01T00:00:00Z"}],activeImplementationId:"impl",shippedImplementationId:"impl",outcomes:[{days:28,evaluatedAt:"2026-09-01T00:00:00Z",implementationId:"impl",pre:{startDate:"2026-07-01",endDate:"2026-07-28",clicks:10,impressions:200,ctr:.05,position:12,topLanding:"https://panchvani.com/panchang/mumbai"},post:{startDate:"2026-08-01",endDate:"2026-08-28",clicks:5,impressions:120,ctr:.041,position:16,topLanding:"https://panchvani.com/tools/choghadiya/mumbai"},landingAligned:true,clicksChangePct:-50,impressionsChangePct:-40,ctrDeltaPoints:-.9,positionImprovement:-4,score:25,signal:"DOWN",recommendation:"REGRESSED",reason:"regressed"}],history:[]};
}

describe("SEO Command Center",()=>{
  it("makes critical indexation or measured regression an executive critical state",()=>{
    const model=buildSeoCommandCenter({snapshot:snapshot(),opportunities:[opportunity()],records:{test:record()},indexation:indexation(),autopilot:null});
    expect(model.health).toBe("CRITICAL");
    expect(model.nextActions[0].priority).toBe("P0");
    expect(model.nextActions.some(action=>action.type==="INDEXATION")).toBe(true);
    expect(model.nextActions.some(action=>action.type==="OUTCOME")).toBe(true);
  });

  it("calculates current vs previous organic movement",()=>{
    const model=buildSeoCommandCenter({snapshot:snapshot(),opportunities:[],records:{},indexation:null,autopilot:null});
    expect(model.traffic.clicksChangePct).toBe(50);
    expect(model.traffic.impressionsChangePct).toBe(50);
    expect(model.traffic.positionImprovement).toBe(2);
  });

  it("never fabricates traffic metrics when Search Console is unavailable",()=>{
    const model=buildSeoCommandCenter({snapshot:null,opportunities:[],records:{},indexation:null,autopilot:null});
    expect(model.health).toBe("NO_DATA");
    expect(model.traffic.available).toBe(false);
    expect(model.traffic.period).toBeNull();
  });

  it("excludes already-indexable baseline cities from expansion candidates",()=>{
    const rows=buildCityExpansionCandidates([opportunity("Mumbai"),opportunity("Agra")]);
    expect(rows.some(row=>row.city==="Mumbai")).toBe(false);
    expect(rows.some(row=>row.city==="Agra")).toBe(true);
  });

  it("keeps city activation as review evidence rather than changing index policy",()=>{
    const model=buildSeoCommandCenter({snapshot:snapshot(),opportunities:[opportunity("Agra")],records:{},indexation:null,autopilot:null});
    expect(model.cityExpansion[0]?.city).toBe("Agra");
    expect(model.nextActions.some(action=>action.type==="CITY_EXPANSION")).toBe(true);
  });
});
