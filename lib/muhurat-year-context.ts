import type {MuhuratRow} from "./muhurat";
import type {YearlyMuhuratMonth,YearlyMuhuratSummary} from "./yearly-expansion";

type Fact={label:string;value:string;note?:string};

export type MuhuratYearContext={
  title:string;
  body:string;
  calendarTitle:string;
  calendarBody:string;
  densityTitle:string;
  densityBody:string;
  timingTitle:string;
  timingBody:string;
  rankingTitle:string;
  rankingBody:string;
  facts:Fact[];
};

function weekday(date:string){return new Intl.DateTimeFormat("en-IN",{weekday:"long",timeZone:"Asia/Kolkata"}).format(new Date(`${date}T06:00:00Z`));}
function isLeap(year:number){return new Date(Date.UTC(year,1,29)).getUTCMonth()===1;}
function monthDensity(value:number){
  if(value===0)return "empty";
  if(value===1)return "single";
  if(value<=3)return "light";
  if(value<=6)return "moderate";
  return "dense";
}
function quarterName(index:number){return ["opening quarter","spring-to-summer quarter","monsoon-side quarter","year-end quarter"][index]??`quarter ${index+1}`;}
function scoreClass(score:number){
  if(score>=85)return "excellent-heavy";
  if(score>=75)return "strong-score";
  if(score>=65)return "balanced-score";
  if(score>0)return "limited-score";
  return "no-score";
}
function continuityClass(minutes:number){
  if(minutes>=150)return "very-long continuity";
  if(minutes>=105)return "long continuity";
  if(minutes>=75)return "balanced continuity";
  if(minutes>=45)return "compact continuity";
  if(minutes>0)return "short continuity";
  return "no retained continuity";
}
function firstWindow(row:MuhuratRow){return row.recommendedWindows[0]??null;}
function clockMinutes(value:string){const [h,m]=value.split(":").map(Number);return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:0;}
function clockBand(value:string|null){
  if(!value)return "no retained start";
  const m=clockMinutes(value);
  if(m<540)return "early morning";
  if(m<660)return "late morning";
  if(m<780)return "midday";
  if(m<900)return "early afternoon";
  return "late afternoon";
}
function sourceLeader(rows:readonly MuhuratRow[]){
  const counts=new Map<string,number>();
  for(const row of rows)for(const window of row.recommendedWindows)for(const source of window.sources)counts.set(source,(counts.get(source)??0)+1);
  return [...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]??null;
}
function reasonLeader(rows:readonly MuhuratRow[]){
  const counts=new Map<string,number>();
  for(const row of rows){const key=row.reasons.join(" + ");counts.set(key,(counts.get(key)??0)+1);}
  return [...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]??null;
}
function weekdayLeader(rows:readonly MuhuratRow[]){
  const counts=new Map<string,number>();
  for(const row of rows){const key=weekday(row.date);counts.set(key,(counts.get(key)??0)+1);}
  return [...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]??null;
}
function average(values:number[]){return values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):0;}
function median(values:number[]){if(!values.length)return 0;const s=[...values].sort((a,b)=>a-b);const i=Math.floor(s.length/2);return s.length%2?s[i]:Math.round((s[i-1]+s[i])/2);}
function longestEmptyRun(months:readonly YearlyMuhuratMonth[]){
  let best:{start:number;end:number;length:number}|null=null;
  let start=-1;
  for(let i=0;i<=months.length;i++){
    const empty=i<months.length&&months[i].qualified===0;
    if(empty&&start<0)start=i;
    if((!empty||i===months.length)&&start>=0){
      const end=i-1,length=end-start+1;
      if(!best||length>best.length)best={start,end,length};
      start=-1;
    }
  }
  return best;
}
function quarterPattern(months:readonly YearlyMuhuratMonth[]){
  return [0,1,2,3].map(q=>{
    const slice=months.slice(q*3,q*3+3);
    const total=slice.reduce((sum,m)=>sum+m.qualified,0);
    const active=slice.filter(m=>m.qualified>0).length;
    const avg=active?Math.round(slice.filter(m=>m.qualified>0).reduce((sum,m)=>sum+m.averageScore,0)/active):0;
    return {name:quarterName(q),total,active,score:avg,density:monthDensity(total)};
  });
}
function monthArc(months:readonly YearlyMuhuratMonth[]){return months.map(m=>`${m.name} ${monthDensity(m.qualified)} ${scoreClass(m.averageScore)}`).join(" · ");}
function topMonths(months:readonly YearlyMuhuratMonth[]){return [...months].filter(m=>m.qualified>0).sort((a,b)=>b.qualified-a.qualified||b.averageScore-a.averageScore||a.month-b.month);}

