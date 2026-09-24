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
    const balance=shukla===krishna?"The Ekadashi calendar is evenly split between the two Pakshas":shukla>krishna?"The Ekadashi calendar leans toward Shukla-paksha sunrise states":"The Ekadashi calendar leans toward Krishna-paksha sunrise states";
    const repeat=repeated?`${repeated} Ekadashi row${repeated===1?"":"s"} survive into a second local sunrise, creating the year's clearest boundary-sensitive cases.`:"Every Ekadashi row is confined to one retained sunrise checkpoint in this city dataset.";
    return `${balance}: ${shukla} Shukla and ${krishna} Krishna observations. ${repeat}`;
  }
  if(slug==="purnima"){
    const repeat=repeated?`${repeated} Purnima state${repeated===1?"":"s"} remain active at two consecutive local sunrises.`:"No Purnima state repeats at the next local sunrise.";
    return `This Purnima series tracks only the Shukla-paksha full-moon state at the sunrise checkpoint. ${repeat} Its useful yearly signal is persistence of the full-moon Tithi around sunrise rather than a Paksha balance.`;
  }
  const repeat=repeated?`${repeated} Amavasya state${repeated===1?"":"s"} continue through a second sunrise.`:"Each retained Amavasya state appears at one local sunrise only.";
  return `This Amavasya series follows the Krishna-paksha new-moon state. ${repeat} Its strongest differentiator is how long the new-moon Tithi remains active after sunrise and where those checkpoints fall through the year.`;
}

type CoverageProfile={key:string;label:string;direct:(vrat:string,year:number,location:string,rows:VratOccurrence[])=>string;body:string};
function coverageProfile(months:number,total:number):CoverageProfile{
  if(months<=3)return {
    key:"compact-cluster",label:"compact cluster",
    direct:(vrat,year,location,rows)=>`${location} has a compact ${vrat} cluster in ${year}: ${total} sunrise observations are concentrated between ${rows[0].date} and ${rows[rows.length-1].date} across only ${months} Gregorian months.`,
    body:`The calendar is tightly clustered rather than year-round. Only ${months} Gregorian months contribute the ${total} retained sunrise states, leaving long stretches of the year without a matching checkpoint.`
  };
  if(months===4)return {
    key:"four-month-arc",label:"four-month arc",
    direct:(vrat,year,location,rows)=>`${vrat} ${year} forms a four-month arc in ${location}: ${total} local-sunrise rows run from ${rows[0].date} through ${rows[rows.length-1].date}, with activity in exactly four Gregorian months.`,
    body:`Four separate months contribute to the sequence. That produces a partial-year arc: broader than a short cluster, but still far from a monthly rhythm across the full calendar.`
  };
  if(months===5)return {
    key:"five-month-chain",label:"five-month chain",
    direct:(vrat,year,location,rows)=>`The ${year} ${vrat} pattern in ${location} is a five-month chain of ${total} sunrise observations. It starts on ${rows[0].date}, ends on ${rows[rows.length-1].date}, and leaves seven Gregorian months without a retained row.`,
    body:`Five months carry the retained states, creating a mid-year chain rather than a compact burst or broad annual spread. The missing seven months are part of this location's actual sunrise sequence.`
  };
  if(months===6)return {
    key:"half-year-spread",label:"half-year spread",
    direct:(vrat,year,location,rows)=>`${location}'s ${vrat} list covers half of the Gregorian months in ${year}: ${total} sunrise rows occupy six months from ${rows[0].date} to ${rows[rows.length-1].date}.`,
    body:`The distribution reaches six months, so the yearly signature is genuinely half-year in coverage. It is neither a seasonal cluster nor a near-monthly sequence.`
  };
  if(months<=8)return {
    key:"extended-spread",label:"extended-year spread",
    direct:(vrat,year,location,rows)=>`${total} ${vrat} sunrise observations give ${location} an extended ${year} spread, reaching ${months} Gregorian months between ${rows[0].date} and ${rows[rows.length-1].date}.`,
    body:`The retained sequence extends across ${months} months and therefore occupies most of the year's main seasonal phases, while still leaving clear months with no target Tithi at sunrise.`
  };
  if(months<12)return {
    key:"broad-annual",label:"broad annual spread",
    direct:(vrat,year,location,rows)=>`${vrat} is broadly distributed through ${year} in ${location}: ${total} sunrise states appear in ${months} of 12 Gregorian months, from ${rows[0].date} to ${rows[rows.length-1].date}.`,
    body:`Coverage reaches ${months} months, so gaps are exceptions rather than the dominant pattern. The annual sequence behaves much more like a recurring monthly signal than a seasonal cluster.`
  };
  return {
    key:"full-year",label:"full-year coverage",
    direct:(vrat,year,location,rows)=>`Every Gregorian month contributes to ${location}'s ${vrat} ${year} sunrise sequence. The ${total} retained rows extend from ${rows[0].date} through ${rows[rows.length-1].date}.`,
    body:`All 12 months contain at least one matching sunrise state, which makes this a continuous annual distribution rather than a partial-year pattern.`
  };
}

