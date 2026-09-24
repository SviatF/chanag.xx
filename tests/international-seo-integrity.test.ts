import {readFileSync} from "node:fs";
import path from "node:path";
import {describe,expect,it} from "vitest";
import {findCityBySlug} from "../lib/cities";
import {todayInIndia} from "../lib/dates";
import {regionalAlternates,regionalLanguageHubAlternates} from "../lib/regional-seo";

function source(relative:string){return readFileSync(path.join(process.cwd(),relative),"utf8");}

describe("international SEO alternate integrity",()=>{
  it("builds a complete regional language hub cluster with x-default",()=>{
    const alternates=regionalLanguageHubAlternates();
    expect(alternates["x-default"]).toBe("/regional");
    expect(alternates["bn-IN"]).toBe("/regional/bengali");
    expect(alternates["ta-IN"]).toBe("/regional/tamil");
    expect(alternates["ml-IN"]).toBe("/regional/malayalam");
    expect(alternates["gu-IN"]).toBe("/regional/gujarati");
    expect(alternates["mr-IN"]).toBe("/regional/marathi");
  });

  it("only links dated English Panchang to regional today pages when the date is actually today",()=>{
    const city=findCityBySlug("mumbai")!;
    const today=todayInIndia().toISOString().slice(0,10);
    const current=regionalAlternates(city,undefined,today);
    expect(current["en-IN"]).toBe(`/panchang/mumbai/${today}`);
    expect(current["x-default"]).toBe(`/panchang/mumbai/${today}`);
    expect(current["mr-IN"]).toBe("/regional/marathi/mumbai");

    const historical=regionalAlternates(city,undefined,"2020-01-01");
    expect(historical).toEqual({"en-IN":"/panchang/mumbai/2020-01-01","x-default":"/panchang/mumbai/2020-01-01"});
  });

  it("keeps Choghadiya language equivalents on the same intent",()=>{
    const city=findCityBySlug("mumbai")!;
    const alternates=regionalAlternates(city,"choghadiya");
    expect(alternates["en-IN"]).toBe("/tools/choghadiya/mumbai");
    expect(alternates["x-default"]).toBe("/tools/choghadiya/mumbai");
    expect(alternates["mr-IN"]).toBe("/regional/marathi/mumbai/choghadiya");
  });

  it("keeps localized routes self-canonical while publishing language alternates",()=>{
    const hub=source("app/regional/[language]/page.tsx");
    const city=source("app/regional/[language]/[city]/page.tsx");
    const intent=source("app/regional/[language]/[city]/[intent]/page.tsx");
    expect(hub).toContain('canonical:`/regional/${language}`');
    expect(hub).toContain("languages:regionalLanguageHubAlternates()");
    expect(city).toContain('canonical:`/regional/${p.language}/${city.slug}`');
    expect(city).toContain("languages:regionalAlternates(city,undefined,date)");
    expect(intent).toContain("canonical:regionalIntentPath(language,city,intent)");
    expect(intent).toContain("languages:regionalAlternates(city,intent)");
  });
});
