import type {City} from "./cities";
import type {VratDefinition,VratOccurrence,VratSlug} from "./vrat";

type Fact={label:string;value:string;note?:string};

export type VratQualityContent={
  directAnswer:string;
  facts:Fact[];
  fingerprintTitle:string;
  fingerprintBody:string;
  distributionTitle:string;
  distributionBody:string;
  transitionTitle:string;
  transitionBody:string;
  observanceTitle:string;
  observanceBody:string;
};

const monthNames=Array.from({length:12},(_,index)=>new Intl.DateTimeFormat("en-IN",{month:"long",timeZone:"Asia/Kolkata"}).format(new Date(Date.UTC(2026,index,1,6))));

function dateMs(value:string){return Date.parse(`${value}T06:00:00Z`);}
function monthNumber(value:string){return Number(value.slice(5,7));}
function monthName(value:number){return monthNames[value-1]??String(value);}
function clockMinutes(value:string){const [h,m]=value.split(":").map(Number);return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:0;}
function durationFromSunrise(row:VratOccurrence){
  let end=clockMinutes(row.tithiEnd);
  const start=clockMinutes(row.sunrise);
  if(row.tithiEndDate>row.date||end<start)end+=1440;
  return Math.max(0,end-start);
}
function dayGap(a:string,b:string){
  const left=dateMs(a),right=dateMs(b);
  if(!Number.isFinite(left)||!Number.isFinite(right))return 0;
  return Math.round((right-left)/86400000);
}
function weekdayLeader(rows:VratOccurrence[]){
  const counts=new Map<string,number>();
  for(const row of rows)counts.set(row.weekday,(counts.get(row.weekday)??0)+1);
  return [...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]??null;
}
function monthDistribution(rows:VratOccurrence[]){
  const counts=new Map<number,number>();
  for(const row of rows){const month=monthNumber(row.date);if(month>=1&&month<=12)counts.set(month,(counts.get(month)??0)+1);}
  return [...counts.entries()].sort((a,b)=>a[0]-b[0]);
}
function peakMonths(distribution:[number,number][]){
  const peak=Math.max(0,...distribution.map(([,count])=>count));
  return peak?distribution.filter(([,count])=>count===peak).map(([month])=>monthName(month)):[];
}
function observanceAngle(slug:VratSlug,rows:VratOccurrence[]){
  const repeated=rows.filter(row=>row.repeatedAtSunrise).length;
  if(slug==="ekadashi"){
    const shukla=rows.filter(row=>row.paksha==="Shukla").length;
    const krishna=rows.filter(row=>row.paksha==="Krishna").length;
    const balance=shukla===krishna?"The two Pakshas are evenly represented":shukla>krishna?"Shukla-paksha observations are more numerous":"Krishna-paksha observations are more numerous";
    const repeat=repeated?`${repeated} Ekadashi row${repeated===1?"":"s"} survive into a second local sunrise, creating the year's clearest boundary-sensitive cases.`:"Every Ekadashi row is confined to one retained sunrise checkpoint in this city dataset.";
    return `${balance}: ${shukla} Shukla and ${krishna} Krishna sunrise states. ${repeat}`;
  }
  if(slug==="purnima"){
    const repeat=repeated?`${repeated} full-moon Tithi state${repeated===1?"":"s"} remain active at two consecutive local sunrises.`:"No full-moon state repeats at the next local sunrise.";
    return `This series tracks only Shukla-paksha Purnima at the sunrise checkpoint. ${repeat} The useful yearly signal is therefore persistence of the full-moon Tithi around sunrise rather than a Shukla/Krishna split.`;
  }
  const repeat=repeated?`${repeated} new-moon Tithi state${repeated===1?"":"s"} continue through a second sunrise.`:"Each retained new-moon state appears at one local sunrise only.";
  return `This series is a Krishna-paksha Amavasya sequence. ${repeat} Its strongest differentiator is how long Amavasya remains active after sunrise and where those sunrise checkpoints fall through the year.`;
}

