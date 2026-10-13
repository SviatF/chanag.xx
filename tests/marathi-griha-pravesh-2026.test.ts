import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {supportedCities,findCityBySlug} from "../lib/cities";
import {getVerifiedMuhuratClosure} from "../lib/verified-muhurat-closures";
import {getMonthlyMuhurat} from "../lib/muhurat";
import {reviewedGrihaPravesh2026} from "./fixtures/marathi-griha-pravesh-2026-evidence";

describe("Marathi Griha Pravesh — supported Maharashtra 2026 Aug–Oct",()=>{
  it("has two independent Maharashtra references plus independently labeled external corroboration",()=>{
    expect(reviewedGrihaPravesh2026.sources).toHaveLength(3);
    expect(reviewedGrihaPravesh2026.sources.filter(x=>x.locality.includes("Maharashtra"))).toHaveLength(2);
    expect(reviewedGrihaPravesh2026.months).toEqual([8,9,10]);
  });
  it("retains explicit independent publisher disagreements instead of claiming all providers agree",()=>{
    const conflicts=reviewedGrihaPravesh2026.conflictingCalendars;
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].exampleDates).toEqual(["2026-08-15","2026-09-17","2026-10-23"]);
    expect(conflicts[0].verdict).toContain("nonzero");
    expect(new Set(reviewedGrihaPravesh2026.sources.map(s=>s.publisher))).toHaveProperty("size",3);
    const closure=getVerifiedMuhuratClosure("griha-pravesh",2026,10,findCityBySlug("pune")!);
    expect(closure?.alternativesNote).toContain("Other published general-purpose house-entry calendars");
    expect(closure?.alternativesNote).toContain("not a blanket prohibition");
  });
  it("does not refer to a Griha Pravesh ceremony as a marriage recommendation",()=>{
    const component=readFileSync("components/VerifiedMuhuratClosurePage.tsx","utf8");
    expect(component).toContain('confirmed {isWedding?"wedding":"Griha Pravesh"} recommendation');
    for(const route of ["app/muhurat/[event]/[year]/[month]/page.tsx","app/muhurat/[event]/[year]/[month]/[city]/page.tsx"]){
      const body=readFileSync(route,"utf8");
      expect(body).toContain("No Customary Marathi House-Entry Dates");
    }
  });
  it("returns zero conventional ceremony dates for supported Maharashtra cities only",async()=>{
    for(const city of supportedCities.filter(x=>x.state==="Maharashtra")){
      for(const month of [8,9,10]){
        const closure=getVerifiedMuhuratClosure("griha-pravesh",2026,month,city);
        expect(closure?.headline).toContain("Griha Pravesh");
        expect(closure?.headline).toContain(city.name);
        expect(closure?.convention).toBe("Reviewed Marathi house-entry calendar");
        expect(closure?.reason).toBe("Restricted lunar months and planetary Asta");
        const {rows}=await getMonthlyMuhurat("griha-pravesh",2026,month,city);
        expect(rows).toHaveLength(0);
      }
    }
  });
  it("never extrapolates into other years, adjacent months, events or regions",()=>{
    const pune=findCityBySlug("pune")!;
    for(const year of [2025,2027])for(const month of [8,9,10])
      expect(getVerifiedMuhuratClosure("griha-pravesh",year,month,pune)).toBeNull();
    for(const month of [7,11,12])expect(getVerifiedMuhuratClosure("griha-pravesh",2026,month,pune)).toBeNull();
    for(const city of ["delhi","chennai","bengaluru","ahmedabad","jaipur"])
      expect(getVerifiedMuhuratClosure("griha-pravesh",2026,10,findCityBySlug(city)!)).toBeNull();
    for(const event of ["vehicle-purchase","gold-purchase","naming-ceremony"])
      expect(getVerifiedMuhuratClosure(event,2026,10,pune)).toBeNull();
  });
});
