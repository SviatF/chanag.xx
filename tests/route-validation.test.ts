import {describe,expect,it} from "vitest";
import {coreCities,findCityBySlug,supportedCities} from "../lib/cities";
import {getMonthlyMuhurat} from "../lib/muhurat";
import {parseIsoRouteDate,parseRouteMonth,parseRouteYear,resolveDailyRouteDate} from "../lib/route-validation";

describe("public route hardening",()=>{
  it("resolves supported cities without silently defaulting invalid slugs to Mumbai",()=>{
    expect(findCityBySlug("mumbai")?.name).toBe("Mumbai");
    expect(findCityBySlug("this-city-does-not-exist")).toBeUndefined();

    const expansionCity=supportedCities.find(city=>!coreCities.some(core=>core.slug===city.slug));
    expect(expansionCity).toBeDefined();
    expect(findCityBySlug(expansionCity!.slug)?.slug).toBe(expansionCity!.slug);
  });

  it("accepts only canonical four-digit years inside the supported route range",()=>{
    expect(parseRouteYear("2026")).toBe(2026);
    expect(parseRouteYear("26")).toBeNull();
    expect(parseRouteYear("2101")).toBeNull();
    expect(parseRouteYear("abcd")).toBeNull();
  });

  it("accepts only canonical two-digit month slugs",()=>{
    expect(parseRouteMonth("01")).toBe(1);
    expect(parseRouteMonth("09")).toBe(9);
    expect(parseRouteMonth("12")).toBe(12);
    expect(parseRouteMonth("9")).toBeNull();
    expect(parseRouteMonth("00")).toBeNull();
    expect(parseRouteMonth("13")).toBeNull();
  });

  it("rejects malformed and impossible ISO dates instead of falling back to today",()=>{
    expect(parseIsoRouteDate("2026-09-10")?.toISOString().slice(0,10)).toBe("2026-09-10");
    expect(parseIsoRouteDate("2026-02-30")).toBeNull();
    expect(parseIsoRouteDate("2026-9-10")).toBeNull();
    expect(parseIsoRouteDate("2101-01-01")).toBeNull();
    expect(resolveDailyRouteDate(["2026-09-10","extra"])).toBeNull();
  });

  it("does not silently convert an unknown Muhurat event to wedding",async()=>{
    const city=findCityBySlug("mumbai")!;
    await expect(getMonthlyMuhurat("not-a-real-event",2026,9,city)).rejects.toThrow("Unsupported Muhurat event");
  });
});
