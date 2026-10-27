/** Source-publication comparisons only. Never a ritual eligibility API. */
/** 24+ time on a sunrise-day convention: 29:22+ on Sep 12 is Sep 13 05:22. */
export function normalizePublishedPlusClock(printedDay:string,printedTime:string):string{
 const date=new Date(printedDay+"T00:00:00Z");
 if(!/^\d{4}-\d{2}-\d{2}$/.test(printedDay)||Number.isNaN(date.getTime())||date.toISOString().slice(0,10)!==printedDay)
   throw Error("Invalid published day");
 if(!/^(?:[01]\d|2\d|3\d|4[0-7]):[0-5]\d\+?$/.test(printedTime))
   throw Error("Invalid published plus-clock");
 const plus=printedTime.endsWith("+");
 const h=+printedTime.slice(0,2),m=+printedTime.slice(3,5);
 if((h>=24&&!plus)||(h<24&&plus))throw Error("Invalid plus-clock suffix");
 const dayShift=Math.floor(h/24);
 const target=new Date(date.getTime()+dayShift*86400000).toISOString().slice(0,10);
 return target+"T"+String(h%24).padStart(2,"0")+":"+String(m).padStart(2,"0");
}
export type PublishedParana={city:"delhi";event:"Devutthana Ekadashi";year:2026;
  tradition:"Smarta"|"Gauna/Vaishnava"|"ISKCON Delhi";
  fastDate:string;paranaDate:string;start:string;end:string;publisherKey:string;
  ritualMethodCertified:false;computedByPanchvani:false;};
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const TIME=/^([01]\d|2[0-3]):[0-5]\d$/;
function validDate(s:string){if(!DATE.test(s))return false;const d=new Date(s+"T00:00:00Z");return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===s;}
function minutes(s:string){return +s.slice(0,2)*60+(+s.slice(3,5));}
function dayAfter(s:string){const d=new Date(s+"T00:00:00Z");return new Date(d.getTime()+86400000).toISOString().slice(0,10);}
export function validatePublishedParana(records:readonly PublishedParana[]):string[]{
 const issues:string[]=[];
 for(const r of records){
  const id=r.tradition+"/"+r.fastDate;
  if(r.city!=="delhi"||r.year!==2026||r.event!=="Devutthana Ekadashi"||!validDate(r.fastDate)||!validDate(r.paranaDate))issues.push(id+":invalid-scope-or-date");
  if(validDate(r.fastDate)&&validDate(r.paranaDate)&&dayAfter(r.fastDate)!==r.paranaDate)issues.push(id+":not-following-day");
  if(!TIME.test(r.start)||!TIME.test(r.end)||minutes(r.start)>=minutes(r.end))issues.push(id+":invalid-parana-clock");
  if(r.ritualMethodCertified!==false||r.computedByPanchvani!==false)issues.push(id+":unwarranted-approval");
 }
 const traditions=new Set(records.map(r=>r.tradition));
 if(traditions.size!==records.length)issues.push("duplicate-tradition");
 const vaishnava=records.filter(r=>r.tradition!=="Smarta");
 if(vaishnava.length===2&&vaishnava[0].paranaDate!==vaishnava[1].paranaDate)issues.push("unresolved-vaishnava-fast-date");
 if(vaishnava.length===2&&vaishnava[0].end===vaishnava[1].end)issues.push("lost-method-difference");
 return issues;
}
export const delhiDevutthana2026:readonly PublishedParana[]=[
 {city:"delhi",event:"Devutthana Ekadashi",year:2026,tradition:"Smarta",fastDate:"2026-11-20",paranaDate:"2026-11-21",start:"13:11",end:"15:18",publisherKey:"drik",ritualMethodCertified:false,computedByPanchvani:false},
 {city:"delhi",event:"Devutthana Ekadashi",year:2026,tradition:"Gauna/Vaishnava",fastDate:"2026-11-21",paranaDate:"2026-11-22",start:"06:49",end:"08:56",publisherKey:"drik",ritualMethodCertified:false,computedByPanchvani:false},
 {city:"delhi",event:"Devutthana Ekadashi",year:2026,tradition:"ISKCON Delhi",fastDate:"2026-11-21",paranaDate:"2026-11-22",start:"06:49",end:"10:21",publisherKey:"iskcon-delhi",ritualMethodCertified:false,computedByPanchvani:false},
] as const;
/** An example can be displayed to teach distinct publishing conventions only. */
export function delhiParanaPublicationExample(slug:string,city:string,year:number){
 if(slug!=="ekadashi"||city!=="delhi"||year!==2026)return null;
 return delhiDevutthana2026;
}
