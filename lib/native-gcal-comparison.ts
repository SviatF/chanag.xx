/** GCal XML contains ordinary Navami, Ashtami, Purnima fasts as well. */
export type NativeFast={date:string;sunriseTithi:string;arunodayaTithi?:string};
export function isGcalEkadashiFast(f:NativeFast):boolean{
 return /^(?:Ekadasi|Dvadasi) \(suitable for fasting\)$/.test(f.sunriseTithi.trim());
}
export const MONTHS:Record<string,string>={Jan:"01",Feb:"02",Mar:"03",Apr:"04",May:"05",Jun:"06",Jul:"07",Aug:"08",Sep:"09",Oct:"10",Nov:"11",Dec:"12"};
export function isoGcalNativeDate(s:string){
 const m=s.match(/^(\d{1,2})\s+([A-Z][a-z]{2})\s+(20\d{2})$/);
 if(!m||!MONTHS[m[2]])throw Error("Invalid original GCal date: "+s);
 const out=m[3]+"-"+MONTHS[m[2]]+"-"+m[1].padStart(2,"0");
 if(new Date(out+"T00:00:00Z").toISOString().slice(0,10)!==out)throw Error("Invalid date "+out);
 return out;
}
export function shardFor(city:string,year:number,count:number){
 if(!Number.isInteger(count)||count<1||count>128)throw Error("Invalid shard count");
 const text=city+"|"+year;let state=2166136261;
 for(const char of text){state=Math.imul(state^char.charCodeAt(0),16777619)>>>0;}
 return state%count;
}
