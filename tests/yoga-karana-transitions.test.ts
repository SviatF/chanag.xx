import {describe,expect,it} from "vitest";
import {getPanchang} from "../lib/panchang";
import {cityBySlug} from "../lib/cities";

function toAbsoluteMinutes(date:string,time:string){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(time))throw new Error("Invalid dated local transition");
  return Date.parse(date+"T"+time+":00Z")/60000;
}

const REFERENCES=[
  {publisher:"Drik Panchang",url:"https://www.drikpanchang.com/marathi/panchang/marathi-day-panchang.html?geoname-id=1275339",city:"mumbai",date:"2026-10-13",yoga:"Priti",yogaEnd:"20:24",karana:"Taitila",karanaEnd:"10:46"},
  {publisher:"AstroLeaf",url:"https://astroleaf.in/panchang/mumbai-maharashtra-india/2026-10-13/",city:"mumbai",date:"2026-10-13",yoga:"Priti",yogaEnd:"20:24",karana:"Taitila",karanaEnd:"10:47"},
  {publisher:"Drik Panchang Delhi",url:"https://www.drikpanchang.com/panchang/day-panchang.html?geoname-id=989920",city:"delhi",date:"2026-10-13",yoga:"Priti",yogaEnd:"20:24",karana:"Taitila",karanaEnd:"10:46"},
] as const;

describe("Wave 3I: Yoga/Karana transitions are dated, city-aware evidence",()=>{
  it("compares actual Yoga/Karana ending instants to two independent Mumbai publishers",async()=>{
    const p=await getPanchang(new Date("2026-10-13T06:00:00Z"),cityBySlug("mumbai"));
    for(const r of REFERENCES.filter(x=>x.city==="mumbai")){
      expect(r.url).toMatch(/^https:/);
      expect(p.yoga).toBe(r.yoga);
      expect(p.karana).toBe(r.karana);
      expect(p.yogaEndDate).toBe(r.date);
      expect(p.karanaEndDate).toBe(r.date);
      expect(Math.abs(toAbsoluteMinutes(r.date,p.yogaEnd)-toAbsoluteMinutes(r.date,r.yogaEnd))).toBeLessThanOrEqual(2);
      expect(Math.abs(toAbsoluteMinutes(r.date,p.karanaEnd)-toAbsoluteMinutes(r.date,r.karanaEnd))).toBeLessThanOrEqual(2);
    }
  });
  it("keeps Delhi local rise data separate while matching the common geocentric lunar transition",async()=>{
    const p=await getPanchang(new Date("2026-10-13T06:00:00Z"),cityBySlug("delhi"));
    const r=REFERENCES[2];
    expect(p.yoga).toBe(r.yoga);
    expect(p.karana).toBe(r.karana);
    expect(Math.abs(toAbsoluteMinutes(r.date,p.yogaEnd)-toAbsoluteMinutes(r.date,r.yogaEnd))).toBeLessThanOrEqual(2);
    expect(Math.abs(toAbsoluteMinutes(r.date,p.karanaEnd)-toAbsoluteMinutes(r.date,r.karanaEnd))).toBeLessThanOrEqual(2);
  });
  it("never allows a sunrise-active Karana to persist beyond its parent Tithi",async()=>{
    for(const city of ["mumbai","delhi","guwahati","chennai"]){
      for(const date of ["2026-09-09","2026-10-13","2027-03-22"]){
        const p=await getPanchang(new Date(date+"T06:00:00Z"),cityBySlug(city));
        const sunrise=toAbsoluteMinutes(p.date,p.sunrise);
        const yogaEnd=toAbsoluteMinutes(p.yogaEndDate!,p.yogaEnd);
        const karanaEnd=toAbsoluteMinutes(p.karanaEndDate!,p.karanaEnd);
        const tithiEnd=toAbsoluteMinutes(p.tithiEndDate!,p.tithiEnd);
        expect(yogaEnd).toBeGreaterThan(sunrise);
        expect(karanaEnd).toBeGreaterThan(sunrise);
        expect(karanaEnd).toBeLessThanOrEqual(tithiEnd+1);
        expect(karanaEnd-sunrise).toBeLessThan(25*60);
      }
    }
  });
});
