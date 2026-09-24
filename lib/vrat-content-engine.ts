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
function dayGap(a:string,b:string){return Math.round((dateMs(b)-dateMs(a))/86400000);}
function weekdayLeader(rows:VratOccurrence[]){
  const counts=new Map<string,number>();
  for(const row of rows)counts.set(row.weekday,(counts.get(row.weekday)??0)+1);
  return [...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]??null;
}
function monthDistribution(rows:VratOccurrence[]){
  const counts=new Map<number,number>();
  for(const row of rows){const month=monthNumber(row.date);counts.set(month,(counts.get(month)??0)+1);}
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
    return `This Ekadashi calendar contains both lunar halves: ${shukla} Shukla-paksha and ${krishna} Krishna-paksha sunrise observations. ${repeated?`${repeated} row${repeated===1?"":"s"} repeat across consecutive sunrises, making those transitions the most location-sensitive entries in the year.`:"No Ekadashi repeats across consecutive local sunrises in this calculation."}`;
  }
  if(slug==="purnima"){
    return `Every retained row is a Shukla-paksha Purnima state at local sunrise. ${repeated?`${repeated} Purnima state${repeated===1?"":"s"} persists across two consecutive sunrises.`:"Each retained Purnima appears at a single local sunrise in this yearly sequence."}`;
  }
  return `Every retained row is a Krishna-paksha Amavasya state at local sunrise. ${repeated?`${repeated} Amavasya state${repeated===1?"":"s"} persists across two consecutive sunrises.`:"Each retained Amavasya appears at a single local sunrise in this yearly sequence."}`;
}

export function buildVratQualityContent(vrat:VratDefinition,year:number,city:City,rows:VratOccurrence[],scope:"city"|"baseline"="city"):VratQualityContent{
  const location=scope==="baseline"?`${city.name} baseline`:city.name;
  if(!rows.length){
    return {
      directAnswer:`No ${vrat.name} sunrise observation is present for ${year} in the ${location} calculation.`,
      facts:[{label:"Sunrise observations",value:"0",note:String(year)}],
      fingerprintTitle:`${vrat.name} ${year} fingerprint`,
      fingerprintBody:`The empty result is itself the yearly fingerprint for this calculation: no local sunrise carries the target ${vrat.name} Tithi state.`,
      distributionTitle:"Yearly distribution",
      distributionBody:"There are no retained months or weekday concentrations because the yearly sequence has no matching sunrise row.",
      transitionTitle:"Transition pattern",
      transitionBody:"No target Tithi transition is represented in the retained yearly list.",
      observanceTitle:`How this ${vrat.name} dataset is structured`,
      observanceBody:`The page remains empty rather than inserting generic national dates into a location-specific sunrise dataset.`
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
  const widestGap=[...gaps].sort((a,b)=>b.days-a.days)[0]??null;
  const tightestGap=[...gaps].sort((a,b)=>a.days-b.days)[0]??null;
  const nextDayEnds=rows.filter(row=>row.tithiEndDate>row.date).length;
  const avgDuration=Math.round(durations.reduce((sum,item)=>sum+item.minutes,0)/durations.length);
  const monthsCovered=distribution.length;
  const peakText=peaks.length?`${peaks.join(" / ")} has the highest monthly concentration at ${Math.max(...distribution.map(([,count])=>count))} observation${Math.max(...distribution.map(([,count])=>count))===1?"":"s"}.`:"";

  return {
    directAnswer:`${vrat.name} ${year} in ${location} contains ${rows.length} local-sunrise observation${rows.length===1?"":"s"}, running from ${rows[0].date} to ${rows[rows.length-1].date}; ${repeatedRows.length} repeat across consecutive sunrises.`,
    facts:[
      {label:"Observed months",value:String(monthsCovered),note:`of 12 in ${year}`},
      {label:"Shukla / Krishna",value:`${shukla} / ${krishna}`,note:"Sunrise rows by Paksha"},
      {label:"Repeated sunrise states",value:String(repeatedRows.length),note:repeatedRows[0]?.date??"No repeat"},
      {label:"Average Tithi time after sunrise",value:`${avgDuration} min`,note:"Across retained rows"},
      {label:"Longest post-sunrise span",value:`${longest.minutes} min`,note:longest.row.date},
      {label:"Next-day Tithi endings",value:String(nextDayEnds),note:"Transition occurs after civil midnight"},
    ],
    fingerprintTitle:`${city.name} ${vrat.name} ${year} fingerprint`,
    fingerprintBody:`The yearly sequence spans ${monthsCovered} Gregorian months. ${peakText} ${weekday?`${weekday[0]} is the most common weekday with ${weekday[1]} observation${weekday[1]===1?"":"s"}.`:""} The longest retained ${vrat.name} state after sunrise occurs on ${longest.row.date} for about ${longest.minutes} minutes; the shortest is ${shortest.row.date} at about ${shortest.minutes} minutes.`,
    distributionTitle:`How ${vrat.name} is distributed through ${year}`,
    distributionBody:`Month counts are ${distribution.map(([month,count])=>`${monthName(month)} ${count}`).join(" · ")}. ${widestGap?`The widest gap between retained observations is ${widestGap.days} days (${widestGap.from} → ${widestGap.to}).`:""} ${tightestGap?`The tightest non-identical gap is ${tightestGap.days} days (${tightestGap.from} → ${tightestGap.to}).`:""}`,
    transitionTitle:`Sunrise and Tithi-end pattern in ${city.name}`,
    transitionBody:`Across the retained rows, the target Tithi remains active for an average of about ${avgDuration} minutes after local sunrise. ${nextDayEnds} transition${nextDayEnds===1?"":"s"} end on the following civil date. ${repeatedRows.length?`The repeated sunrise rows are ${repeatedRows.map(row=>row.date).join(", ")}, where the same Tithi state survives into another local sunrise.`:"No retained row repeats the same Tithi across consecutive local sunrises."}`,
    observanceTitle:`${vrat.name}-specific yearly pattern`,
    observanceBody:observanceAngle(vrat.slug,rows),
  };
}
