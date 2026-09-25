import type {MuhuratRow} from "./muhurat";
import type {YearlyMuhuratMonth,YearlyMuhuratSummary} from "./yearly-expansion";

type Fact={label:string;value:string;note?:string};

type EventProfile={
  label:string;
  title:string;
  body:string;
  decisionNoun:string;
  fallbackNoun:string;
};

export type MuhuratYearHighSimilarityContext={
  title:string;
  eventBody:string;
  sequenceTitle:string;
  sequenceBody:string;
  shortlistTitle:string;
  shortlistBody:string;
  facts:Fact[];
};

const eventProfiles:Record<string,EventProfile>={
  wedding:{
    label:"ceremony-date planning",
    title:"Wedding-year planning fingerprint",
    body:"This annual view is read as a ceremony-date shortlist rather than as a generic auspicious-date archive. The practical comparison is between months that offer several screened alternatives, months that offer only one narrow fallback, and months that carry no configured-profile candidate. When two years look similar at headline level, the useful distinction is the order in which those planning choices appear, the weekday and lunar-match mix inside the strongest dates, and whether the cleaner windows cluster early or later in the active season.",
    decisionNoun:"ceremony shortlist",
    fallbackNoun:"backup ceremony month",
  },
  "griha-pravesh":{
    label:"home-entry planning",
    title:"Griha Pravesh year planning fingerprint",
    body:"This annual view is organized around home-entry scheduling. Instead of treating every active month as interchangeable, it separates the first realistic entry window, the strongest occupancy-planning month, sparse fallback periods and long no-candidate gaps. The year fingerprint therefore follows the actual order of usable months, the weekday and lunar-match character of their leading dates, and the continuity of the retained local timing blocks that a household would need to coordinate around the entry ritual and move-in sequence.",
    decisionNoun:"entry shortlist",
    fallbackNoun:"backup entry month",
  },
  "vehicle-purchase":{
    label:"purchase-and-handover planning",
    title:"Vehicle-purchase year planning fingerprint",
    body:"This annual view is read as a purchase, delivery and handover planning map. The main distinction is not merely how many dates survive the Muhurat screen, but where operationally useful alternatives sit across the year: which month opens the shortlist, which month provides the deepest fallback pool, which weekday pattern recurs, and how the retained clean-time blocks are distributed around the leading dates. That makes each year a different handover sequence rather than a repeated list with a changed year number.",
    decisionNoun:"handover shortlist",
    fallbackNoun:"backup purchase month",
  },
};

const openingProfiles:Record<string,{title:string;body:string}>={
  Monday:{title:"Monday-opening civil frame",body:"The civil year starts on a Monday, so the annual sequence opens directly inside the working week. Read the first active month against that week-start frame, then compare whether later candidates keep returning to early-week dates or migrate toward a different weekday rhythm."},
  Tuesday:{title:"Tuesday-opening civil frame",body:"The civil year begins on a Tuesday, producing an early-week but not week-start baseline. The useful yearly signature is the shift from that Tuesday opening into the weekday mix of the strongest candidate months and the eventual closing-season pattern."},
  Wednesday:{title:"Midweek-opening civil frame",body:"The civil year opens in the middle of the week. That midweek anchor makes the chronology especially useful: compare the first active month with the later weekday leaders and watch whether the shortlist stays midweek-heavy or breaks toward weekend-adjacent dates."},
  Thursday:{title:"Late-week-opening civil frame",body:"The year begins on a Thursday, so its civil baseline sits on the late-week side before the first weekend. The annual fingerprint is read by tracking how the active-month sequence departs from that late-week opening and where the dominant candidate weekdays eventually settle."},
  Friday:{title:"Weekend-approach civil frame",body:"The civil year opens on a Friday, immediately beside the weekend. That creates a weekend-approach baseline for the annual chronology; the strongest months are compared by whether their leading dates preserve that late-week tendency or move back into the middle of the working week."},
  Saturday:{title:"Weekend-opening civil frame",body:"The year starts on a Saturday, giving the annual sequence a true weekend opening. The useful distinction is how quickly the first active month leaves that weekend baseline and whether the strongest later candidates concentrate on working-week or weekend-adjacent weekdays."},
  Sunday:{title:"Sunday-opening civil frame",body:"The civil year begins on Sunday. That weekend boundary is the reference point for the annual sequence, so the month-by-month shortlist is read by how its leading dates redistribute across the following working-week and weekend cycle."},
};

