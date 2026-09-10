import {describe,expect,it} from "vitest";
import type {GscRow,GscTrafficSnapshot} from "../lib/gsc";
import {buildSearchOpportunities} from "../lib/search-opportunities";

function row(query:string,impressions:number,clicks:number,position:number):GscRow{return {keys:[query],impressions,clicks,position,ctr:impressions?clicks/impressions:0};}
function qp(query:string,page:string,impressions:number,clicks:number,position:number):GscRow{return {keys:[query,page],impressions,clicks,position,ctr:impressions?clicks/impressions:0};}
function snap(query:string,page:string,impressions=500,clicks=20,position=8.5):GscTrafficSnapshot{return {siteUrl:"sc-domain:panchvani.com",startDate:"2026-08-12",endDate:"2026-09-08",previousStartDate:"2026-07-15",previousEndDate:"2026-08-11",current:{clicks:0,impressions:0,ctr:0,position:0},previous:{clicks:0,impressions:0,ctr:0,position:0},pages:[],queries:[row(query,impressions,clicks,position)],queryPages:[qp(query,page,impressions,clicks,position)],daily:[]};}

describe("Expanded tool Search Opportunity ownership",()=>{
  it("maps Tithi demand to the evergreen Tithi Finder instead of Daily Panchang",()=>{
    const [item]=buildSearchOpportunities(snap("tithi today delhi","https://panchvani.com/panchang/delhi"));
    expect(item.intent).toBe("tool:tithi-finder");
    expect(item.recommendedPath).toBe("/tools/tithi-finder");
    expect(item.status).toBe("WRONG_LANDING");
  });

  it("keeps generic city Panchang demand owned by the daily city page",()=>{
    const [item]=buildSearchOpportunities(snap("panchang delhi today","https://panchvani.com/panchang/delhi",900,90,3.2));
    expect(item.intent).toBe("daily:panchang");
    expect(item.recommendedPath).toBe("/panchang/delhi");
  });

  it("recognizes a correctly aligned Moon Phase landing",()=>{
    const [item]=buildSearchOpportunities(snap("moon phase today India","https://panchvani.com/tools/moon-phase",700,65,4.5));
    expect(item.intent).toBe("tool:moon-phase");
    expect(item.recommendedPath).toBe("/tools/moon-phase");
    expect(["COVERED","LOW_CTR"]).toContain(item.status);
  });

  it("routes date-lookup intent to the lookup tool even when a city modifier exists",()=>{
    const [item]=buildSearchOpportunities(snap("panchang date lookup pune","https://panchvani.com/panchang/pune"));
    expect(item.intent).toBe("tool:panchang-date-lookup");
    expect(item.city).toBe("pune");
    expect(item.recommendedPath).toBe("/tools/panchang-date-lookup");
  });
});
