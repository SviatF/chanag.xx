import {muhuratRules,type MuhuratRow} from "./muhurat";

type Fact={label:string;value:string;note?:string};

export type MuhuratMonthSimilarityContext={
  title:string;
  positionBody:string;
  sequenceTitle:string;
  sequenceBody:string;
  facts:Fact[];
};

type MonthProfile={position:string;story:string;contrast:string};

const monthProfiles:Record<number,MonthProfile>={
  1:{
    position:"year-opening winter baseline",
    story:"January is the reset month in this comparison set: it opens the civil year while Mumbai is still in its drier winter phase. That makes the page useful as a fresh baseline rather than a continuation of a previous quarter. Read the shortlist as an opening benchmark for candidate depth, weekday concentration and clean-window continuity before the year develops further.",
    contrast:"Its comparison question is therefore baseline formation: does the new year begin with a concentrated shortlist, a dispersed field, or a single dominant timing pattern?"
  },
  2:{
    position:"short late-winter bridge",
    story:"February is structurally different because it is the shortest civil month and acts as a compact bridge between the year-opening winter period and the spring transition. A Muhurat shortlist here should be read for compression: candidate dates have less calendar space in which to spread, so clustering, weekday repetition and fallback depth matter more than raw month length.",
    contrast:"The useful contrast is compactness: this page asks whether a shorter calendar still produces meaningful alternatives or funnels the event into only a narrow set of retained days."
  },
  3:{
    position:"spring-turn first-quarter close",
    story:"March closes the first quarter and moves the Mumbai baseline out of the late-winter bridge into a warmer spring-turn planning period. The month is best treated as a quarter-closing test of momentum: compare how many screened dates survive, whether the leading grades stay clustered, and whether candidate weekdays spread across the calendar or collect in a narrow cadence.",
    contrast:"Its distinguishing question is quarter-end breadth: does the shortlist widen before the next quarter, or does one repeated lunar-and-weekday pattern dominate the retained field?"
  },
  4:{
    position:"new-quarter hot-season opening",
    story:"April starts a new quarter and belongs to Mumbai's hotter pre-monsoon build-up rather than the first-quarter spring turn. That calendar position makes the month a clean restart for comparison. The useful reading is not only which date ranks first, but how the new-quarter shortlist distributes across early, middle and late portions of the month and how many timing-source combinations survive exclusions.",
    contrast:"The key contrast is restart versus carry-over: April shows whether the event enters the new quarter with a different candidate cadence from the months that precede it."
  },
  5:{
    position:"pre-monsoon late-spring stretch",
    story:"May sits deep in the pre-monsoon portion of Mumbai's calendar and forms a late-spring stretch before the seasonal handoff. For Muhurat comparison, this is a spacing month: pay attention to whether screened dates occupy only one part of the month or span its opening, middle and closing thirds, and whether the strongest rows share the same lunar reason or arrive through different qualifying combinations.",
    contrast:"Its distinctive question is spread: does the shortlist provide calendar flexibility before the monsoon handoff, or is the apparent depth concentrated into one repeated pattern?"
  },
  6:{
    position:"monsoon-onset midyear handoff",
    story:"June is a handoff month in Mumbai: it approaches the middle of the civil year while the monsoon season normally begins to reshape the local calendar context. The Muhurat page should therefore be read as a transition snapshot. Candidate cadence, weekday sequence and retained timing sources show whether the shortlist changes character at midyear rather than simply repeating the pre-monsoon months.",
    contrast:"The central contrast is transition: June asks whether the event's screened field becomes more concentrated, more varied or differently ordered as the year crosses into its middle stretch."
  },
  7:{
    position:"mid-monsoon second-half opening",
    story:"July opens the second half of the civil year and sits inside Mumbai's core monsoon season. In this comparison framework it functions as a second-half reset rather than a continuation of June. The useful fingerprint is the order of retained weekdays, the mix of planning grades and whether candidates appear near the opening, middle or closing third of the month.",
    contrast:"Its comparison question is second-half structure: does the year reopen with a balanced field of alternatives, or with a tight cluster that behaves differently from the first-half months?"
  },
  8:{
    position:"late-monsoon third-quarter middle",
    story:"August occupies the middle of the third quarter while Mumbai remains in the later monsoon stretch. That makes it a persistence month: the page tests whether the event keeps the same shortlist shape seen earlier in the quarter or develops a new combination of weekday cadence, lunar reasons and clean-window sources. The sequence of candidates matters more here than a generic monthly summary.",
    contrast:"The useful contrast is persistence versus change: August shows whether the third-quarter pattern holds together or breaks into a materially different shortlist fingerprint."
  },
  9:{
    position:"monsoon-retreat third-quarter close",
    story:"September closes the third quarter and approaches Mumbai's monsoon-retreat transition. It is therefore a closure month in the annual comparison, not merely another late-monsoon page. Read the retained dates for end-of-quarter concentration: which calendar thirds contain candidates, which weekdays recur, and whether the grade sequence creates a clear hierarchy or a compressed group of near-equivalent options.",
    contrast:"Its distinguishing question is quarter-close concentration: does the shortlist tighten as the quarter ends, or preserve enough internal variety to behave unlike the spring and midyear months?"
  },
  10:{
    position:"post-monsoon fourth-quarter opening",
    story:"October starts the fourth quarter and moves the Mumbai baseline toward the post-monsoon part of the year. In Muhurat comparison this is another reset point, but unlike January it begins the closing quarter rather than the full year. Candidate depth, lunar-reason diversity and usable timing-source mix indicate whether the final-quarter opening creates a fresh planning profile.",
    contrast:"The central contrast is final-quarter reset: October asks whether the event gains a new shortlist structure after the monsoon months or carries forward the same cadence."
  },
  11:{
    position:"late-autumn closing-quarter middle",
    story:"November lies in the middle of the closing quarter, after the post-monsoon reset and before the year-end finish. That makes it a consolidation month. The shortlist should be read for stability: repeated weekday anchors, recurring lunar reasons and the balance between top-ranked dates and fallback rows reveal whether the event has settled into a consistent late-year planning pattern.",
    contrast:"Its comparison question is consolidation: does the month produce a stable ladder of alternatives, or a fragmented set whose timing-source and grade patterns pull in different directions?"
  },
  12:{
    position:"year-closing winter return",
    story:"December is the annual closing month and returns the Mumbai baseline to a drier winter setting. It serves as the terminal checkpoint for the year's Muhurat sequence. The useful fingerprint is closure: compare how the final shortlist distributes across the month, whether strong rows cluster near one calendar segment, and which weekday and lunar combinations remain present at the end of the civil year.",
    contrast:"The distinguishing question is year-end closure: December shows whether the event finishes with broad fallback depth, a narrow final cluster, or one clearly dominant retained pattern."
  }
};

