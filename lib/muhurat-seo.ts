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

function firstWindow(row:MuhuratRow|undefined){
  const window=row?.recommendedWindows[0];
  return window?`${window.start}–${window.end}`:null;
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

  if(!top){
    return {
      monthLabel:label,
      qualifyingCount,
      excellentCount,
      strongCount,
      averageScore,
      topDate:null,
      topWindow:null,
      headline:`No ${rule.title.toLowerCase()} candidates matched the current Tithi + Nakshatra screening profile for ${label} in ${location}.`,
      overview:`Panchvani checked every day of ${label} against the current ${rule.title.toLowerCase()} Tithi and Nakshatra screening profile for ${location}. No date matched both filters, so the month is not padded with weaker dates simply to create a longer list.`,
      rankingInsight:`Because no date passed the initial Tithi + Nakshatra screen, no Planning Score ranking is shown for ${label}. The Planning Score is only a practical clean-time comparison after that screen; it is not a full Panchang Shuddhi.`,
      timingInsight:`Local Rahu Kalam, Yamaganda, Gulika, Abhijit and Choghadiya are still calculated from ${city.name}'s sunrise and sunset, but those local periods do not convert a date into a religiously certified Muhurat.`,
      alternatives:`Check an adjacent month if your planning dates are flexible. A full ceremony decision can require weekday, Yoga, Karana, Adhika Maas, Lagna, planetary-combustion and personal-chart rules that are outside this shortlist.`
    };
  }

  const topHuman=humanDate(top.date);
  const topWindow=firstWindow(top);
  const gradePhrase=excellentCount
    ? `${excellentCount} screened candidate${excellentCount===1?"":"s"} reached the Excellent planning band`
    : strongCount?`${strongCount} screened candidate${strongCount===1?"":"s"} reached the Strong planning band`:`the screened candidates remained in the Good or Limited planning bands`;

  const overview=`For ${label}, Panchvani found ${qualifyingCount} ${rule.title.toLowerCase()} candidate date${qualifyingCount===1?"":"s"} in ${location} after applying the current Tithi + Nakshatra screen. ${gradePhrase}, and the average Planning Score across those screened candidates is ${averageScore}/100. This is not a complete Panchang Shuddhi.`;

  const rankingInsight=runnerUp
    ? `${topHuman} ranks first for practical planning at ${top.planning.score}/100 (${top.planning.grade}), with a ${top.planning.longestWindowMinutes}-minute longest clean block and ${top.planning.totalCleanMinutes} unique clean minutes. The next screened candidate is ${humanDate(runnerUp.date)} at ${runnerUp.planning.score}/100, a ${top.planning.score-runnerUp.planning.score}-point gap${third?`; ${humanDate(third.date)} is third at ${third.planning.score}/100`:""}.`
    : `${topHuman} is the only date passing the current Tithi + Nakshatra screen in ${label}; its practical Planning Score is ${top.planning.score}/100 (${top.planning.grade}) with a ${top.planning.longestWindowMinutes}-minute longest clean block and ${top.planning.totalCleanMinutes} unique clean minutes.`;

  const timingInsight=topWindow
    ? `The highest-ranked screened candidate's first clean reference window is ${topWindow}. Favorable daytime periods are kept only after overlaps with ${city.name}'s Rahu Kalam, Yamaganda and Gulika are removed; the longest remaining uninterrupted block is ${top.planning.longestWindowMinutes} minutes.`
    : `The highest-ranked screened candidate matched the Tithi + Nakshatra profile, but no favorable daytime block of at least 15 minutes remained after ${city.name}'s Rahu Kalam, Yamaganda and Gulika exclusions.`;

  const alternativeRows=rows.slice(1,4);
  const alternatives=alternativeRows.length
    ? `Next planning alternatives inside the current screen: ${alternativeRows.map((row,index)=>`#${index+2} ${humanDate(row.date)} (${row.planning.score}/100, ${row.planning.longestWindowMinutes} min longest clean block)`).join("; ")}.`
    : `There are no additional screened alternatives in ${label} under the current Tithi + Nakshatra profile.`;

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
