import type {City} from "./cities";
import {buildCityContentProfile} from "./city-content-profile";
import type {MuhuratRow} from "./muhurat";

type Fact={label:string;value:string;note?:string};

export type MuhuratCityContext={
  title:string;
  body:string;
  secondaryBody:string;
  facts:Fact[];
};

function clockMinutes(value:string){
  const [h,m]=value.split(":").map(Number);
  return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:0;
}
function average(values:number[]){return values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):null;}
function phase(minutes:number|null){
  if(minutes===null)return {key:"no-retained-window",text:"no retained-window clock phase"};
  if(minutes<540)return {key:"early-morning",text:"an early-morning retained-window profile"};
  if(minutes<660)return {key:"late-morning",text:"a late-morning retained-window profile"};
  if(minutes<780)return {key:"midday",text:"a midday retained-window profile"};
  if(minutes<900)return {key:"early-afternoon",text:"an early-afternoon retained-window profile"};
  return {key:"late-afternoon",text:"a late-afternoon retained-window profile"};
}
function sourceLeader(rows:readonly MuhuratRow[]){
  const counts=new Map<string,number>();
  for(const row of rows)for(const window of row.recommendedWindows)for(const source of window.sources)counts.set(source,(counts.get(source)??0)+1);
  return [...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]??null;
}
function gradeShape(rows:readonly MuhuratRow[]){
  const grades=new Map<string,number>();
  for(const row of rows)grades.set(row.planning.grade,(grades.get(row.planning.grade)??0)+1);
  return [...grades.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
}
function candidateSpread(rows:readonly MuhuratRow[]){
  if(rows.length<2)return {key:rows.length?"single-date":"empty",text:rows.length?"one isolated candidate date":"no candidate-date spread"};
  const days=rows.map(row=>Number(row.date.slice(-2))).filter(Number.isFinite).sort((a,b)=>a-b);
  const span=days[days.length-1]-days[0];
  if(span<=7)return {key:"tight-week",text:"a tightly clustered one-week candidate arc"};
  if(span<=14)return {key:"fortnight",text:"a candidate arc contained within roughly a fortnight"};
  if(span<=21)return {key:"three-week",text:"a candidate field spread across about three weeks"};
  return {key:"full-month",text:"a candidate field extending across most of the month"};
}

export function buildMuhuratCityContext(city:City,rows:readonly MuhuratRow[],eventTitle:string):MuhuratCityContext{
  const cityProfile=buildCityContentProfile(city);
  const firstWindowStarts=rows.map(row=>row.recommendedWindows[0]?.start).filter((value):value is string=>Boolean(value)).map(clockMinutes);
  const firstWindowPhase=phase(average(firstWindowStarts));
  const rahuStarts=rows.map(row=>row.data?.rahu?.start).filter((value):value is string=>Boolean(value)).map(clockMinutes);
  const rahuPhase=phase(average(rahuStarts));
  const spread=candidateSpread(rows);
  const source=sourceLeader(rows);
  const grades=gradeShape(rows);
  const noWindow=rows.filter(row=>row.recommendedWindows.length===0).length;
  const sourceText=source?`${source[0]} is the most frequently retained timing source across the shortlist`:`no favorable timing source survives because there is no candidate row with a retained window`;
  const gradeText=grades.length?grades.map(([grade,count])=>`${grade} ${count}`).join(" · "):"no grade distribution";

  if(!rows.length){
    return {
      title:`Why ${city.name} remains a distinct local ${eventTitle} page`,
      body:`The empty shortlist is still evaluated in ${city.name}'s own geographic context: ${cityProfile.geoContext}. The city sits in a ${cityProfile.latitudeContext} and its local solar clock is ${cityProfile.solarClockContext}. No candidate is borrowed from a neighbouring city or national placeholder when the lunar gate returns zero rows.`,
      secondaryBody:`This means the zero-result state belongs to the local calculation itself. A later month can differ because the event's accepted Tithi and Nakshatra combinations are screened again against ${city.name}'s own timing data rather than reusing another city's shortlist.`,
      facts:[
        {label:"Local geography",value:cityProfile.geoContext},
        {label:"Latitude profile",value:cityProfile.latitudeContext},
        {label:"Solar-clock relation",value:cityProfile.solarClockContext},
        {label:"Candidate spread",value:"empty"},
      ]
    };
  }

  const body=spread.key==="tight-week"
    ? `${city.name}'s ${eventTitle.toLowerCase()} shortlist is geographically anchored in ${cityProfile.geoContext}. This month compresses its surviving dates into ${spread.text}; retained windows lean toward ${firstWindowPhase.text}, while the city's solar clock is ${cityProfile.solarClockContext}.`
    : spread.key==="fortnight"
      ? `${eventTitle} in ${city.name} forms ${spread.text}. The calculation is tied to ${cityProfile.geoContext}, where ${cityProfile.solarClockContext}; across the surviving dates the first usable windows average into ${firstWindowPhase.text}.`
      : spread.key==="three-week"
        ? `The ${city.name} field is neither a one-week cluster nor a full-month spread: it forms ${spread.text}. Its local context is ${cityProfile.geoContext}, with a ${cityProfile.latitudeContext}; the retained-window clock shape is ${firstWindowPhase.text}.`
        : spread.key==="full-month"
          ? `${city.name} carries ${spread.text} for ${eventTitle.toLowerCase()}. The timing layer is grounded in ${cityProfile.geoContext}; because the city is ${cityProfile.solarClockContext}, its local exclusion and favorable-window clocks should not be substituted with another city's values.`
          : `${city.name} has ${spread.text} for ${eventTitle.toLowerCase()}. That single row belongs to ${cityProfile.geoContext}, a ${cityProfile.latitudeContext} with a solar clock ${cityProfile.solarClockContext}.`;

  const secondaryBody=source
    ? `${sourceText}. The candidate-grade mix is ${gradeText}. Rahu starts, on average, in ${rahuPhase.text}; ${noWindow?`${noWindow} lunar-qualified row${noWindow===1?"":"s"} loses every favorable daytime window after local exclusions.`:"every lunar-qualified row retains at least one favorable daytime window after local exclusions."}`
    : `The lunar screen produces rows, but none retains a favorable daytime timing source after exclusions. The grade mix is ${gradeText}; Rahu falls into ${rahuPhase.text} across the local candidate set.`;

  return {
    title:`${city.name} local planning signature`,
    body,
    secondaryBody,
    facts:[
      {label:"Geographic setting",value:cityProfile.geoContext},
      {label:"Solar-clock relation",value:cityProfile.solarClockContext,note:cityProfile.latitudeContext},
      {label:"Candidate-date shape",value:spread.key,note:spread.text},
      {label:"First-window phase",value:firstWindowPhase.key,note:firstWindowPhase.text},
      {label:"Rahu phase",value:rahuPhase.key,note:"Average across candidate rows"},
      {label:"Dominant timing source",value:source?.[0]??"none",note:source?`${source[1]} retained appearances`:"No retained source"},
    ]
  };
}
