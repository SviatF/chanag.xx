export type MuhuratCityMonthHeading={
  primary:string;
  period:string;
  full:string;
};

export function muhuratMonthName(year:number,month:number){
  return new Intl.DateTimeFormat("en-IN",{month:"long",timeZone:"Asia/Kolkata"}).format(new Date(Date.UTC(year,month-1,1)));
}

export function buildMuhuratCityMonthHeading(eventTitle:string,cityName:string,year:number,month:number):MuhuratCityMonthHeading{
  const monthName=muhuratMonthName(year,month);
  const primary=`${eventTitle} in ${cityName}`;
  const period=`${monthName} ${year}`;
  return {primary,period,full:`${primary} — ${period}`};
}