type DurationProfile={key:string;headline:string;body:(avg:number,longest:number,shortest:number)=>string};
function durationProfile(avg:number):DurationProfile{
  if(avg<300)return {key:"quick-turnover",headline:"quick post-sunrise turnover",body:(a,l,s)=>`The target Tithi turns over comparatively soon after sunrise: average persistence is ${a} minutes, with retained spans ranging from ${s} to ${l} minutes.`};
  if(avg<480)return {key:"late-morning",headline:"late-morning persistence",body:(a,l,s)=>`Most retained states extend well beyond sunrise but do not dominate the whole day. Mean persistence is ${a} minutes; the shortest row lasts ${s} minutes after sunrise and the longest ${l}.`};
  if(avg<660)return {key:"midday",headline:"midday persistence",body:(a,l,s)=>`The typical retained Tithi survives into the middle of the local day. Its average post-sunrise life is ${a} minutes, bounded by ${s} minutes at the short end and ${l} at the long end.`};
  if(avg<840)return {key:"afternoon",headline:"afternoon persistence",body:(a,l,s)=>`Afternoon persistence defines this set: the target Tithi remains active an average ${a} minutes after sunrise. Individual retained spans run from ${s} to ${l} minutes.`};
  if(avg<1020)return {key:"evening",headline:"evening-weighted persistence",body:(a,l,s)=>`These rows are evening-weighted rather than early-turnover states. The average duration after sunrise is ${a} minutes, with a ${l-s}-minute gap between the ${s}-minute shortest and ${l}-minute longest cases.`};
  return {key:"late-night",headline:"late-night persistence",body:(a,l,s)=>`The target Tithi commonly survives deep into the local day or night. Average post-sunrise persistence reaches ${a} minutes; even the shortest retained span is ${s} minutes, while the longest reaches ${l}.`};
}

type BoundaryProfile={key:string;body:(vrat:string,repeated:VratOccurrence[],nextDayEnds:number,total:number)=>string};
function boundaryProfile(repeated:number,nextDayEnds:number):BoundaryProfile{
  if(repeated&&nextDayEnds)return {key:"double-boundary",body:(vrat,rows,midnight)=>`This is a double-boundary year for ${vrat}: ${rows.length} row${rows.length===1?"":"s"} repeat at consecutive sunrises and ${midnight} retained transition${midnight===1?"":"s"} finish on the following civil date. Sunrise persistence and midnight crossing both shape the list.`};
  if(repeated)return {key:"sunrise-persistence",body:(vrat,rows)=>`Sunrise persistence is the defining boundary signal for ${vrat}. ${rows.length} retained row${rows.length===1?"":"s"} carry the same target Tithi into a second local sunrise, while none of the listed endings requires a following-date label.`};
  if(nextDayEnds)return {key:"midnight-crossing",body:(vrat,_rows,midnight)=>`Midnight crossing matters more than repeated sunrise states in this ${vrat} sequence. No row repeats at a second sunrise, but ${midnight} Tithi ending${midnight===1?"":"s"} land on the following civil date.`};
  return {key:"single-day",body:(vrat,_rows,_midnight,total)=>`The ${vrat} sequence has a clean single-day boundary profile: all ${total} retained rows occur at one sunrise checkpoint and their listed Tithi endings stay on the same civil date.`};
}

function cadenceBody(gaps:{from:string;to:string;days:number}[]){
  const valid=gaps.filter(item=>item.days>0);
  if(!valid.length)return {key:"single",text:"There is no multi-row cadence to measure."};
  const min=Math.min(...valid.map(item=>item.days)),max=Math.max(...valid.map(item=>item.days));
  const spread=max-min;
  if(spread<=2)return {key:"clockwork",text:`Adjacent observations are close to a clockwork cadence: valid gaps stay between ${min} and ${max} days.`};
  if(spread<=8)return {key:"regular",text:`The cadence is fairly regular, with neighboring observations separated by ${min}–${max} days.`};
  if(spread<=20)return {key:"variable",text:`Spacing is visibly variable: the shortest interval is ${min} days and the longest ${max}, producing a ${spread}-day spread.`};
  return {key:"irregular",text:`The sequence is irregular rather than monthly-like. Its shortest adjacent gap is ${min} days, while the widest reaches ${max} days — a ${spread}-day difference.`};
}

