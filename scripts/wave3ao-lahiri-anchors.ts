/**
 * Wave 3AO: 6-hour effective APPARENT Lahiri correction from Swiss UT.
 *
 * This captures the agreed Swiss Lahiri frame at globally reusable instants.
 * We measure midpoint interpolation error against DIRECT Swiss/Moshier calls
 * rather than asserting a theoretical accuracy that was never measured.
 * Output is a research-only artifact; never import into public pages.
 */
import {createHash} from "node:crypto";
import {mkdirSync,writeFileSync} from "node:fs";
import {createDefaultSweData} from "@typescriptify/sweph/dist/types.js";
import {sweCalcUt,sweClose,sweSetSidMode} from "@typescriptify/sweph/dist/sweph.js";
import {SE_SUN,SE_MOON,SEFLG_MOSEPH,SEFLG_SIDEREAL,SE_SIDM_LAHIRI} from "@typescriptify/sweph/dist/constants.js";
import {JPL_V6_ROOTS_ASSET_SHA256} from "../lib/jpl-v6-pinned-data";
const START=Date.parse("2025-12-30T00:00:00.000Z");
const END=Date.parse("2029-01-03T00:00:00.000Z");
const PERIOD=6*3600000,JD_ZERO=2440587.5,DAY=86400000;
const deg=(x:number)=>((x%360)+360)%360;
const signed=(a:number,b:number)=>((a-b+540)%360)-180;
const swed=createDefaultSweData();
sweSetSidMode(swed,SE_SIDM_LAHIRI,0,0);
function at(ms:number,withMoon:boolean){
  const jd=JD_ZERO+ms/DAY;
  const tropical=sweCalcUt(swed,jd,SE_SUN,SEFLG_MOSEPH).xx[0];
  const sidereal=sweCalcUt(swed,jd,SE_SUN,SEFLG_MOSEPH|SEFLG_SIDEREAL).xx[0];
  if(!Number.isFinite(tropical)||!Number.isFinite(sidereal))
    throw Error("Nonfinite direct Swiss Lahiri Sun at "+new Date(ms).toISOString());
  const effective=deg(tropical-sidereal);
  if(!(effective>20&&effective<29))throw Error("Invalid Lahiri correction "+effective);
  let bodyDisagreementArcsec:number|null=null;
  if(withMoon){
    const mt=sweCalcUt(swed,jd,SE_MOON,SEFLG_MOSEPH).xx[0];
    const msid=sweCalcUt(swed,jd,SE_MOON,SEFLG_MOSEPH|SEFLG_SIDEREAL).xx[0];
    bodyDisagreementArcsec=Math.abs(signed(deg(mt-msid),effective))*3600;
    if(!Number.isFinite(bodyDisagreementArcsec)||bodyDisagreementArcsec>1)
      throw Error("Swiss apparent Sun/Moon Lahiri frame mismatch");
  }
  return {effective,bodyDisagreementArcsec};
}
const samples:Array<[number,number]>=[];
let maxMidpointArcsec=0,maxBodyMismatchArcsec=0;
try{
  for(let t=START;t<=END;t+=PERIOD){
    const result=at(t,(t-START)%(DAY*7)===0);
    samples.push([t,result.effective]);
    if(result.bodyDisagreementArcsec!==null)
      maxBodyMismatchArcsec=Math.max(maxBodyMismatchArcsec,result.bodyDisagreementArcsec);
  }
  for(let i=0;i<samples.length-1;i++){
    const left=samples[i],right=samples[i+1];
    const midpoint=left[0]+PERIOD/2;
    const interpolation=(left[1]+right[1])/2;
    const actual=at(midpoint,false).effective;
    const deviation=Math.abs(signed(actual,interpolation))*3600;
    if(!Number.isFinite(deviation))throw Error("Nonfinite midpoint interpolation error");
    maxMidpointArcsec=Math.max(maxMidpointArcsec,deviation);
  }
}finally{sweClose(swed);}
if(samples.length<4300||samples.length>4600||maxMidpointArcsec>0.5)
  throw Error("Wave3AO 6h interpolation calibration failed "+JSON.stringify({
    samples:samples.length,maxMidpointArcsec
  }));
const payload={
  wave:"3AO",version:1,
  source:"Swiss/Moshier UT apparent tropical-minus-Lahiri sidereal Sun, SE_SIDM_LAHIRI",
  rootSourceSha256:JPL_V6_ROOTS_ASSET_SHA256,
  jplKernelSha256:"c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2",
  periodHours:6,coverageStartUtc:new Date(START).toISOString(),coverageEndUtc:new Date(END).toISOString(),
  maxMeasuredMidpointInterpolationErrorArcsec:maxMidpointArcsec,
  maxMeasuredSunMoonOffsetMismatchArcsec:maxBodyMismatchArcsec,
  fullyIndependentAyanamsa:false,releaseApproved:false,samples
};
const serialized=JSON.stringify(payload)+"\n";
mkdirSync("artifacts",{recursive:true});
writeFileSync("artifacts/wave3ao-lahiri-6h-anchors.json",serialized);
const digest=createHash("sha256").update(serialized).digest("hex");
console.log("[Wave3AO Lahiri] anchors="+samples.length+" midpointMaxArcsec="+maxMidpointArcsec.toFixed(6)+
  " SunMoonMismatchMaxArcsec="+maxBodyMismatchArcsec.toFixed(6)+" sha256="+digest+
  " approved=false");
