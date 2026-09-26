import {afterEach,describe,expect,it} from "vitest";
import {findCityBySlug} from "../lib/cities";
import {todayInIndia} from "../lib/dates";
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

  it("uses the dated canonical English Panchang for today's regional city cluster",()=>{
    const city=findCityBySlug("chennai")!;
    const today=todayInIndia().toISOString().slice(0,10);
    const alternates=regionalAlternates(city,undefined,today);
    expect(alternates["en-IN"]).toBe(`/panchang/chennai/${today}`);
    expect(alternates["x-default"]).toBe(`/panchang/chennai/${today}`);
    expect(alternates["ta-IN"]).toBe("/regional/tamil/chennai");
  });

  it("does not emit a one-page Rahu Kalam hreflang cluster without a true equivalent",()=>{
    const city=findCityBySlug("coimbatore")!;
    process.env.SEO_EXTRA_INDEX_CITIES="coimbatore";
    delete process.env.SEO_EXTRA_REGIONAL_INTENTS;
    expect(regionalAlternates(city,"rahu-kalam")).toEqual({});

    process.env.SEO_EXTRA_REGIONAL_INTENTS="tamil:coimbatore:rahu-kalam";
    expect(isRegionalIntentIndexable("tamil",city,"rahu-kalam")).toBe(true);
    expect(regionalAlternates(city,"rahu-kalam")).toEqual({});
  });

  it("keeps all curated Rahu Kalam pages free of incomplete hreflang clusters",()=>{
    for(const slug of ["kolkata","chennai","ahmedabad","surat","vadodara","mumbai","pune","nagpur","thane"]){
      expect(regionalAlternates(findCityBySlug(slug)!,"rahu-kalam")).toEqual({});
    }
  });

  it("uses the self-canonical English Choghadiya tool as the Choghadiya equivalent",()=>{
    const city=findCityBySlug("ahmedabad")!;
    const alternates=regionalAlternates(city,"choghadiya");
    expect(alternates["en-IN"]).toBe("/tools/choghadiya/ahmedabad");
    expect(alternates["x-default"]).toBe("/tools/choghadiya/ahmedabad");
    expect(alternates["gu-IN"]).toBe("/regional/gujarati/ahmedabad/choghadiya");
  });
});
