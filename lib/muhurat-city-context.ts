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

function cityNarrativeKey(slug:string){
  let hash=17;
  for(let index=0;index<slug.length;index++)hash=(hash*131+slug.charCodeAt(index)*(index+17))%9973;
  return hash;
}

type SemanticNarrativeArgs={
  city:City;
  eventTitle:string;
  cityProfile:ReturnType<typeof buildCityContentProfile>;
  rowCount:number;
  spreadText:string;
  firstWindowText:string;
  rahuText:string;
  sourceText:string;
  gradeText:string;
  noWindow:number;
};

function buildCitySemanticNarrative(args:SemanticNarrativeArgs){
  const {city,eventTitle,cityProfile,rowCount,spreadText,firstWindowText,rahuText,sourceText,gradeText,noWindow}=args;
  const key=cityNarrativeKey(city.slug);
  const anchorIndex=key%6;
  const shapeIndex=Math.floor(key/6)%7;
  const exclusionIndex=Math.floor(key/42)%5;
  const decisionIndex=Math.floor(key/210)%5;
  const rowState=rowCount
    ? `${rowCount} lunar-qualified row${rowCount===1?"":"s"} reach the local timing stage`
    : "the lunar gate produces no candidate row, so the timing stage is intentionally left inactive";
  const windowState=rowCount
    ? `${firstWindowText} describes where the first retained windows tend to enter the local clock`
    : "there is no retained-window phase to summarize because no row survives the lunar gate";
  const rahuState=rowCount
    ? `Rahu averages into ${rahuText} across the candidate set`
    : "Rahu is not promoted into a shortlist summary when there is no candidate row";
  const exclusionState=rowCount
    ? noWindow
      ? `${noWindow} qualified row${noWindow===1?"":"s"} lose every favorable daytime window after exclusions`
      : "every qualified row keeps at least one favorable daytime window after exclusions"
    : "no exclusion result is fabricated for an empty shortlist";

  const anchors=[
    `Read this ${eventTitle.toLowerCase()} shortlist from ${cityProfile.geoContext}, not from a generic India timetable. ${city.name} has ${cityProfile.solarClockContext}; sunrise-derived exclusions and favorable periods are therefore evaluated on the city's own solar-day clock before any ranking is shown.`,
    `${city.name}'s local frame is ${cityProfile.geoContext}. Its ${cityProfile.latitudeContext} and ${cityProfile.solarClockContext} make the clock layer location-specific, so the useful comparison is between locally retained windows rather than copied civil-time labels from another city.`,
    `The geographic baseline here is ${cityProfile.geoContext}. Panchvani keeps that baseline attached to the ${eventTitle.toLowerCase()} calculation because the city is ${cityProfile.solarClockContext}; the shortlist is meant to be interpreted through its own sunrise-based exclusions and surviving windows.`,
    `For ${city.name}, the planning context starts with ${cityProfile.geoContext}. This is a ${cityProfile.latitudeContext} where the solar clock is ${cityProfile.solarClockContext}. The page therefore treats local timing as part of the result, not as a cosmetic city-name substitution.`,
    `The local timing signature belongs to ${cityProfile.geoContext}. Because ${city.name} is ${cityProfile.solarClockContext}, the retained-window clock and exclusion grid are read against this city's daylight structure before the ${eventTitle.toLowerCase()} candidates are compared.`,
    `${city.name} is analysed as its own timing location: ${cityProfile.geoContext}, within a ${cityProfile.latitudeContext}. That matters operationally because its solar clock is ${cityProfile.solarClockContext}, and the candidate table preserves those locally recomputed windows rather than borrowing a neighbouring schedule.`
  ];

  const shapes=[
    `The date geometry is ${spreadText}. At the same time, ${windowState}. Reading both layers together separates how widely the month distributes candidate dates from where usable local time actually begins on those dates.`,
    `${rowState}. Their calendar distribution forms ${spreadText}; independently, ${windowState}. This keeps candidate density and clock usability as two different signals instead of collapsing them into a single score.`,
    `From a month-structure perspective, the result is ${spreadText}. The clock-side reading is different: ${windowState}. A dense date cluster can still have a distinct timing shape, while a broad date field can share a narrow first-window phase.`,
    `This shortlist has ${spreadText}, which describes spacing across the civil month rather than quality by itself. For practical timing, ${windowState}; that second signal shows how the locally retained periods are positioned after screening.`,
    `The surviving-date pattern resolves into ${spreadText}. That is only the calendar layer. The timing layer says that ${windowState}, so the page keeps date spread and intraday placement visible as separate planning dimensions.`,
    `The month does not reduce to candidate count alone: its spacing is ${spreadText}, while ${windowState}. Those two properties answer different questions — when candidate dates occur and where retained time sits within each local day.`,
    `Treat ${spreadText} as the shortlist's calendar footprint. Then read the intraday footprint separately: ${windowState}. This two-layer view is more informative than assuming that more candidate dates automatically mean better local timing coverage.`
  ];

  const exclusions=[
    `${rahuState}. After the local exclusion pass, ${exclusionState}. That relationship is part of the city result because favorable labels are not treated as usable when a retained interval is removed by the exclusion grid.`,
    `The exclusion layer adds another city-specific check: ${rahuState}. In the final retained set, ${exclusionState}. This is why the page reports both favorable sources and the windows that remain after local conflict removal.`,
    `Local conflict timing is not hidden behind the score. ${rahuState}, and ${exclusionState}. The surviving-window picture therefore reflects the interaction between favorable periods and the city's own exclusion clocks.`,
    `A favorable source is only useful after exclusions are applied. Here, ${rahuState}; once those conflicts are removed, ${exclusionState}. That makes the retained supply more meaningful than a raw list of nominally favorable periods.`,
    `The city-level timing pass also tracks conflict pressure. ${rahuState}. The outcome is that ${exclusionState}; the shortlist therefore exposes whether favorable labels survive contact with the local exclusion schedule.`
  ];

  const decisions=[
    `${sourceText}. The grade distribution is ${gradeText}. For comparison, use that source mix together with continuity and exclusions; a high-ranked date is stronger evidence when several independent local signals survive rather than when one headline score stands alone.`,
    `Across this local shortlist, ${sourceText}. Grades resolve as ${gradeText}. The useful decision frame is to compare source diversity, uninterrupted clean time and fallback depth together, because those describe how robust the local result is after screening.`,
    `${sourceText}. The resulting grade shape is ${gradeText}. When choosing between rows, compare the leading date with its nearest fallback on retained-window continuity and exclusion loss instead of treating rank position as the only meaningful difference.`,
    `The timing-source layer says that ${sourceText}. The candidate grades are ${gradeText}. This makes the page most useful as a local comparison surface: inspect why the leader survives, how much clean time remains, and whether a realistic fallback keeps similar support.`,
    `For the final local read, ${sourceText}; the grade mix is ${gradeText}. The strongest row should therefore be interpreted alongside its retained sources, continuity and exclusions, with the next-best row acting as a practical stress test of the ranking.`
  ];

  return `${anchors[anchorIndex]} ${shapes[shapeIndex]} ${exclusions[exclusionIndex]} ${decisions[decisionIndex]}`;
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
  const semanticNarrative=buildCitySemanticNarrative({
    city,eventTitle,cityProfile,rowCount:rows.length,spreadText:spread.text,firstWindowText:firstWindowPhase.text,rahuText:rahuPhase.text,sourceText,gradeText,noWindow
  });

  if(!rows.length){
    return {
      title:`Why ${city.name} remains a distinct local ${eventTitle} page`,
      body:`The empty shortlist is still evaluated in ${city.name}'s own geographic context: ${cityProfile.geoContext}. The city sits in a ${cityProfile.latitudeContext} and its local solar clock is ${cityProfile.solarClockContext}. No candidate is borrowed from a neighbouring city or national placeholder when the lunar gate returns zero rows.`,
      secondaryBody:`This means the zero-result state belongs to the local calculation itself. A later month can differ because the event's accepted Tithi and Nakshatra combinations are screened again against ${city.name}'s own timing data rather than reusing another city's shortlist. ${semanticNarrative}`,
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
    ? `${sourceText}. The candidate-grade mix is ${gradeText}. Rahu starts, on average, in ${rahuPhase.text}; ${noWindow?`${noWindow} lunar-qualified row${noWindow===1?"":"s"} loses every favorable daytime window after local exclusions.`:"every lunar-qualified row retains at least one favorable daytime window after local exclusions."} ${semanticNarrative}`
    : `The lunar screen produces rows, but none retains a favorable daytime timing source after exclusions. The grade mix is ${gradeText}; Rahu falls into ${rahuPhase.text} across the local candidate set. ${semanticNarrative}`;

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
