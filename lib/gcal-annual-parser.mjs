/**
 * GCAL 11 annual TXT export adapter. Research only.
 * Source: an independent *export of GCal 11*, not a second astronomical implementation.
 * Never feed this into the production religious date selector.
 */
const MONTHS={Jan:"01",Feb:"02",Mar:"03",Apr:"04",May:"05",Jun:"06",Jul:"07",Aug:"08",Sep:"09",Oct:"10",Nov:"11",Dec:"12"};
const DAILY=/^\s*(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(20\d{2})\s+(Mo|Tu|We|Th|Fr|Sa|Su)\s+(.+)$/;
const SHORT_DAY=/^\d{4}-\d{2}-\d{2}$/;
function dayToIso(day,mon,year){
 const value=year+"-"+MONTHS[mon]+"-"+day.padStart(2,"0");
 if(new Date(value+"T00:00:00Z").toISOString().slice(0,10)!==value)throw Error("GCAL invalid civil date "+value);
 return value;
}
export function isoDayGap(earlier,later){
 if(!SHORT_DAY.test(earlier)||!SHORT_DAY.test(later))throw Error("Bad day key");
 return Math.round((Date.parse(later+"T00:00:00Z")-Date.parse(earlier+"T00:00:00Z"))/86400000);
}
export function parseGcalAnnualText(source,{city,year}){
 if(typeof source!=="string"||source.length<100)throw Error("No GCAL source text");
 if(!source.includes("GCal 11, Build 5"))throw Error("Unexpected GCal software build");
 if(!source.includes(city+" [India]"))throw Error("GCAL export city mismatch "+city);
 const days=[],warnings=[];
 let current=null;
 const lines=source.replace(/\r\n?/g,"\n").split("\n");
 for(const line of lines){
  const match=line.match(DAILY);
  if(match){
   const [,day,month,printedYear,,rest]=match;
   const date=dayToIso(day,month,printedYear);
   if(current)days.push(current);
   const tithi=(rest.match(/^\s*([A-Za-z-]+)/)||[])[1]||"unknown";
   current={date,tithi,raw:rest.trim(),fast:/\bEkadasi\s+\(suitable for fasting\)/i.test(rest),
    vedhaExcluded:/\bEkadasi\s+\(not suitable for fasting\)/i.test(rest),
    subtype:[],parana:null};
   continue;
  }
  if(!current)continue;
  const tr=line.trim();
  if(/(?:Trisprsa|Trisparsa|Unmilani|Vyanjuli|Paksavardhini|Jaya|Jayanti|Vijaya|Papanasini).*Mahadvadasi/i.test(tr)){
   current.subtype.push(tr);
  }
  if(/^Fasting for .+Ekadasi/i.test(tr))current.fast=true;
  if(/^Break fast /i.test(tr)){
   if(current.parana)warnings.push(current.date+":duplicate-parana");
   const clock=tr.match(/^Break fast\s+(\d{2}:\d{2})\s+\(([^)]+)\)\s*-\s*(\d{2}:\d{2})\s+\(([^)]+)\)\s*(LT|DST)?/i);
   const after=tr.match(/^Break fast\s+after\s+(\d{2}:\d{2})\s+\(([^)]+)\)\s*(LT|DST)?/i);
   const validClock=clock&&clock[1]<clock[3];
   // Some GCal exports explicitly provide ONLY a lower bound ("after 10:50").
   // Never manufacture an upper bound in a published Parana recommendation.
   current.parana={line:tr,validClock:!!validClock||!!after,openEnded:!!after,
    start:clock?.[1]??after?.[1]??null,end:clock?.[3]??null,
    startReason:clock?.[2]??after?.[2]??null,endReason:clock?.[4]??null,
    localMode:clock?.[5]??after?.[3]??null};
  }
 }
 if(current)days.push(current);
 const dated=days.filter(x=>x.date.startsWith(year+"-")).sort((a,b)=>a.date.localeCompare(b.date));
 if(dated.length!==days.length)warnings.push("adjacent-year-dates-in-export");
 if(new Set(dated.map(x=>x.date)).size!==dated.length)warnings.push("duplicated-date");
 if(dated.length<350)warnings.push("insufficient-days:"+dated.length);
 const fasts=dated.filter(x=>x.fast);
 const notSuitable=dated.filter(x=>x.vedhaExcluded);
 const paranas=dated.filter(x=>x.parana);
 const pairs=fasts.map(fast=>{
   const eligible=paranas.filter(x=>{const gap=isoDayGap(fast.date,x.date);return gap>0&&gap<=2;});
   const next=eligible[0]??null;
   return {fastDate:fast.date,fastSunriseTithi:fast.tithi,
    mahadvadasi:fast.subtype,paranaDate:next?.date??null,
    paranaSunriseTithi:next?.tithi??null,
    parana:next?.parana??null,
    prevNotSuitable:notSuitable.some(x=>isoDayGap(x.date,fast.date)===1),
    dwadashiExpiredBeforeParanaSunrise:next?.tithi!=="Dvadasi"&&!!next,
    paranaUnpaired:!next};
 });
 if(fasts.length<20||fasts.length>32)warnings.push("implausible-fast-count:"+fasts.length);
 const unused=paranas.filter(p=>!pairs.some(x=>x.paranaDate===p.date));
 return {
   source:{city,year,software:"GCal 11, Build 5"},
   days:dated,fasts:fasts.map(x=>({date:x.date,tithi:x.tithi,subtype:x.subtype})),
   ineligibleEkadashi:notSuitable.map(x=>x.date),pairs,
   unpairedParanas:unused.map(x=>x.date),warnings,
   summary:{days:dated.length,fasts:fasts.length,paranaEvents:paranas.length,
    mahadvadasi:pairs.filter(x=>x.mahadvadasi.length).length,
    vedhaExclusions:notSuitable.length,
    paranaEndTithi:pairs.filter(x=>x.parana?.endReason?.includes("end of tithi")).length,
    paranaStartQuarter:pairs.filter(x=>x.parana?.startReason?.includes("1/4 of tithi")).length,
    dwadashiEndedBeforeSunrise:pairs.filter(x=>x.dwadashiExpiredBeforeParanaSunrise).length,
    unparsedParana:pairs.filter(x=>x.parana&&!x.parana.validClock).length,
    openEndedParana:pairs.filter(x=>x.parana?.openEnded).length}
 };
}
