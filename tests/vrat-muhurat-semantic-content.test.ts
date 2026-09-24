import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {findCityBySlug} from "../lib/cities";
import {buildMuhuratMonthlyQualityContent} from "../lib/muhurat-content-engine";
import type {MuhuratRow} from "../lib/muhurat";
import {buildVratQualityContent} from "../lib/vrat-content-engine";
import {vratDefinitions,type VratOccurrence} from "../lib/vrat";

const city=findCityBySlug("mumbai")!;

function vratRows(tithi:"Ekadashi"|"Purnima"|"Amavasya",paksha:"Shukla"|"Krishna"):VratOccurrence[]{
  return [
    {date:"2026-01-05",weekday:"Monday",paksha,tithi,sunrise:"07:12",tithiEnd:"14:20",tithiEndDate:"2026-01-05",repeatedAtSunrise:false,sequence:1},
    {date:"2026-02-04",weekday:"Wednesday",paksha,tithi,sunrise:"07:05",tithiEnd:"06:50",tithiEndDate:"2026-02-05",repeatedAtSunrise:true,sequence:2},
    {date:"2026-03-06",weekday:"Friday",paksha,tithi,sunrise:"06:48",tithiEnd:"11:10",tithiEndDate:"2026-03-06",repeatedAtSunrise:false,sequence:3},
  ];
}

function muhuratRows():MuhuratRow[]{
  return [
    {date:"2026-10-08",data:{} as never,recommendedWindows:[{start:"09:10",end:"11:20",sources:["Shubh Choghadiya","Abhijit Muhurat"]}],avoidWindows:[],reasons:["Panchami Tithi","Rohini Nakshatra"],planning:{score:91,grade:"Excellent",totalCleanMinutes:180,longestWindowMinutes:130,sourceCount:2,hasAbhijit:true,idealContinuousMinutes:90,factors:[]}},
    {date:"2026-10-14",data:{} as never,recommendedWindows:[{start:"10:20",end:"11:05",sources:["Labh Choghadiya"]}],avoidWindows:[],reasons:["Ekadashi Tithi","Swati Nakshatra"],planning:{score:72,grade:"Strong",totalCleanMinutes:95,longestWindowMinutes:45,sourceCount:1,hasAbhijit:false,idealContinuousMinutes:90,factors:[]}},
  ];
}

describe("Vrat and Muhurat semantic content architecture",()=>{
  it("creates observance-specific Vrat fingerprints rather than one shared paragraph",()=>{
    const ekadashi=buildVratQualityContent(vratDefinitions.ekadashi,2026,city,vratRows("Ekadashi","Shukla"));
    const purnima=buildVratQualityContent(vratDefinitions.purnima,2026,city,vratRows("Purnima","Shukla"));
    const amavasya=buildVratQualityContent(vratDefinitions.amavasya,2026,city,vratRows("Amavasya","Krishna"));
    expect(ekadashi.observanceBody).toContain("Ekadashi calendar");
    expect(purnima.observanceBody).toContain("Purnima state");
    expect(amavasya.observanceBody).toContain("Amavasya state");
    expect(new Set([ekadashi.observanceBody,purnima.observanceBody,amavasya.observanceBody]).size).toBe(3);
    expect(ekadashi.transitionBody).toContain("following civil date");
  });

  it("creates event-specific Muhurat fingerprints from the same candidate rows",()=>{
    const rows=muhuratRows();
    const wedding=buildMuhuratMonthlyQualityContent("wedding",2026,10,city,rows);
    const vehicle=buildMuhuratMonthlyQualityContent("vehicle-purchase",2026,10,city,rows);
    expect(wedding.ruleBody).toContain("90 minutes");
    expect(wedding.ruleBody).toContain("long uninterrupted planning continuity");
    expect(vehicle.ruleBody).toContain("30 minutes");
    expect(vehicle.ruleBody).toContain("compact transaction-friendly windows");
    expect(wedding.fingerprintBody).not.toBe(vehicle.fingerprintBody);
  });

  it("wires public Vrat and Muhurat routes to semantic engines with no disclaimer shell",()=>{
    const files=[
      "app/vrat/page.tsx",
      "app/vrat/[vrat]/[year]/page.tsx",
      "app/vrat/[vrat]/[year]/[city]/page.tsx",
      "app/muhurat/page.tsx",
      "app/muhurat/[event]/[year]/page.tsx",
      "app/muhurat/[event]/[year]/[month]/page.tsx",
      "app/muhurat/[event]/[year]/[month]/[city]/page.tsx",
    ];
    for(const file of files){
      const source=readFileSync(file,"utf8");
      expect(source,`${file} still imports MethodologyNote`).not.toContain("MethodologyNote");
      expect(source,`${file} still links to disclaimer`).not.toContain('href="/disclaimer"');
      expect(source,`${file} still renders generic scope copy`).not.toContain("muhuratScreeningStatement");
    }
    expect(readFileSync("app/vrat/[vrat]/[year]/[city]/page.tsx","utf8")).toContain("buildVratQualityContent");
    expect(readFileSync("app/muhurat/[event]/[year]/[month]/[city]/page.tsx","utf8")).toContain("buildMuhuratMonthlyQualityContent");
    expect(readFileSync("app/muhurat/[event]/[year]/page.tsx","utf8")).toContain("buildMuhuratYearQualityContent");
  });
});
