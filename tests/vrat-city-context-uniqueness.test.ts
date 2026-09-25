import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {findCityBySlug} from "../lib/cities";
import {phase1PriorityCities} from "../lib/seo-policy";
import {buildVratCityContext} from "../lib/vrat-city-context";
import {findVratBySlug,type VratOccurrence} from "../lib/vrat";

function rows():VratOccurrence[]{
  return [
    {date:"2026-01-05",weekday:"Monday",paksha:"Shukla",tithi:"Ekadashi",sunrise:"06:28",tithiEnd:"14:20",tithiEndDate:"2026-01-05",repeatedAtSunrise:false,sequence:1},
    {date:"2026-02-03",weekday:"Tuesday",paksha:"Krishna",tithi:"Ekadashi",sunrise:"06:18",tithiEnd:"06:05",tithiEndDate:"2026-02-04",repeatedAtSunrise:true,sequence:2},
    {date:"2026-03-05",weekday:"Thursday",paksha:"Shukla",tithi:"Ekadashi",sunrise:"06:03",tithiEnd:"18:10",tithiEndDate:"2026-03-05",repeatedAtSunrise:false,sequence:3},
    {date:"2026-04-04",weekday:"Saturday",paksha:"Krishna",tithi:"Ekadashi",sunrise:"05:49",tithiEnd:"11:45",tithiEndDate:"2026-04-04",repeatedAtSunrise:false,sequence:4},
    {date:"2026-05-04",weekday:"Monday",paksha:"Shukla",tithi:"Ekadashi",sunrise:"05:38",tithiEnd:"16:30",tithiEndDate:"2026-05-04",repeatedAtSunrise:false,sequence:5},
  ];
}
function normalized(value:string,city:string,state:string){return value.toLowerCase().replaceAll(city.toLowerCase()," ").replaceAll(state.toLowerCase()," ").replace(/\b\d+(?::\d+)?\b/g," ").replace(/[^a-z]+/g," ").replace(/\s+/g," ").trim();}
function trigrams(value:string){const words=value.split(/\s+/).filter(Boolean),out=new Set<string>();for(let i=0;i<=words.length-3;i++)out.add(words.slice(i,i+3).join(" "));return out;}
function jaccard(a:string,b:string){const left=trigrams(a),right=trigrams(b);let overlap=0;for(const item of left)if(right.has(item))overlap++;return overlap/(left.size+right.size-overlap||1);}
function maxPairwise(values:string[]){let max=0;for(let i=0;i<values.length;i++)for(let j=i+1;j<values.length;j++)max=Math.max(max,jaccard(values[i],values[j]));return max;}

describe("Vrat city semantic dedup layer",()=>{
  it("keeps every phase-one city distinct after city names, states and numbers are stripped",()=>{
    const vrat=findVratBySlug("ekadashi")!;
    const values=phase1PriorityCities.map(slug=>{
      const city=findCityBySlug(slug)!;
      const context=buildVratCityContext(vrat,2026,city,rows());
      const text=[context.focusTitle,context.focusBody,context.title,context.body,context.secondaryBody,...context.facts.map(item=>`${item.label} ${item.value} ${item.note??""}`)].join(" ");
      return normalized(text,city.name,city.state);
    });
    expect(new Set(values).size).toBe(phase1PriorityCities.length);
    expect(maxPairwise(values)).toBeLessThan(0.8);
  });

  it("keeps Ekadashi, Purnima and Amavasya focus layers semantically distinct",()=>{
    const city=findCityBySlug("mumbai")!;
    const ekadashi=buildVratCityContext(findVratBySlug("ekadashi")!,2026,city,rows());
    const purnimaRows=rows().map(row=>({...row,paksha:"Shukla" as const,tithi:"Purnima" as const}));
    const amavasyaRows=rows().map(row=>({...row,paksha:"Krishna" as const,tithi:"Amavasya" as const}));
    const purnima=buildVratCityContext(findVratBySlug("purnima")!,2026,city,purnimaRows);
    const amavasya=buildVratCityContext(findVratBySlug("amavasya")!,2026,city,amavasyaRows);
    expect(new Set([ekadashi.focusBody,purnima.focusBody,amavasya.focusBody]).size).toBe(3);
  });

  it("renders the Vrat city semantic layer on the public route",()=>{
    const source=readFileSync("app/vrat/[vrat]/[year]/[city]/page.tsx","utf8");
    expect(source).toContain("buildVratCityContext");
    expect(source).toContain("LOCAL CITY SIGNATURE");
  });
});
