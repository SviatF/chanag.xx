import {describe,expect,it} from "vitest";
import {findCityBySlug} from "../lib/cities";
import {buildMuhuratCityContext} from "../lib/muhurat-city-context";
import type {MuhuratRow} from "../lib/muhurat";
import {phase1PriorityCities} from "../lib/seo-policy";

function rows():MuhuratRow[]{
  return [
    {
      date:"2026-10-08",
      data:{rahu:{start:"13:30",end:"15:00"}} as any,
      recommendedWindows:[{start:"09:10",end:"11:20",sources:["Shubh Choghadiya","Abhijit Muhurat"]}],
      avoidWindows:[],reasons:["Panchami Tithi","Rohini Nakshatra"],
      planning:{score:91,grade:"Excellent",totalCleanMinutes:180,longestWindowMinutes:130,sourceCount:2,hasAbhijit:true,idealContinuousMinutes:90,factors:[]}
    },
    {
      date:"2026-10-18",
      data:{rahu:{start:"10:45",end:"12:15"}} as any,
      recommendedWindows:[{start:"10:20",end:"11:05",sources:["Labh Choghadiya"]}],
      avoidWindows:[],reasons:["Ekadashi Tithi","Swati Nakshatra"],
      planning:{score:72,grade:"Strong",totalCleanMinutes:95,longestWindowMinutes:45,sourceCount:1,hasAbhijit:false,idealContinuousMinutes:90,factors:[]}
    }
  ];
}

function normalized(value:string,city:string,state:string){
  return value.toLowerCase()
    .replaceAll(city.toLowerCase()," ")
    .replaceAll(state.toLowerCase()," ")
    .replace(/\b\d+(?::\d+)?\b/g," ")
    .replace(/[^a-z]+/g," ")
    .replace(/\s+/g," ")
    .trim();
}

describe("Muhurat city semantic dedup layer",()=>{
  it("keeps every phase-one city distinct even after city names and numbers are stripped",()=>{
    const values=phase1PriorityCities.map(slug=>{
      const city=findCityBySlug(slug)!;
      const context=buildMuhuratCityContext(city,rows(),"Wedding Muhurat");
      const text=[context.title,context.body,context.secondaryBody,...context.facts.map(item=>`${item.label} ${item.value} ${item.note??""}`)].join(" ");
      return normalized(text,city.name,city.state);
    });
    expect(new Set(values).size).toBe(phase1PriorityCities.length);
  });

  it("is rendered on the public city-month Muhurat route",async()=>{
    const source=await import("node:fs").then(fs=>fs.readFileSync("app/muhurat/[event]/[year]/[month]/[city]/page.tsx","utf8"));
    expect(source).toContain("buildMuhuratCityContext");
    expect(source).toContain("LOCAL CITY SIGNATURE");
  });
});
