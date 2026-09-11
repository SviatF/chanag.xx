import {describe,expect,it} from "vitest";
import {cityBySlug} from "../lib/cities";
import {festivalBySlugYear} from "../lib/festivals";
import {getFestivalSemantics} from "../lib/festival-conventions";
import {getPanchang} from "../lib/panchang";
import {
  getFestivalLocalReference,
  getFestivalRuleProfile,
  muhuratExcludedFactors,
  muhuratScreeningStatement,
} from "../lib/religious-integrity";

describe("religious content integrity",()=>{
  it("keeps Diwali as a Pradosh reference rather than an exact Lakshmi Puja certification",async()=>{
    const festival=festivalBySlugYear("diwali",2026)!;
    const city=cityBySlug("mumbai");
    const data=await getPanchang(new Date(festival.date+"T06:00:00Z"),city);
    const profile=getFestivalRuleProfile(festival);
    const reference=getFestivalLocalReference(festival,data);

    expect(profile.criteria.join(" ")).toContain("Sthir Lagna");
    expect(profile.limitations.join(" ")).toContain("Lagna");
    expect(reference?.label).toBe("Pradosh reference");
    expect(reference?.note).toContain("Exact Lakshmi Puja Muhurat");
  });

  it("does not certify Raksha Bandhan without a complete Bhadra interval",async()=>{
    const festival=festivalBySlugYear("raksha-bandhan",2026)!;
    const city=cityBySlug("delhi");
    const data=await getPanchang(new Date(festival.date+"T06:00:00Z"),city);
    const profile=getFestivalRuleProfile(festival);
    const reference=getFestivalLocalReference(festival,data);

    expect(profile.exactness).toBe("context-only");
    expect(profile.criteria.join(" ")).toContain("Avoid Bhadra");
    expect(reference?.value).toBe("Bhadra check required");
  });

  it("derives only a Nishita reference for Janmashtami and keeps tradition caveats",async()=>{
    const festival=festivalBySlugYear("janmashtami",2026)!;
    const city=cityBySlug("delhi");
    const data=await getPanchang(new Date(festival.date+"T06:00:00Z"),city);
    const profile=getFestivalRuleProfile(festival);
    const reference=getFestivalLocalReference(festival,data);

    expect(reference?.label).toBe("Nishita reference");
    expect(reference?.value).toMatch(/\d{2}:\d{2}/);
    expect(profile.limitations.join(" ")).toContain("Smarta/Vaishnava");
  });

  it("uses local moonrise as the Karwa Chauth fasting reference",async()=>{
    const festival=festivalBySlugYear("karwa-chauth",2026)!;
    const city=cityBySlug("delhi");
    const data=await getPanchang(new Date(festival.date+"T06:00:00Z"),city);
    const reference=getFestivalLocalReference(festival,data);

    expect(reference?.label).toBe("Fasting reference");
    expect(reference?.value).toContain(`Sunrise ${data.sunrise}`);
    expect(reference?.value).toContain("Moonrise");
  });

  it("uses convention-safe festival summaries",()=>{
    const janmashtami=getFestivalSemantics(festivalBySlugYear("janmashtami",2026)!);
    const karwa=getFestivalSemantics(festivalBySlugYear("karwa-chauth",2026)!);
    expect(janmashtami.displayShort).not.toContain("Bhadrapada Krishna Ashtami");
    expect(karwa.displayShort).not.toContain("Kartika Krishna Chaturthi");
    expect(janmashtami.lunarConventionNote).toContain("Amanta");
  });

  it("keeps Muhurat output explicitly outside full Panchang Shuddhi",()=>{
    expect(muhuratScreeningStatement).toContain("not a complete Panchang Shuddhi");
    expect(muhuratExcludedFactors.join(" ")).toContain("Lagna");
    expect(muhuratExcludedFactors.join(" ")).toContain("Adhika Maas");
    expect(muhuratExcludedFactors.join(" ")).toContain("Guru/Shukra Asta");
  });
});
