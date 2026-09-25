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

function clockMinutes(value:string){const [h,m]=value.split(":").map(Number);return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:0;}
function average(values:number[]){return values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):0;}
function span(values:number[]){return values.length?Math.max(...values)-Math.min(...values):0;}
function dayGap(a:string,b:string){return Math.round((Date.parse(`${b}T06:00:00Z`)-Date.parse(`${a}T06:00:00Z`))/86400000);}
function durationFromSunrise(row:VratOccurrence){let end=clockMinutes(row.tithiEnd);const rise=clockMinutes(row.sunrise);if(row.tithiEndDate>row.date||end<rise)end+=1440;return Math.max(0,end-rise);}
function clockBand(minutes:number){if(minutes<330)return {key:"pre-dawn-edge",text:"a very early sunrise clock"};if(minutes<360)return {key:"early-morning",text:"an early-morning sunrise clock"};if(minutes<390)return {key:"near-six",text:"a sunrise clock centered near 06:00"};return {key:"later-morning",text:"a later local sunrise clock"};}
function persistenceBand(minutes:number){if(minutes<240)return {key:"short",text:"short post-sunrise Tithi persistence"};if(minutes<480)return {key:"moderate",text:"moderate post-sunrise Tithi persistence"};if(minutes<720)return {key:"long",text:"long post-sunrise Tithi persistence"};if(minutes<960)return {key:"very-long",text:"very long post-sunrise Tithi persistence"};return {key:"overnight",text:"overnight-level Tithi persistence"};}
function cadenceBand(rows:readonly VratOccurrence[]){if(rows.length<2)return {key:"single",text:"a single retained sunrise state"};const gaps=rows.slice(1).map((row,index)=>dayGap(rows[index].date,row.date)).filter(value=>value>0);const min=Math.min(...gaps),max=Math.max(...gaps),spread=max-min;if(spread<=2)return {key:"steady",text:`a very steady ${min}–${max}-day cadence`};if(spread<=7)return {key:"regular",text:`a regular ${min}–${max}-day cadence`};if(spread<=16)return {key:"variable",text:`a variable ${min}–${max}-day cadence`};return {key:"irregular",text:`an irregular ${min}–${max}-day cadence`};}
function monthShape(rows:readonly VratOccurrence[]){const months=[...new Set(rows.map(row=>row.date.slice(5,7)))];if(months.length<=3)return {key:"clustered",text:`a compact ${months.length}-month footprint`};if(months.length<=6)return {key:"partial-year",text:`a partial-year footprint across ${months.length} months`};if(months.length<=9)return {key:"broad",text:`a broad footprint across ${months.length} months`};return {key:"near-annual",text:`a near-annual footprint across ${months.length} months`};}
function weekdayShape(rows:readonly VratOccurrence[]){const counts=new Map<string,number>();for(const row of rows)counts.set(row.weekday,(counts.get(row.weekday)??0)+1);const sorted=[...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));return {leader:sorted[0]?.[0]??"none",leaderCount:sorted[0]?.[1]??0,variety:sorted.length,map:sorted.map(([day,count])=>`${day} ${count}`).join(" · ")};}
function narrativeKey(city:City){let hash=37;for(let i=0;i<city.slug.length;i++)hash=(hash*149+city.slug.charCodeAt(i)*(i+9))%65521;return hash;}
function focusCopy(vrat:VratDefinition,rows:readonly VratOccurrence[]){
  const repeated=rows.filter(row=>row.repeatedAtSunrise).length,shukla=rows.filter(row=>row.paksha==="Shukla").length,krishna=rows.filter(row=>row.paksha==="Krishna").length;
  if(vrat.slug==="ekadashi")return {title:"Ekadashi sunrise-state focus",body:`This city page follows both Shukla and Krishna Ekadashi at local sunrise. The retained year contains ${shukla} Shukla and ${krishna} Krishna observations, with ${repeated} repeated-sunrise boundary case${repeated===1?"":"s"}.`};
  if(vrat.slug==="purnima")return {title:"Purnima sunrise persistence focus",body:`This city page tracks Shukla Purnima at local sunrise. Its distinguishing signal is how long the full-moon Tithi remains active after sunrise and whether any Purnima state repeats at a second local sunrise; this year has ${repeated} such repeat${repeated===1?"":"s"}.`};
  return {title:"Amavasya sunrise persistence focus",body:`This city page tracks Krishna Amavasya at local sunrise. The useful local signal is the new-moon Tithi's post-sunrise persistence together with any second-sunrise carryover; this year has ${repeated} repeated state${repeated===1?"":"s"}.`};
}

