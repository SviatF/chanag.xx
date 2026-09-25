import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {findCityBySlug} from "../lib/cities";
import {calculateVratCalendar,findVratBySlug,type VratSlug} from "../lib/vrat";
import {buildVratYearContext} from "../lib/vrat-year-context";

const city=findCityBySlug("mumbai")!;
const years=[2025,2026,2027,2028];

function normalized(value:string){return value.toLowerCase().replace(/\b\d+(?::\d+)?(?:\.\d+)?\b/g," ").replace(/[^a-z]+/g," ").replace(/\s+/g," ").trim();}
function trigrams(value:string){const words=normalized(value).split(" ").filter(Boolean);return new Set(words.length<3?words:words.slice(0,-2).map((_,index)=>words.slice(index,index+3).join(" ")));}
function similarity(a:string,b:string){const left=trigrams(a),right=trigrams(b);let overlap=0;for(const item of left)if(right.has(item))overlap++;return overlap/(left.size+right.size-overlap||1);}
function output(slug:VratSlug,year:number){
  const vrat=findVratBySlug(slug)!;
  const context=buildVratYearContext(vrat,year,calculateVratCalendar(slug,year,city));
  return [context.title,context.body,context.calendarTitle,context.calendarBody,context.cadenceTitle,context.cadenceBody,context.persistenceTitle,context.persistenceBody,context.observanceTitle,context.observanceBody,...context.facts.map(f=>`${f.label} ${f.value} ${f.note??""}`)].join(" ");
}
function assertYearDistinct(slug:VratSlug){
  const values=years.map(year=>output(slug,year));
  expect(new Set(values.map(normalized)).size).toBe(years.length);
  let max=0;
  for(let i=0;i<values.length;i++)for(let j=i+1;j<values.length;j++)max=Math.max(max,similarity(values[i],values[j]));
  expect(max).toBeLessThan(0.8);
}

describe("Vrat yearly similarity context",()=>{
  it("keeps Ekadashi indexed years structurally distinct after dates and numbers are stripped",()=>{assertYearDistinct("ekadashi");});
  it("keeps Purnima indexed years structurally distinct after dates and numbers are stripped",()=>{assertYearDistinct("purnima");});
  it("keeps Amavasya indexed years structurally distinct after dates and numbers are stripped",()=>{assertYearDistinct("amavasya");});

  it("renders the annual lunar rhythm on the public Vrat-year route",()=>{
    const source=readFileSync("app/vrat/[vrat]/[year]/page.tsx","utf8");
    expect(source).toContain("buildVratYearContext");
    expect(source).toContain("ANNUAL LUNAR RHYTHM");
    expect(source).toContain("yearContext.cadenceBody");
    expect(source).toContain("yearContext.persistenceBody");
  });
});
