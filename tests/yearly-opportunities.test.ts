import {describe,expect,it} from "vitest";
import type {GscRow,GscTrafficSnapshot} from "../lib/gsc";
import {buildSearchOpportunities} from "../lib/search-opportunities";

function row(query:string,impressions=800,clicks=30,position=9.5):GscRow{return {keys:[query],impressions,clicks,position,ctr:clicks/impressions};}
function queryPage(query:string,page:string,impressions=800,clicks=30,position=9.5):GscRow{return {keys:[query,page],impressions,clicks,position,ctr:clicks/impressions};}
function snapshot(query:string,page:string,position=9.5):GscTrafficSnapshot{return {siteUrl:"sc-domain:panchvani.com",startDate:"2026-08-12",endDate:"2026-09-08",previousStartDate:"2026-07-15",previousEndDate:"2026-08-11",current:{clicks:0,impressions:0,ctr:0,position:0},previous:{clicks:0,impressions:0,ctr:0,position:0},pages:[],queries:[row(query,800,30,position)],queryPages:[queryPage(query,page,800,30,position)],daily:[]};}

describe("Yearly Search Demand Expansion",()=>{
  it("maps national Hindu Calendar year intent to the annual owner",()=>{
    const result=buildSearchOpportunities(snapshot("hindu calendar 2027","https://panchvani.com/hindu-calendar/2027",5));
    expect(result[0].intent).toBe("yearly:hindu-calendar");
    expect(result[0].recommendedPath).toBe("/hindu-calendar/2027");
    expect(result[0].status).not.toBe("NEW_CLUSTER");
    expect(result[0].action).not.toBe("BUILD");
  });

  it("maps city Panchang year intent to the city yearly calendar",()=>{
    const result=buildSearchOpportunities(snapshot("panchang 2027 delhi","https://panchvani.com/calendar/delhi/2027",6));
    expect(result[0].intent).toBe("yearly:hindu-calendar");
    expect(result[0].city).toBe("delhi");
    expect(result[0].recommendedPath).toBe("/calendar/delhi/2027");
    expect(result[0].status).not.toBe("NEW_CLUSTER");
  });

  it("maps annual Muhurat demand to the new yearly owner",()=>{
    const result=buildSearchOpportunities(snapshot("wedding muhurat 2027","https://panchvani.com/muhurat/wedding/2027",12));
    expect(result[0].recommendedPath).toBe("/muhurat/wedding/2027");
    expect(result[0].template).toBe("Existing yearly Muhurat hub");
    expect(result[0].status).toBe("STRIKING_DISTANCE");
  });

  it("does not invent a city-year Muhurat route for annual city-modified demand",()=>{
    const result=buildSearchOpportunities(snapshot("wedding muhurat delhi 2027","https://panchvani.com/muhurat/wedding/2027",7));
    expect(result[0].city).toBe("delhi");
    expect(result[0].recommendedPath).toBe("/muhurat/wedding/2027");
    expect(result[0].recommendedPath).not.toContain("/2027/delhi");
  });

  it("turns far-future yearly demand into policy review rather than duplicate build",()=>{
    const result=buildSearchOpportunities(snapshot("hindu calendar 2030","https://panchvani.com/hindu-calendar/2026",14));
    expect(result[0].recommendedPath).toBe("/hindu-calendar/2030");
    expect(result[0].status).toBe("NEW_CLUSTER");
    expect(result[0].action).toBe("REVIEW");
    expect(result[0].reason).toContain("outside the current rolling yearly index window");
  });

  it("keeps existing Vrat and Festival year ownership intact",()=>{
    const ekadashi=buildSearchOpportunities(snapshot("ekadashi 2027","https://panchvani.com/vrat/ekadashi/2027",6));
    expect(ekadashi[0].recommendedPath).toBe("/vrat/ekadashi/2027");
    const diwali=buildSearchOpportunities(snapshot("diwali 2027","https://panchvani.com/festivals/diwali/2027",6));
    expect(diwali[0].recommendedPath).toBe("/festivals/diwali/2027");
  });
});