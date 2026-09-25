import type {VratDefinition,VratOccurrence} from "./vrat";

type Fact={label:string;value:string;note?:string};

export type VratYearContext={
  title:string;
  body:string;
  calendarTitle:string;
  calendarBody:string;
  cadenceTitle:string;
  cadenceBody:string;
  persistenceTitle:string;
  persistenceBody:string;
  observanceTitle:string;
  observanceBody:string;
  facts:Fact[];
};

const monthNames=["January","February","March","April","May","June","July","August","September","October","November","December"];
const quarterNames=["opening quarter","spring quarter","monsoon-side quarter","year-end quarter"];

function monthNumber(date:string){return Number(date.slice(5,7));}
function monthName(month:number){return monthNames[month-1]??String(month);}
function dateMs(value:string){return Date.parse(`${value}T06:00:00Z`);}
function weekday(date:string){return new Intl.DateTimeFormat("en-IN",{weekday:"long",timeZone:"Asia/Kolkata"}).format(new Date(`${date}T06:00:00Z`));}
function isLeap(year:number){return new Date(Date.UTC(year,1,29)).getUTCMonth()===1;}
function clockMinutes(value:string){const [h,m]=value.split(":").map(Number);return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:0;}
function durationFromSunrise(row:VratOccurrence){let end=clockMinutes(row.tithiEnd),start=clockMinutes(row.sunrise);if(row.tithiEndDate>row.date||end<start)end+=1440;return Math.max(0,end-start);}
function gapDays(a:string,b:string){return Math.round((dateMs(b)-dateMs(a))/86400000);}
function average(values:number[]){return values.length?Math.round(values.reduce((sum,value)=>sum+value,0)/values.length):0;}
function median(values:number[]){if(!values.length)return 0;const sorted=[...values].sort((a,b)=>a-b),mid=Math.floor(sorted.length/2);return sorted.length%2?sorted[mid]:Math.round((sorted[mid-1]+sorted[mid])/2);}

