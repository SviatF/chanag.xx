import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {buildMuhuratYearHighSimilarityContext} from "../lib/muhurat-year-high-similarity-context";
import type {MuhuratRow} from "../lib/muhurat";
import type {YearlyMuhuratMonth,YearlyMuhuratSummary} from "../lib/yearly-expansion";

const monthNames=["January","February","March","April","May","June","July","August","September","October","November","December"];
const events=["wedding","griha-pravesh","vehicle-purchase"] as const;

function row(event:string,year:number,month:number,index:number):MuhuratRow{
  const eventShift=event==="wedding"?1:event==="griha-pravesh"?3:5;
  const day=4+index*5+((year+eventShift)%3);
  const sources=["Abhijit Muhurat","Shubh Choghadiya","Labh Choghadiya","Amrit Choghadiya"];
  const tithis=["Panchami","Ekadashi","Trayodashi","Saptami","Tritiya"];
  const nakshatras=["Rohini","Swati","Anuradha","Revati","Uttara Phalguni"];
  const source=sources[(year+month+index+eventShift)%sources.length];
  const score=67+((year+month*5+index*7+eventShift)%29);
  return {
    date:`${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`,
    data:{} as never,
    recommendedWindows:[{start:`${String(7+((year+month+eventShift)%7)).padStart(2,"0")}:15`,end:`${String(9+((year+month+eventShift)%7)).padStart(2,"0")}:05`,sources:[source]}],
    avoidWindows:[],
    reasons:[`${tithis[(year+month+eventShift)%tithis.length]} Tithi`,`${nakshatras[(year+index+eventShift)%nakshatras.length]} Nakshatra`],
    planning:{score,grade:score>=85?"Excellent":score>=70?"Strong":"Good",totalCleanMinutes:75+((month*17+year+eventShift)%125),longestWindowMinutes:40+((month*19+year+eventShift)%125),sourceCount:1,hasAbhijit:source==="Abhijit Muhurat",idealContinuousMinutes:90,factors:[]}
  };
}

function summary(event:string,year:number):YearlyMuhuratSummary{
  const patterns:Record<number,number[]>={
    2025:[1,2,4,7,10],
    2026:[1,3,5,6,9,12],
    2027:[2,3,4,8,9,10,11],
    2028:[1,2,3,4,5,7,8,10,12],
  };
  const eventShift=event==="wedding"?0:event==="griha-pravesh"?1:2;
  const base=patterns[year]??[1,4,7,10];
  const active=[...new Set(base.map(month=>((month+eventShift-1)%12)+1))].sort((a,b)=>a-b);
  const rowsByMonth=new Map<number,MuhuratRow[]>();
  for(const month of active){
    const count=1+((year+month+eventShift)%3);
    rowsByMonth.set(month,Array.from({length:count},(_,index)=>row(event,year,month,index)));
  }
  const rows=[...rowsByMonth.values()].flat().sort((a,b)=>b.planning.score-a.planning.score||a.date.localeCompare(b.date));
  const months:YearlyMuhuratMonth[]=monthNames.map((name,index)=>{
    const month=index+1,list=rowsByMonth.get(month)??[];
    return {month,slug:String(month).padStart(2,"0"),name,qualified:list.length,excellent:list.filter(r=>r.planning.grade==="Excellent").length,strong:list.filter(r=>r.planning.grade==="Strong").length,averageScore:list.length?Math.round(list.reduce((sum,item)=>sum+item.planning.score,0)/list.length):0,top:[...list].sort((a,b)=>b.planning.score-a.planning.score)[0]??null};
  });
  const title=event==="wedding"?"Wedding Muhurat":event==="griha-pravesh"?"Griha Pravesh Muhurat":"Vehicle Purchase Muhurat";
  return {event,year,title,months,rows,topRows:rows.slice(0,10),totalQualified:rows.length,excellentCount:rows.filter(r=>r.planning.grade==="Excellent").length,strongCount:rows.filter(r=>r.planning.grade==="Strong").length,averageScore:rows.length?Math.round(rows.reduce((sum,item)=>sum+item.planning.score,0)/rows.length):0,strongestMonth:[...months].filter(m=>m.qualified>0).sort((a,b)=>b.qualified-a.qualified||b.averageScore-a.averageScore)[0]??null};
}

function normalized(value:string){return value.toLowerCase().replace(/\b\d+(?::\d+)?\b/g," ").replace(/[^a-z]+/g," ").replace(/\s+/g," ").trim();}
function trigrams(value:string){const words=normalized(value).split(" ").filter(Boolean);return new Set(words.length<3?words:words.slice(0,-2).map((_,index)=>words.slice(index,index+3).join(" ")));}
function similarity(a:string,b:string){const left=trigrams(a),right=trigrams(b);let overlap=0;for(const item of left)if(right.has(item))overlap++;return overlap/(left.size+right.size-overlap||1);}
function rendered(event:string,year:number){const context=buildMuhuratYearHighSimilarityContext(summary(event,year));return [context.title,context.eventBody,context.sequenceTitle,context.sequenceBody,context.shortlistTitle,context.shortlistBody,...context.facts.map(item=>`${item.label} ${item.value} ${item.note??""}`)].join(" ");}

describe("Muhurat year high-similarity planning fingerprint",()=>{
  it("keeps all indexed years below the rendered HIGH threshold inside each event",()=>{
    for(const event of events){
      const outputs=[2025,2026,2027,2028].map(year=>rendered(event,year));
      let max=0;
      for(let i=0;i<outputs.length;i++)for(let j=i+1;j<outputs.length;j++)max=Math.max(max,similarity(outputs[i],outputs[j]));
      expect(max).toBeLessThan(0.68);
    }
  });

  it("keeps the three Muhurat intents semantically separated",()=>{
    const outputs=events.map(event=>rendered(event,2026));
    expect(similarity(outputs[0],outputs[1])).toBeLessThan(0.68);
    expect(similarity(outputs[0],outputs[2])).toBeLessThan(0.68);
    expect(similarity(outputs[1],outputs[2])).toBeLessThan(0.68);
  });

  it("renders the annual comparison fingerprint on the public route",()=>{
    const source=readFileSync("app/muhurat/[event]/[year]/page.tsx","utf8");
    expect(source).toContain("buildMuhuratYearHighSimilarityContext");
    expect(source).toContain("ANNUAL COMPARISON FINGERPRINT");
    expect(source).toContain("highSimilarityContext.sequenceBody");
    expect(source).toContain("highSimilarityContext.shortlistBody");
  });
});
