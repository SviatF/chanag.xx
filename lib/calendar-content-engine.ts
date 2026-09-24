import type {City} from "./cities";
import type {Festival} from "./festivals";
import type {Panchang} from "./panchang";
import {formatPanchangTime,formatWindow} from "./panchang";

type LunarLabels={amantaLabel:string;purnimantaLabel:string};
type FestivalSummary=Pick<Festival,"name"|"slug"|"date">;
type MonthlyEntry=Pick<Panchang,"date"|"tithi"|"nakshatra"|"rahu"|"yamaganda"|"gulika"|"abhijit"|"dayChoghadiya">;
type Fact={label:string;value:string;note?:string};

export type DailyPanchangQualityContent={
  directAnswer:string;
  facts:Fact[];
  fingerprintTitle:string;
  fingerprintBody:string;
  transitionTitle:string;
  transitionBody:string;
  solarTitle:string;
  solarBody:string;
  lunarTitle:string;
  lunarBody:string;
};

export type MonthlyCalendarQualityContent={
  directAnswer:string;
  facts:Fact[];
  fingerprintTitle:string;
  fingerprintBody:string;
  lunarTitle:string;
  lunarBody:string;
  solarTitle:string;
  solarBody:string;
  festivalBody:string;
};

export type YearlyCalendarQualityContent={
  directAnswer:string;
  facts:Fact[];
  fingerprintTitle:string;
  fingerprintBody:string;
  seasonalTitle:string;
  seasonalBody:string;
  lunarTitle:string;
  lunarBody:string;
  festivalBody:string;
};

const commonTithis=["Pratipada","Dvitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami","Navami","Dashami","Ekadashi","Dwadashi","Trayodashi","Chaturdashi"];
const nakshatras=["Ashwini","Bharani","Krittika","Rohini","Mrigashirsha","Ardra","Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"];

function clockMinutes(value:string){
  const [hours,minutes]=value.split(":").map(Number);
  return Number.isFinite(hours)&&Number.isFinite(minutes)?hours*60+minutes:0;
}

function daylightMinutes(data:Panchang){
  const start=clockMinutes(data.sunrise),end=clockMinutes(data.sunset);
  return end>=start?end-start:end+1440-start;
}

function signedMinutes(value:number){
  if(value===0)return "no clock change";
  return `${Math.abs(value)} minutes ${value>0?"later":"earlier"}`;
}

function humanDate(value:string){
  return new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"long",year:"numeric",weekday:"long",timeZone:"Asia/Kolkata"}).format(new Date(`${value}T06:00:00Z`));
}

function nextTithiLabel(data:Panchang){
  if(data.tithi==="Purnima")return "Pratipada · Krishna Paksha";
  if(data.tithi==="Amavasya")return "Pratipada · Shukla Paksha";
  if(data.tithi==="Chaturdashi")return data.paksha==="Shukla"?"Purnima · Shukla Paksha":"Amavasya · Krishna Paksha";
  const index=commonTithis.indexOf(data.tithi);
  return index>=0&&index<commonTithis.length-1?`${commonTithis[index+1]} · ${data.paksha} Paksha`:"the next lunar Tithi";
}

function nextNakshatraLabel(data:Panchang){
  const index=nakshatras.indexOf(data.nakshatra);
  return index>=0?nakshatras[(index+1)%nakshatras.length]:"the next Nakshatra";
}

function rangeByTime(entries:ReadonlyArray<Panchang>,field:"sunrise"|"sunset"){
  if(!entries.length)return null;
  let earliest=entries[0],latest=entries[0];
  for(const entry of entries.slice(1)){
    if(clockMinutes(entry[field])<clockMinutes(earliest[field]))earliest=entry;
    if(clockMinutes(entry[field])>clockMinutes(latest[field]))latest=entry;
  }
  return {earliest,latest,range:clockMinutes(latest[field])-clockMinutes(earliest[field])};
}

function rangeByClock<T extends {date:string}>(entries:ReadonlyArray<T>,value:(entry:T)=>string){
  if(!entries.length)return null;
  let earliest=entries[0],latest=entries[0];
  for(const entry of entries.slice(1)){
    if(clockMinutes(value(entry))<clockMinutes(value(earliest)))earliest=entry;
    if(clockMinutes(value(entry))>clockMinutes(value(latest)))latest=entry;
  }
  return {earliest,latest,range:clockMinutes(value(latest))-clockMinutes(value(earliest))};
}

