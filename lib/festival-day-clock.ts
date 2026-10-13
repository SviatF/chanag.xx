/**
 * Shared civil-day phase semantics for all festival narratives.
 * Times are India-local; explicit event dates prevent accidental +24h rollovers.
 */
export function localClockMinutes(value:string):number|null{
  const match=/^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  return match?Number(match[1])*60+Number(match[2]):null;
}
export function localDateOffset(date:string|null|undefined,baseDate:string):number|null{
  if(!date||date===baseDate)return 0;
  const current=Date.parse(`${baseDate}T00:00:00Z`);
  const target=Date.parse(`${date}T00:00:00Z`);
  if(!Number.isFinite(current)||!Number.isFinite(target))return null;
  return Math.round((target-current)/86400000);
}
export function localDayPhase(time:string,eventDate:string|null|undefined,baseDate:string,sunrise:string,sunset:string):string{
  const minute=localClockMinutes(time),offset=localDateOffset(eventDate,baseDate);
  const rise=localClockMinutes(sunrise),set=localClockMinutes(sunset);
  if(minute===null||offset===null||rise===null||set===null||set<=rise)return "time unavailable";
  if(offset<0)return "the previous local day";
  if(offset>0)return "the following local day";
  if(minute<rise)return "the pre-sunrise period";
  if(minute===rise)return "the sunrise boundary";
  if(minute>set)return "the post-sunset period";
  if(minute===set)return "the sunset boundary";
  const ratio=(minute-rise)/(set-rise);
  if(ratio<0.2)return "opening daylight";
  if(ratio<0.4)return "morning";
  if(ratio<0.6)return "midday";
  if(ratio<0.8)return "afternoon";
  return "late daylight";
}
export function localMoonriseRelation(data:{
  date:string;sunrise:string;sunset:string;
  moonrise:string;moonriseDate:string|null|undefined;
}):{key:string;text:string;delta:number|null}{
  const moon=localClockMinutes(data.moonrise),set=localClockMinutes(data.sunset);
  const rise=localClockMinutes(data.sunrise);
  const offset=localDateOffset(data.moonriseDate,data.date);
  if(moon===null||set===null||rise===null||offset===null){
    return {key:"unavailable",text:"moonrise time is unavailable for this local date",delta:null};
  }
  const actual=moon+offset*1440,delta=actual-set;
  if(offset<0)return {key:"previous-day",text:"the recorded moonrise belongs to the previous local date",delta};
  if(offset===0&&actual<rise)return {key:"pre-dawn",text:"moonrise occurs before local sunrise",delta};
  if(delta<0)return {key:"daylight",text:`moonrise occurs in local daylight, ${Math.abs(delta)} minutes before sunset`,delta};
  if(delta===0)return {key:"sunset",text:"moonrise coincides with local sunset",delta};
  if(offset>0)return {key:"following-day",text:`moonrise occurs on the following local date at ${data.moonrise}`,delta};
  if(delta<=60)return {key:"near-sunset",text:"moonrise follows sunset within about an hour",delta};
  if(delta<=180)return {key:"early-night",text:"moonrise falls in the early local night",delta};
  if(delta<=360)return {key:"mid-night",text:"moonrise falls deeper into the first half of night",delta};
  return {key:"late-night",text:"moonrise occurs well after local sunset",delta};
}
