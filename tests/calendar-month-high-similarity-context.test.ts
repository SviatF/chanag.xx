import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {buildCalendarMonthHighSimilarityContext} from "../lib/calendar-month-high-similarity-context";
import {findCityBySlug} from "../lib/cities";

function entries(month=11){
  const days=month===2?28:month===4||month===6||month===9||month===11?30:31;
  const tithis=["Pratipada","Dvitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami","Navami","Dashami","Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Purnima"];
  const nakshatras=["Ashwini","Bharani","Krittika","Rohini","Mrigashirsha","Ardra","Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"];
  return Array.from({length:days},(_,index)=>{
    const day=index+1;
    const minuteShift=Math.floor(index/5);
    return {
      date:`2026-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`,
      tithi:tithis[index%tithis.length],
      nakshatra:nakshatras[(index*2)%nakshatras.length],
      paksha:index<Math.ceil(days/2)?"Shukla":"Krishna",
      rahu:{start:`13:${String(18+minuteShift).padStart(2,"0")}`,end:"14:52"},
      yamaganda:{start:`06:${String(8+Math.floor(index/6)).padStart(2,"0")}`,end:"07:42"},
      gulika:{start:`09:${String(4+Math.floor(index/7)).padStart(2,"0")}`,end:"10:36"},
      abhijit:day%6===0?null:{start:"11:51",end:"12:40"}
    };
  });
}
function normalized(value:string,city:string,state:string){
  return value.toLowerCase()
    .replaceAll(city.toLowerCase()," ")
    .replaceAll(state.toLowerCase()," ")
    .replace(/\b\d+(?::\d+)?(?:\.\d+)?%?\b/g," ")
    .replace(/[^a-z]+/g," ")
    .replace(/\s+/g," ")
    .trim();
}
function trigrams(value:string){
  const words=value.split(/\s+/).filter(Boolean),out=new Set<string>();
  for(let i=0;i<=words.length-3;i++)out.add(words.slice(i,i+3).join(" "));
  return out;
}
function jaccard(a:string,b:string){
  const left=trigrams(a),right=trigrams(b);let overlap=0;
  for(const item of left)if(right.has(item))overlap++;
  return overlap/(left.size+right.size-overlap||1);
}
function serialized(citySlug:string,month:number){
  const city=findCityBySlug(citySlug)!;
  const context=buildCalendarMonthHighSimilarityContext(city,2026,month,entries(month));
  expect(context).not.toBeNull();
  const value=context!;
  const text=[value.title,value.geographyBody,value.rhythmTitle,value.rhythmBody,...value.facts.map(item=>`${item.label} ${item.value} ${item.note??""}`)].join(" ");
  return normalized(text,city.name,city.state);
}

describe("Monthly calendar Gujarat HIGH-similarity cleanup",()=>{
  it("keeps Ahmedabad and Vadodara strongly separated after route tokens and numbers are stripped",()=>{
    for(const month of [1,2,3,4,5,6,7,8,9,10,11,12]){
      expect(jaccard(serialized("ahmedabad",month),serialized("vadodara",month))).toBeLessThan(0.32);
    }
  });

  it("does not inject this targeted comparison block into unrelated cities",()=>{
    const mumbai=findCityBySlug("mumbai")!;
    expect(buildCalendarMonthHighSimilarityContext(mumbai,2026,11,entries())).toBeNull();
  });

  it("renders the comparison lens on the public monthly calendar route",()=>{
    const source=readFileSync("app/calendar/[city]/[year]/[month]/page.tsx","utf8");
    expect(source).toContain("buildCalendarMonthHighSimilarityContext");
    expect(source).toContain("GUJARAT MONTH COMPARISON LENS");
    expect(source).toContain("highSimilarityContext.rhythmBody");
  });
});
