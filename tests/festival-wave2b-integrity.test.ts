import {describe,expect,it} from "vitest";
import {getPanchang} from "../lib/panchang";
import {cityBySlug} from "../lib/cities";
import {festivalBySlugYear,festivalsForYear} from "../lib/festivals";
import {festivalCityPageIsIndexable,festivalPageIsIndexable,validateFestivalYear} from "../lib/festival-expansion";
import {chhathFollowingSunrise,buildFestivalCityQualityContent} from "../lib/festival-content-engine";
import {getLunarMonthConventions} from "../lib/calendar-conventions";
import {getFestivalLocalReference,getFestivalRuleProfile} from "../lib/religious-integrity";

describe("Wave 2B complete date ledger with a separate publication gate",()=>{
  it("fills source-observed Dhanteras and Chhath 2027 while leaving future routes unindexed",()=>{
    expect(validateFestivalYear(2027).valid).toBe(true);
    expect(festivalsForYear(2027)).toHaveLength(19);
    expect(festivalBySlugYear("dhanteras",2027)?.date).toBe("2027-10-27");
    expect(festivalBySlugYear("chhath-puja",2027)?.date).toBe("2027-11-04");
    for(const slug of ["dhanteras","chhath-puja","diwali","janmashtami"]){
      expect(festivalPageIsIndexable(slug,2027)).toBe(false);
      expect(festivalCityPageIsIndexable(slug,2027,"mumbai")).toBe(false);
    }
  });
  for(const year of [2026,2027]){
    it(`Chhath ${year} always distinguishes sunset day from following Usha Arghya sunrise`,async()=>{
      const festival=festivalBySlugYear("chhath-puja",year)!;
      const city=cityBySlug("patna");
      const day=new Date(festival.date+"T06:00:00Z");
      const panchang=await getPanchang(day,city);
      const following=chhathFollowingSunrise(panchang);
      expect(following?.date).not.toBe(festival.date);
      expect(following?.time).toMatch(/^[0-2][0-9]:[0-5][0-9]$/);
      const content=buildFestivalCityQualityContent(festival,city,panchang,getLunarMonthConventions(day,city,panchang),getFestivalLocalReference(festival,panchang));
      expect(content.ritualBody).toContain(`Sandhya Arghya uses the local sunset at ${panchang.sunset}`);
      expect(content.ritualBody).toContain(`Usha Arghya follows at the next sunrise, ${following!.time}`);
      expect(content.directFacts.some(f=>f.label==="Usha Arghya · next sunrise"&&f.note===following!.date)).toBe(true);
    });
  }
  it("does not promote a generic Tithi or Choghadiya label into certified ritual Muhurat",async()=>{
    for(const slug of ["diwali","janmashtami","raksha-bandhan","karwa-chauth"]){
      const festival=festivalBySlugYear(slug,2026)!;
      const data=await getPanchang(new Date(festival.date+"T06:00:00Z"),cityBySlug("delhi"));
      const ref=getFestivalLocalReference(festival,data);
      const profile=getFestivalRuleProfile(festival);
      expect(ref).not.toBeNull();
      expect(profile.criteria.length).toBeGreaterThan(1);
      if(slug==="raksha-bandhan"){
        expect(profile.exactness).toBe("context-only");
        expect(ref?.label).toBe("Bhadra-free Purnima reference");
        expect(ref?.value).toContain(" — ");
      }
      if(slug==="diwali")expect(ref?.label).toBe("Pradosh reference");
      if(slug==="janmashtami")expect(ref?.label).toBe("Nishita reference");
    }
  });
});
