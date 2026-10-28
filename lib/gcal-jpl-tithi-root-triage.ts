/**
 * Physically separate, research-only JPL DE440s phase versus original GCal
 * and Swiss/Moshier at the EXACT SAME observer-clock instant.
 * The JPL source is a pinned 4512-transition 6° table; 12° Tithi edges are
 * exactly its even-indexed entries, never interpolated midpoint estimates.
 */
import type {JplHalfTithiTable} from "./jpl-v6-tithi-karana-canary";
import {jplHalfTithiAtMs} from "./jpl-v6-tithi-karana-canary";
export const ORIGINAL_GCAL_SHA="1d20f6e0caf29b6293157d258d02287e4edf0481" as const;
export const ORIGINAL_JPL_KERNEL_SHA="c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2" as const;
const DAY=86400000,IST=330*60000;
export function originalGcalISTSunriseUtcMs(date:string,sunriseXml:string):number{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||new Date(date+"T00:00:00Z").toISOString().slice(0,10)!==date)
  throw Error("Invalid GCal source civil date");
 const m=sunriseXml?.match(/^<sunrise\b[^>]*\btime="(\d{2}):(\d{2}):(\d{2})"/);
 if(!m)throw Error("Original GCal XML missing sunrise clock");
 const [hh,mm,ss]=m.slice(1).map(Number);
 if(hh>23||mm>59||ss>59)throw Error("Invalid source sunrise clock");
 return Date.parse(date+"T00:00:00Z")+((hh*60+mm)*60+ss)*1000-IST;
}
export function originalGcalTithiAtSunrise(sunriseXml:string):number{
 const m=sunriseXml?.match(/<tithi\b[^>]*\bindex="(\d+)"/);
 if(!m)throw Error("GCal source sunrise is missing indexed tithi");
 const n=Number(m[1]);
 if(!Number.isInteger(n)||n<1||n>30)throw Error("GCal source tithi index out of range");
 // GCal 1–15 Krishna then 16–30 Gaura, Swiss 0–14 Shukla and 15–29 Krishna.
 return (n+14)%30;
}
export function jplTithiClockAt(table:JplHalfTithiTable,utcMs:number){
 if(table.kernelSha256!==ORIGINAL_JPL_KERNEL_SHA||table.halfTithiBoundaryCount!==4512||
    table.ritualSelectionCertified!==false||table.canaryOnly!==true)
  throw Error("Non-pinned or production-approved JPL research source");
 return jplHalfTithiAtMs(table,utcMs).tithiIndex;
}
export type JplEdge={utcMs:number;index:number};
export function jplTithiEdges(table:JplHalfTithiTable):JplEdge[]{
 const a=table.halfTithiTransitions.filter(x=>x[1]%2===0).map(x=>({utcMs:x[0],index:x[1]/2}));
 if(a.length<2200)throw Error("Missing exact 12-degree JPL Tithi boundaries");
 for(let i=1;i<a.length;i++)if(a[i].utcMs<=a[i-1].utcMs||
     a[i].index!==(a[i-1].index+1)%30)throw Error("Broken JPL Tithi sequence");
 return a;
}
/** Returns the real nearest 12° JPL boundary, signed UTC distance, not 6° Karana. */
export function nearestJplTithiEdge(edges:JplEdge[],at:number){
 if(!Number.isFinite(at))throw Error("Invalid source clock");
 let low=0,high=edges.length;
 while(low<high){const m=(low+high)>>>1;if(edges[m].utcMs<at)low=m+1;else high=m;}
 const candidates=[edges[low-1],edges[low]].filter(Boolean);
 if(!candidates.length)throw Error("Missing JPL physical root");
 const edge=candidates.sort((x,y)=>Math.abs(x.utcMs-at)-Math.abs(y.utcMs-at))[0];
 return {...edge,secondsFromEdge:(at-edge.utcMs)/1000};
}
export type Concordance="ALL_AGREE"|"GCAL_AND_JPL_AGREE_SWISS_DIFFERS"|
 "SWISS_AND_JPL_AGREE_GCAL_DIFFERS"|"GCAL_AND_SWISS_AGREE_JPL_DIFFERS"|"THREE_WAY_DISAGREEMENT";
export function concordance(gcal:number,swiss:number,jpl:number):Concordance{
 if([gcal,swiss,jpl].some(n=>!Number.isInteger(n)||n<0||n>29))
  throw Error("Invalid cross-model Tithi state");
 if(gcal===swiss&&swiss===jpl)return "ALL_AGREE";
 if(gcal===jpl)return "GCAL_AND_JPL_AGREE_SWISS_DIFFERS";
 if(swiss===jpl)return "SWISS_AND_JPL_AGREE_GCAL_DIFFERS";
 if(gcal===swiss)return "GCAL_AND_SWISS_AGREE_JPL_DIFFERS";
 return "THREE_WAY_DISAGREEMENT";
}
export const NO_PUBLISH={independentlyCertified:false,publicRitualApproval:false,
 tithiModelSelectedForPublicCalendar:false,autoPublishRitualDates:false} as const;