function coverageVoice(months:number,total:number){
  if(months<=4)return {label:"clustered",body:`The ${total} retained rows are concentrated into only ${months} Gregorian months, so the year has long stretches with no sunrise match.`};
  if(months<=8)return {label:"intermittent",body:`The sequence is intermittent across ${months} Gregorian months: several months contribute rows, but the pattern is not a near-monthly cadence.`};
  return {label:"broad",body:`The sequence is broadly distributed across ${months} Gregorian months, giving the year a near-continuous month-to-month presence rather than a narrow seasonal cluster.`};
}
function repeatVoice(repeated:number,total:number){
  if(!repeated)return `All ${total} retained entries are single-sunrise states; none carries the same target Tithi into the next local sunrise.`;
  if(repeated===1)return `One row is a double-sunrise boundary case, making that date the most sensitive point in the local annual sequence.`;
  return `${repeated} rows are double-sunrise boundary cases, so persistence across sunrise is a recurring feature rather than an isolated anomaly.`;
}
function durationVoice(avg:number,longest:number,shortest:number){
  const spread=Math.max(0,longest-shortest);
  if(avg>=900)return `Post-sunrise persistence is long on average at ${avg} minutes, with a ${spread}-minute spread between the longest and shortest retained states.`;
  if(avg>=540)return `The target Tithi usually remains active well into the day after sunrise: average persistence is ${avg} minutes and the longest-shortest spread is ${spread} minutes.`;
  if(avg>=300)return `The yearly set has a mid-length post-sunrise profile, averaging ${avg} minutes before the target Tithi ends; the duration spread is ${spread} minutes.`;
  return `Turnover after sunrise is comparatively quick, averaging ${avg} minutes, with only ${spread} minutes separating the longest and shortest retained spans.`;
}
function cadenceVoice(gaps:{from:string;to:string;days:number}[]){
  const valid=gaps.filter(item=>item.days>0);
  if(!valid.length)return "There is no multi-row cadence to compare.";
  const min=Math.min(...valid.map(item=>item.days)),max=Math.max(...valid.map(item=>item.days));
  const spread=max-min;
  if(spread<=2)return `Spacing is unusually steady: adjacent observations range only from ${min} to ${max} days apart.`;
  if(spread<=8)return `Spacing is fairly regular, with adjacent gaps ranging from ${min} to ${max} days.`;
  return `Spacing is uneven across the year: the shortest gap is ${min} days while the longest reaches ${max} days, a ${spread}-day cadence spread.`;
}
function pakshaVoice(shukla:number,krishna:number){
  if(shukla===krishna)return "The retained sunrise states are perfectly balanced between Shukla and Krishna Paksha.";
  const delta=Math.abs(shukla-krishna);
  return shukla>krishna?`Shukla Paksha leads the yearly count by ${delta} observation${delta===1?"":"s"}.`:`Krishna Paksha leads the yearly count by ${delta} observation${delta===1?"":"s"}.`;
}