function compactDates(entries:ReadonlyArray<{date:string;tithi:string}>,tithi:string){
  return entries.filter(entry=>entry.tithi===tithi).map(entry=>entry.date);
}

function listDates(values:string[]){
  if(!values.length)return "none in the local sunrise sequence";
  return values.join(", ");
}

function monthName(year:number,month:number){
  return new Intl.DateTimeFormat("en-IN",{month:"long",timeZone:"Asia/Kolkata"}).format(new Date(Date.UTC(year,month-1,1)));
}

function monthNameFromIso(value:string){
  const month=Number(value.slice(5,7));
  return new Intl.DateTimeFormat("en-IN",{month:"long",timeZone:"Asia/Kolkata"}).format(new Date(Date.UTC(2026,month-1,1)));
}

export function buildDailyPanchangQualityContent(city:City,data:Panchang,lunar:LunarLabels):DailyPanchangQualityContent{
  const daylight=daylightMinutes(data);
  const tithiEnd=formatPanchangTime(data.tithiEnd,data.tithiEndDate,data.date);
  const nakshatraEnd=formatPanchangTime(data.nakshatraEnd,data.nakshatraEndDate,data.date);
  const favorable=data.dayChoghadiya.filter(item=>item.effect==="good");
  const firstGood=favorable[0];
  const lastGood=favorable[favorable.length-1];
  const moonBand=data.moonIllumination>=70?"bright":data.moonIllumination<=30?"low-illumination":"mid-illumination";

  return {
    directAnswer:`On ${humanDate(data.date)}, ${city.name} has ${data.tithi} Tithi in ${data.paksha} Paksha, ${data.nakshatra} Nakshatra, sunrise at ${data.sunrise}, sunset at ${data.sunset}, and Rahu Kalam ${formatWindow(data.rahu)}.`,
    facts:[
      {label:"Daylight span",value:`${daylight} minutes`,note:`${data.sunrise}–${data.sunset}`},
      {label:"Tithi changes",value:tithiEnd,note:`Next: ${nextTithiLabel(data)}`},
      {label:"Nakshatra changes",value:nakshatraEnd,note:`Next: ${nextNakshatraLabel(data)}`},
      {label:"Moon illumination",value:`${data.moonIllumination}%`,note:`${data.rashi} Rashi`},
      {label:"Solar Rashi",value:data.solarRashi,note:`Day lord: ${data.dayLord}`},
      {label:"Favorable daytime periods",value:String(favorable.length),note:firstGood&&lastGood?`${firstGood.name} ${firstGood.start} → ${lastGood.name} ${lastGood.end}`:"See Choghadiya table"},
    ],
    fingerprintTitle:`${city.name} Panchang fingerprint for ${data.date}`,
    fingerprintBody:`The sunrise-state combination for this date is ${data.tithi} Tithi, ${data.nakshatra} Nakshatra pada ${data.nakshatraPada}, ${data.yoga} Yoga and ${data.karana} Karana, with the Moon in ${data.rashi} and the Sun in ${data.solarRashi}. This combination is more specific than a generic weekday Panchang because it binds the lunar state to ${city.name}'s own ${data.sunrise} sunrise.`,
    transitionTitle:"What changes during this Panchang day",
    transitionBody:`${data.tithi} continues until ${tithiEnd}, after which the lunar sequence advances to ${nextTithiLabel(data)}. ${data.nakshatra} continues until ${nakshatraEnd}, then advances to ${nextNakshatraLabel(data)}. The transition clocks are calculated for ${city.name}, so a nearby civil date can still show a different sunrise-state combination.`,
    solarTitle:`Solar-day profile in ${city.name}`,
    solarBody:`Sunrise at ${data.sunrise} and sunset at ${data.sunset} create a ${daylight}-minute local daylight span. Rahu Kalam is ${formatWindow(data.rahu)}, Yamaganda is ${formatWindow(data.yamaganda)}, and Gulika Kalam is ${formatWindow(data.gulika)}. ${favorable.length?`The daytime Choghadiya sequence contains ${favorable.length} favorable periods.`:"No daytime period is labelled favorable in the calculated sequence."}`,
    lunarTitle:"Lunar context for this date",
    lunarBody:`The day is in ${data.paksha} Paksha with ${data.moonIllumination}% Moon illumination, a ${moonBand} lunar phase. The Amanta month is ${lunar.amantaLabel}, while the Purnimanta convention gives ${lunar.purnimantaLabel}. Both labels describe the same astronomical day under different month-reckoning systems.`,
  };
}

