import type {City} from "./cities";
import {muhuratRules,type MuhuratRow} from "./muhurat";

export type MuhuratSeoSummary={
  monthLabel:string;
  qualifyingCount:number;
  excellentCount:number;
  strongCount:number;
  averageScore:number;
  topDate:string|null;
  topWindow:string|null;
  headline:string;
  overview:string;
  rankingInsight:string;
  timingInsight:string;
  alternatives:string;
};

function monthLabel(year:number,month:number){
  return new Intl.DateTimeFormat("en-IN",{month:"long",year:"numeric",timeZone:"Asia/Kolkata"}).format(new Date(Date.UTC(year,month-1,1,6)));
}

function humanDate(value:string){
  const date=new Date(value+"T06:00:00Z");
  return new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"long",year:"numeric",weekday:"long",timeZone:"Asia/Kolkata"}).format(date);
}

function weekday(value:string){
  return new Intl.DateTimeFormat("en-IN",{weekday:"long",timeZone:"Asia/Kolkata"}).format(new Date(value+"T06:00:00Z"));
}

function firstWindow(row:MuhuratRow|undefined){
  const window=row?.recommendedWindows[0];
  return window?`${window.start}–${window.end}`:null;
}

function seasonVoice(month:number){
  if(month<=2)return "winter planning month";
  if(month<=5)return "pre-monsoon planning month";
  if(month<=9)return "monsoon-season planning month";
  if(month<=11)return "post-monsoon festival-season month";
  return "year-end planning month";
}

function densityVoice(count:number){
  if(count<=2)return "a sparse shortlist";
  if(count<=5)return "a selective shortlist";
  return "a comparatively broad shortlist";
}

function windowVoice(minutes:number){
  if(minutes>=120)return "an unusually broad uninterrupted block";
  if(minutes>=75)return "a substantial uninterrupted block";
  if(minutes>=30)return "a compact but usable uninterrupted block";
  if(minutes>0)return "a narrow uninterrupted block";
  return "no surviving uninterrupted daytime block";
}