export function buildMuhuratYearContext(summary:YearlyMuhuratSummary):MuhuratYearContext{
  const {year,title,months,rows}=summary;
  const leap=isLeap(year);
  const jan1=weekday(`${year}-01-01`),dec31=weekday(`${year}-12-31`);
  const active=months.filter(m=>m.qualified>0),empty=months.filter(m=>m.qualified===0);
  const first=active[0]??null,last=active[active.length-1]??null;
  const emptyRun=longestEmptyRun(months);
  const quarters=quarterPattern(months);
  const strongestQuarter=[...quarters].sort((a,b)=>b.total-a.total||b.score-a.score)[0];
  const weakestQuarter=[...quarters].sort((a,b)=>a.total-b.total||a.score-b.score)[0];
  const monthLeaders=topMonths(months);
  const densest=monthLeaders[0]??null,runnerMonth=monthLeaders[1]??null;
  const weekdayTop=weekdayLeader(rows),reasonTop=reasonLeader(rows),sourceTop=sourceLeader(rows);
  const avgLongest=average(rows.map(r=>r.planning.longestWindowMinutes));
  const medianClean=median(rows.map(r=>r.planning.totalCleanMinutes));
  const scoreSpread=rows.length?Math.max(...rows.map(r=>r.planning.score))-Math.min(...rows.map(r=>r.planning.score)):0;
  const sourceKinds=new Set(rows.flatMap(r=>r.recommendedWindows.flatMap(w=>w.sources))).size;
  const firstStarts=rows.map(r=>firstWindow(r)?.start).filter((v):v is string=>Boolean(v));
  const avgStart=firstStarts.length?Math.round(firstStarts.reduce((s,v)=>s+clockMinutes(v),0)/firstStarts.length):null;
  const avgStartBand=avgStart===null?"no retained start":clockBand(`${String(Math.floor(avgStart/60)).padStart(2,"0")}:${String(avgStart%60).padStart(2,"0")}`);
  const yearFrame=leap?"leap-year frame":"common-year frame";
  const activityShape=active.length>=10?"near-continuous annual availability":active.length>=7?"broad annual availability":active.length>=4?"intermittent annual availability":"concentrated annual availability";
  const continuity=continuityClass(avgLongest);
  const monthlyArc=monthArc(months);
  const quarterArc=quarters.map(q=>`${q.name}: ${q.density} ${scoreClass(q.score)}`).join(" · ");
  const emptyRunText=emptyRun&&emptyRun.length>0?`${months[emptyRun.start].name}${emptyRun.end>emptyRun.start?` through ${months[emptyRun.end].name}`:""}`:"none";
  const gradeShape=`Excellent ${summary.excellentCount} · Strong ${summary.strongCount} · Other ${Math.max(0,summary.totalQualified-summary.excellentCount-summary.strongCount)}`;

  const body=active.length===0
    ? `${title} ${year} is an empty annual screen on the Mumbai baseline. The ${yearFrame} begins on ${jan1} and ends on ${dec31}; every month remains empty under the configured Tithi + Nakshatra gate, so no timing-rank narrative is manufactured.`
    : active.length<=3
      ? `${title} ${year} is highly concentrated rather than year-round. Only ${active.map(m=>m.name).join(", ")} contain screened candidates. The ${yearFrame} opens on ${jan1}; ${densest?.name??"no month"} carries the densest part of the shortlist and the longest empty stretch is ${emptyRunText}.`
      : active.length<=6
        ? `${title} ${year} forms an intermittent annual arc. Candidate months begin with ${first?.name} and finish with ${last?.name}; the calendar itself is a ${yearFrame} running ${jan1} to ${dec31}. The strongest concentration sits in ${densest?.name??"no month"}, while ${emptyRunText} is the longest no-candidate run.`
        : active.length<=9
          ? `${title} ${year} has broad but incomplete availability across the Mumbai baseline. ${first?.name} is the first active month and ${last?.name} the last; ${strongestQuarter.name} is the busiest seasonal block, while ${weakestQuarter.name} is the lightest. The civil year runs from a ${jan1} opening to a ${dec31} close.`
          : `${title} ${year} is close to continuous annual availability: ${active.length} months contain candidates. The ${yearFrame} starts on ${jan1}, closes on ${dec31}, and still shows a distinct density leader in ${densest?.name??"the strongest month"} rather than a flat repeated-month pattern.`;

  const calendarBody=leap
    ? `This leap-year structure adds an extra February civil day, but the Muhurat shortlist is still determined by the lunar screen. The month-state arc is: ${monthlyArc}. Quarter structure: ${quarterArc}.`
    : `This is a common civil year, so February keeps its regular length. The yearly Muhurat identity comes from the actual month-state arc rather than the year number: ${monthlyArc}. Quarter structure: ${quarterArc}.`;

  const densityBody=densest
    ? runnerMonth
      ? `${densest.name} leads annual candidate density, with ${runnerMonth.name} as the next-deepest fallback month. ${strongestQuarter.name} carries the strongest quarter-level concentration, whereas ${weakestQuarter.name} is the thinnest. ${empty.length?`Empty months are ${empty.map(m=>m.name).join(", ")}.`:"No month is empty."}`
      : `${densest.name} is the only active month with meaningful candidate density. All remaining months are empty, producing a sharply concentrated annual pattern rather than a distributed shortlist.`
    : `There is no active-month density layer because the yearly lunar screen returns zero rows.`;

  const timingBody=rows.length
    ? `Across all annual candidates, the average longest clean block falls into ${continuity}; median total clean supply is ${medianClean} minutes. First retained windows average into the ${avgStartBand} band. ${sourceTop?`${sourceTop[0]} is the most frequent retained timing source.`:"No timing source survives."} The year uses ${sourceKinds} distinct favorable source labels and spans ${scoreSpread} score points.`
    : `No row reaches the local timing stage, so there is no continuity, source-diversity or first-window distribution to summarize for this year.`;

  const rankingBody=rows.length
    ? `${weekdayTop?`${weekdayTop[0]} is the most common weekday among screened dates.`:""} ${reasonTop?`${reasonTop[0]} is the most repeated lunar-match combination.`:""} The annual grade mix is ${gradeShape}. ${summary.topRows[0]?`The #1 row is ${summary.topRows[0].date} at ${summary.topRows[0].planning.score}/100; ${summary.topRows[1]?`${summary.topRows[1].date} provides the next fallback.`:"there is no second ranked row."}`:""}`
    : `There is no annual ranking because no date survives the configured screen.`;

  return {
    title:`${year} annual Muhurat identity · ${activityShape}`,
    body,
    calendarTitle:`Civil-calendar frame · ${yearFrame}`,
    calendarBody,
    densityTitle:`Month and quarter density pattern`,
    densityBody,
    timingTitle:`Annual clean-time signature · ${continuity}`,
    timingBody,
    rankingTitle:`Weekday, lunar-match and ranking signature`,
    rankingBody,
    facts:[
      {label:"Civil frame",value:yearFrame,note:`${jan1} → ${dec31}`},
      {label:"Availability shape",value:activityShape,note:`${active.length} active · ${empty.length} empty months`},
      {label:"Strongest quarter",value:strongestQuarter.name,note:`${strongestQuarter.density} · ${scoreClass(strongestQuarter.score)}`},
      {label:"Longest empty run",value:emptyRunText,note:emptyRun?`${emptyRun.length} month(s)`:"No empty run"},
      {label:"Continuity class",value:continuity,note:`Avg longest block ${avgLongest} min`},
      {label:"First-window band",value:avgStartBand,note:`${sourceKinds} distinct timing sources`},
      {label:"Weekday leader",value:weekdayTop?.[0]??"none",note:weekdayTop?`${weekdayTop[1]} candidate(s)`:"No candidates"},
      {label:"Lunar-match leader",value:reasonTop?.[0]??"none",note:reasonTop?`${reasonTop[1]} row(s)`:"No candidates"},
    ]
  };
}
