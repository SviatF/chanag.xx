import {describe,expect,it} from "vitest";
import {supportedCities} from "../lib/cities";
describe("canonical supported city registry",()=>{
 it("contains exactly one unique record per supported city",()=>{
  expect(supportedCities.length).toBe(454);
  expect(new Set(supportedCities.map(x=>x.slug)).size).toBe(supportedCities.length);
  for(const city of supportedCities){
   expect(city.lat).toBeGreaterThan(7);
   expect(city.lat).toBeLessThan(37);
   expect(city.lng).toBeGreaterThan(66);
   expect(city.lng).toBeLessThan(100);
  }
 });
});