export function buildVratCityContext(vrat:VratDefinition,year:number,city:City,rows:readonly VratOccurrence[]):VratCityContext{
  const profile=buildCityContentProfile(city),focus=focusCopy(vrat,rows);
  if(!rows.length){return {focusTitle:focus.title,focusBody:focus.body,title:`${city.name} ${vrat.name} local signature`,body:`No retained ${vrat.name} sunrise state appears in ${year} for ${city.name}. The empty result still belongs to ${profile.geoContext}, a ${profile.latitudeContext} whose solar clock is ${profile.solarClockContext}. ${profile.dailyContext}`,secondaryBody:`No neighboring-city dates are substituted. Any later matching row is generated again from ${city.name}'s own sunrise and Sun–Moon geometry.`,facts:[{label:"Geographic setting",value:profile.geoContext},{label:"Latitude profile",value:profile.latitudeContext},{label:"Solar-clock relation",value:profile.solarClockContext},{label:"Annual local rows",value:"0"}]};}

  const sunriseValues=rows.map(row=>clockMinutes(row.sunrise)),persistenceValues=rows.map(durationFromSunrise),avgSunrise=average(sunriseValues),sunriseSpread=span(sunriseValues),avgPersistence=average(persistenceValues),persistenceSpread=span(persistenceValues);
  const repeats=rows.filter(row=>row.repeatedAtSunrise),nextDayEnds=rows.filter(row=>row.tithiEndDate>row.date),sunrise=clockBand(avgSunrise),persistence=persistenceBand(avgPersistence),cadence=cadenceBand(rows),months=monthShape(rows),weekdays=weekdayShape(rows),variant=narrativeKey(city)%6;
  const earliest=[...rows].sort((a,b)=>clockMinutes(a.sunrise)-clockMinutes(b.sunrise))[0],latest=[...rows].sort((a,b)=>clockMinutes(b.sunrise)-clockMinutes(a.sunrise))[0];
  const durationRows=[...rows].map(row=>({row,minutes:durationFromSunrise(row)})).sort((a,b)=>b.minutes-a.minutes),longest=durationRows[0],shortest=durationRows[durationRows.length-1];

  const body=variant===0
    ? `${city.name}'s ${vrat.name} year is anchored to ${profile.geoContext}, a ${profile.latitudeContext} where the solar clock is ${profile.solarClockContext}. The retained sequence forms ${months.text} with ${cadence.text}, and its average dawn falls into ${sunrise.text}. ${profile.dailyContext}`
    : variant===1
      ? `For ${city.name}, ${vrat.name} is a local-sunrise series rather than a national date list. The geographic frame is ${profile.geoContext}; ${profile.solarClockContext} and ${sunrise.text} shape the retained checkpoints. Across ${year}, the observations create ${months.text} and ${cadence.text}. ${profile.dailyContext}`
      : variant===2
        ? `The ${vrat.name} sequence in ${city.name} belongs to ${profile.geoContext}. Its ${profile.latitudeContext} and ${profile.solarClockContext} determine where the target Tithi meets sunrise. The year resolves to ${cadence.key} cadence, ${months.key} month coverage and a ${sunrise.key} average sunrise profile. ${profile.dailyContext}`
        : variant===3
          ? `Read ${city.name}'s ${vrat.name} calendar through the city's own dawn checkpoints. ${profile.geoContext} supplies the place context, while the solar clock is ${profile.solarClockContext}. The retained rows span ${months.text}; their spacing is ${cadence.text}, and the average sunrise class is ${sunrise.key}. ${profile.dailyContext}`
          : variant===4
            ? `${city.name} contributes a distinct ${vrat.name} sunrise series from ${profile.geoContext}. The local timing frame is ${profile.solarClockContext} at a ${profile.latitudeContext}. Rather than importing another city's dates, this page preserves ${months.text}, ${cadence.text} and ${sunrise.text} from the local rows. ${profile.dailyContext}`
            : `The yearly ${vrat.name} signature starts with geography: ${profile.geoContext}. In ${city.name}, the solar clock is ${profile.solarClockContext}; the retained Tithi-at-sunrise rows then form ${months.text} and ${cadence.text}. Their mean dawn sits in the ${sunrise.key} band. ${profile.dailyContext}`;

  const secondaryBody=variant%3===0
    ? `${persistence.text[0].toUpperCase()+persistence.text.slice(1)} defines the Tithi side of the profile. Average post-sunrise persistence is ${avgPersistence} minutes, from ${shortest.minutes} to ${longest.minutes}; ${repeats.length} rows repeat at another sunrise and ${nextDayEnds.length} end on the next civil date. Weekday distribution spans ${weekdays.variety} labels, led by ${weekdays.leader}.`
    : variant%3===1
      ? `The year has two separate boundary signals: persistence and recurrence. The target Tithi remains after sunrise for ${avgPersistence} minutes on average, while ${repeats.length} retained state${repeats.length===1?"":"s"} survive to another dawn and ${nextDayEnds.length} transition${nextDayEnds.length===1?"":"s"} cross civil midnight. The weekday map is ${weekdays.map}.`
      : `Local sunrise does more than select the date: it also exposes how long the target Tithi survives afterward. This set is ${persistence.key}, with a ${persistenceSpread}-minute duration spread between retained rows. The longest case is ${longest.row.date}, the shortest ${shortest.row.date}; weekday variety reaches ${weekdays.variety}, with ${weekdays.leader} most frequent.`;

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
      {label:"Weekday structure",value:weekdays.leader,note:`${weekdays.variety} weekdays · ${weekdays.map}`},
      {label:"Boundary cases",value:`${repeats.length} repeated · ${nextDayEnds.length} next-day endings`},
    ]
  };
}
