import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {buildMuhuratYearContext} from "../lib/muhurat-year-context";
import type {MuhuratRow} from "../lib/muhurat";
import type {YearlyMuhuratMonth,YearlyMuhuratSummary} from "../lib/yearly-expansion";

const monthNames=["January","February","March","April","May","June","July","August","September","October","November","December"];

function row(year:number,month:number,index:number):MuhuratRow{
  const day=5+index*4;
  const source=(year+month+index)%3===0?"Abhijit Muhurat":(year+month+index)%3===1?"Shubh Choghadiya":"Labh Choghadiya";
  const score=68+((year+month*3+index*7)%27);
  return {
    date:`${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`,
    data:{} as never,
    recommendedWindows:[{start:`${String(8+((year+month+index)%6)).padStart(2,"0")}:10`,end:`${String(9+((year+month+index)%6)).padStart(2,"0")}:20`,sources:[source]}],
    avoidWindows:[],
    reasons:[`${["Panchami","Ekadashi","Trayodashi","Saptami"][(year+month)%4]} Tithi`,`${["Rohini","Swati","Anuradha","Revati"][(year+index)%4]} Nakshatra`],
    planning:{score,grade:score>=85?"Excellent":score>=70?"Strong":"Good",totalCleanMinutes:80+((month*13+year)%110),longestWindowMinutes:45+((month*17+year)%95),sourceCount:1,hasAbhijit:source==="Abhijit Muhurat",idealContinuousMinutes:90,factors:[]}
  };
}

function summary(year:number):YearlyMuhuratSummary{
  const activeByYear:Record<number,number[]>={
    2025:[1,2,4,7,10],
    2026:[1,3,5,6,9,12],
    2027:[2,3,4,8,9,10,11],
    2028:[1,2,3,4,5,7,8,10,12],
  };
  const active=activeByYear[year]??[1,4,7,10];
  const rowsByMonth=new Map<number,MuhuratRow[]>();
  for(const month of active){
    const count=1+((year+month)%3);
    rowsByMonth.set(month,Array.from({length:count},(_,index)=>row(year,month,index)));
  }
  const rows=[...rowsByMonth.values()].flat().sort((a,b)=>b.planning.score-a.planning.score||a.date.localeCompare(b.date));
  const months:YearlyMuhuratMonth[]=monthNames.map((name,index)=>{
    const month=index+1,list=rowsByMonth.get(month)??[];
    return {month,slug:String(month).padStart(2,"0"),name,qualified:list.length,excellent:list.filter(r=>r.planning.grade==="Excellent").length,strong:list.filter(r=>r.planning.grade==="Strong").length,averageScore:list.length?Math.round(list.reduce((s,r)=>s+r.planning.score,0)/list.length):0,top:[...list].sort((a,b)=>b.planning.score-a.planning.score)[0]??null};
  });
  return {event:"wedding",year,title:"Wedding Muhurat",months,rows,topRows:rows.slice(0,10),totalQualified:rows.length,excellentCount:rows.filter(r=>r.planning.grade==="Excellent").length,strongCount:rows.filter(r=>r.planning.grade==="Strong").length,averageScore:rows.length?Math.round(rows.reduce((s,r)=>s+r.planning.score,0)/rows.length):0,strongestMonth:[...months].filter(m=>m.qualified>0).sort((a,b)=>b.qualified-a.qualified||b.averageScore-a.averageScore)[0]??null};
}

function normalized(value:string){return value.toLowerCase().replace(/\b\d+(?::\d+)?\b/g," ").replace(/[^a-z]+/g," ").replace(/\s+/g," ").trim();}
function trigrams(value:string){const w=normalized(value).split(" ").filter(Boolean);return new Set(w.length<3?w:w.slice(0,-2).map((_,i)=>w.slice(i,i+3).join(" ")));}
function similarity(a:string,b:string){const left=trigrams(a),right=trigrams(b);let overlap=0;for(const item of left)if(right.has(item))overlap++;return overlap/(left.size+right.size-overlap||1);}
function text(year:number){const c=buildMuhuratYearContext(summary(year));return [c.title,c.body,c.calendarTitle,c.calendarBody,c.densityTitle,c.densityBody,c.timingTitle,c.timingBody,c.rankingTitle,c.rankingBody,...c.facts.map(f=>`${f.label} ${f.value} ${f.note??""}`)].join(" ");}

describe("yearly Muhurat similarity context",()=>{
  it("keeps adjacent indexed years structurally distinct after numbers are stripped",()=>{
    const outputs=[2025,2026,2027,2028].map(text);
    expect(new Set(outputs.map(normalized)).size).toBe(4);
    let max=0;
    for(let i=0;i<outputs.length;i++)for(let j=i+1;j<outputs.length;j++)max=Math.max(max,similarity(outputs[i],outputs[j]));
    expect(max).toBeLessThan(0.78);
  });

  it("renders the annual year lens on the public Muhurat-year route",()=>{
    const source=readFileSync("app/muhurat/[event]/[year]/page.tsx","utf8");
    expect(source).toContain("buildMuhuratYearContext");
    expect(source).toContain("ANNUAL YEAR LENS");
    expect(source).toContain("yearContext.calendarBody");
    expect(source).toContain("yearContext.rankingBody");
  });
});
