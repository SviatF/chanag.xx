import type {City} from "./cities";
import {muhuratRules,type MuhuratRow} from "./muhurat";
import type {YearlyMuhuratSummary} from "./yearly-expansion";

type Fact={label:string;value:string;note?:string};

type EventProfile={focus:string;continuity:string;decision:string;signal:string};

const profiles:Record<string,EventProfile>={
  wedding:{focus:"long uninterrupted planning continuity",continuity:"Wedding uses the strictest continuity target in the current model",decision:"compare the leading date against the next-best dates before choosing a month",signal:"the balance between lunar qualification and a broad clean local window"},
  "griha-pravesh":{focus:"stable local entry windows",continuity:"Griha Pravesh uses a 75-minute ideal continuous target in the current model",decision:"prefer months where the shortlist is not only large but also retains long clean blocks",signal:"how much practical clean time survives after the local exclusion periods"},
  "vehicle-purchase":{focus:"compact transaction-friendly windows",continuity:"Vehicle Purchase uses a 30-minute ideal continuous target in the current model",decision:"compare several strong dates because shorter clean windows can still score efficiently",signal:"how often a screened date retains a compact usable local block"},
  "naming-ceremony":{focus:"balanced medium-duration windows",continuity:"Naming Ceremony uses a 45-minute ideal continuous target in the current model",decision:"look for dates where lunar qualification and timing-source diversity reinforce each other",signal:"the combination of clean minutes, favorable sources and continuity"},
  "business-opening":{focus:"initiation-oriented clean timing",continuity:"Business Opening uses a 45-minute ideal continuous target in the current model",decision:"compare top dates by continuity and source diversity instead of raw candidate count alone",signal:"whether favorable sources survive the local exclusion grid"},
  "gold-purchase":{focus:"short practical purchase windows",continuity:"Gold Purchase uses a 30-minute ideal continuous target in the current model",decision:"separate timing quality from market price and compare both independently",signal:"whether a screened date keeps enough clean local time for a practical purchase window"},
};

export type MuhuratMonthlyQualityContent={
  directAnswer:string;
  facts:Fact[];
  fingerprintTitle:string;
  fingerprintBody:string;
  rankingTitle:string;
  rankingBody:string;
  timingTitle:string;
  timingBody:string;
  ruleTitle:string;
  ruleBody:string;
};

export type MuhuratYearQualityContent={
  directAnswer:string;
  facts:Fact[];
  fingerprintTitle:string;
  fingerprintBody:string;
  seasonalTitle:string;
  seasonalBody:string;
  rankingTitle:string;
  rankingBody:string;
  ruleTitle:string;
  ruleBody:string;
};

function humanMonth(year:number,month:number){return new Intl.DateTimeFormat("en-IN",{month:"long",year:"numeric",timeZone:"Asia/Kolkata"}).format(new Date(Date.UTC(year,month-1,1,6)));}
function weekday(value:string){return new Intl.DateTimeFormat("en-IN",{weekday:"long",timeZone:"Asia/Kolkata"}).format(new Date(`${value}T06:00:00Z`));}
function avg(values:number[]){return values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):0;}
function median(values:number[]){if(!values.length)return 0;const sorted=[...values].sort((a,b)=>a-b);const mid=Math.floor(sorted.length/2);return sorted.length%2?sorted[mid]:Math.round((sorted[mid-1]+sorted[mid])/2);}
function scoreBand(rows:readonly MuhuratRow[]){
  return {excellent:rows.filter(r=>r.planning.grade==="Excellent").length,strong:rows.filter(r=>r.planning.grade==="Strong").length,good:rows.filter(r=>r.planning.grade==="Good").length,limited:rows.filter(r=>r.planning.grade==="Limited").length};
}
function topReason(rows:readonly MuhuratRow[]){
  const counts=new Map<string,number>();
  for(const row of rows){const key=row.reasons.join(" + ");counts.set(key,(counts.get(key)??0)+1);}
  return [...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]??null;
}
function weekdayLeader(rows:readonly MuhuratRow[]){
  const counts=new Map<string,number>();
  for(const row of rows){const key=weekday(row.date);counts.set(key,(counts.get(key)??0)+1);}
  return [...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]??null;
}
function uniqueSources(rows:readonly MuhuratRow[]){return new Set(rows.flatMap(row=>row.recommendedWindows.flatMap(window=>window.sources))).size;}
function profileFor(event:string){return profiles[event]??{focus:"clean local planning windows",continuity:"The event uses its configured continuity target",decision:"compare the leading rows by score and clean-time continuity",signal:"the balance between lunar qualification and local clean-time availability"};}

