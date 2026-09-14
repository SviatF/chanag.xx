export const KYIV_TIME_ZONE="Europe/Kyiv";
export const GSC_DAILY_CRONS=["0 21 * * *","0 22 * * *"] as const;

export function isKyivMidnight(input:Date|number){
  const date=input instanceof Date?input:new Date(input);
  const parts=new Intl.DateTimeFormat("en-GB",{
    timeZone:KYIV_TIME_ZONE,
    hour:"2-digit",
    minute:"2-digit",
    hourCycle:"h23",
  }).formatToParts(date);
  const hour=parts.find(part=>part.type==="hour")?.value;
  const minute=parts.find(part=>part.type==="minute")?.value;
  return hour==="00"&&minute==="00";
}

export function isGscDailyCron(cron:string){
  return (GSC_DAILY_CRONS as readonly string[]).includes(cron);
}

export function shouldRunGscDailyAtKyivMidnight(cron:string,scheduledTime:number){
  return isGscDailyCron(cron)&&isKyivMidnight(scheduledTime);
}