function weekday(date:string){return new Intl.DateTimeFormat("en-IN",{weekday:"long",timeZone:"Asia/Kolkata"}).format(new Date(`${date}T06:00:00Z`));}
function isLeap(year:number){return new Date(Date.UTC(year,1,29)).getUTCMonth()===1;}
function monthNameFromDate(date:string,months:readonly YearlyMuhuratMonth[]){const month=Number(date.slice(5,7));return months.find(item=>item.month===month)?.name??"Unknown month";}
function rowSource(row:MuhuratRow){return row.recommendedWindows[0]?.sources[0]??"no retained timing source";}
function continuity(minutes:number){
  if(minutes>=150)return "very-long clean block";
  if(minutes>=105)return "long clean block";
  if(minutes>=75)return "balanced clean block";
  if(minutes>=45)return "compact clean block";
  return "short clean block";
}
function supply(value:number){
  if(value===0)return "closed month";
  if(value===1)return "single-choice month";
  if(value<=3)return "light-choice month";
  if(value<=6)return "multi-choice month";
  return "deep-choice month";
}
function gradeMix(month:YearlyMuhuratMonth){
  if(month.qualified===0)return "no retained grade mix";
  if(month.excellent>month.strong)return "excellent-led mix";
  if(month.strong>month.excellent)return "strong-led mix";
  if(month.excellent===month.strong&&month.excellent>0)return "balanced excellent-and-strong mix";
  return "good-grade mix";
}
function activeMonths(summary:YearlyMuhuratSummary){return summary.months.filter(month=>month.qualified>0);}
function topMonths(summary:YearlyMuhuratSummary){return [...activeMonths(summary)].sort((a,b)=>b.qualified-a.qualified||b.averageScore-a.averageScore||a.month-b.month);}
function longestEmptyRun(months:readonly YearlyMuhuratMonth[]){
  let best:YearlyMuhuratMonth[]=[];
  let current:YearlyMuhuratMonth[]=[];
  for(const month of months){
    if(month.qualified===0){current=[...current,month];if(current.length>best.length)best=current;}
    else current=[];
  }
  return best;
}
function countLeader(values:string[]){
  const counts=new Map<string,number>();
  for(const value of values)counts.set(value,(counts.get(value)??0)+1);
  return [...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]??null;
}
function quarterSignature(summary:YearlyMuhuratSummary){
  const names=["opening quarter","second quarter","monsoon-side quarter","closing quarter"];
  return names.map((name,index)=>{
    const months=summary.months.slice(index*3,index*3+3);
    const candidates=months.reduce((sum,month)=>sum+month.qualified,0);
    const active=months.filter(month=>month.qualified>0).map(month=>month.name);
    return {name,candidates,active};
  });
}
function chronologyShape(summary:YearlyMuhuratSummary){
  const active=activeMonths(summary);
  if(!active.length)return "fully closed annual screen";
  const averageMonth=active.reduce((sum,month)=>sum+month.month,0)/active.length;
  const first=active[0].month,last=active[active.length-1].month;
  if(last-first<=3)return averageMonth<=6?"compact early-season cluster":"compact late-season cluster";
  if(averageMonth<5.5)return "front-weighted annual arc";
  if(averageMonth>7.5)return "back-weighted annual arc";
  if(active.length>=9)return "broad full-year arc";
  return "split-season annual arc";
}
function monthSentence(month:YearlyMuhuratMonth){
  if(!month.top)return `${month.name} is a ${supply(month.qualified)} and contributes no configured-profile date to the annual shortlist.`;
  const top=month.top;
  const reasonPath=top.reasons.length?top.reasons.join(" with "):"screened lunar match";
  return `${month.name} is a ${supply(month.qualified)} with a ${gradeMix(month)}. Its leading date falls on ${weekday(top.date)}, combines ${reasonPath}, uses ${rowSource(top)} as the first retained source, and carries a ${continuity(top.planning.longestWindowMinutes)}.`;
}
function shortlistSentence(row:MuhuratRow,index:number,summary:YearlyMuhuratSummary){
  const month=monthNameFromDate(row.date,summary.months);
  const reasons=row.reasons.length?row.reasons.join(" plus "):"screened lunar match";
  const rankWord=["lead","second","third","fourth","fifth","sixth"][index]??"later";
  return `The ${rankWord} planning fit sits in ${month} on ${weekday(row.date)}: ${row.planning.grade} grade, ${reasons}, ${rowSource(row)} first, and a ${continuity(row.planning.longestWindowMinutes)}.`;
}