export function buildMuhuratMonthlyQualityContent(event:string,year:number,month:number,city:City,rows:readonly MuhuratRow[],scope:"city"|"baseline"="city"):MuhuratMonthlyQualityContent{
  const rule=muhuratRules[event];if(!rule)throw new Error(`Unsupported Muhurat event: ${event}`);
  const profile=profileFor(event);
  const label=humanMonth(year,month);
  const location=scope==="baseline"?`${city.name} baseline`:city.name;
  const bands=scoreBand(rows);
  const top=rows[0];const runner=rows[1];
  const averageScore=avg(rows.map(row=>row.planning.score));
  const medianClean=median(rows.map(row=>row.planning.totalCleanMinutes));
  const avgLongest=avg(rows.map(row=>row.planning.longestWindowMinutes));
  const abhijitRows=rows.filter(row=>row.planning.hasAbhijit).length;
  const noWindowRows=rows.filter(row=>row.recommendedWindows.length===0).length;
  const reason=topReason(rows);const week=weekdayLeader(rows);
  const sources=uniqueSources(rows);
  const spread=rows.length?Math.max(...rows.map(r=>r.planning.score))-Math.min(...rows.map(r=>r.planning.score)):0;
  const gap=top&&runner?top.planning.score-runner.planning.score:null;

  if(!top){
    return {
      directAnswer:`${rule.title} in ${location} has no candidate date for ${label} under the current Tithi + Nakshatra profile.`,
      facts:[{label:"Screened candidates",value:"0",note:label},{label:"Ideal continuous target",value:`${rule.idealContinuousMinutes} min`,note:profile.focus},{label:"Accepted Tithis",value:String(rule.goodTithi.length)},{label:"Accepted Nakshatras",value:String(rule.goodNakshatra.length)}],
      fingerprintTitle:`${label} ${rule.title} fingerprint`,
      fingerprintBody:`The zero-candidate month is a distinct result: none of the local Panchang rows matched both configured lunar filters, so no Planning Score ranking is generated for ${location}.`,
      rankingTitle:"What the empty shortlist means",
      rankingBody:`There is no artificial fallback rank. The next useful comparison is another month where the configured ${rule.goodTithi.length} Tithis and ${rule.goodNakshatra.length} Nakshatras create at least one matching row.`,
      timingTitle:`Timing model for ${rule.title}`,
      timingBody:`${profile.continuity}. Because no row reaches the lunar screen in ${label}, local Rahu Kalam, Yamaganda, Gulika, Abhijit and Choghadiya never enter a candidate ranking for this month.`,
      ruleTitle:`What makes ${rule.title} different`,
      ruleBody:`This event is evaluated around ${profile.focus}; the decisive signal is ${profile.signal}. The configured ideal continuous target is ${rule.idealContinuousMinutes} minutes.`
    };
  }

  return {
    directAnswer:`${rule.title} in ${location} has ${rows.length} candidate date${rows.length===1?"":"s"} for ${label}; ${top.date} leads at ${top.planning.score}/100 with ${top.planning.longestWindowMinutes} uninterrupted clean minutes.`,
    facts:[
      {label:"Candidate dates",value:String(rows.length),note:`${bands.excellent} Excellent · ${bands.strong} Strong`},
      {label:"Average / score spread",value:`${averageScore}/100 · ${spread} pts`,note:"Across screened rows"},
      {label:"Median clean time",value:`${medianClean} min`,note:"Unique clean minutes"},
      {label:"Average longest block",value:`${avgLongest} min`,note:`Target ${rule.idealContinuousMinutes} min`},
      {label:"Abhijit survives",value:`${abhijitRows}/${rows.length}`,note:"After local exclusions"},
      {label:"Timing sources",value:String(sources),note:noWindowRows?`${noWindowRows} row${noWindowRows===1?"":"s"} with no surviving window`:"Every row retains a window"},
    ],
    fingerprintTitle:`${label} ${rule.title} fingerprint for ${city.name}`,
    fingerprintBody:`The shortlist has ${rows.length} rows with an average score of ${averageScore}/100 and a ${spread}-point full score spread. ${reason?`${reason[0]} is the most common lunar match, appearing ${reason[1]} time${reason[1]===1?"":"s"}.`:""} ${week?`${week[0]} is the most frequent weekday among candidates (${week[1]}).`:""}`,
    rankingTitle:`How decisive is the top ${rule.title} date?`,
    rankingBody:runner?`${top.date} leads ${runner.date} by ${gap} point${gap===1?"":"s"}. The leader supplies ${top.planning.totalCleanMinutes} total clean minutes and a ${top.planning.longestWindowMinutes}-minute longest block, while the runner-up has ${runner.planning.totalCleanMinutes} total clean minutes and ${runner.planning.longestWindowMinutes} minutes in its longest block. ${profile.decision}.`:`${top.date} is the only surviving candidate in ${label}, so the month is defined by a single-row decision rather than a close ranking. It retains ${top.planning.totalCleanMinutes} total clean minutes and a ${top.planning.longestWindowMinutes}-minute longest block.`,
    timingTitle:`Local timing supply in ${city.name}`,
    timingBody:`Across the shortlist, median total clean time is ${medianClean} minutes and the average longest uninterrupted block is ${avgLongest} minutes. Abhijit remains available after exclusions on ${abhijitRows} of ${rows.length} rows, and ${sources} distinct favorable timing source${sources===1?"":"s"} appear in the retained windows.`,
    ruleTitle:`${rule.title} screening signature`,
    ruleBody:`${profile.continuity}. The lunar gate accepts ${rule.goodTithi.length} configured Tithis and ${rule.goodNakshatra.length} configured Nakshatras; after that gate, the score emphasizes ${profile.focus}. In this event family the key practical signal is ${profile.signal}.`
  };
}

