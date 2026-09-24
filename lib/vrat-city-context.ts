import type {City} from "./cities";
import {buildCityContentProfile} from "./city-content-profile";
import type {VratDefinition,VratOccurrence} from "./vrat";

type Fact={label:string;value:string;note?:string};

export type VratCityContext={
  focusTitle:string;
  focusBody:string;
  title:string;
  body:string;
  secondaryBody:string;
  facts:Fact[];
};

function clockMinutes(value:string){
  const [h,m]=value.split(":").map(Number);
  return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:0;
}
function average(values:number[]){return values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):0;}
function span(values:number[]){return values.length?Math.max(...values)-Math.min(...values):0;}
function dayGap(a:string,b:string){return Math.round((Date.parse(`${b}T06:00:00Z`)-Date.parse(`${a}T06:00:00Z`))/86400000);}
function durationFromSunrise(row:VratOccurrence){
  let end=clockMinutes(row.tithiEnd);
  const rise=clockMinutes(row.sunrise);
  if(row.tithiEndDate>row.date||end<rise)end+=1440;
  return Math.max(0,end-rise);
}
function clockBand(minutes:number){
  if(minutes<330)return {key:"pre-dawn-edge",text:"a very early sunrise clock"};
  if(minutes<360)return {key:"early-morning",text:"an early-morning sunrise clock"};
  if(minutes<390)return {key:"near-six",text:"a sunrise clock centered near 06:00"};
  return {key:"later-morning",text:"a later local sunrise clock"};
}
function persistenceBand(minutes:number){
  if(minutes<240)return {key:"short",text:"short post-sunrise Tithi persistence"};
  if(minutes<480)return {key:"moderate",text:"moderate post-sunrise Tithi persistence"};
  if(minutes<720)return {key:"long",text:"long post-sunrise Tithi persistence"};
  if(minutes<960)return {key:"very-long",text:"very long post-sunrise Tithi persistence"};
  return {key:"overnight",text:"overnight-level Tithi persistence"};
}
function cadenceBand(rows:readonly VratOccurrence[]){
  if(rows.length<2)return {key:"single",text:"a single retained sunrise state"};
  const gaps=rows.slice(1).map((row,index)=>dayGap(rows[index].date,row.date)).filter(value=>value>0);
  const min=Math.min(...gaps),max=Math.max(...gaps),spread=max-min;
  if(spread<=2)return {key:"steady",text:`a very steady ${min}–${max}-day cadence`};
  if(spread<=7)return {key:"regular",text:`a regular ${min}–${max}-day cadence`};
  if(spread<=16)return {key:"variable",text:`a variable ${min}–${max}-day cadence`};
  return {key:"irregular",text:`an irregular ${min}–${max}-day cadence`};
}
function monthShape(rows:readonly VratOccurrence[]){
  const months=[...new Set(rows.map(row=>row.date.slice(5,7)))];
  if(months.length<=3)return {key:"clustered",text:`a compact ${months.length}-month footprint`};
  if(months.length<=6)return {key:"partial-year",text:`a partial-year footprint across ${months.length} months`};
  if(months.length<=9)return {key:"broad",text:`a broad footprint across ${months.length} months`};
  return {key:"near-annual",text:`a near-annual footprint across ${months.length} months`};
}
function focusCopy(vrat:VratDefinition,rows:readonly VratOccurrence[]){
  const repeated=rows.filter(row=>row.repeatedAtSunrise).length;
  const shukla=rows.filter(row=>row.paksha==="Shukla").length;
  const krishna=rows.filter(row=>row.paksha==="Krishna").length;
  if(vrat.slug==="ekadashi")return {
    title:"Ekadashi sunrise-state focus",
    body:`This city page follows both Shukla and Krishna Ekadashi at local sunrise. The retained year contains ${shukla} Shukla and ${krishna} Krishna observations, with ${repeated} repeated-sunrise boundary case${repeated===1?"":"s"}.`
  };
  if(vrat.slug==="purnima")return {
    title:"Purnima sunrise persistence focus",
    body:`This city page tracks Shukla Purnima at local sunrise. Its distinguishing signal is how long the full-moon Tithi remains active after sunrise and whether any Purnima state repeats at a second local sunrise; this year has ${repeated} such repeat${repeated===1?"":"s"}.`
  };
  return {
    title:"Amavasya sunrise persistence focus",
    body:`This city page tracks Krishna Amavasya at local sunrise. The useful local signal is the new-moon Tithi's post-sunrise persistence together with any second-sunrise carryover; this year has ${repeated} repeated state${repeated===1?"":"s"}.`
  };
}

