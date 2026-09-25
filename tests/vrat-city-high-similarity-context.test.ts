import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {findCityBySlug} from "../lib/cities";
import {phase1PriorityCities} from "../lib/seo-policy";
import {buildVratCitySimilarityContext} from "../lib/vrat-city-similarity-context";
import {findVratBySlug,type VratOccurrence} from "../lib/vrat";

const rows:VratOccurrence[]=[
  {date:"2027-01-12",weekday:"Tuesday",paksha:"Shukla",tithi:"Purnima",sunrise:"06:44",tithiEnd:"14:20",tithiEndDate:"2027-01-12",repeatedAtSunrise:false,sequence:1},
  {date:"2027-04-11",weekday:"Sunday",paksha:"Shukla",tithi:"Purnima",sunrise:"06:18",tithiEnd:"08:05",tithiEndDate:"2027-04-12",repeatedAtSunrise:true,sequence:2},
  {date:"2027-07-09",weekday:"Friday",paksha:"Shukla",tithi:"Purnima",sunrise:"05:58",tithiEnd:"16:42",tithiEndDate:"2027-07-09",repeatedAtSunrise:false,sequence:3},
  {date:"2027-10-07",weekday:"Thursday",paksha:"Shukla",tithi:"Purnima",sunrise:"06:21",tithiEnd:"23:18",tithiEndDate:"2027-10-07",repeatedAtSunrise:false,sequence:4}
];
const vrat=findVratBySlug("purnima")!;
const allCities=phase1PriorityCities.map(slug=>findCityBySlug(slug)!);
const removable=allCities.flatMap(city=>[city.name.toLowerCase(),city.state.toLowerCase()]).sort((a,b)=>b.length-a.length);
function normalize(value:string){let out=value.toLowerCase();for(const token of removable)out=out.replaceAll(token," ");return out.replace(/\b\d+(?::\d+)?\b/g," ").replace(/[^a-z]+/g," ").replace(/\s+/g," ").trim();}
function trigrams(value:string){const words=value.split(/\s+/).filter(Boolean),out=new Set<string>();for(let i=0;i<=words.length-3;i++)out.add(words.slice(i,i+3).join(" "));return out;}
function jaccard(a:string,b:string){const left=trigrams(a),right=trigrams(b);let overlap=0;for(const token of left)if(right.has(token))overlap++;return overlap/(left.size+right.size-overlap||1);}
function maxPairwise(values:string[]){let max=0;for(let i=0;i<values.length;i++)for(let j=i+1;j<values.length;j++)max=Math.max(max,jaccard(values[i],values[j]));return max;}
function rendered(slug:string){const city=findCityBySlug(slug)!;const c=buildVratCitySimilarityContext(vrat,2027,city,rows);return normalize([c.title,c.localityBody,c.boundaryTitle,c.boundaryBody,...c.facts.map(f=>`${f.label} ${f.value} ${f.note??""}`)].join(" "));}

describe("Vrat city high-similarity locality layer",()=>{
  it("keeps all phase-one cities distinct on identical annual lunar rows",()=>{
    const values=phase1PriorityCities.map(rendered);
    expect(new Set(values).size).toBe(phase1PriorityCities.length);
    expect(maxPairwise(values)).toBeLessThan(0.55);
  });
  it("separates the dominant current high-risk city pairs",()=>{
    expect(jaccard(rendered("mumbai"),rendered("pune"))).toBeLessThan(0.5);
    expect(jaccard(rendered("hyderabad"),rendered("nagpur"))).toBeLessThan(0.5);
    expect(jaccard(rendered("surat"),rendered("thane"))).toBeLessThan(0.5);
    expect(jaccard(rendered("surat"),rendered("vadodara"))).toBeLessThan(0.5);
  });
  it("renders the Vrat locality lens on the public route",()=>{
    const source=readFileSync("app/vrat/[vrat]/[year]/[city]/page.tsx","utf8");
    expect(source).toContain("buildVratCitySimilarityContext");
    expect(source).toContain("VRAT LOCALITY LENS");
  });
});
