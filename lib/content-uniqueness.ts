import type {City} from "./cities";
import type {Panchang} from "./panchang";
import type {VratDefinition,VratOccurrence} from "./vrat";

function clockMinutes(value:string){
  const [hours,minutes]=value.split(":").map(Number);
  return Number.isFinite(hours)&&Number.isFinite(minutes)?hours*60+minutes:0;
}

function spanMinutes(start:string,end:string){
  const a=clockMinutes(start),b=clockMinutes(end);
  return b>=a?b-a:b+1440-a;
}

function regionVoice(city:City){
  if(city.lng>=82)return "eastern solar profile";
  if(city.lng<=74.5)return "western solar profile";
  if(city.lat<=16)return "southern latitude profile";
  if(city.lat>=27)return "northern latitude profile";
  return "central-India solar profile";
}

function daylightBand(minutes:number){
  if(minutes>=780)return "a long daylight span";
  if(minutes<=690)return "a compact daylight span";
  return "a moderate daylight span";
}

export function buildDailyDataNarrative(data:Panchang,city:City){
  const daylight=spanMinutes(data.sunrise,data.sunset);
  const favorable=data.dayChoghadiya.filter(period=>period.effect==="good");
  const first=favorable[0];
  const moon=data.moonIllumination>=70?"a bright Moon":data.moonIllumination<=30?"a darker lunar phase":"a mid-range lunar illumination";
  const abhijit=data.abhijit
    ? `Abhijit is available at ${data.abhijit.start}–${data.abhijit.end}, so it can be compared directly with the local avoid periods.`
    : `No Abhijit interval is exposed for this ${data.weekday}, which puts more weight on the favorable Choghadiya sequence.`;
  return `${data.weekday} in ${city.name} opens with ${data.tithi} Tithi in ${data.paksha} Paksha and ${data.nakshatra} Nakshatra. ${city.name}'s ${regionVoice(city)} produces ${daylightBand(daylight)} of about ${daylight} minutes from ${data.sunrise} to ${data.sunset}; ${first?`${first.name} is the first favorable daytime Choghadiya at ${first.start}–${first.end}`:"the table below carries the full local Choghadiya sequence"}. With ${moon}, the lunar context is materially different from a date that shares the same weekday but has another Tithi or Nakshatra. ${abhijit}`;
}

export function buildChoghadiyaNarrative(data:Panchang,city:City){
  const daylight=spanMinutes(data.sunrise,data.sunset);
  const favorable=data.dayChoghadiya.filter(period=>period.effect==="good");
  const opening=data.dayChoghadiya[0];
  const firstGood=favorable[0];
  const lastGood=favorable[favorable.length-1];
  const rahuPosition=clockMinutes(data.rahu.start)<clockMinutes(data.sunrise)+daylight/2?"first half":"second half";
  const sequence=favorable.map(period=>period.name).join(", ")||"no favorable daytime label";
  const locationLine=city.lng>=82
    ? `Because ${city.name} sits farther east, its solar-day clock can begin noticeably earlier than western-city examples even though the weekday sequence is the same.`
    : city.lng<=74.5
      ? `The western longitude of ${city.name} shifts the local solar clock later than many eastern-city examples, so copied national clock times would be misleading.`
      : `For ${city.name}, the useful distinction is the local sunrise/sunset span rather than a generic India-wide clock schedule.`;
  return `${data.weekday}'s daytime sequence in ${city.name} begins with ${opening?.name??"the first calculated period"} and contains ${favorable.length} favorable periods: ${sequence}. ${daylightBand(daylight)} of about ${daylight} minutes means each daytime Choghadiya lasts roughly ${Math.round(daylight/8)} minutes. Rahu Kalam falls in the ${rahuPosition} of the solar day at ${data.rahu.start}–${data.rahu.end}; ${firstGood&&lastGood?`the favorable run stretches from ${firstGood.name} at ${firstGood.start} to ${lastGood.name} ending ${lastGood.end}`:"use the table for the complete sequence"}. ${locationLine}`;
}

function weekdayLeader(rows:VratOccurrence[]){
  const counts=new Map<string,number>();
  for(const row of rows)counts.set(row.weekday,(counts.get(row.weekday)??0)+1);
  return [...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]?.[0]??"the listed weekdays";
}

export function buildVratCityNarrative(vrat:VratDefinition,year:number,city:City,rows:VratOccurrence[]){
  if(!rows.length)return `${city.name} has no ${vrat.name} sunrise observation in ${year} under the current Tithi rule, so Panchvani does not manufacture a city schedule from a national placeholder.`;
  const repeated=rows.filter(row=>row.repeatedAtSunrise).length;
  const shukla=rows.filter(row=>row.paksha==="Shukla").length;
  const krishna=rows.filter(row=>row.paksha==="Krishna").length;
  const dominant=shukla===krishna?"an even Shukla/Krishna split":shukla>krishna?"more Shukla-paksha observations":"more Krishna-paksha observations";
  const first=rows[0],last=rows[rows.length-1];
  const repeatSentence=repeated
    ? `${repeated} observation${repeated===1?"":"s"} repeat at consecutive local sunrises, a signal that the Tithi boundary sits close enough to sunrise to deserve city-level attention.`
    : `None of the listed observations repeats across consecutive local sunrises, so every retained date is a single-sunrise occurrence for this city.`;
  const geography=city.lng>=82
    ? `The eastern solar profile matters most when a Tithi transition occurs between ${city.name}'s earlier sunrise and the later sunrise of a western city.`
    : city.lng<=74.5
      ? `With a western solar profile, ${city.name}'s sunrise can occur after eastern cities have already assigned the lunar state to their civil date.`
      : city.lat<=16
        ? `At ${city.name}'s southern latitude, seasonal sunrise movement is smaller than in many northern cities, but near-sunrise Tithi transitions can still change the date assignment.`
        : `The local sunrise remains the deciding checkpoint in ${city.name}; longitude and season can move that checkpoint relative to another city.`;
  return `The ${year} ${vrat.name} list for ${city.name} contains ${rows.length} sunrise observations from ${first.date} to ${last.date}, with ${dominant}; ${weekdayLeader(rows)} appears most often among the retained dates. ${repeatSentence} ${geography}`;
}

export function normalizeUniquenessText(value:string,ignoredTokens:string[]=[]){
  let normalized=value.toLowerCase().normalize("NFKC");
  for(const token of ignoredTokens.filter(Boolean).sort((a,b)=>b.length-a.length)){
    normalized=normalized.replaceAll(token.toLowerCase().normalize("NFKC")," ");
  }
  return normalized
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g," ")
    .replace(/\b\d+(?::\d+)?\b/g," ")
    .replace(/[^\p{L}\p{M}]+/gu," ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function jaccardTextSimilarity(a:string,b:string,ignoredTokens:string[]=[]){
  const shingles=(value:string)=>{
    const words=normalizeUniquenessText(value,ignoredTokens);
    if(words.length<2)return new Set(words);
    return new Set(words.slice(0,-1).map((word,index)=>`${word} ${words[index+1]}`));
  };
  const left=shingles(a),right=shingles(b);
  if(!left.size&&!right.size)return 1;
  let intersection=0;
  for(const item of left)if(right.has(item))intersection++;
  const union=new Set([...left,...right]).size;
  return union?intersection/union:0;
}