export function buildMuhuratYearQualityContent(event:string,year:number,city:City,summary:YearlyMuhuratSummary):MuhuratYearQualityContent{
  const rule=muhuratRules[event];if(!rule)throw new Error(`Unsupported Muhurat event: ${event}`);
  const profile=profileFor(event);
  const rows=summary.rows;
  const activeMonths=summary.months.filter(month=>month.qualified>0);
  const emptyMonths=summary.months.filter(month=>month.qualified===0);
  const densest=[...summary.months].sort((a,b)=>b.qualified-a.qualified||b.averageScore-a.averageScore||a.month-b.month)[0]??null;
  const top=summary.topRows[0];const runner=summary.topRows[1];
  const medianClean=median(rows.map(row=>row.planning.totalCleanMinutes));
  const avgLongest=avg(rows.map(row=>row.planning.longestWindowMinutes));
  const abhijit=rows.filter(row=>row.planning.hasAbhijit).length;
  const sources=uniqueSources(rows);
  const bands=scoreBand(rows);
  const reason=topReason(rows);
  const spread=rows.length?Math.max(...rows.map(r=>r.planning.score))-Math.min(...rows.map(r=>r.planning.score)):0;

  return {
    directAnswer:`${rule.title} ${year} from the ${city.name} baseline contains ${summary.totalQualified} screened candidate date${summary.totalQualified===1?"":"s"} across ${activeMonths.length} active month${activeMonths.length===1?"":"s"}; ${summary.strongestMonth?.name??"no month"} has the strongest monthly result.`,
    facts:[
      {label:"Active / empty months",value:`${activeMonths.length} / ${emptyMonths.length}`,note:"Months with / without candidates"},
      {label:"Excellent / Strong",value:`${bands.excellent} / ${bands.strong}`,note:"Annual planning bands"},
      {label:"Annual score spread",value:`${spread} pts`,note:`Average ${summary.averageScore}/100`},
      {label:"Median clean time",value:`${medianClean} min`,note:"Across all candidate rows"},
      {label:"Average longest block",value:`${avgLongest} min`,note:`Target ${rule.idealContinuousMinutes} min`},
      {label:"Abhijit survives",value:`${abhijit}/${rows.length}`,note:`${sources} favorable timing sources`},
    ],
    fingerprintTitle:`${rule.title} ${year} annual fingerprint`,
    fingerprintBody:`The annual shortlist is distributed across ${activeMonths.length} months and leaves ${emptyMonths.length} months empty. ${densest?`${densest.name} is the densest month with ${densest.qualified} candidate${densest.qualified===1?"":"s"} at an average ${densest.averageScore}/100.`:""} ${reason?`${reason[0]} is the most repeated lunar match across the year (${reason[1]} rows).`:""}`,
    seasonalTitle:`How ${rule.title} availability moves through ${year}`,
    seasonalBody:`Active months: ${activeMonths.map(month=>`${month.name} ${month.qualified}`).join(" · ")||"none"}. ${emptyMonths.length?`Months with no screened candidate: ${emptyMonths.map(month=>month.name).join(", ")}.`:"Every month has at least one screened candidate."} This month-to-month distribution is specific to the event's configured lunar profile rather than a repeated twelve-month template.`,
    rankingTitle:`Annual leadership and fallback depth`,
    rankingBody:top?runner?`${top.date} ranks first at ${top.planning.score}/100 and ${runner.date} follows at ${runner.planning.score}/100. The annual leader has ${top.planning.longestWindowMinutes} uninterrupted minutes and ${top.planning.totalCleanMinutes} total clean minutes. Across all rows, the median clean-time supply is ${medianClean} minutes; ${profile.decision}.`:`${top.date} is the only annual candidate under the current screen, with ${top.planning.score}/100 and ${top.planning.longestWindowMinutes} uninterrupted minutes.`:`No annual candidate survives the configured lunar screen, so the year has no ranking table to summarize.`,
    ruleTitle:`${rule.title} annual screening signature`,
    ruleBody:`${profile.continuity}. Across ${year}, the model uses ${rule.goodTithi.length} accepted Tithis, ${rule.goodNakshatra.length} accepted Nakshatras and an ideal continuous target of ${rule.idealContinuousMinutes} minutes. The practical focus is ${profile.focus}, with ${profile.signal} as the key differentiator between otherwise qualifying dates.`
  };
}
