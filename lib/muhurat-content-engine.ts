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

function shortlistProfile(count:number){
  if(count===1)return {key:"single-candidate",label:"single-candidate month"};
  if(count===2)return {key:"head-to-head",label:"two-date head-to-head"};
  if(count===3)return {key:"compact-trio",label:"compact three-date shortlist"};
  if(count===4)return {key:"four-way-field",label:"four-way comparison field"};
  if(count<=6)return {key:"deep-shortlist",label:"deep but selective shortlist"};
  return {key:"broad-field",label:"broad candidate field"};
}
function spreadProfile(spread:number){
  if(spread<=4)return {key:"near-tie",text:"scores are compressed into a near-tie"};
  if(spread<=10)return {key:"tight-spread",text:"the ranking is tightly grouped"};
  if(spread<=20)return {key:"tiered-spread",text:"the shortlist separates into visible score tiers"};
  return {key:"wide-spread",text:"the top and bottom of the shortlist are widely separated"};
}
function cleanProfile(medianClean:number,avgLongest:number){
  if(avgLongest===0)return {key:"fragmented",text:"no average uninterrupted block survives",body:`The timing supply is fragmented: the average longest block is zero even though median total clean time is ${medianClean} minutes.`};
  if(avgLongest<45)return {key:"narrow",text:"short-block timing",body:`Timing is narrow-block: the average longest run is only ${avgLongest} minutes and median total clean supply is ${medianClean} minutes.`};
  if(avgLongest<75)return {key:"compact",text:"compact-window timing",body:`The month has compact usable windows, averaging ${avgLongest} uninterrupted minutes with ${medianClean} median total clean minutes.`};
  if(avgLongest<105)return {key:"balanced",text:"balanced-window timing",body:`Continuity is balanced rather than extreme: the average longest block is ${avgLongest} minutes and median clean supply is ${medianClean} minutes.`};
  if(avgLongest<150)return {key:"long-block",text:"long-block timing",body:`Long uninterrupted blocks define the month. The average longest block reaches ${avgLongest} minutes while median total clean time is ${medianClean} minutes.`};
  return {key:"abundant",text:"abundant continuity",body:`The local timing supply is unusually abundant: average longest continuity reaches ${avgLongest} minutes and median total clean time is ${medianClean} minutes.`};
}
function abhijitProfile(value:number,total:number){
  if(!total||value===0)return {key:"no-abhijit",text:"No candidate retains Abhijit after exclusions."};
  if(value===total)return {key:"all-abhijit",text:"Every candidate retains an Abhijit contribution after exclusions."};
  const ratio=value/total;
  if(ratio<0.5)return {key:"minority-abhijit",text:`Abhijit survives only on a minority of rows (${value}/${total}).`};
  if(ratio===0.5)return {key:"split-abhijit",text:`Abhijit survival is evenly split at ${value}/${total} rows.`};
  return {key:"majority-abhijit",text:`A majority of candidates retain Abhijit after exclusions (${value}/${total}).`};
}
function sourceProfile(sources:number){
  if(sources<=0)return "no retained favorable timing source";
  if(sources===1)return "a single-source timing model in the surviving windows";
  if(sources===2)return "a two-source favorable timing mix";
  return `a diversified mix of ${sources} favorable timing sources`;
}