export function buildMuhuratYearHighSimilarityContext(summary:YearlyMuhuratSummary):MuhuratYearHighSimilarityContext{
  const profile=eventProfiles[summary.event]??{
    label:"annual Muhurat planning",
    title:`${summary.title} year planning fingerprint`,
    body:"This annual view is read as a planning sequence. The useful differences between years come from the order of active months, weekday distribution, lunar-match mix, retained timing sources and the continuity of the strongest local windows.",
    decisionNoun:"annual shortlist",
    fallbackNoun:"backup month",
  };
  const jan1=weekday(`${summary.year}-01-01`);
  const opening=openingProfiles[jan1]??openingProfiles.Monday;
  const active=activeMonths(summary);
  const leaders=topMonths(summary);
  const emptyRun=longestEmptyRun(summary.months);
  const quarters=quarterSignature(summary);
  const quarterLeader=[...quarters].sort((a,b)=>b.candidates-a.candidates||a.name.localeCompare(b.name))[0];
  const weekdayTop=countLeader(summary.rows.map(row=>weekday(row.date)));
  const sourceTop=countLeader(summary.rows.map(row=>rowSource(row)));
  const lunarTop=countLeader(summary.rows.map(row=>row.reasons.join(" + ")).filter(Boolean));
  const chronology=chronologyShape(summary);
  const firstActive=active[0]??null,lastActive=active[active.length-1]??null;
  const leadMonth=leaders[0]??null,fallbackMonth=leaders[1]??null;
  const monthSequence=summary.months.map(monthSentence).join(" ");
  const shortlist=summary.topRows.slice(0,6).map((row,index)=>shortlistSentence(row,index,summary)).join(" ");
  const leapText=isLeap(summary.year)?"leap-year February":"regular-length February";
  const eventBody=`${profile.body} ${opening.body} In this ${leapText} frame, the result is a ${chronology}. ${firstActive?`${firstActive.name} opens the ${profile.decisionNoun}`:`No month opens the ${profile.decisionNoun}`}; ${lastActive?`${lastActive.name} closes it.`:"the year stays closed."} ${leadMonth?`${leadMonth.name} is the deepest decision month.`:"There is no density leader."} ${fallbackMonth?`${fallbackMonth.name} acts as the ${profile.fallbackNoun}.`:"There is no second active fallback month."}`;
  const sequenceBody=monthSequence;
  const shortlistBody=summary.topRows.length?shortlist:`No date survives the configured screen, so this year has no ranked shortlist narrative.`;

  return {
    title:`${profile.title} · ${opening.title}`,
    eventBody,
    sequenceTitle:`Month-by-month ${profile.label} sequence`,
    sequenceBody,
    shortlistTitle:`Ranked-date fingerprint · ${chronology}`,
    shortlistBody,
    facts:[
      {label:"Chronology shape",value:chronology,note:firstActive&&lastActive?`${firstActive.name} → ${lastActive.name}`:"No active span"},
      {label:"Civil opening",value:opening.title,note:`Year closes on ${weekday(`${summary.year}-12-31`)}`},
      {label:"Decision month",value:leadMonth?.name??"none",note:leadMonth?`${supply(leadMonth.qualified)} · ${gradeMix(leadMonth)}`:"No retained month"},
      {label:"Fallback month",value:fallbackMonth?.name??"none",note:fallbackMonth?`${supply(fallbackMonth.qualified)} · ${gradeMix(fallbackMonth)}`:"No second month"},
      {label:"Longest closed run",value:emptyRun.length?emptyRun.map(month=>month.name).join(" → "):"none",note:emptyRun.length?`${emptyRun.length} consecutive closed month(s)`:"No closed sequence"},
      {label:"Quarter leader",value:quarterLeader.name,note:quarterLeader.active.length?quarterLeader.active.join(" · "):"No active month in quarter"},
      {label:"Weekday fingerprint",value:weekdayTop?.[0]??"none",note:weekdayTop?`${weekdayTop[1]} retained candidate(s)`:"No retained candidates"},
      {label:"Timing-source fingerprint",value:sourceTop?.[0]??"none",note:sourceTop?`${sourceTop[1]} leading row occurrence(s)`:"No retained source"},
      {label:"Lunar-match fingerprint",value:lunarTop?.[0]??"none",note:lunarTop?`${lunarTop[1]} occurrence(s)`:"No repeated match"},
    ]
  };
}