export function buildVratCityContext(vrat:VratDefinition,year:number,city:City,rows:readonly VratOccurrence[]):VratCityContext{
  const profile=buildCityContentProfile(city);
  const focus=focusCopy(vrat,rows);
  if(!rows.length){
    return {
      focusTitle:focus.title,
      focusBody:focus.body,
      title:`${city.name} ${vrat.name} local signature`,
      body:`No retained ${vrat.name} sunrise state appears in ${year} for ${city.name}. The empty result still belongs to ${profile.geoContext}, a ${profile.latitudeContext} whose solar clock is ${profile.solarClockContext}; no neighboring-city dates are substituted.`,
      secondaryBody:`The next valid row, if it appears in another year, will be generated again from ${city.name}'s own sunrise and Sun–Moon geometry rather than copied from a national calendar.`,
      facts:[
        {label:"Geographic setting",value:profile.geoContext},
        {label:"Latitude profile",value:profile.latitudeContext},
        {label:"Solar-clock relation",value:profile.solarClockContext},
        {label:"Annual local rows",value:"0"},
      ]
    };
  }

  const sunriseValues=rows.map(row=>clockMinutes(row.sunrise));
  const persistenceValues=rows.map(durationFromSunrise);
  const avgSunrise=average(sunriseValues);
  const sunriseSpread=span(sunriseValues);
  const avgPersistence=average(persistenceValues);
  const persistenceSpread=span(persistenceValues);
  const repeats=rows.filter(row=>row.repeatedAtSunrise);
  const nextDayEnds=rows.filter(row=>row.tithiEndDate>row.date);
  const sunrise=clockBand(avgSunrise);
  const persistence=persistenceBand(avgPersistence);
  const cadence=cadenceBand(rows);
  const months=monthShape(rows);
  const earliest=[...rows].sort((a,b)=>clockMinutes(a.sunrise)-clockMinutes(b.sunrise))[0];
  const latest=[...rows].sort((a,b)=>clockMinutes(b.sunrise)-clockMinutes(a.sunrise))[0];
  const longest=[...rows].map(row=>({row,minutes:durationFromSunrise(row)})).sort((a,b)=>b.minutes-a.minutes)[0];
  const shortest=[...rows].map(row=>({row,minutes:durationFromSunrise(row)})).sort((a,b)=>a.minutes-b.minutes)[0];

  const body=sunrise.key==="pre-dawn-edge"
    ? `${city.name}'s ${vrat.name} year is anchored to ${profile.geoContext}, where the retained observations sit on ${sunrise.text}. The local solar clock is ${profile.solarClockContext}; the annual sequence has ${months.text} and ${cadence.text}.`
    : sunrise.key==="early-morning"
      ? `For ${city.name}, ${vrat.name} is calculated across ${profile.geoContext} with ${sunrise.text}. Its ${profile.latitudeContext} and ${profile.solarClockContext} produce ${months.text}; the retained dates follow ${cadence.text}.`
      : sunrise.key==="near-six"
        ? `${city.name}'s ${vrat.name} sequence comes from ${profile.geoContext}. A sunrise pattern centered near 06:00 combines with a solar clock ${profile.solarClockContext}; the year forms ${months.text} with ${cadence.text}.`
        : `${city.name} has ${sunrise.text} for its retained ${vrat.name} rows. The calculation belongs to ${profile.geoContext}, where the ${profile.latitudeContext} and ${profile.solarClockContext} shape the yearly local-sunrise sequence.`;

  const secondaryBody=repeats.length
    ? `${persistence.text[0].toUpperCase()+persistence.text.slice(1)} defines the Tithi side of the profile: average persistence is ${avgPersistence} minutes after sunrise, with ${repeats.length} repeated-sunrise case${repeats.length===1?"":"s"}. The longest retained span occurs on ${longest.row.date}; the shortest on ${shortest.row.date}.`
    : `${persistence.text[0].toUpperCase()+persistence.text.slice(1)} defines the Tithi side of the profile. None of the ${rows.length} retained rows repeats at the next sunrise; average persistence is ${avgPersistence} minutes, ranging from ${shortest.minutes} to ${longest.minutes} minutes after sunrise.`;

  return {
    focusTitle:focus.title,
    focusBody:focus.body,
    title:`${city.name} ${vrat.name} ${year} local signature`,
    body,
    secondaryBody,
    facts:[
      {label:"Geographic setting",value:profile.geoContext},
      {label:"Solar-clock relation",value:profile.solarClockContext,note:profile.latitudeContext},
      {label:"Sunrise profile",value:sunrise.key,note:`${earliest.sunrise} earliest · ${latest.sunrise} latest · ${sunriseSpread} min spread`},
      {label:"Tithi persistence",value:persistence.key,note:`Avg ${avgPersistence} min · spread ${persistenceSpread} min`},
      {label:"Cadence profile",value:cadence.key,note:cadence.text},
      {label:"Month footprint",value:months.key,note:months.text},
      {label:"Boundary cases",value:`${repeats.length} repeated · ${nextDayEnds.length} next-day endings`},
    ]
  };
}
