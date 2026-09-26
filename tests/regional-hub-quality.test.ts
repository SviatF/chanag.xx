import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {nativeCityName} from "../lib/regional-i18n";
import {buildRegionalHubQuality} from "../lib/regional-hub-quality";
import {regionalPureLocale} from "../lib/regional-pure-copy";
import {regionalCitiesForLanguage,regionalLanguageSlugs,type RegionalLanguageSlug} from "../lib/regional-seo";
import {nativeStateName} from "../lib/regional-values";

const activeLanguages=regionalLanguageSlugs.filter(language=>regionalCitiesForLanguage(language).length>0);

function qualityFor(language:RegionalLanguageSlug){
  const cities=regionalCitiesForLanguage(language);
  return buildRegionalHubQuality(language,{
    cityNames:cities.map(city=>nativeCityName(language,city)),
    stateNames:cities.map(city=>nativeStateName(language,city.state)),
    panchangName:regionalPureLocale(language).panchangName,
  });
}

function corpus(language:RegionalLanguageSlug){
  const quality=qualityFor(language);
  if(!quality)return "";
  return [
    quality.overviewTitle,quality.overviewBody,
    quality.coverageTitle,quality.coverageBody,
    quality.timingTitle,quality.timingBody,
    quality.usageTitle,quality.usageBody,
    quality.cityCountLabel,quality.cityCountNote,
    quality.localBasisLabel,quality.localBasisValue,quality.localBasisNote,
    ...quality.faqs.flatMap(faq=>[faq.question,faq.answer]),
  ].join(" ").replace(/\s+/g," ").trim();
}

function words(value:string){return value.split(/\s+/).filter(Boolean).length;}

describe("Regional language hub mass-content quality",()=>{
  it("deepens exactly the four active language hubs and leaves no-coverage Malayalam untouched",()=>{
    expect(activeLanguages).toEqual(["bengali","tamil","gujarati","marathi"]);
    expect(qualityFor("malayalam")).toBeNull();
  });

  it("builds substantial native city-driven content for every active hub",()=>{
    for(const language of activeLanguages){
      const quality=qualityFor(language)!;
      const text=corpus(language);
      expect(quality.faqs).toHaveLength(3);
      expect(words(text)).toBeGreaterThan(180);
      for(const city of regionalCitiesForLanguage(language))expect(text).toContain(nativeCityName(language,city));
    }
  });

  it("keeps the new quality layer free of internal SEO-control language and mixed technical jargon",()=>{
    const forbidden=/indexable|seo policy|demand-gated|keyword|canonical owner|search index|civil-day|civil date|calendar convention|sunrise-only|regional search hub|active intent pages/i;
    for(const language of activeLanguages)expect(corpus(language)).not.toMatch(forbidden);
  });

  it("renders the quality layer and FAQ schema only through the language-hub route",()=>{
    const source=readFileSync("app/regional/[language]/page.tsx","utf8");
    expect(source).toContain("buildRegionalHubQuality");
    expect(source).toContain('"@type":"FAQPage"');
    expect(source).toContain("quality.overviewBody");
    expect(source).toContain("quality.timingBody");
    expect(source).toContain("quality.usageBody");
  });
});