export function buildVratQualityContent(vrat:VratDefinition,year:number,city:City,rows:VratOccurrence[],scope:"city"|"baseline"="city"):VratQualityContent{
  const location=scope==="baseline"?`${city.name} baseline`:city.name;
  if(!rows.length){
    return {
      directAnswer:`No ${vrat.name} sunrise observation is present for ${year} in the ${location} calculation.`,
      facts:[{label:"Sunrise observations",value:"0",note:String(year)}],
      fingerprintTitle:`${vrat.name} ${year} fingerprint`,
      fingerprintBody:`The empty result is the defining annual pattern here: none of the local sunrise checkpoints carries the target ${vrat.name} Tithi state.`,
      distributionTitle:"Yearly distribution",
      distributionBody:"There is no month concentration, weekday leader or spacing pattern because the retained sequence contains no row.",
      transitionTitle:"Transition pattern",
      transitionBody:"No target Tithi boundary enters the yearly retained set, so there is no post-sunrise duration profile to compare.",
      observanceTitle:`How this ${vrat.name} dataset is structured`,
      observanceBody:`The local dataset remains empty rather than borrowing dates from a different city's sunrise sequence.`
    };
  }

  const repeatedRows=rows.filter(row=>row.repeatedAtSunrise);
  const shukla=rows.filter(row=>row.paksha==="Shukla").length;
  const krishna=rows.filter(row=>row.paksha==="Krishna").length;
  const distribution=monthDistribution(rows);
  const peaks=peakMonths(distribution);
  const weekday=weekdayLeader(rows);
  const durations=rows.map(row=>({row,minutes:durationFromSunrise(row)})).sort((a,b)=>b.minutes-a.minutes||a.row.date.localeCompare(b.row.date));
  const longest=durations[0];
  const shortest=durations[durations.length-1];
  const gaps=rows.slice(1).map((row,index)=>({from:rows[index].date,to:row.date,days:dayGap(rows[index].date,row.date)}));
  const validGaps=gaps.filter(item=>item.days>0);
  const widestGap=[...validGaps].sort((a,b)=>b.days-a.days)[0]??null;
  const tightestGap=[...validGaps].sort((a,b)=>a.days-b.days)[0]??null;
  const nextDayEnds=rows.filter(row=>row.tithiEndDate>row.date).length;
  const avgDuration=Math.round(durations.reduce((sum,item)=>sum+item.minutes,0)/durations.length);
  const monthsCovered=distribution.length;
  const maxMonthly=Math.max(0,...distribution.map(([,count])=>count));
  const coverage=coverageVoice(monthsCovered,rows.length);
  const repeatPattern=repeatVoice(repeatedRows.length,rows.length);
  const durationPattern=durationVoice(avgDuration,longest.minutes,shortest.minutes);
  const cadencePattern=cadenceVoice(gaps);
  const pakshaPattern=pakshaVoice(shukla,krishna);
  const monthMap=distribution.map(([month,count])=>`${monthName(month)} ${count}`).join(" · ");

  return {
    directAnswer:`${vrat.name} ${year} in ${location} contains ${rows.length} local-sunrise observation${rows.length===1?"":"s"} from ${rows[0].date} to ${rows[rows.length-1].date}. The annual pattern is ${coverage.label}, with ${repeatedRows.length} repeated sunrise state${repeatedRows.length===1?"":"s"}.`,
    facts:[
      {label:"Observed months",value:String(monthsCovered),note:`of 12 in ${year}`},
      {label:"Shukla / Krishna",value:`${shukla} / ${krishna}`,note:"Sunrise rows by Paksha"},
      {label:"Repeated sunrise states",value:String(repeatedRows.length),note:repeatedRows[0]?.date??"No repeat"},
      {label:"Average Tithi time after sunrise",value:`${avgDuration} min`,note:"Across retained rows"},
      {label:"Longest post-sunrise span",value:`${longest.minutes} min`,note:longest.row.date},
      {label:"Next-day Tithi endings",value:String(nextDayEnds),note:"Transition occurs after civil midnight"},
    ],
    fingerprintTitle:`${city.name} ${vrat.name} ${year} fingerprint`,
    fingerprintBody:`${coverage.body} ${durationPattern} ${weekday?`${weekday[0]} is the weekday leader with ${weekday[1]} retained sunrise observation${weekday[1]===1?"":"s"}.`:""}`,
    distributionTitle:`${coverage.label[0].toUpperCase()+coverage.label.slice(1)} ${vrat.name} distribution through ${year}`,
    distributionBody:`Month map: ${monthMap||"no valid month rows"}. ${peaks.length?`${peaks.join(" / ")} ${peaks.length===1?"is":"are"} the densest month${peaks.length===1?"":"s"} at ${maxMonthly} observation${maxMonthly===1?"":"s"}.`:""} ${cadencePattern} ${pakshaPattern}`,
    transitionTitle:`Tithi persistence after ${city.name} sunrise`,
    transitionBody:`${repeatPattern} ${nextDayEnds?`${nextDayEnds} retained transition${nextDayEnds===1?"":"s"} end after midnight on the following civil date.`:"Every retained Tithi ends before the following civil date."} ${widestGap&&tightestGap?`For cadence context, ${tightestGap.from} → ${tightestGap.to} is the tightest valid interval and ${widestGap.from} → ${widestGap.to} the widest.`:""}`,
    observanceTitle:`${vrat.name}-specific annual signature`,
    observanceBody:`${observanceAngle(vrat.slug,rows)} ${durationPattern}`,
  };
}
