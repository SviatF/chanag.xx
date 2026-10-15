/**
 * Wave 3AJ: validate facts PRESENT IN THE RENDERED daily page, not URL
 * tokens, rewritten city prose, or a hidden metadata fingerprint.
 * Internal integrity and observational difference are distinct questions:
 * matching values between nearby towns can be physically legitimate.
 */
const DAILY=/^\/panchang\/([^/]+)\/(\d{4}-\d{2}-\d{2})$/;
const REQUIRED=["Tithi","Nakshatra","Yoga","Karana","Sunrise","Sunset"];
const decode=value=>String(value)
  .replace(/&nbsp;|&#160;/gi," ")
  .replace(/&amp;/gi,"&")
  .replace(/&lt;/gi,"<")
  .replace(/&gt;/gi,">")
  .replace(/&quot;/gi,'"')
  .replace(/&#39;|&apos;/gi,"'")
  .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)))
  .replace(/&#x([\da-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)));
const plain=html=>decode(String(html).replace(/<[^>]*>/g," ").replace(/\s+/g," ")).trim();
export function extractDailyVisibleFacts(html){
  const values={};
  for(const match of html.matchAll(/<div\b[^>]*class=["'][^"']*\bdata-card\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi)){
    const block=match[1];
    const label=block.match(/<small\b[^>]*>([\s\S]*?)<\/small>/i);
    const value=block.match(/<strong\b[^>]*>([\s\S]*?)<\/strong>/i);
    if(!label||!value)continue;
    const name=plain(label[1]);
    if(REQUIRED.includes(name)){
      if(Object.hasOwn(values,name))values[name]=null; // ambiguous duplicate label
      else {
        values[name]=plain(value[1]);
        if(name==="Tithi"){
          // This is visible under the Tithi card. Distinguish lunar identity
          // from the separately rendered clock/date; do not infer Paksha.
          const details=[...block.matchAll(/<small\b[^>]*>([\s\S]*?)<\/small>/gi)].map(x=>plain(x[1]));
          const sub=details.slice(1).join(" ");
          values.Paksha=sub.match(/\b(Shukla|Krishna) Paksha\b/)?.[1]??null;
          values.TithiEndClock=sub.match(/\buntil (\d{2}:\d{2})\b/)?.[1]??null;
        }
      }
    }
  }
  return values;
}
const clockMinutes=value=>{
  if(typeof value!=="string"||!/^([01]\d|2[0-3]):[0-5]\d$/.test(value))return null;
  const [h,m]=value.split(":").map(Number);
  return h*60+m;
};
export function inspectDailyVisibleFacts(pathname,html){
  const route=pathname.match(DAILY);
  if(!route)return null;
  const facts=extractDailyVisibleFacts(html);
  const problems=[];
  for(const field of REQUIRED){
    if(typeof facts[field]!=="string"||!facts[field]||facts[field]==="—")
      problems.push("missing or ambiguous rendered "+field);
  }
  const rise=clockMinutes(facts.Sunrise),set=clockMinutes(facts.Sunset);
  if(rise===null||set===null)problems.push("invalid local sunrise/sunset format");
  else {
    const daylight=set-rise;
    if(daylight<8*60||daylight>16*60)
      problems.push("implausible or reversed sunrise/sunset sequence");
  }
  for(const key of ["Tithi","Nakshatra","Yoga","Karana"]){
    const value=facts[key];
    if(typeof value==="string"&&/^[\d\s:—-]+$/.test(value))
      problems.push("non-lunar label in rendered "+key);
  }
  return {
    pathname,city:route[1],date:route[2],problems,
    // Crucially do not strip actual clocks and astronomical labels here:
    // similarity of variable facts is different from prose similarity.
    signature:REQUIRED.map(field=>String(facts[field]??"")).join("|"),
    fields:facts
  };
}
export function summarizeDailyFactIntegrity(records){
  const daily=records.filter(Boolean);
  const problems=daily.flatMap(row=>row.problems.map(issue=>({pathname:row.pathname,issue})));
  const byDate=new Map();
  for(const row of daily){
    const group=byDate.get(row.date)??[];
    group.push(row);
    byDate.set(row.date,group);
  }
  const identicalLocalFactGroups=[];
  for(const [date,group] of byDate){
    const bySignature=new Map();
    for(const row of group){
      if(row.problems.length)continue;
      const owners=bySignature.get(row.signature)??[];
      owners.push(row.pathname);
      bySignature.set(row.signature,owners);
    }
    for(const owners of bySignature.values()){
      if(owners.length>1)identicalLocalFactGroups.push({date,owners});
    }
  }
  return {
    dailyPages:daily.length,failures:problems,
    identicalLocalFactGroups,
    // Observational only. Identical rounded clocks across adjacent towns
    // do not prove editorial or astronomical errors.
    identicalGroupsRequireHumanReview:identicalLocalFactGroups.length>0
  };
}
