import {supportedCities} from "./cities";
import {todayInIndia} from "./dates";
import {isPriorityCity} from "./seo-policy";

export const sitemapPriorityCities=supportedCities.filter(city=>isPriorityCity(city.slug));

export function rollingDailyDates(pastDays=14,futureDays=45){
  const base=todayInIndia();
  const dates:string[]=[];
  for(let offset=-pastDays;offset<=futureDays;offset++){
    const date=new Date(base);
    date.setUTCDate(date.getUTCDate()+offset);
    dates.push(date.toISOString().slice(0,10));
  }
  return dates;
}

export type SitemapMonth={year:number;month:number;slug:string};

export function rollingMonths(backMonths=2,forwardMonths=12):SitemapMonth[]{
  const now=todayInIndia();
  const baseYear=now.getUTCFullYear();
  const baseMonth=now.getUTCMonth();
  const rows:SitemapMonth[]=[];
  for(let offset=-backMonths;offset<=forwardMonths;offset++){
    const date=new Date(Date.UTC(baseYear,baseMonth+offset,1,6));
    const month=date.getUTCMonth()+1;
    rows.push({year:date.getUTCFullYear(),month,slug:String(month).padStart(2,"0")});
  }
  return rows;
}
