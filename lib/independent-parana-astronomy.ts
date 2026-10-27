/**
 * Astronomically independent of the GCal executable: Swiss/MoSeph UT Sun and
 * Moon longitudes, numerical tithi-boundary bisection and local rise/set times.
 * Research-only comparison; not certified for religious prescriptions.
 */
import type {City} from "./cities";
import {createDefaultSweData} from "@typescriptify/sweph/dist/types.js";
import {sweCalcUt,sweClose,sweSetSidMode} from "@typescriptify/sweph/dist/sweph.js";
import {sweRiseTrans} from "@typescriptify/sweph/dist/swecl.js";
import {SE_SUN,SE_MOON,SEFLG_MOSEPH,SEFLG_SIDEREAL,SE_SIDM_LAHIRI,SE_CALC_RISE,SE_CALC_SET} from "@typescriptify/sweph/dist/constants.js";
import {indiaCivilDayStartJulian} from "./india-time";
import type {ParanaInput} from "./independent-parana";
import type {NakshatraMahadvadashi} from "./independent-mahadvadashi";
const jdToMs=(jd:number)=>(jd-2440587.5)*86400000;
const norm=(angle:number)=>((angle%360)+360)%360;
function tithi(s:ReturnType<typeof createDefaultSweData>,jd:number){
 const sun=sweCalcUt(s,jd,SE_SUN,SEFLG_MOSEPH).xx[0];
 const moon=sweCalcUt(s,jd,SE_MOON,SEFLG_MOSEPH).xx[0];
 if(!Number.isFinite(sun)||!Number.isFinite(moon))throw Error("Nonfinite independent Swiss longitude");
 return Math.floor(norm(moon-sun)/12);
}
function bisect(s:ReturnType<typeof createDefaultSweData>,low:number,high:number,oldIndex:number){
 for(let j=0;j<29;j++){const mid=(low+high)/2;if(tithi(s,mid)===oldIndex)low=mid;else high=mid;}
 return (low+high)/2;
}
const nakaTarget:Record<NakshatraMahadvadashi,number>={JAYA:6,JAYANTI:3,VIJAYA:21,PAPANASINI:7};
function independentNakshatraEnd(s:ReturnType<typeof createDefaultSweData>,sunrise:number,target:NakshatraMahadvadashi):number|null{
 const idx=(jd:number)=>{
  const longitude=sweCalcUt(s,jd,SE_MOON,SEFLG_MOSEPH|SEFLG_SIDEREAL).xx[0];
  if(!Number.isFinite(longitude))throw Error("Nonfinite independent Nakshatra longitude");
  return Math.floor(norm(longitude)/(360/27));
 };
 const targetIndex=nakaTarget[target];
 if(idx(sunrise)!==targetIndex)return null;
 let left=sunrise;
 for(let hour=1;hour<=48;hour++){
  const right=sunrise+hour/24;
  if(idx(right)!==targetIndex){
   let low=left,high=right;
   for(let n=0;n<32;n++){const mid=(low+high)/2;if(idx(mid)===targetIndex)low=mid;else high=mid;}
   return jdToMs((low+high)/2);
  }
  left=right;
 }
 return null;
}
export function independentParanaAstronomy(city:City,fastDate:string,paranaDate:string,fastNakshatraSubtype:NakshatraMahadvadashi|null=null):ParanaInput|null{
 const [year,month,day]=fastDate.split("-").map(Number);
 const [py,pm,pd]=paranaDate.split("-").map(Number);
 if([year,month,day,py,pm,pd].some(x=>!Number.isInteger(x)))throw Error("Invalid city/year event");
 const fastStart=indiaCivilDayStartJulian(year,month,day);
 const paraStart=indiaCivilDayStartJulian(py,pm,pd);
 if(paraStart-fastStart<0.9||paraStart-fastStart>2.1)throw Error("Parana day not within next two civil days");
 const swed=createDefaultSweData();
 try{
  sweSetSidMode(swed,SE_SIDM_LAHIRI,0,0);
  const geo=[city.lng,city.lat,0],jdRise=sweRiseTrans(swed,paraStart,SE_SUN,null,SEFLG_MOSEPH,SE_CALC_RISE,geo,1013.25,25,null);
  const jdSet=sweRiseTrans(swed,paraStart,SE_SUN,null,SEFLG_MOSEPH,SE_CALC_SET,geo,1013.25,25,null);
  if(jdRise.retval<0||jdSet.retval<0||!(jdSet.tret>jdRise.tret))throw Error("Missing or inverted independent daylight");
  const transitions:{index:number;jd:number}[]=[];
  let left=fastStart-1.2,previous=tithi(swed,left);
  const end=paraStart+1.7,step=1/24;
  for(let right=left+step;right<=end;right+=step){
   const current=tithi(swed,right);
   if(current!==previous){
    const root=bisect(swed,right-step,right,previous);
    transitions.push({index:current,jd:root});
   }
   previous=current;
  }
  const segments=transitions.filter(x=>x.index===11||x.index===26).map((x,i)=>{
   const next=transitions.find(y=>y.jd>x.jd+1e-8);
   return {start:x.jd,end:next?.jd??null};
  });
  const trayodashiSegments=transitions.filter(x=>x.index===12||x.index===27).map(x=>{
   const next=transitions.find(y=>y.jd>x.jd+1e-8);
   return {start:x.jd,end:next?.jd??null};
  });
  const trayodashi=trayodashiSegments.find(x=>x.end!==null&&x.end>=paraStart&&x.start<=paraStart+1);
  const bounds=segments.find(x=>x.end!==null&&x.end>=fastStart&&x.start<=paraStart+1);
  if(!bounds?.end)return null;
  return {fastDate,paranaDate,sunrise:jdToMs(jdRise.tret),sunset:jdToMs(jdSet.tret),
   dwadashiStart:jdToMs(bounds.start),dwadashiEnd:jdToMs(bounds.end),
   trayodashiEnd:trayodashi?.end?jdToMs(trayodashi.end):null,
   nakshatraEnd:fastNakshatraSubtype?independentNakshatraEnd(swed,jdRise.tret,fastNakshatraSubtype):null,
   method:"GCal-normal"};
 }finally{sweClose(swed);}
}
