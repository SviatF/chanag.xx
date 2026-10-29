/**
 * Research-only counterfactual input for the SAME independent ISKCON rules.
 * Changing only Moon/Sun Tithi = causal ephemeris experiment.
 * Optional JPL sidereal Moon Nakshatra is a separate experiment and requires
 * pinned Lahiri anchors; NOT independently certified traditional ayanamsa.
 *
 * Neither original GCal labels nor GCal clocks are available to this module.
 */
import type {DawnTithi} from "./independent-mahadvadashi";
import type {JplHalfTithiTable} from "./jpl-v6-tithi-karana-canary";
import {jplHalfTithiAtMs} from "./jpl-v6-tithi-karana-canary";
import type {VerifiedV6SiderealSource} from "./v6-unified-calendar-staging";
import {siderealStateAtUtc} from "./jpl-v6-sidereal-transitions";
export const JPL_OBSERVANCE_RESEARCH_ONLY=true as const;
export type ResearchDawnInput={
 date:string;sunriseUtcMs:number;arunodayaUtcMs:number;
 sunriseTithiIndex:number;arunodayaTithiIndex:number;
 sunriseNakshatraIndex:number;sunriseNakshatraBoundaryMinutes:number;
 nearFiveMinuteAstronomicalBoundary:boolean
};
const nearest=(roots:readonly [number,number][],at:number)=>{
 let lo=0,hi=roots.length;
 while(lo<hi){const mid=(lo+hi)>>>1;if(roots[mid][0]<at)lo=mid+1;else hi=mid;}
 return Math.min(lo>0?Math.abs(roots[lo-1][0]-at):Infinity,
  lo<roots.length?Math.abs(roots[lo][0]-at):Infinity);
};
const tithiCache=new WeakMap<JplHalfTithiTable,readonly [number,number][]>();
/** A real 12-degree Moon-Sun transition, not a 6-degree Karana edge. */
export function nearestJplTithiBoundaryMs(table:JplHalfTithiTable,at:number){
 let edges=tithiCache.get(table);
 if(!edges){edges=table.halfTithiTransitions.filter(([,index])=>index%2===0);tithiCache.set(table,edges);}
 return nearest(edges,at);
}
export function researchDawn(
 obs:ResearchDawnInput,table:JplHalfTithiTable,
 source:VerifiedV6SiderealSource,
 mode:"jpl-tithi-swiss-nakshatra"|"jpl-tithi-jpl-nakshatra"
):DawnTithi{
 if(!Number.isFinite(obs.sunriseUtcMs)||!Number.isFinite(obs.arunodayaUtcMs)||
  obs.sunriseUtcMs-obs.arunodayaUtcMs<95*60000||
  obs.sunriseUtcMs-obs.arunodayaUtcMs>97*60000||
  !/^\d{4}-\d{2}-\d{2}$/.test(obs.date))
  throw Error("Invalid independently observed Swiss dawn instant");
 const tithi=jplHalfTithiAtMs(table,Math.round(obs.sunriseUtcMs)).tithiIndex;
 const atArunodaya=jplHalfTithiAtMs(table,Math.round(obs.arunodayaUtcMs)).tithiIndex;
 const near=nearestJplTithiBoundaryMs(table,obs.sunriseUtcMs)<=5*60000||
  nearestJplTithiBoundaryMs(table,obs.arunodayaUtcMs)<=5*60000;
 const jplNak=mode==="jpl-tithi-jpl-nakshatra"?
  siderealStateAtUtc(source.table,new Date(Math.round(obs.sunriseUtcMs)).toISOString()):null;
 const nearNak=jplNak!==null?
  nearest(source.table.events.nakshatra,obs.sunriseUtcMs)<=5*60000:
  obs.sunriseNakshatraBoundaryMinutes<=5;
 return {date:obs.date,sunriseIndex:tithi,arunodayaIndex:atArunodaya,
  nearBoundary:near,
  nakshatraIndex:jplNak?.nakshatra.index??obs.sunriseNakshatraIndex,
  nearNakshatraBoundary:nearNak};
}
export const RESEARCH_OBSERVANCE_RELEASE_GUARD={
 publicCalendarChanged:false,publicRitualApproval:false,
 independentTraditionCertified:false,paranaApproved:false,
 jplSiderealAyanamsaFullyIndependent:false
} as const;
