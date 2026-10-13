import type {Panchang} from "./panchang";
import type {TruthReference} from "./content-truth-references";
type Finding={field:string;severity:"error"|"warning";explanation:string};
function clock(value:string):number|null{
  const m=/^([01]\\d|2[0-3]):([0-5]\\d)$/.exec(value);
  return m?Number(m[1])*60+Number(m[2]):null;
}
function dayDistance(start:string,end:string):number|null{
  if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(start)||!/^\\d{4}-\\d{2}-\\d{2}$/.test(end))return null;
  const x=Date.parse(start+"T00:00:00Z"),y=Date.parse(end+"T00:00:00Z");
  return Number.isFinite(x)&&Number.isFinite(y)?Math.round((y-x)/86400000):null;
}
function duration(start:string,end:string):number|null{
  const s=clock(start),e=clock(end);
  return s===null||e===null?null:e-s;
}
/** Internal arithmetic/chronology checks are not independent astronomical validation. */
export function checkPanchangIntegrity(data:Panchang):Finding[]{
  const result:Finding[]=[];
  const fail=(field:string,explanation:string)=>result.push({field,severity:"error",explanation});
  if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(data.date))fail("date","Invalid civil date");
  const daylight=duration(data.sunrise,data.sunset);
  if(daylight===null||daylight<500||daylight>950)fail("solar-day",`Implausible India-local sunrise/sunset span: ${data.sunrise}–${data.sunset}`);
  for(const [field,window] of [["rahu",data.rahu],["yamaganda",data.yamaganda],["gulika",data.gulika]] as const){
    const span=duration(window.start,window.end);
    if(span===null||span<=0||span>150)fail(field,`Implausible exclusion interval: ${window.start}–${window.end}`);
    if(clock(window.start)!==null&&clock(data.sunrise)!==null&&clock(window.start)!<clock(data.sunrise)!)fail(field,"Exclusion begins before sunrise");
    if(clock(window.end)!==null&&clock(data.sunset)!==null&&clock(window.end)!>clock(data.sunset)!)fail(field,"Exclusion extends after sunset");
  }
  for(const [field,time,when] of [
    ["tithiEnd",data.tithiEnd,data.tithiEndDate],
    ["nakshatraEnd",data.nakshatraEnd,data.nakshatraEndDate],
    ["moonrise",data.moonrise,data.moonriseDate],
    ["moonset",data.moonset,data.moonsetDate],
  ] as const){
    if(time==="—"){if(when!==null)fail(field,"Missing event time has an event date");continue;}
    if(clock(time)===null)fail(field,`Malformed clock ${time}`);
    const offset=when?dayDistance(data.date,when):null;
    if(offset===null||offset<0||offset>2)fail(field,`Missing or implausible event date ${when}`);
  }
  if(data.dayChoghadiya.length!==8||data.nightChoghadiya.length!==8)fail("choghadiya","Expected 8 daytime and 8 nighttime periods");
  for(const [label,entries] of [["day",data.dayChoghadiya],["night",data.nightChoghadiya]] as const){
    let previousEnd:number|null=null;
    for(const [index,item] of entries.entries()){
      const start=clock(item.start),end=clock(item.end);
      const absoluteStart=start===null?null:start+item.startDayOffset*1440;
      const absoluteEnd=end===null?null:end+item.endDayOffset*1440;
      if(absoluteStart===null||absoluteEnd===null||absoluteEnd<=absoluteStart)fail(`${label}-choghadiya`,`Invalid window ${index+1}`);
      if(previousEnd!==null&&absoluteStart!==null&&Math.abs(previousEnd-absoluteStart)>2)fail(`${label}-choghadiya`,`Gap or overlap before segment ${index+1}`);
      previousEnd=absoluteEnd;
    }
  }
  if(data.nakshatraPada<1||data.nakshatraPada>4)fail("nakshatraPada",`Invalid Pada ${data.nakshatraPada}`);
  if(data.moonIllumination<0||data.moonIllumination>100)fail("moonIllumination",`Invalid illumination ${data.moonIllumination}`);
  return result;
}
export function checkAgainstReference(
  data:Panchang,reference:TruthReference
):Finding[]{
  const findings:Finding[]=[];
  if(data.date!==reference.date)findings.push({field:"date",severity:"error",explanation:`Expected ${reference.date}; got ${data.date}`});
  for(const [field,expected] of Object.entries(reference.values)){
    const actual=(data as unknown as Record<string,unknown>)[field];
    if(typeof actual!=="string"){findings.push({field,severity:"error",explanation:`No factual value for ${field}`});continue;}
    const wanted=clock(expected),got=clock(actual);
    const diff=wanted!==null&&got!==null?Math.abs(wanted-got):null;
    if(diff!==null){
      if(diff>reference.toleranceMinutes)findings.push({field,severity:"error",explanation:`${actual} vs independent ${expected} (${diff} min)`});
    }else if(actual!==expected){
      findings.push({field,severity:"error",explanation:`${actual} vs independent ${expected}`});
    }
  }
  return findings;
}
