import {describe,expect,it} from "vitest";
import {
  detectExpandedToolQuery,
  moonPhaseName,
  resolveToolCity,
  resolveToolDate,
  toolDateIso,
} from "../lib/tool-expansion";

describe("P2.4 evergreen tool expansion",()=>{
  it("classifies focused tool queries without treating generic Panchang as a tool intent",()=>{
    expect(detectExpandedToolQuery("tithi today in Delhi")?.slug).toBe("tithi-finder");
    expect(detectExpandedToolQuery("आज का नक्षत्र")?.slug).toBe("nakshatra-today");
    expect(detectExpandedToolQuery("moon phase today India")?.slug).toBe("moon-phase");
    expect(detectExpandedToolQuery("which hindu month is running")?.slug).toBe("hindu-month-finder");
    expect(detectExpandedToolQuery("panchang date lookup")?.slug).toBe("panchang-date-lookup");
    expect(detectExpandedToolQuery("panchang delhi today")).toBeNull();
  });

  it("keeps valid tool dates exact and rejects impossible dates",()=>{
    expect(toolDateIso(resolveToolDate("2026-02-28"))).toBe("2026-02-28");
    expect(toolDateIso(resolveToolDate("2026-02-30"))).not.toBe("2026-02-30");
    expect(toolDateIso(resolveToolDate("not-a-date"))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("uses Mumbai only as an intentional query-input fallback",()=>{
    expect(resolveToolCity(undefined).slug).toBe("mumbai");
    expect(resolveToolCity("delhi").slug).toBe("delhi");
    expect(resolveToolCity("invalid-city").slug).toBe("mumbai");
  });

  it("classifies waxing and waning lunar phases from Paksha plus illumination",()=>{
    expect(moonPhaseName({tithi:"Amavasya",paksha:"Krishna",moonIllumination:0})).toBe("New Moon");
    expect(moonPhaseName({tithi:"Purnima",paksha:"Shukla",moonIllumination:100})).toBe("Full Moon");
    expect(moonPhaseName({tithi:"Ashtami",paksha:"Shukla",moonIllumination:50})).toBe("First Quarter");
    expect(moonPhaseName({tithi:"Ashtami",paksha:"Krishna",moonIllumination:50})).toBe("Last Quarter");
    expect(moonPhaseName({tithi:"Panchami",paksha:"Shukla",moonIllumination:25})).toBe("Waxing Crescent");
    expect(moonPhaseName({tithi:"Dwadashi",paksha:"Krishna",moonIllumination:75})).toBe("Waning Gibbous");
  });
});
