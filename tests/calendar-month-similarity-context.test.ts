import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {buildCalendarMonthSimilarityContext} from "../lib/calendar-month-similarity-context";
import {findCityBySlug} from "../lib/cities";
import {phase1PriorityCities} from "../lib/seo-policy";

function entries(){
  return Array.from({length:30},(_,index)=>{
    const day=index+1;
    return {
      date:`2026-09-${String(day).padStart(2,"0")}`,
      sunrise:`06:${String(8+Math.floor(day/4)).padStart(2,"0")}`,
      sunset:`18:${String(38-Math.floor(day/5)).padStart(2,"0")}`,
      rahu:{start:`13:${String(18+Math.floor(day/6)).padStart(2,"0")}`,end:"14:52"}
    };
  });
}
function normalized(value:string,city:string,state:string){
  return value.toLowerCase().replaceAll(city.toLowerCase()," ").replaceAll(state.toLowerCase()," ").replace(/\b\d+(?::\d+)?\b/g," ").replace(/[^a-z]+/g," ").replace(/\s+/g," ").trim();
}
function trigrams(value:string){const words=value.split(/\s+/).filter(Boolean),out=new Set<string>();for(let i=0;i<=words.length-3;i++)out.add(words.slice(i,i+3).join(" "));return out;}
function jaccard(a:string,b:string){const left=trigrams(a),right=trigrams(b);let overlap=0;for(const item of left)if(right.has(item))overlap++;return overlap/(left.size+right.size-overlap||1);}
function maxPairwise(values:string[]){let max=0;for(let i=0;i<values.length;i++)for(let j=i+1;j<values.length;j++)max=Math.max(max,jaccard(values[i],values[j]));return max;}
function rendered(citySlug:string){
  const city=findCityBySlug(citySlug)!;
  const context=buildCalendarMonthSimilarityContext(city,2026,9,entries());
  const text=[context.title,context.localityBody,context.solarTitle,context.solarBody,...context.facts.map(item=>`${item.label} ${item.value} ${item.note??""}`)].join(" ");
  return normalized(text,city.name,city.state);
}

describe("Monthly calendar high-similarity locality layer",()=>{
  it("keeps phase-one locality lenses well below the rendered-audit HIGH threshold",()=>{
    const values=phase1PriorityCities.map(rendered);
    expect(new Set(values).size).toBe(phase1PriorityCities.length);
    expect(maxPairwise(values)).toBeLessThan(0.55);
  });

  it("separates the known Ahmedabad and Vadodara high-similarity pair",()=>{
    expect(jaccard(rendered("ahmedabad"),rendered("vadodara"))).toBeLessThan(0.52);
  });

  it("renders the monthly locality lens on the public route",()=>{
    const source=readFileSync("app/calendar/[city]/[year]/[month]/page.tsx","utf8");
    expect(source).toContain("buildCalendarMonthSimilarityContext");
    expect(source).toContain("MONTHLY LOCALITY LENS");
  });
});
