/**
 * Wave 3AK — compare facts displayed across public rendered routes.
 * Month tiles must agree with the SAME city's Daily Panchang on the SAME
 * civil date; Vrat sunrise-reference links must agree on Tithi identity.
 * No invented "unique" numbers, and missing counterpart URLs are reported
 * as coverage, not a physical contradiction.
 */
import {extractDailyVisibleFacts} from "./daily-fact-integrity.mjs";
const datePath=/^\/panchang\/([^/]+)\/(\d{4}-\d{2}-\d{2})$/;
const monthPath=/^\/calendar\/([^/]+)\/(\d{4})\/(\d{2})$/;
const vratPath=/^\/vrat\/(ekadashi|purnima|amavasya)\/(\d{4})\/([^/]+)$/;
function normalize(value){
  return String(value??"").replace(/<[^>]+>/g," ").replace(/&amp;/gi,"&")
    .replace(/&#39;|&apos;/gi,"'").replace(/&nbsp;/gi," ")
    .replace(/\s+/g," ").trim();
}
function htmlAnchors(html){
  const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]??html;
  return [...main.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)]
    .map(m=>({href:m[1].match(/\bhref=["']([^"']+)["']/i)?.[1]??"",
      inner:m[2]}));
}
function extractMonthRows(pathname,html){
  const match=pathname.match(monthPath);
  if(!match)return null;
  const rows=[];
  for(const anchor of htmlAnchors(html)){
    const target=anchor.href.match(datePath);
    if(!target||target[1]!==match[1]||!target[2].startsWith(match[2]+"-"+match[3]+"-"))continue;
    const smalls=[...anchor.inner.matchAll(/<small\b[^>]*>([\s\S]*?)<\/small>/gi)].map(x=>normalize(x[1]));
    const day=Number(target[2].slice(8,10));
    if(!Number.isInteger(day)||day<1||day>31)continue;
    // Month grid tiles use first two small tags for Tithi and Nakshatra.
    if(smalls.length<2)continue;
    rows.push({city:target[1],date:target[2],tithi:smalls[0],nakshatra:smalls[1]});
  }
  return rows;
}
function extractVratRows(pathname,html){
  const match=pathname.match(vratPath);
  if(!match)return null;
  const rows=[];
  for(const anchor of htmlAnchors(html)){
    const target=anchor.href.match(datePath);
    if(!target||target[1]!==match[3]||!target[2].startsWith(match[2]+"-"))continue;
    const strong=anchor.inner.match(/<strong\b[^>]*>([\s\S]*?)<\/strong>/i);
    const small=anchor.inner.match(/<small\b[^>]*>([\s\S]*?)<\/small>/i);
    if(!strong||normalize(strong[1])!==target[2]||!small)continue;
    const paksha=normalize(small[1]).match(/\b(Shukla|Krishna) Paksha\b/)?.[1];
    if(!paksha)continue;
    rows.push({city:target[1],date:target[2],vrat:match[1],paksha});
  }
  return rows;
}
const key=(city,date)=>city+"|"+date;
export function inspectCrossPageCalendar(pathname,html){
  return {pathname,month:extractMonthRows(pathname,html),vrat:extractVratRows(pathname,html),
    daily:pathname.match(datePath)?extractDailyVisibleFacts(html):null};
}
export function reconcileRenderedCalendar(pages){
  const daily=new Map(),monthRows=[],vratRows=[];
  for(const page of pages){
    const path=page.pathname;
    const m=path.match(datePath);
    if(m&&page.daily)daily.set(key(m[1],m[2]),page.daily);
    if(page.month)monthRows.push(...page.month.map(row=>({...row,source:path})));
    if(page.vrat)vratRows.push(...page.vrat.map(row=>({...row,source:path})));
  }
  const contradictions=[],missingCounterparts=[];
  let matchedMonth=0,matchedVrat=0;
  const record=(row,field,expected,actual)=>{
    if(expected!==actual)contradictions.push({source:row.source,
      target:"/panchang/"+row.city+"/"+row.date,date:row.date,city:row.city,
      field,expected,actual});
  };
  for(const row of monthRows){
    const target=daily.get(key(row.city,row.date));
    if(!target){missingCounterparts.push({source:row.source,city:row.city,date:row.date,type:"month"});continue;}
    matchedMonth++;
    record(row,"Tithi",row.tithi,target.Tithi);
    record(row,"Nakshatra",row.nakshatra,target.Nakshatra);
  }
  const names={ekadashi:"Ekadashi",purnima:"Purnima",amavasya:"Amavasya"};
  for(const row of vratRows){
    const target=daily.get(key(row.city,row.date));
    if(!target){missingCounterparts.push({source:row.source,city:row.city,date:row.date,type:"vrat"});continue;}
    matchedVrat++;
    record(row,"Vrat sunrise Tithi",names[row.vrat],target.Tithi);
  }
  return {monthRows:monthRows.length,vratRows:vratRows.length,matchedMonth,matchedVrat,
    contradictions,missingCounterparts,
    proof:"Internal SSR consistency only; not independent JPL astronomy or tradition fasting certification"};
}