function monthLabel(year:number,month:number){return new Intl.DateTimeFormat("en-IN",{month:"long",year:"numeric",timeZone:"Asia/Kolkata"}).format(new Date(Date.UTC(year,month-1,1,6)));}
function weekday(date:string){return new Intl.DateTimeFormat("en-IN",{weekday:"long",timeZone:"Asia/Kolkata"}).format(new Date(`${date}T06:00:00Z`));}
function unique<T>(values:readonly T[]){return [...new Set(values)];}
function countBy(values:readonly string[]){const counts=new Map<string,number>();for(const value of values)counts.set(value,(counts.get(value)??0)+1);return [...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));}
function dayThird(date:string){const day=Number(date.slice(8,10));return day<=10?"opening third":day<=20?"middle third":"closing third";}
function cadence(rows:readonly MuhuratRow[]){
  const zones=new Set(rows.map(row=>dayThird(row.date)));
  if(!rows.length)return "empty calendar field";
  if(zones.size===1)return `${[...zones][0]} concentration`;
  if(zones.size===3)return "all-thirds calendar spread";
  if(zones.has("opening third")&&zones.has("middle third"))return "opening-to-middle spread";
  if(zones.has("middle third")&&zones.has("closing third"))return "middle-to-closing spread";
  return "edge-spanning opening-and-closing spread";
}
function shortlistShape(count:number){
  if(count===0)return "no retained candidates";
  if(count===1)return "single-anchor shortlist";
  if(count===2)return "paired fallback structure";
  if(count===3)return "compact three-date field";
  if(count<=5)return "layered selective field";
  return "broad multi-date field";
}
function gradeShape(rows:readonly MuhuratRow[]){
  const grades=rows.map(row=>row.planning.grade);
  const distinct=unique(grades);
  if(!grades.length)return "no grade sequence";
  if(distinct.length===1)return `uniform ${distinct[0].toLowerCase()} grade field`;
  return `${distinct.join(" → ")} grade ladder`;
}
function reasonSignature(rows:readonly MuhuratRow[]){
  const reasons=countBy(rows.flatMap(row=>row.reasons));
  if(!reasons.length)return "no retained lunar-reason label";
  return reasons.slice(0,4).map(([reason,count])=>`${reason} (${count} row${count===1?"":"s"})`).join(" · ");
}
function sourceSignature(rows:readonly MuhuratRow[]){
  const sources=countBy(rows.flatMap(row=>row.recommendedWindows.flatMap(window=>window.sources)));
  if(!sources.length)return "no favorable timing source survives";
  return sources.slice(0,5).map(([source,count])=>`${source} on ${count} retained window${count===1?"":"s"}`).join(" · ");
}
function weekdaySignature(rows:readonly MuhuratRow[]){
  const days=rows.map(row=>weekday(row.date));
  if(!days.length)return "no weekday sequence";
  return unique(days).join(" → ");
}
function dominantWeekday(rows:readonly MuhuratRow[]){return countBy(rows.map(row=>weekday(row.date)))[0]?.[0]??"none";}
function monthSequenceBody(month:number,label:string,rows:readonly MuhuratRow[]){
  const shape=shortlistShape(rows.length),calendarCadence=cadence(rows),weekdays=weekdaySignature(rows),grades=gradeShape(rows),reason=reasonSignature(rows),sources=sourceSignature(rows);
  switch(month%4){
    case 1:return `${label} resolves into a ${shape} with ${calendarCadence}. Reading the candidates from the start of the month forward, the represented weekday path is ${weekdays}. The planning hierarchy is a ${grades}. Lunar qualification is led by ${reason}. The surviving favorable-source pattern is ${sources}. Together these signals describe the actual retained field rather than a month-name substitution.`;
    case 2:return `The retained field for ${label} is best read from distribution inward: ${calendarCadence}, then a ${shape}, then the weekday sequence ${weekdays}. Its score labels form a ${grades}. The lunar reasons are ${reason}, while the clean-window source signature is ${sources}. This combination gives the month a chronology that can be compared directly with adjacent months without treating their tables as interchangeable.`;
    case 3:return `Start with chronology rather than rank for ${label}. Candidates occupy a ${calendarCadence}; their weekday order is ${weekdays}, and the shortlist itself is a ${shape}. Grade movement forms a ${grades}. The strongest repeated lunar evidence is ${reason}. Favorable timing survives through ${sources}. Those layers make the month identifiable even after dates and numeric scores are removed from a similarity comparison.`;
    default:return `${label} has a ${shape}, but its stronger identifier is the sequence around it: ${calendarCadence}, weekday path ${weekdays}, and a ${grades}. The qualifying lunar mix is ${reason}. The retained favorable-source mix is ${sources}. This is the month-level planning fingerprint used here, so comparison depends on actual candidate structure instead of generic Muhurat prose.`;
  }
}

