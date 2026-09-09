import { describe, expect, it } from "vitest";
import { cityBySlug } from "../lib/cities";
import { getPanchang } from "../lib/panchang";
import { referenceFixtures } from "./fixtures/panchang-reference";

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function expectTimeClose(actual: string, expected: string, tolerance = 2) {
  expect(Math.abs(toMinutes(actual) - toMinutes(expected))).toBeLessThanOrEqual(tolerance);
}

describe("Panchang accuracy regression", () => {
  for (const fixture of referenceFixtures) {
    it(`${fixture.city} ${fixture.date} stays aligned with the reference Panchang`, async () => {
      const city = cityBySlug(fixture.city);
      const data = await getPanchang(new Date(fixture.date + "T06:00:00Z"), city);
      const expected = fixture.expected;

      expect(data.tithi).toBe(expected.tithi);
      expect(data.nakshatra).toBe(expected.nakshatra);
      expect(data.yoga).toBe(expected.yoga);
      expect(data.karana).toBe(expected.karana);
      expect(data.hinduMonth).toBe(expected.hinduMonth);
      expect(data.vikramSamvat).toBe(expected.vikramSamvat);
      expect(data.shakaSamvat).toBe(expected.shakaSamvat);
      expect(data.abhijit).toBe(expected.abhijit);

      expectTimeClose(data.sunrise, expected.sunrise);
      expectTimeClose(data.sunset, expected.sunset);
      expectTimeClose(data.tithiEnd, expected.tithiEnd);
      expectTimeClose(data.nakshatraEnd, expected.nakshatraEnd);
      expectTimeClose(data.rahu.start, expected.rahu[0]);
      expectTimeClose(data.rahu.end, expected.rahu[1]);
      expectTimeClose(data.yamaganda.start, expected.yamaganda[0]);
      expectTimeClose(data.yamaganda.end, expected.yamaganda[1]);
      expectTimeClose(data.gulika.start, expected.gulika[0]);
      expectTimeClose(data.gulika.end, expected.gulika[1]);
    });
  }

  it("Wednesday Choghadiya uses the canonical 8 day + 8 night sequence", async () => {
    const data = await getPanchang(
      new Date("2026-09-09T06:00:00Z"),
      cityBySlug("mumbai")
    );

    expect(data.dayChoghadiya).toHaveLength(8);
    expect(data.nightChoghadiya).toHaveLength(8);
    expect(data.dayChoghadiya.map((x) => x.name)).toEqual([
      "Labh","Amrit","Kaal","Shubh","Rog","Udveg","Char","Labh",
    ]);
    expect(data.nightChoghadiya.map((x) => x.name)).toEqual([
      "Udveg","Shubh","Amrit","Char","Rog","Kaal","Labh","Udveg",
    ]);

    expectTimeClose(data.dayChoghadiya[0].start, "06:25");
    expectTimeClose(data.dayChoghadiya[0].end, "07:58");
    expectTimeClose(data.dayChoghadiya[3].start, "11:03");
    expectTimeClose(data.dayChoghadiya[3].end, "12:36");
  });

  it("Abhijit is available on Tuesday and omitted on Wednesday", async () => {
    const city = cityBySlug("mumbai");
    const tuesday = await getPanchang(new Date("2026-09-08T06:00:00Z"), city);
    const wednesday = await getPanchang(new Date("2026-09-09T06:00:00Z"), city);

    expect(tuesday.abhijit).not.toBeNull();
    expect(wednesday.abhijit).toBeNull();

    if (tuesday.abhijit) {
      expectTimeClose(tuesday.abhijit.start, "12:11", 3);
      expectTimeClose(tuesday.abhijit.end, "13:01", 3);
    }
  });
});
