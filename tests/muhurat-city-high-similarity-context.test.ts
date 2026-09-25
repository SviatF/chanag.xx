import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {findCityBySlug} from "../lib/cities";
import type {MuhuratRow} from "../lib/muhurat";
import {buildMuhuratCitySimilarityContext} from "../lib/muhurat-city-similarity-context";
import {phase1PriorityCities} from "../lib/seo-policy";

const rows:MuhuratRow[]=[
  {date:"2027-07-05",data:{date:"2027-07-05",tithi:"Panchami",nakshatra:"Rohini",rahu:{start:"07:30",end:"09:00"},yamaganda:{start:"10:30",end:"12:00"},gulika:{start:"13:30",end:"15:00"},abhijit:{start:"12:05",end:"12:52"},dayChoghadiya:[]},recommendedWindows:[{start:"09:12",end:"10:18",sources:["Amrit Choghadiya","Shubh Choghadiya"]}],avoidWindows:[],reasons:["Panchami Tithi","Rohini Nakshatra"],planning:{score:82,grade:"Strong",totalCleanMinutes:112,longestWindowMinutes:66,sourceCount:2,hasAbhijit:false,idealContinuousMinutes:30,factors:[]}},
  {date:"2027-07-14",data:{date:"2027-07-14",tithi:"Dashami",nakshatra:"Pushya",rahu:{start:"12:00",end:"13:30"},yamaganda:{start:"07:30",end:"09:00"},gulika:{start:"10:30",end:"12:00"},abhijit:{start:"12:05",end:"12:52"},dayChoghadiya:[]},recommendedWindows:[{start:"06:10",end:"07:18",sources:["Labh Choghadiya"]},{start:"15:08",end:"16:02",sources:["Amrit Choghadiya"]}],avoidWindows:[],reasons:["Dashami Tithi","Pushya Nakshatra"],planning:{score:77,grade:"Strong",totalCleanMinutes:122,longestWindowMinutes:68,sourceCount:2,hasAbhijit:false,idealContinuousMinutes:30,factors:[]}},
  {date:"2027-07-23",data:{date:"2027-07-23",tithi:"Ekadashi",nakshatra:"Shravana",rahu:{start:"10:30",end:"12:00"},yamaganda:{start:"15:00",end:"16:30"},gulika:{start:"07:30",end:"09:00"},abhijit:{start:"12:06",end:"12:53"},dayChoghadiya:[]},recommendedWindows:[{start:"12:06",end:"12:53",sources:["Abhijit Muhurat"]}],avoidWindows:[],reasons:["Ekadashi Tithi","Shravana Nakshatra"],planning:{score:74,grade:"Strong",totalCleanMinutes:47,longestWindowMinutes:47,sourceCount:1,hasAbhijit:true,idealContinuousMinutes:30,factors:[]}}
];

const cityNames=phase1PriorityCities.map(slug=>findCityBySlug(slug)!).flatMap(city=>[city.name.toLowerCase(),city.state.toLowerCase()]);
function normalized(value:string){
  let out=value.toLowerCase();
  for(const token of cityNames.sort((a,b)=>b.length-a.length))out=out.replaceAll(token," ");
  return out.replace(/\b\d+(?::\d+)?\b/g," ").replace(/[^a-z]+/g," ").replace(/\s+/g," ").trim();
}
function trigrams(value:string){const words=value.split(/\s+/).filter(Boolean),out=new Set<string>();for(let i=0;i<=words.length-3;i++)out.add(words.slice(i,i+3).join(" "));return out;}
function jaccard(a:string,b:string){const left=trigrams(a),right=trigrams(b);let overlap=0;for(const item of left)if(right.has(item))overlap++;return overlap/(left.size+right.size-overlap||1);}
function maxPairwise(values:string[]){let max=0;for(let i=0;i<values.length;i++)for(let j=i+1;j<values.length;j++)max=Math.max(max,jaccard(values[i],values[j]));return max;}
function rendered(slug:string){const city=findCityBySlug(slug)!;const c=buildMuhuratCitySimilarityContext(city,rows,"Vehicle Purchase Muhurat",2027,7);return normalized([c.title,c.localityBody,c.decisionTitle,c.decisionBody,...c.facts.map(f=>`${f.label} ${f.value} ${f.note??""}`)].join(" "));}

describe("Muhurat city-month high-similarity locality layer",()=>{
  it("keeps all phase-one cities distinct even when the Muhurat rows are identical",()=>{
    const values=phase1PriorityCities.map(rendered);
    expect(new Set(values).size).toBe(phase1PriorityCities.length);
    expect(maxPairwise(values)).toBeLessThan(0.55);
  });
  it("separates the most frequent current high-risk city pairs",()=>{
    expect(jaccard(rendered("bhopal"),rendered("delhi"))).toBeLessThan(0.5);
    expect(jaccard(rendered("surat"),rendered("thane"))).toBeLessThan(0.5);
    expect(jaccard(rendered("lucknow"),rendered("surat"))).toBeLessThan(0.5);
  });
  it("renders the new locality decision lens on the public route",()=>{
    const source=readFileSync("app/muhurat/[event]/[year]/[month]/[city]/page.tsx","utf8");
    expect(source).toContain("buildMuhuratCitySimilarityContext");
    expect(source).toContain("MUHURAT LOCALITY LENS");
  });
});