export function buildMuhuratSeoSummary(event:string,year:number,month:number,city:City,rows:MuhuratRow[],scope:"baseline"|"city"="city"):MuhuratSeoSummary{
  const rule=muhuratRules[event];
  if(!rule)throw new Error(`Unsupported Muhurat event: ${event}`);

  const label=monthLabel(year,month);
  const qualifyingCount=rows.length;
  const excellentCount=rows.filter(row=>row.planning.grade==="Excellent").length;
  const strongCount=rows.filter(row=>row.planning.grade==="Strong").length;
  const averageScore=qualifyingCount?Math.round(rows.reduce((sum,row)=>sum+row.planning.score,0)/qualifyingCount):0;
  const top=rows[0];
  const runnerUp=rows[1];
  const third=rows[2];
  const location=scope==="baseline"?`${city.name} baseline`:city.name;
  const season=seasonVoice(month);

  if(!top){
    const timing=city.lng>=82
      ? `${city.name}'s eastern solar profile still shifts Rahu Kalam and other local periods earlier on the clock than a western-city reference.`
      : city.lng<=74.5
        ? `${city.name}'s western longitude keeps the local timing calculation later on the clock than many eastern-city examples.`
        : `Local sunrise and sunset in ${city.name} still determine the practical timing grid even when no date survives the lunar screen.`;
    return {
      monthLabel:label,
      qualifyingCount,
      excellentCount,
      strongCount,
      averageScore,
      topDate:null,
      topWindow:null,
      headline:`No ${rule.title.toLowerCase()} candidates matched the current Tithi + Nakshatra screening profile for ${label} in ${location}.`,
      overview:`This ${season} produced no date that matched both lunar filters in ${location}. Panchvani leaves the shortlist empty instead of padding it with weaker dates, which makes this month's result materially different from a month with qualifying rows.`,
      rankingInsight:`With zero screened candidates there is no Planning Score order to compare, so the useful signal is the absence of a match rather than an artificial rank table.`,
      timingInsight:timing,
      alternatives:`The practical next comparison is an adjacent month, where a different Tithi/Nakshatra distribution can create a new shortlist before local clean-time windows are considered.`
    };
  }

  const topHuman=humanDate(top.date);
  const topWindow=firstWindow(top);
  const gradePhrase=excellentCount
    ? `${excellentCount} candidate${excellentCount===1?"":"s"} reached the Excellent planning band`
    : strongCount?`${strongCount} candidate${strongCount===1?"":"s"} reached the Strong planning band`:`the shortlist stayed in the Good or Limited planning bands`;
  const density=densityVoice(qualifyingCount);
  const topDay=weekday(top.date);
  const gap=runnerUp?top.planning.score-runnerUp.planning.score:null;

  const overviewVariants=[
    `${label} is ${density} for ${location}: ${qualifyingCount} date${qualifyingCount===1?"":"s"} passed the current Tithi + Nakshatra screen. ${gradePhrase}; the shortlist average is ${averageScore}/100, and the leading date falls on ${topDay}.`,
    `In this ${season}, ${location} produced ${qualifyingCount} screened ${rule.title.toLowerCase()} candidate${qualifyingCount===1?"":"s"}. The data forms ${density}; ${gradePhrase}, while the mean practical Planning Score is ${averageScore}/100.`,
    `${location} enters ${label} with ${density} rather than a generic month template. ${qualifyingCount} lunar-profile match${qualifyingCount===1?"":"es"} remain, averaging ${averageScore}/100; ${topDay} carries the highest-ranked practical fit.`
  ];
  const overview=overviewVariants[(month+qualifyingCount+Math.round(city.lng))%overviewVariants.length];

  const rankingInsight=runnerUp
    ? gap!==null&&gap>=12
      ? `${topHuman} separates clearly from the rest at ${top.planning.score}/100 (${top.planning.grade}); ${humanDate(runnerUp.date)} follows at ${runnerUp.planning.score}/100, a ${gap}-point gap. The lead date carries ${windowVoice(top.planning.longestWindowMinutes)} of ${top.planning.longestWindowMinutes} minutes${third?`, while ${humanDate(third.date)} sits third at ${third.planning.score}/100`:""}.`
      : `${topHuman} ranks first at ${top.planning.score}/100, but the race is tight: ${humanDate(runnerUp.date)} is only ${gap} point${gap===1?"":"s"} behind. The lead row has ${top.planning.totalCleanMinutes} total clean minutes and ${windowVoice(top.planning.longestWindowMinutes)}; ${third?`${humanDate(third.date)} gives the month a third distinct fallback at ${third.planning.score}/100.`:"there is no third screened fallback."}`
    : `${topHuman} is the month's only surviving candidate. Its ${top.planning.score}/100 score is driven by ${top.planning.totalCleanMinutes} clean minutes and ${windowVoice(top.planning.longestWindowMinutes)}, so the page correctly presents a single-date shortlist instead of repeating multi-date ranking prose.`;

  const timingInsight=topWindow
    ? top.planning.longestWindowMinutes>=75
      ? `The lead date opens with a clean reference window at ${topWindow}. In ${city.name}, that row retains ${top.planning.longestWindowMinutes} uninterrupted minutes after Rahu Kalam, Yamaganda and Gulika are removed, giving timing continuity more weight than raw window count.`
      : `The first surviving reference window is ${topWindow}, but the longest block is only ${top.planning.longestWindowMinutes} minutes. For ${city.name}, this is a tighter timing pattern: local exclusions fragment the favorable periods rather than leaving one broad block.`
    : `${topHuman} matched the lunar profile, yet ${city.name}'s local exclusions leave no favorable daytime block of at least 15 minutes. That makes the row a useful example of why lunar qualification and usable clock time are separate signals.`;

  const alternativeRows=rows.slice(1,4);
  const alternatives=alternativeRows.length
    ? qualifyingCount>=6
      ? `Because this month has a broader shortlist, compare the next practical options rather than over-focusing on one date: ${alternativeRows.map((row,index)=>`#${index+2} ${humanDate(row.date)} (${row.planning.score}/100; ${row.planning.longestWindowMinutes} min longest block)`).join("; ")}.`
      : `The remaining screened choices are limited enough to compare directly: ${alternativeRows.map((row,index)=>`#${index+2} ${humanDate(row.date)} at ${row.planning.score}/100 with a ${row.planning.longestWindowMinutes}-minute longest block`).join("; ")}.`
    : `No second screened date exists in ${label}; the next meaningful comparison is another month rather than a weaker in-month substitute.`;

  return {
    monthLabel:label,
    qualifyingCount,
    excellentCount,
    strongCount,
    averageScore,
    topDate:top.date,
    topWindow,
    headline:`${rule.title} planning screen in ${location}: ${qualifyingCount} candidate date${qualifyingCount===1?"":"s"} for ${label}, led by ${topHuman}.`,
    overview,
    rankingInsight,
    timingInsight,
    alternatives
  };
}