function monthlyDirect(ruleTitle:string,location:string,label:string,rows:readonly MuhuratRow[],top:MuhuratRow,shortlist:{key:string;label:string}){
  switch(shortlist.key){
    case "single-candidate":return `${label} leaves ${location} with one ${ruleTitle.toLowerCase()} candidate only: ${top.date}, scoring ${top.planning.score}/100 with a ${top.planning.longestWindowMinutes}-minute longest clean block.`;
    case "head-to-head":return `${ruleTitle} in ${location} is a two-date contest for ${label}. ${top.date} leads the pair at ${top.planning.score}/100; its longest uninterrupted clean block is ${top.planning.longestWindowMinutes} minutes.`;
    case "compact-trio":return `${location} has a compact trio of ${ruleTitle.toLowerCase()} candidates in ${label}. The three-date field is led by ${top.date} at ${top.planning.score}/100 and ${top.planning.longestWindowMinutes} uninterrupted minutes.`;
    case "four-way-field":return `Four screened ${ruleTitle.toLowerCase()} dates form ${location}'s ${label} comparison field. ${top.date} sits first at ${top.planning.score}/100, carrying a ${top.planning.longestWindowMinutes}-minute longest clean block.`;
    case "deep-shortlist":return `${label} produces a deep but selective ${ruleTitle.toLowerCase()} shortlist in ${location}: ${rows.length} dates survive the lunar screen, with ${top.date} leading at ${top.planning.score}/100.`;
    default:return `${location} has a broad ${ruleTitle.toLowerCase()} field in ${label}: ${rows.length} screened dates remain, headed by ${top.date} at ${top.planning.score}/100.`;
  }
}

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
  const weekdayVariety=new Set(rows.map(row=>weekday(row.date))).size;
  const sources=uniqueSources(rows);
  const spread=rows.length?Math.max(...rows.map(r=>r.planning.score))-Math.min(...rows.map(r=>r.planning.score)):0;
  const gap=top&&runner?top.planning.score-runner.planning.score:null;

  if(!top){
    return {
      directAnswer:`${rule.title} in ${location} has no candidate date for ${label} under the current Tithi + Nakshatra profile.`,
      facts:[{label:"Screened candidates",value:"0",note:label},{label:"Ideal continuous target",value:`${rule.idealContinuousMinutes} min`,note:profile.focus},{label:"Accepted Tithis",value:String(rule.goodTithi.length)},{label:"Accepted Nakshatras",value:String(rule.goodNakshatra.length)}],
      fingerprintTitle:`${label} ${rule.title} fingerprint · empty lunar gate`,
      fingerprintBody:`The zero-candidate month is its own data state: none of the local Panchang rows match both configured lunar filters, so ${location} has no score distribution, fallback depth or clean-window comparison to summarize.`,
      rankingTitle:"No ranking layer this month",
      rankingBody:`With no lunar-profile survivor there is no artificial #1 date. The meaningful comparison shifts to another month where the event's ${rule.goodTithi.length} accepted Tithis and ${rule.goodNakshatra.length} accepted Nakshatras produce at least one row.`,
      timingTitle:`Timing stage never activates in ${label}`,
      timingBody:`${profile.continuity}. Rahu Kalam, Yamaganda, Gulika, Abhijit and favorable Choghadiya are only ranked after a date survives the lunar gate; no row reaches that stage here.`,
      ruleTitle:`What makes ${rule.title} different`,
      ruleBody:`This event is evaluated around ${profile.focus}; the decisive signal is ${profile.signal}. The configured ideal continuous target is ${rule.idealContinuousMinutes} minutes.`
    };
  }

  const shortlist=shortlistProfile(rows.length);
  const spreadState=spreadProfile(spread);
  const clean=cleanProfile(medianClean,avgLongest);
  const abhijit=abhijitProfile(abhijitRows,rows.length);
  const topReasonText=reason?`${reason[0]} appears on ${reason[1]} row${reason[1]===1?"":"s"}`:"no repeated lunar-match label";
  const weekdayText=week?`${week[0]} leads across ${weekdayVariety} represented weekday${weekdayVariety===1?"":"s"}`:"weekday concentration is unavailable";

  const fingerprintBody=shortlist.key==="single-candidate"
    ? `This is not a distribution problem but a single-row month. ${top.date} alone survives; its lunar match is ${top.reasons.join(" + ")}, its total clean supply is ${top.planning.totalCleanMinutes} minutes, and the timing profile is ${clean.key}.`
    : shortlist.key==="head-to-head"
      ? `Two candidates create a direct contrast rather than a deep ranking. ${spreadState.text}; ${topReasonText}. The pair averages ${averageScore}/100, while ${abhijit.text}`
      : shortlist.key==="compact-trio"
        ? `Three rows make the month compact enough for full comparison. ${weekdayText}; ${topReasonText}. Their score spread is ${spread} points, producing a ${spreadState.key} pattern around a ${averageScore}/100 average.`
        : shortlist.key==="four-way-field"
          ? `A four-date field creates both leadership and fallback depth. ${spreadState.text}, ${topReasonText}, and ${weekdayText}. Average score is ${averageScore}/100; the local clean-time profile is ${clean.key}.`
          : shortlist.key==="deep-shortlist"
            ? `The ${rows.length}-row field is deep enough to expose distribution rather than one-off timing. ${spreadState.text}; ${weekdayText}. ${topReasonText}, while the shortlist-wide clean-time class is ${clean.key}.`
            : `A broad ${rows.length}-date field makes this month distribution-heavy. ${weekdayText}; ${topReasonText}; ${spreadState.text}. The field averages ${averageScore}/100 and carries a ${clean.key} continuity profile.`;

  let rankingBody:string;
  if(!runner){
    rankingBody=`There is no runner-up: ${top.date} is the only lunar-profile survivor. Its ${top.planning.score}/100 score combines ${top.planning.totalCleanMinutes} clean minutes with a ${top.planning.longestWindowMinutes}-minute longest block, so comparison must move to another month rather than a weaker in-month fallback.`;
  }else if(rows.length===2){
    rankingBody=`The month is a head-to-head: ${top.date} leads ${runner.date} by ${gap} point${gap===1?"":"s"}. Their longest clean blocks are ${top.planning.longestWindowMinutes} and ${runner.planning.longestWindowMinutes} minutes respectively, making the runner-up a concrete alternative rather than one row in a long table.`;
  }else if(rows.length===3){
    const third=rows[2];
    rankingBody=`The trio has a clear 1–2–3 structure. ${top.date} leads by ${gap} point${gap===1?"":"s"} over ${runner.date}; ${third.date} supplies the third fallback at ${third.planning.score}/100. This makes ranking depth visible without diluting the comparison across many dates.`;
  }else if(rows.length===4){
    rankingBody=`Leadership sits inside a four-way field: ${top.date} is #1, ${runner.date} is #2 at a ${gap}-point gap, and two additional rows preserve fallback depth. ${spreadState.text}; ${profile.decision}.`;
  }else{
    rankingBody=`The top pair is only the front of a ${rows.length}-date field. ${top.date} leads ${runner.date} by ${gap} point${gap===1?"":"s"}, while ${rows.length-2} additional screened dates create deeper fallback capacity. ${spreadState.text}; ${profile.decision}.`;
  }

  const timingBody=clean.key==="fragmented"
    ? `${clean.body} ${abhijit.text} ${noWindowRows} candidate row${noWindowRows===1?"":"s"} has no surviving recommended window, so lunar qualification is materially stronger than practical daytime continuity in this local month.`
    : clean.key==="narrow"
      ? `${clean.body} ${abhijit.text} The surviving windows draw on ${sourceProfile(sources)}, so small changes in local exclusions matter more than raw candidate count.`
      : clean.key==="compact"
        ? `${clean.body} ${sourceProfile(sources)[0].toUpperCase()+sourceProfile(sources).slice(1)} supports the retained rows. ${abhijit.text}`
        : clean.key==="balanced"
          ? `${clean.body} ${abhijit.text} Timing diversity comes from ${sourceProfile(sources)}, giving the month neither a scarce nor an excessive clean-time profile.`
          : clean.key==="long-block"
            ? `${clean.body} ${abhijit.text} With ${sourceProfile(sources)}, continuity rather than simple window count is the defining timing feature.`
            : `${clean.body} ${sourceProfile(sources)[0].toUpperCase()+sourceProfile(sources).slice(1)} appears across the field, and ${abhijit.text.toLowerCase()}`;

  return {
    directAnswer:monthlyDirect(rule.title,location,label,rows,top,shortlist),
    facts:[
      {label:"Shortlist structure",value:shortlist.key,note:`${rows.length} candidates`},
      {label:"Score distribution",value:spreadState.key,note:`Avg ${averageScore}/100 · spread ${spread} pts`},
      {label:"Clean-time profile",value:clean.key,note:`Median ${medianClean} min · longest avg ${avgLongest} min`},
      {label:"Abhijit pattern",value:abhijit.key,note:`${abhijitRows}/${rows.length} rows`},
      {label:"Lunar-match leader",value:reason?.[0]??"—",note:reason?`${reason[1]} row(s)`:undefined},
      {label:"Timing-source depth",value:String(sources),note:noWindowRows?`${noWindowRows} row${noWindowRows===1?"":"s"} without surviving window`:"All rows retain timing"},
    ],
    fingerprintTitle:`${label} ${rule.title} · ${shortlist.label} · ${clean.text}`,
    fingerprintBody,
    rankingTitle:`Ranking shape · ${shortlist.label}`,
    rankingBody,
    timingTitle:`${city.name} timing supply · ${clean.text}`,
    timingBody,
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
