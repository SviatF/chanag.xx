import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {findCityBySlug} from "../lib/cities";
import {
  detectRegionalSearchQuery,
  regionalCitiesForLanguage,
  regionalLanguageSeo,
  regionalLanguageSlugs,
} from "../lib/regional-seo";
import {
  choghadiyaNativeNames,
  localizeNakshatra,
  localizePaksha,
  localizeTithi,
  nativeCityName,
} from "../lib/regional-i18n";
import {regionalPureLocale} from "../lib/regional-pure-copy";
import {nativeRegionalMonth} from "../lib/regional-values";
import type {RegionalCalendarProfile} from "../lib/regional-calendar";

describe("Regional language integrity",()=>{
  it("detects native Panchang queries across all five Indic scripts",()=>{
    expect(detectRegionalSearchQuery("আজকের পঞ্জিকা কলকাতা")).toEqual({language:"bengali",intent:"panchang"});
    expect(detectRegionalSearchQuery("இன்றைய பஞ்சாங்கம் சென்னை")).toEqual({language:"tamil",intent:"panchang"});
    expect(detectRegionalSearchQuery("ഇന്നത്തെ പഞ്ചാംഗം കൊച്ചി")).toEqual({language:"malayalam",intent:"panchang"});
    expect(detectRegionalSearchQuery("આજનું પંચાંગ અમદાવાદ")).toEqual({language:"gujarati",intent:"panchang"});
    expect(detectRegionalSearchQuery("आजचे पंचांग मुंबई")).toEqual({language:"marathi",intent:"panchang"});
  });

  it("detects native Rahu Kalam queries without losing combining marks",()=>{
    expect(detectRegionalSearchQuery("কলকাতা রাহুকাল")).toEqual({language:"bengali",intent:"rahu-kalam"});
    expect(detectRegionalSearchQuery("சென்னை ராகு காலம்")).toEqual({language:"tamil",intent:"rahu-kalam"});
    expect(detectRegionalSearchQuery("കൊച്ചി രാഹുകാലം")).toEqual({language:"malayalam",intent:"rahu-kalam"});
    expect(detectRegionalSearchQuery("અમદાવાદ રાહુકાળ")).toEqual({language:"gujarati",intent:"rahu-kalam"});
    expect(detectRegionalSearchQuery("मुंबई राहुकाल")).toEqual({language:"marathi",intent:"rahu-kalam"});
  });

  it("keeps locale hreflang and public copy aligned",()=>{
    for(const language of regionalLanguageSlugs){
      const copy=regionalPureLocale(language);
      expect(copy.hreflang).toBe(regionalLanguageSeo[language].hreflang);
      expect(copy.hubTitle.length).toBeGreaterThan(4);
      expect(copy.hubDescription.length).toBeGreaterThan(20);
    }
  });

  it("uses native city, Tithi, Paksha and Nakshatra values",()=>{
    expect(nativeCityName("bengali",findCityBySlug("kolkata")!)).toBe("কলকাতা");
    expect(nativeCityName("tamil",findCityBySlug("chennai")!)).toBe("சென்னை");
    expect(nativeCityName("gujarati",findCityBySlug("ahmedabad")!)).toBe("અમદાવાદ");
    expect(nativeCityName("marathi",findCityBySlug("mumbai")!)).toBe("मुंबई");

    expect(localizeTithi("gujarati","Amavasya")).toBe("અમાસ");
    expect(localizePaksha("gujarati","Krishna")).toBe("વદ");
    expect(localizeNakshatra("tamil","Shravana")).toBe("திருவோணம்");
    expect(localizeTithi("bengali","Purnima")).toBe("পূর্ণিমা");
  });

  it("renders regional month names in native script",()=>{
    const profile=(month:string):RegionalCalendarProfile=>({calendarSystem:"x",month,nakshatra:"x",note:"x"});
    expect(nativeRegionalMonth("tamil",profile("Chithirai"))).toBe("சித்திரை");
    expect(nativeRegionalMonth("malayalam",profile("Chingam"))).toBe("ചിങ്ങം");
    expect(nativeRegionalMonth("gujarati",profile("Bhadarvo"))).toBe("ભાદરવો");
    expect(nativeRegionalMonth("marathi",profile("Shravana"))).toBe("श्रावण");
    expect(nativeRegionalMonth("gujarati",profile("Shravana (Adhika)"))).toBe("અધિક શ્રાવણ");
  });

  it("keeps Choghadiya names native on regional surfaces",()=>{
    expect(choghadiyaNativeNames.gujarati.Shubh).toBe("શુભ");
    expect(choghadiyaNativeNames.marathi.Amrit).toBe("अमृत");
    expect(choghadiyaNativeNames.tamil.Labh).toBe("லாப");
  });

  it("does not index a language hub with no active relevant city coverage",()=>{
    expect(regionalCitiesForLanguage("malayalam")).toEqual([]);
  });

  it("keeps public locale copy free of internal SEO jargon and mixed technical English",()=>{
    const forbidden=/indexable|seo policy|demand-gated|keyword|canonical owner|search index|civil-day|civil date|calendar convention|sunrise-only|regional search hub|active intent pages/i;
    for(const language of regionalLanguageSlugs){
      const copy=regionalPureLocale(language);
      const publicCopy=[
        copy.hubTitle,copy.hubDescription,copy.citiesTitle,copy.citiesIntro,
        copy.methodologyTitle,copy.methodologyText,copy.noCoverageTitle,copy.noCoverageText,
        copy.solarTransitionTitle,copy.solarTransitionText("A","B","12:00"),
        copy.calendarExplanationTitle,copy.afterMidnightNote,
      ].join(" ");
      expect(publicCopy).not.toMatch(forbidden);
    }
  });

  it("keeps regional route source free of old public SEO-control language",()=>{
    const paths=[
      "app/regional/[language]/page.tsx",
      "app/regional/[language]/[city]/page.tsx",
      "app/regional/[language]/[city]/[intent]/page.tsx",
    ];
    const forbidden=/REGIONAL SEARCH HUB|Indexable cities|Active intent pages|Demand-gated|current SEO city policy|Regional depth, not translated duplication/i;
    for(const path of paths){
      expect(readFileSync(path,"utf8")).not.toMatch(forbidden);
    }
  });
});