export function buildMuhuratMonthSimilarityContext(event:string,year:number,month:number,rows:readonly MuhuratRow[]):MuhuratMonthSimilarityContext{
  const rule=muhuratRules[event];if(!rule)throw new Error(`Unsupported Muhurat event: ${event}`);
  const profile=monthProfiles[month];if(!profile)throw new Error(`Unsupported month: ${month}`);
  const label=monthLabel(year,month);
  const shape=shortlistShape(rows.length),calendarCadence=cadence(rows),grades=gradeShape(rows);
  const weekdays=weekdaySignature(rows),dominant=dominantWeekday(rows);
  const reasons=reasonSignature(rows),sources=sourceSignature(rows);
  const abhijitRows=rows.filter(row=>row.planning.hasAbhijit).length;
  const noWindowRows=rows.filter(row=>row.recommendedWindows.length===0).length;

  return {
    title:`${label} comparison identity · ${profile.position}`,
    positionBody:`${profile.story} ${profile.contrast} For ${rule.title}, the actual Mumbai-baseline result is a ${shape} with ${calendarCadence} and a ${grades}.`,
    sequenceTitle:`${label} retained-candidate chronology`,
    sequenceBody:monthSequenceBody(month,label,rows),
    facts:[
      {label:"Calendar position",value:profile.position,note:profile.contrast},
      {label:"Shortlist architecture",value:shape,note:calendarCadence},
      {label:"Candidate weekday path",value:weekdays,note:`Dominant weekday: ${dominant}`},
      {label:"Planning-grade path",value:grades,note:"Order follows the ranked retained rows"},
      {label:"Lunar reason signature",value:reasons,note:"Repeated reason labels across the retained candidates"},
      {label:"Timing-source signature",value:sources,note:"Favorable sources surviving local exclusions"},
      {label:"Abhijit participation",value:abhijitRows===0?"absent":abhijitRows===rows.length&&rows.length?"universal":"partial",note:`Retained on ${abhijitRows} of ${rows.length} candidates`},
      {label:"Window continuity state",value:noWindowRows===0?"all candidates retain a window":noWindowRows===rows.length&&rows.length?"no candidate retains a window":"mixed retained-window field",note:`${noWindowRows} rows without a retained favorable window`}
    ]
  };
}
