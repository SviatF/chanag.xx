import {afterEach,describe,expect,it} from "vitest";
import {findCityBySlug} from "../lib/cities";
import {
  detectRegionalSearchQuery,
  isRegionalIntentIndexable,
  regionalAlternates,
  regionalIntentActivationSnapshot,
  regionalLanguageSupportsIntent,
} from "../lib/regional-seo";

const originalCities=process.env.SEO_EXTRA_INDEX_CITIES;
const originalRegional=process.env.SEO_EXTRA_REGIONAL_INTENTS;

afterEach(()=>{
  if(originalCities===undefined)delete process.env.SEO_EXTRA_INDEX_CITIES;else process.env.SEO_EXTRA_INDEX_CITIES=originalCities;
  if(originalRegional===undefined)delete process.env.SEO_EXTRA_REGIONAL_INTENTS;else process.env.SEO_EXTRA_REGIONAL_INTENTS=originalRegional;
});

describe("Regional SEO Scale Engine",()=>{
  it("detects language-specific Panchang and timing demand in native and Latin queries",()=>{
    expect(detectRegionalSearchQuery("tamil rahu kalam chennai")).toEqual({language:"tamil",intent:"rahu-kalam"});
    expect(detectRegionalSearchQuery("gujarati choghadiya ahmedabad")).toEqual({language:"gujarati",intent:"choghadiya"});
    expect(detectRegionalSearchQuery("বাংলা পঞ্জিকা kolkata")).toEqual({language:"bengali",intent:"panchang"});
  });

  it("does not pretend every timing intent is a regional convention in every language",()=>{
    expect(regionalLanguageSupportsIntent("tamil","rahu-kalam")).toBe(true);
    expect(regionalLanguageSupportsIntent("tamil","choghadiya")).toBe(false);
    expect(regionalLanguageSupportsIntent("gujarati","choghadiya")).toBe(true);
  });

  it("keeps the curated launch seed indexable without runtime approvals",()=>{
    delete process.env.SEO_EXTRA_INDEX_CITIES;
    delete process.env.SEO_EXTRA_REGIONAL_INTENTS;
    expect(isRegionalIntentIndexable("tamil",findCityBySlug("chennai")!,"rahu-kalam")).toBe(true);
    expect(isRegionalIntentIndexable("gujarati",findCityBySlug("ahmedabad")!,"choghadiya")).toBe(true);
  });

  it("requires city approval before a new regional intent can be activated",()=>{
    const city=findCityBySlug("coimbatore")!;
    delete process.env.SEO_EXTRA_INDEX_CITIES;
    process.env.SEO_EXTRA_REGIONAL_INTENTS="tamil:coimbatore:rahu-kalam";
    expect(isRegionalIntentIndexable("tamil",city,"rahu-kalam")).toBe(false);

    process.env.SEO_EXTRA_INDEX_CITIES="coimbatore";
    delete process.env.SEO_EXTRA_REGIONAL_INTENTS;
    expect(isRegionalIntentIndexable("tamil",city,"rahu-kalam")).toBe(false);

    process.env.SEO_EXTRA_REGIONAL_INTENTS="tamil:coimbatore:rahu-kalam";
    expect(isRegionalIntentIndexable("tamil",city,"rahu-kalam")).toBe(true);
    expect(regionalIntentActivationSnapshot().extra).toContain("tamil:coimbatore:rahu-kalam");
  });

  it("ignores invalid or linguistically irrelevant runtime activation keys",()=>{
    process.env.SEO_EXTRA_INDEX_CITIES="coimbatore";
    process.env.SEO_EXTRA_REGIONAL_INTENTS="tamil:coimbatore:choghadiya,unknown:coimbatore:rahu-kalam,tamil:not-a-city:rahu-kalam";
    expect(regionalIntentActivationSnapshot().extra).toEqual([]);
  });

  it("emits hreflang only for approved equivalents",()=>{
    const city=findCityBySlug("coimbatore")!;
    process.env.SEO_EXTRA_INDEX_CITIES="coimbatore";
    delete process.env.SEO_EXTRA_REGIONAL_INTENTS;
    const before=regionalAlternates(city,"rahu-kalam");
    expect(before["en-IN"]).toBe(`/panchang/${city.slug}`);
    expect(before["ta-IN"]).toBeUndefined();

    process.env.SEO_EXTRA_REGIONAL_INTENTS="tamil:coimbatore:rahu-kalam";
    const after=regionalAlternates(city,"rahu-kalam");
    expect(after["ta-IN"]).toBe("/regional/tamil/coimbatore/rahu-kalam");
    expect(after["x-default"]).toBe(`/panchang/${city.slug}`);
  });
});
