import {describe,expect,it} from "vitest";
import type {GscRow,GscTrafficSnapshot} from "../lib/gsc";
import {buildSearchOpportunities} from "../lib/search-opportunities";

function row(query:string,impressions:number,clicks:number,position:number):GscRow{
  return {keys:[query],impressions,clicks,position,ctr:impressions?clicks/impressions:0};
}

function queryPage(query:string,page:string,impressions:number,clicks:number,position:number):GscRow{
  return {keys:[query,page],impressions,clicks,position,ctr:impressions?clicks/impressions:0};
}

function snapshot(queries:GscRow[],queryPages:GscRow[]):GscTrafficSnapshot{
  return {
    siteUrl:"sc-domain:panchvani.com",
    startDate:"2026-08-12",
    endDate:"2026-09-08",
    previousStartDate:"2026-07-15",
    previousEndDate:"2026-08-11",
    current:{clicks:0,impressions:0,ctr:0,position:0},
    previous:{clicks:0,impressions:0,ctr:0,position:0},
    pages:[],queries,queryPages,daily:[]
  };
}

describe("Search Demand Expansion Engine",()=>{
  it("routes Ekadashi demand to the implemented Vrat cluster and flags the old Panchang landing",()=>{
    const q="ekadashi 2026 delhi";
    const result=buildSearchOpportunities(snapshot(
      [row(q,1400,22,11.8)],
      [queryPage(q,"https://panchvani.com/panchang/delhi/2026-09-08",1400,22,11.8)]
    ));
    const opportunity=result[0];
    expect(opportunity.intent).toBe("vrat:ekadashi");
    expect(opportunity.status).toBe("WRONG_LANDING");
    expect(opportunity.action).toBe("ALIGN");
    expect(opportunity.recommendedPath).toBe("/vrat/ekadashi/2026/delhi");
    expect(opportunity.template).toContain("Existing Vrat");
  });

  it("treats a correctly ranking Vrat page as striking distance instead of a missing cluster",()=>{
    const q="purnima 2026 mumbai";
    const page="https://panchvani.com/vrat/purnima/2026/mumbai";
    const result=buildSearchOpportunities(snapshot(
      [row(q,760,18,13.1)],
      [queryPage(q,page,760,18,13.1)]
    ));
    expect(result[0].status).toBe("STRIKING_DISTANCE");
    expect(result[0].action).toBe("STRENGTHEN");
    expect(result[0].recommendedPath).toBe("/vrat/purnima/2026/mumbai");
  });

  it("detects when Google ranks the wrong page for an existing Choghadiya intent",()=>{
    const q="choghadiya today mumbai";
    const result=buildSearchOpportunities(snapshot(
      [row(q,800,18,8.6)],
      [queryPage(q,"https://panchvani.com/panchang/mumbai/2026-09-08",800,18,8.6)]
    ));
    const opportunity=result[0];
    expect(opportunity.status).toBe("WRONG_LANDING");
    expect(opportunity.action).toBe("ALIGN");
    expect(opportunity.currentLanding).toBe("/panchang/mumbai/2026-09-08");
    expect(opportunity.recommendedPath).toBe("/tools/choghadiya/mumbai");
  });

  it("marks a correct monthly Muhurat page in positions 9-25 as striking distance",()=>{
    const q="wedding muhurat september 2026 delhi";
    const page="https://panchvani.com/muhurat/wedding/2026/09/delhi";
    const result=buildSearchOpportunities(snapshot(
      [row(q,620,12,12.4)],
      [queryPage(q,page,620,12,12.4)]
    ));
    const opportunity=result[0];
    expect(opportunity.status).toBe("STRIKING_DISTANCE");
    expect(opportunity.action).toBe("STRENGTHEN");
    expect(opportunity.recommendedPath).toBe("/muhurat/wedding/2026/09/delhi");
  });

  it("identifies low CTR when the correct tool already ranks on page one",()=>{
    const q="moon sign calculator";
    const page="https://panchvani.com/tools/moon-sign-calculator";
    const result=buildSearchOpportunities(snapshot(
      [row(q,1000,10,4.5)],
      [queryPage(q,page,1000,10,4.5)]
    ));
    expect(result[0].status).toBe("LOW_CTR");
    expect(result[0].action).toBe("IMPROVE_SNIPPET");
  });

  it("keeps a well-matched, well-performing daily Panchang query covered",()=>{
    const q="panchang today mumbai";
    const page="https://panchvani.com/panchang/mumbai/2026-09-08";
    const result=buildSearchOpportunities(snapshot(
      [row(q,900,135,2.2)],
      [queryPage(q,page,900,135,2.2)]
    ));
    expect(result[0].status).toBe("COVERED");
    expect(result[0].action).toBe("MONITOR");
  });

  it("aggregates query variants into one demand opportunity",()=>{
    const a="rahu kaal delhi";
    const b="rahu kalam delhi";
    const page="https://panchvani.com/panchang/delhi/2026-09-08";
    const result=buildSearchOpportunities(snapshot(
      [row(a,500,15,7),row(b,300,9,7.5)],
      [queryPage(a,page,500,15,7),queryPage(b,page,300,9,7.5)]
    ));
    expect(result).toHaveLength(1);
    expect(result[0].queryCount).toBe(2);
    expect(result[0].impressions).toBe(800);
    expect(result[0].recommendedPath).toBe("/panchang/delhi");
  });
});