function countClass(value:number){if(value===0)return "empty";if(value===1)return "single";if(value===2)return "double";return "multi-state";}
function gapClass(value:number){if(value<=1)return "consecutive-sunrise";if(value<=13)return "compressed-lunar-gap";if(value<=16)return "fortnight-rhythm";if(value<=22)return "stretched-fortnight";if(value<=35)return "monthly-scale-gap";return "extended-gap";}
function persistenceClass(value:number){if(value<240)return "early-turnover";if(value<420)return "morning-persistence";if(value<600)return "midday-persistence";if(value<780)return "afternoon-persistence";if(value<960)return "evening-persistence";if(value<1200)return "late-evening-persistence";return "overnight-persistence";}
function cadenceShape(gaps:number[]){
  if(!gaps.length)return "single-observation cadence";
  const classes=[...new Set(gaps.map(gapClass))];
  if(classes.length===1)return `${classes[0]} cadence`;
  if(classes.length===2)return `${classes[0]} with ${classes[1]} cadence`;
  return `mixed ${classes.slice(0,3).join(" / ")} cadence`;
}
function weekdayShape(rows:readonly VratOccurrence[]){
  const counts=new Map<string,number>();for(const row of rows)counts.set(row.weekday,(counts.get(row.weekday)??0)+1);
  const sorted=[...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
  return {leader:sorted[0]?.[0]??"none",map:sorted.map(([day,count])=>`${day} ${countClass(count)}`).join(" · "),variety:sorted.length};
}
function monthShape(rows:readonly VratOccurrence[]){
  const counts=Array.from({length:12},()=>0);for(const row of rows){const month=monthNumber(row.date);if(month>=1&&month<=12)counts[month-1]++;}
  return {counts,arc:counts.map((count,index)=>`${monthNames[index]} ${countClass(count)}`).join(" · "),active:counts.filter(Boolean).length};
}
function quarterShape(rows:readonly VratOccurrence[]){
  const counts=[0,0,0,0];for(const row of rows){const month=monthNumber(row.date);if(month>=1&&month<=12)counts[Math.floor((month-1)/3)]++;}
  const labels=counts.map((count,index)=>`${quarterNames[index]} ${count===0?"quiet":count<=3?"light":count<=6?"steady":"dense"}`);
  return {counts,arc:labels.join(" · "),leader:quarterNames[counts.indexOf(Math.max(...counts))]??quarterNames[0]};
}
function persistenceArc(rows:readonly VratOccurrence[]){return rows.map(row=>`${monthName(monthNumber(row.date))} ${row.weekday} ${persistenceClass(durationFromSunrise(row))}`).join(" · ");}
function gapArc(rows:readonly VratOccurrence[]){return rows.slice(1).map((row,index)=>`${monthName(monthNumber(rows[index].date))}→${monthName(monthNumber(row.date))} ${gapClass(gapDays(rows[index].date,row.date))}`).join(" · ");}
function boundaryMonths(rows:readonly VratOccurrence[],kind:"repeat"|"next-day"){
  const values=rows.filter(row=>kind==="repeat"?row.repeatedAtSunrise:row.tithiEndDate>row.date).map(row=>monthName(monthNumber(row.date)));
  return values.length?[...new Set(values)].join(" · "):"none";
}
function pakshaArc(rows:readonly VratOccurrence[]){return rows.map(row=>`${monthName(monthNumber(row.date))} ${row.paksha}`).join(" · ");}

export function buildVratYearContext(vrat:VratDefinition,year:number,rows:readonly VratOccurrence[]):VratYearContext{
  const leap=isLeap(year),jan1=weekday(`${year}-01-01`),dec31=weekday(`${year}-12-31`);
  if(!rows.length){
    return {
      title:`${vrat.name} annual rhythm · empty sunrise set`,body:`The Mumbai reference returns no retained ${vrat.name} sunrise state for this ${leap?"leap":"common"} civil year. The year opens on ${jan1} and closes on ${dec31}; no month, weekday or persistence sequence is substituted from another year.`,
      calendarTitle:`Civil-year frame · ${leap?"leap":"common"} year`,calendarBody:`The calendar runs from a ${jan1} opening to a ${dec31} close, but the target Tithi never appears in the retained sunrise set.`,
      cadenceTitle:"No annual cadence",cadenceBody:"There are no adjacent retained rows, so no lunar-gap sequence can be measured.",
      persistenceTitle:"No persistence arc",persistenceBody:"No target Tithi survives into a retained sunrise checkpoint, leaving no post-sunrise duration profile.",
      observanceTitle:`${vrat.name} year identity`,observanceBody:"The empty result itself is the annual identity for this baseline calculation.",
      facts:[{label:"Civil frame",value:leap?"leap year":"common year",note:`${jan1} → ${dec31}`},{label:"Month footprint",value:"empty"},{label:"Weekday footprint",value:"empty"}]
    };
  }

  const months=monthShape(rows),quarters=quarterShape(rows),weekdays=weekdayShape(rows);
  const gaps=rows.slice(1).map((row,index)=>gapDays(rows[index].date,row.date)).filter(value=>value>0);
  const durations=rows.map(durationFromSunrise),avgDuration=average(durations),medianDuration=median(durations);
  const repeated=rows.filter(row=>row.repeatedAtSunrise),nextDay=rows.filter(row=>row.tithiEndDate>row.date);
  const first=rows[0],last=rows[rows.length-1],firstMonth=monthName(monthNumber(first.date)),lastMonth=monthName(monthNumber(last.date));
  const longestIndex=durations.indexOf(Math.max(...durations)),shortestIndex=durations.indexOf(Math.min(...durations));
  const longest=rows[longestIndex],shortest=rows[shortestIndex];
  const cadence=cadenceShape(gaps),persist=persistenceClass(avgDuration);
  const gapSequence=gapArc(rows),persistenceSequence=persistenceArc(rows),monthArc=months.arc,quarterArc=quarters.arc;
  const repeatMonths=boundaryMonths(rows,"repeat"),nextDayMonths=boundaryMonths(rows,"next-day");
  const pakshaSequence=pakshaArc(rows);

  const body=`${vrat.name} ${year} has its own annual sunrise rhythm on the Mumbai baseline. The retained sequence starts in ${firstMonth} on ${first.weekday} and closes in ${lastMonth} on ${last.weekday}. ${months.active} Gregorian months participate, ${quarters.leader} carries the strongest quarter-level concentration, and ${weekdays.leader} is the most frequent weekday label. The year therefore resolves to ${cadence} rather than a reusable year template.`;
  const calendarBody=`This is a ${leap?"leap-year":"common-year"} civil frame, opening on ${jan1} and ending on ${dec31}. Its month-state arc is ${monthArc}. Quarter structure is ${quarterArc}. Those named month and weekday states remain meaningful even when dates and numeric counts are ignored.`;
  const cadenceBody=`Adjacent sunrise observations form this gap arc: ${gapSequence}. The median gap is ${median(gaps)} days and the observed spacing class is ${cadence}. The weekday footprint is ${weekdays.map}; first and last retained weekdays are ${first.weekday} and ${last.weekday}.`;
  const persistenceBody=`Post-sunrise Tithi duration averages into ${persist}, with a median of ${medianDuration} minutes. The annual persistence arc is ${persistenceSequence}. The longest retained state falls in ${monthName(monthNumber(longest.date))} on ${longest.weekday}; the shortest falls in ${monthName(monthNumber(shortest.date))} on ${shortest.weekday}. Repeated-sunrise months: ${repeatMonths}. Next-date transition months: ${nextDayMonths}.`;
  const observanceBody=vrat.slug==="ekadashi"
    ? `Ekadashi adds a Paksha alternation layer that Purnima and Amavasya do not have. This year's retained Paksha arc is ${pakshaSequence}. ${repeated.length?`Second-sunrise Ekadashi persistence appears in ${repeatMonths}.`:"No Ekadashi row repeats at a second sunrise in this annual set."}`
    : vrat.slug==="purnima"
      ? `Purnima is a Shukla full-moon sunrise series, so its annual identity comes from month placement, weekday rotation and persistence rather than Paksha alternation. The full-moon persistence arc is ${persistenceSequence}; second-sunrise cases occur in ${repeatMonths}.`
      : `Amavasya is a Krishna new-moon sunrise series. Its annual identity is carried by the new-moon persistence arc ${persistenceSequence}, together with next-date transitions in ${nextDayMonths} and repeated-sunrise states in ${repeatMonths}.`;

  return {
    title:`${year} annual Vrat rhythm · ${cadence}`,
    body,
    calendarTitle:`Civil calendar identity · ${leap?"leap-year":"common-year"} frame`,
    calendarBody,
    cadenceTitle:`Month, quarter and weekday cadence`,
    cadenceBody,
    persistenceTitle:`Tithi persistence arc · ${persist}`,
    persistenceBody,
    observanceTitle:`${vrat.name}-specific annual identity`,
    observanceBody,
    facts:[
      {label:"Civil frame",value:leap?"leap year":"common year",note:`${jan1} → ${dec31}`},
      {label:"Annual endpoints",value:`${firstMonth} ${first.weekday} → ${lastMonth} ${last.weekday}`},
      {label:"Month arc",value:`${months.active} active months`,note:monthArc},
      {label:"Quarter leader",value:quarters.leader,note:quarterArc},
      {label:"Weekday leader",value:weekdays.leader,note:weekdays.map},
      {label:"Cadence class",value:cadence,note:gaps.length?`${Math.min(...gaps)}–${Math.max(...gaps)} day observed gap range`:"single row"},
      {label:"Persistence class",value:persist,note:`Average ${avgDuration} min · median ${medianDuration} min`},
      {label:"Boundary months",value:`repeat: ${repeatMonths}`,note:`next-date: ${nextDayMonths}`},
    ]
  };
}