function pakshaBody(shukla:number,krishna:number){
  if(shukla===krishna)return "Shukla and Krishna Paksha contribute equally to the retained sunrise count.";
  const delta=Math.abs(shukla-krishna);
  return shukla>krishna?`Shukla Paksha supplies ${delta} more retained sunrise observation${delta===1?"":"s"} than Krishna.`:`Krishna Paksha supplies ${delta} more retained sunrise observation${delta===1?"":"s"} than Shukla.`;
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
  const weekdayVariety=new Set(rows.map(row=>row.weekday)).size;
  const durations=rows.map(row=>({row,minutes:durationFromSunrise(row)})).sort((a,b)=>b.minutes-a.minutes||a.row.date.localeCompare(b.row.date));
  const longest=durations[0];
  const shortest=durations[durations.length-1];
  const gaps=rows.slice(1).map((row,index)=>({from:rows[index].date,to:row.date,days:dayGap(rows[index].date,row.date)}));
  const nextDayEnds=rows.filter(row=>row.tithiEndDate>row.date).length;
  const avgDuration=Math.round(durations.reduce((sum,item)=>sum+item.minutes,0)/durations.length);
  const monthsCovered=distribution.length;
  const maxMonthly=Math.max(0,...distribution.map(([,count])=>count));
  const coverage=coverageProfile(monthsCovered,rows.length);
  const duration=durationProfile(avgDuration);
  const boundary=boundaryProfile(repeatedRows.length,nextDayEnds);
  const cadence=cadenceBody(gaps);
  const monthMap=distribution.map(([month,count])=>`${monthName(month)} ${count}`).join(" · ");
  const peakText=peaks.length?`${peaks.join(" / ")} ${peaks.length===1?"is":"are"} densest at ${maxMonthly} observation${maxMonthly===1?"":"s"}.`:"";

  const fingerprintBody=monthsCovered<=3
    ? `${coverage.body} The temporal character is ${duration.headline}. ${duration.body(avgDuration,longest.minutes,shortest.minutes)} ${weekday?`${weekday[0]} leads the weekday tally; ${weekdayVariety} distinct weekday labels occur.`:""}`
    : monthsCovered<=5
      ? `${duration.body(avgDuration,longest.minutes,shortest.minutes)} Against that duration profile, ${coverage.body} ${weekday?`Weekday diversity reaches ${weekdayVariety}, with ${weekday[0]} appearing most often.`:""}`
      : monthsCovered===6
        ? `Six-month coverage and ${duration.headline} intersect here. ${coverage.body} ${duration.body(avgDuration,longest.minutes,shortest.minutes)} The retained rows occupy ${weekdayVariety} different weekdays.`
        : `${coverage.body} Its second defining feature is ${duration.headline}: ${duration.body(avgDuration,longest.minutes,shortest.minutes)} ${weekday?`${weekday[0]} is the most frequent weekday among ${weekdayVariety} represented weekdays.`:""}`;

  const distributionBody=cadence.key==="clockwork"
    ? `${cadence.text} Month map: ${monthMap}. ${peakText} ${pakshaBody(shukla,krishna)}`
    : cadence.key==="regular"
      ? `Month map first: ${monthMap}. ${pakshaBody(shukla,krishna)} ${cadence.text} ${peakText}`
      : cadence.key==="variable"
        ? `${peakText} ${cadence.text} The monthly footprint is ${monthMap}. ${pakshaBody(shukla,krishna)}`
        : `${pakshaBody(shukla,krishna)} The retained month footprint is ${monthMap}. ${cadence.text} ${peakText}`;

  return {
    directAnswer:coverage.direct(vrat.name,year,location,rows),
    facts:[
      {label:"Observed months",value:String(monthsCovered),note:`${coverage.label} · ${year}`},
      {label:"Shukla / Krishna",value:`${shukla} / ${krishna}`,note:"Sunrise rows by Paksha"},
      {label:"Boundary profile",value:boundary.key,note:`${repeatedRows.length} repeated · ${nextDayEnds} next-day endings`},
      {label:"Persistence profile",value:duration.headline,note:`Average ${avgDuration} min after sunrise`},
      {label:"Longest / shortest span",value:`${longest.minutes} / ${shortest.minutes} min`,note:`${longest.row.date} · ${shortest.row.date}`},
      {label:"Cadence profile",value:cadence.key,note:`${weekdayVariety} weekdays represented`},
    ],
    fingerprintTitle:`${city.name} ${vrat.name} ${year}: ${coverage.label} + ${duration.headline}`,
    fingerprintBody,
    distributionTitle:`${coverage.label[0].toUpperCase()+coverage.label.slice(1)} across the Gregorian year`,
    distributionBody,
    transitionTitle:`${boundary.key.replaceAll("-"," ")} at ${city.name} sunrise`,
    transitionBody:boundary.body(vrat.name,repeatedRows,nextDayEnds,rows.length),
    observanceTitle:`${vrat.name}-specific annual signature`,
    observanceBody:`${observanceAngle(vrat.slug,rows)} The post-sunrise persistence class is ${duration.headline}; the spacing class is ${cadence.key}.`,
  };
}
