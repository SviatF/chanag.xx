import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {buildMuhuratMonthSimilarityContext} from "../lib/muhurat-month-similarity-context";
import type {MuhuratPlanningGrade,MuhuratRow} from "../lib/muhurat";

const reasonPairs=[
  ["Dvitiya","Rohini"],["Tritiya","Mrigashirsha"],["Panchami","Magha"],["Saptami","Hasta"],
  ["Ekadashi","Swati"],["Trayodashi","Anuradha"],["Dashami","Shravana"],["Dvitiya","Dhanishta"],
  ["Tritiya","Revati"],["Panchami","Uttara Phalguni"],["Saptami","Chitra"],["Ekadashi","Uttara Bhadrapada"]
] as const;
const sourceSets=[
  ["Amrit Choghadiya","Abhijit Muhurat"],
  ["Shubh Choghadiya"],
  ["Labh Choghadiya","Amrit Choghadiya"],
  ["Abhijit Muhurat","Shubh Choghadiya"],
] as const;
const grades:MuhuratPlanningGrade[]=["Excellent","Strong","Good","Limited"];

function rows(month:number):MuhuratRow[]{
  const days=[3,11,19,27].slice(0,2+(month%3));
  return days.map((day,index)=>{
    const pair=reasonPairs[(month+index-1)%reasonPairs.length];
    const sources=sourceSets[(month+index)%sourceSets.length];
    return {
      date:`2027-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`,
      data:{} as MuhuratRow["data"],
      recommendedWindows:[{start:"09:10",end:"10:05",sources:[...sources]}],
      avoidWindows:[],
      reasons:[pair[0],pair[1]],
      planning:{
        score:92-index*8-month%4,
        grade:grades[(index+month)%grades.length],
        totalCleanMinutes:120+month*3-index*9,
        longestWindowMinutes:80+month-index*7,
        sourceCount:sources.length,
        hasAbhijit:sources.includes("Abhijit Muhurat"),
        idealContinuousMinutes:75,
        factors:[]
      }
    };
  });
}
function normalized(value:string){
  return value.toLowerCase()
    .replace(/\b(?:griha|pravesh|muhurat|mumbai|baseline)\b/g," ")
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g," ")
    .replace(/\b\d+(?::\d+)?(?:\.\d+)?%?\b/g," ")
    .replace(/[^a-z]+/g," ")
    .replace(/\s+/g," ")
    .trim();
}
function trigrams(value:string){const words=value.split(/\s+/).filter(Boolean),out=new Set<string>();for(let i=0;i<=words.length-3;i++)out.add(words.slice(i,i+3).join(" "));return out;}
function jaccard(a:string,b:string){const left=trigrams(a),right=trigrams(b);let overlap=0;for(const item of left)if(right.has(item))overlap++;return overlap/(left.size+right.size-overlap||1);}
function maxPairwise(values:string[]){let max=0;for(let i=0;i<values.length;i++)for(let j=i+1;j<values.length;j++)max=Math.max(max,jaccard(values[i],values[j]));return max;}
function serialized(month:number){
  const context=buildMuhuratMonthSimilarityContext("griha-pravesh",2027,month,rows(month));
  return normalized([context.title,context.positionBody,context.sequenceTitle,context.sequenceBody,...context.facts.map(item=>`${item.label} ${item.value} ${item.note??""}`)].join(" "));
}

describe("Muhurat monthly HIGH-similarity layer",()=>{
  it("keeps all twelve month identities well below the rendered HIGH threshold",()=>{
    const values=Array.from({length:12},(_,index)=>serialized(index+1));
    expect(new Set(values).size).toBe(12);
    expect(maxPairwise(values)).toBeLessThan(0.55);
  });

  it("separates the known March/September and April/August risk pairs",()=>{
    expect(jaccard(serialized(3),serialized(9))).toBeLessThan(0.48);
    expect(jaccard(serialized(4),serialized(8))).toBeLessThan(0.48);
  });

  it("renders the comparison fingerprint on the public monthly route",()=>{
    const source=readFileSync("app/muhurat/[event]/[year]/[month]/page.tsx","utf8");
    expect(source).toContain("buildMuhuratMonthSimilarityContext");
    expect(source).toContain("MONTH COMPARISON FINGERPRINT");
    expect(source).toContain("similarity.sequenceBody");
  });
});
