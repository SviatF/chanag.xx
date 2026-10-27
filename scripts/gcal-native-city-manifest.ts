import {mkdirSync,writeFileSync} from "node:fs";
import {supportedCities} from "../lib/cities";
const seen=new Map<string,typeof supportedCities[number]>();
const collisions:string[]=[];
const cities=supportedCities.filter(city=>{
 const prior=seen.get(city.slug);
 if(!prior){seen.set(city.slug,city);return true;}
 if(Math.abs(prior.lat-city.lat)>0.02||Math.abs(prior.lng-city.lng)>0.02)throw Error("Conflicting coordinates for duplicate slug "+city.slug);
 collisions.push(city.slug);
 return false;
}).map(city=>{
 if(!Number.isFinite(city.lat)||!Number.isFinite(city.lng)||city.lat<6||city.lat>39||city.lng<68||city.lng>99)throw Error("Unsupported India coordinate "+city.slug);
 const d=(n:number,pos:string,neg:string)=>{const total=Math.round(Math.abs(n)*60);return String(Math.floor(total/60))+(n>=0?pos:neg)+String(total%60).padStart(2,"0");};
 return {slug:city.slug,name:city.name,lat:city.lat,lng:city.lng,coordinateArgument:d(city.lat,"N","S")+";"+d(city.lng,"E","W"),utcOffset:"+05:30"};
});
mkdirSync("artifacts/gcal-city-run",{recursive:true});
writeFileSync("artifacts/gcal-city-run/manifest.json",JSON.stringify({generatedAt:new Date().toISOString(),yearRange:[2026,2027],count:cities.length,duplicateSlugCount:collisions.length,duplicateSlugs:[...new Set(collisions)],cities},null,2));
console.log("Native GCal city manifest prepared for "+cities.length+" unique cities; duplicate slugs="+collisions.length);
