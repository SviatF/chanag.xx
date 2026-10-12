import {describe,expect,it} from "vitest";
import {localDayPhase,localMoonriseRelation} from "../lib/festival-day-clock";

describe("festival day timing integrity",()=>{
  it("uses the same midday boundaries for every city lens",()=>{
    expect(localDayPhase("12:51","2026-10-20","2026-10-20","06:11","17:51")).toBe("midday");
    expect(localDayPhase("16:10","2026-10-20","2026-10-20","06:11","17:51")).toBe("late daylight");
    expect(localDayPhase("03:00","2026-10-21","2026-10-20","06:11","17:51")).toBe("the following local day");
  });
  it("never rolls a daytime moonrise over to the next day",()=>{
    const result=localMoonriseRelation({date:"2026-10-20",sunrise:"06:11",sunset:"17:51",moonrise:"13:57",moonriseDate:"2026-10-20"});
    expect(result.key).toBe("daylight");
    expect(result.delta).toBe(-234);
    expect(result.text).toContain("before sunset");
    expect(result.text).not.toContain("after");
  });
  it("respects recorded moonrise day offsets and night readings",()=>{
    expect(localMoonriseRelation({date:"2026-10-20",sunrise:"06:11",sunset:"17:51",moonrise:"18:10",moonriseDate:"2026-10-20"}).key).toBe("near-sunset");
    const following=localMoonriseRelation({date:"2026-10-20",sunrise:"06:11",sunset:"17:51",moonrise:"01:15",moonriseDate:"2026-10-21"});
    expect(following.key).toBe("following-day");
    expect(following.text).toContain("following local date");
    expect(localMoonriseRelation({date:"2026-10-20",sunrise:"06:11",sunset:"17:51",moonrise:"—",moonriseDate:null}).key).toBe("unavailable");
  });
});