export function buildMonthlyCalendarQualityContent(city:City,year:number,month:number,entries:ReadonlyArray<MonthlyEntry>,festivals:ReadonlyArray<FestivalSummary>):MonthlyCalendarQualityContent{
  const name=monthName(year,month);
  const ekadashi=compactDates(entries,"Ekadashi");
  const purnima=compactDates(entries,"Purnima");
  const amavasya=compactDates(entries,"Amavasya");
  const keyCount=ekadashi.length+purnima.length+amavasya.length;
  const tithiVariety=new Set(entries.map(entry=>entry.tithi)).size;
  const nakshatraVariety=new Set(entries.map(entry=>entry.nakshatra)).size;
  const abhijitDays=entries.filter(entry=>entry.abhijit!==null).length;
  const favorablePeriods=entries.reduce((sum,entry)=>sum+entry.dayChoghadiya.filter(period=>period.effect==="good").length,0);
  const rahuRange=rangeByClock(entries,entry=>entry.rahu.start);
  const first=entries[0],last=entries[entries.length-1];
  const firstLastRahuDrift=first&&last?clockMinutes(last.rahu.start)-clockMinutes(first.rahu.start):0;
  const festivalSummary=festivals.length
    ? festivals.map(item=>`${item.name} (${item.date})`).join(" · ")
    : "No maintained festival record falls in this Gregorian month.";

  return {
    directAnswer:`${name} ${year} in ${city.name} contains ${entries.length} local Panchang days, ${keyCount} sunrise entries marked as Ekadashi/Purnima/Amavasya, and ${festivals.length} maintained festival date${festivals.length===1?"":"s"}.`,
    facts:[
      {label:"Calendar days",value:String(entries.length),note:`${name} ${year}`},
      {label:"Lunar marker mornings",value:String(keyCount),note:`Ekadashi ${ekadashi.length} · Purnima ${purnima.length} · Amavasya ${amavasya.length}`},
      {label:"Tithi labels at sunrise",value:String(tithiVariety),note:"Distinct monthly sunrise states"},
      {label:"Nakshatras at sunrise",value:String(nakshatraVariety),note:"Distinct monthly sunrise states"},
      {label:"Abhijit available",value:`${abhijitDays} days`,note:`of ${entries.length} local dates`},
      {label:"Favorable Choghadiya periods",value:String(favorablePeriods),note:"Across the full month"},
    ],
    fingerprintTitle:`${name} ${year} month fingerprint for ${city.name}`,
    fingerprintBody:`The local sunrise sequence contains ${tithiVariety} distinct Tithi labels and ${nakshatraVariety} Nakshatras. ${rahuRange?`Because Rahu Kalam is derived from the local daylight span, its start clock ranges by ${rahuRange.range} minutes across the month, from ${rahuRange.earliest.rahu.start} on ${rahuRange.earliest.date} to ${rahuRange.latest.rahu.start} on ${rahuRange.latest.date}.`:""}`,
    lunarTitle:`Lunar rhythm in ${name}`,
    lunarBody:`Ekadashi appears at local sunrise on ${listDates(ekadashi)}. Purnima appears on ${listDates(purnima)}, and Amavasya appears on ${listDates(amavasya)}. These markers are taken from the ${city.name} sunrise state for each civil date rather than copied from a national placeholder.`,
    solarTitle:`Local daylight-derived timing movement through ${name}`,
    solarBody:`${rahuRange?`Rahu Kalam starts between ${rahuRange.earliest.rahu.start} and ${rahuRange.latest.rahu.start} across the month. From the first listed day to the last, the Rahu start clock moves ${signedMinutes(firstLastRahuDrift)}. Abhijit is available on ${abhijitDays} of ${entries.length} dates, and the full month contains ${favorablePeriods} favorable daytime Choghadiya periods.`:"Local timing-range data is unavailable for this month."}`,
    festivalBody:`Maintained festival signal for ${name}: ${festivalSummary}`,
  };
}

