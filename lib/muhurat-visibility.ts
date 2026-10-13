import {todayInIndia} from "./dates";

/** The live/current month advertises only dates from today's India civil day.
 * Historical months retain their archive; future months retain full planning horizon.
 * This is a presentation filter, NOT an additional astronomical or ritual rule.
 */
export function visibleMonthMuhuratRows<T extends {date:string}>(
  rows:ReadonlyArray<T>,year:number,month:number,asOf=todayInIndia()
):T[]{
  const thisYear=asOf.getUTCFullYear(),thisMonth=asOf.getUTCMonth()+1;
  if(thisYear!==year||thisMonth!==month)return [...rows];
  const today=asOf.toISOString().slice(0,10);
  return rows.filter(row=>row.date>=today);
}
