import {afterEach,describe,expect,it} from "vitest";
import type {GscRow,GscTrafficSnapshot} from "../lib/gsc";
import {buildSearchOpportunities} from "../lib/search-opportunities";

const originalCities=process.env.SEO_EXTRA_INDEX_CITIES;
const originalRegional=process.env.SEO_EXTRA_REGIONAL_INTENTS;

afterEach(()=>{
  if(originalCities===undefined)delete process.env.SEO_EXTRA_INDEX_CITIES;else process.env.SEO_EXTRA_INDEX_CITIES=originalCities;
  if(originalRegional===undefined)delete process.env.SEO_EXTRA_REGIONAL_INTENTS;else process.env.SEO_EXTRA_REGIONAL_INTENTS=originalRegional;
});

function row(query:string,impressions:number,clicks:number,position:number):GscRow{return {keys:[query],impressions,clicks,position,ctr:impressions?clicks/impressions:0};}
function queryPage(query:string,page:string,impressions:number,clicks:number,position:number):GscRow{return {keys:[query,page],impressions,clicks,position,ctr:impressions?clicks/impressions:0};}
function snapshot(query:string,page:string,impressions=600,clicks=12,position=11.5):GscTrafficSnapshot{return {siteUrl:"sc-domain:panchvani.com",startDate:"2026-08-12",endDate:"2026-09-08",previousStartDate:"2026-07-15",previousEndDate:"2026-08-11",current:{clicks:0,impressions:0,ctr:0,position:0},previous:{clicks:0,impressions:0,ctr:0,position:0},pages:[],queries:[row(query,impressions,clicks,position)],queryPages:[queryPage(query,page,impressions,clicks,position)],daily:[]};}

describe("Regional search demand opportunities",()=>{
  it("routes a seeded Tamil Rahu query to the regional intent page and flags the old regional hub",()=>{
    delete process.env.SEO_EXTRA_INDEX_CITIES;
    delete process.env.SEO_EXTRA_REGIONAL_INTENTS;
    const result=buildSearchOpportunities(snapshot("tamil rahu kalam chennai","https://panchvani.com/regional/tamil/chennai"));
    expect(result).toHaveLength(1);
    expect(result[0].intent).toBe("regional:tamil:rahu-kalam");
    expect(result[0].recommendedPath).toBe("/regional/tamil/chennai/rahu-kalam");
    expect(result[0].status).toBe("WRONG_LANDING");
    expect(result[0].action).toBe("ALIGN");
  });

  it("treats an existing noindex regional route as an activation review, not a build request",()=>{
    process.env.SEO_EXTRA_INDEX_CITIES="coimbatore";
    delete process.env.SEO_EXTRA_REGIONAL_INTENTS;
    const result=buildSearchOpportunities(snapshot("tamil rahu kalam coimbatore","https://panchvani.com/regional/tamil/coimbatore"));
    expect(result[0].recommendedPath).toBe("/regional/tamil/coimbatore/rahu-kalam");
    expect(result[0].status).toBe("NEW_CLUSTER");
    expect(result[0].action).toBe("REVIEW");
    expect(result[0].reason).toContain("intentionally noindex");
    expect(result[0].reason).toContain("tamil:coimbatore:rahu-kalam");
  });

  it("moves the same demand into normal landing diagnostics after explicit activation",()=>{
    process.env.SEO_EXTRA_INDEX_CITIES="coimbatore";
    process.env.SEO_EXTRA_REGIONAL_INTENTS="tamil:coimbatore:rahu-kalam";
    const result=buildSearchOpportunities(snapshot("tamil rahu kalam coimbatore","https://panchvani.com/regional/tamil/coimbatore"));
    expect(result[0].status).toBe("WRONG_LANDING");
    expect(result[0].action).toBe("ALIGN");
  });

  it("keeps generic Bengali Panjika demand on the regional city hub",()=>{
    const result=buildSearchOpportunities(snapshot("bangla panjika kolkata","https://panchvani.com/regional/bengali/kolkata",900,80,3.8));
    expect(result[0].intent).toBe("regional:bengali:panchang");
    expect(result[0].recommendedPath).toBe("/regional/bengali/kolkata");
    expect(["COVERED","LOW_CTR"]).toContain(result[0].status);
  });
});