export function buildYearlyCalendarQualityContent(city:City,year:number,snapshots:ReadonlyArray<Panchang>,festivals:ReadonlyArray<FestivalSummary>):YearlyCalendarQualityContent{
  const sunrise=rangeByTime(snapshots,"sunrise");
  const tithiVariety=new Set(snapshots.map(entry=>`${entry.paksha}:${entry.tithi}`)).size;
  const nakshatraVariety=new Set(snapshots.map(entry=>entry.nakshatra)).size;
  const festivalCounts=new Map<number,number>();
  for(const festival of festivals){
    const month=Number(festival.date.slice(5,7));
    festivalCounts.set(month,(festivalCounts.get(month)??0)+1);
  }
  const maxFestivalCount=Math.max(0,...festivalCounts.values());
  const concentratedMonths=maxFestivalCount
    ? [...festivalCounts.entries()].filter(([,count])=>count===maxFestivalCount).map(([month])=>monthName(year,month))
    : [];
  const first=snapshots[0],last=snapshots[snapshots.length-1];
  const annualFirstDayDrift=first&&last?clockMinutes(last.sunrise)-clockMinutes(first.sunrise):0;
  const festivalBody=festivals.length
    ? `${festivals.length} maintained festival dates are linked to ${city.name} in ${year}. ${concentratedMonths.length?`${concentratedMonths.join(" / ")} carries ${maxFestivalCount} maintained festival date${maxFestivalCount===1?"":"s"}, the highest concentration in the current dataset.`:""}`
    : `No validated festival records are currently stored for ${year}; Panchvani does not synthesize missing festival dates.`;

  return {
    directAnswer:`The ${year} ${city.name} Hindu calendar connects 12 local monthly Panchang pages. The first-day monthly snapshots contain ${tithiVariety} distinct Paksha/Tithi states, ${nakshatraVariety} Nakshatras, and ${festivals.length} maintained festival dates across the year.`,
    facts:[
      {label:"Monthly local hubs",value:"12",note:`${city.name} coordinates`},
      {label:"First-day Tithi states",value:String(tithiVariety),note:"Distinct Paksha + Tithi combinations"},
      {label:"First-day Nakshatras",value:String(nakshatraVariety),note:"Across 12 monthly snapshots"},
      {label:"Maintained festivals",value:String(festivals.length),note:`Validated ${year} dataset`},
      {label:"Earliest month-start sunrise",value:sunrise?.earliest.sunrise??"—",note:sunrise?monthNameFromIso(sunrise.earliest.date):"No snapshot"},
      {label:"Latest month-start sunrise",value:sunrise?.latest.sunrise??"—",note:sunrise?monthNameFromIso(sunrise.latest.date):"No snapshot"},
    ],
    fingerprintTitle:`${city.name} ${year} calendar fingerprint`,
    fingerprintBody:`The 12 month-start Panchang snapshots vary across ${tithiVariety} Paksha/Tithi states and ${nakshatraVariety} Nakshatras. ${sunrise?`Their sunrise clocks span ${sunrise.range} minutes between the earliest and latest month-start values.`:""} This gives the yearly hub a location-specific solar/lunar signature instead of treating every city as the same annual template.`,
    seasonalTitle:`Seasonal solar movement in ${city.name}`,
    seasonalBody:`${sunrise?`Among the first-day snapshots, the earliest sunrise is ${sunrise.earliest.sunrise} in ${monthNameFromIso(sunrise.earliest.date)}, and the latest is ${sunrise.latest.sunrise} in ${monthNameFromIso(sunrise.latest.date)}. From January 1 to December 1, the sunrise clock moves ${signedMinutes(annualFirstDayDrift)}.`:"Seasonal sunrise snapshots are unavailable."}`,
    lunarTitle:"How the lunar state changes across month starts",
    lunarBody:`The month cards sample the Tithi and Nakshatra active at local sunrise on the first civil day of each Gregorian month. Across ${year}, those 12 checkpoints produce ${tithiVariety} distinct Paksha/Tithi combinations and ${nakshatraVariety} Nakshatras for ${city.name}.`,
    festivalBody,
  };
}
