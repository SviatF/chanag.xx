import {readFileSync} from "node:fs";
import path from "node:path";
import {describe,expect,it} from "vitest";

function source(relative:string){return readFileSync(path.join(process.cwd(),relative),"utf8");}

const directCopyFiles=[
  "app/page.tsx",
  "app/about/page.tsx",
  "app/accuracy/page.tsx",
  "app/gold-rate/page.tsx",
  "app/gold-rate/[city]/page.tsx",
  "app/tools/gold-value-calculator/page.tsx",
  "app/vrat/page.tsx",
  "app/vrat/[vrat]/[year]/page.tsx",
  "app/vrat/[vrat]/[year]/[city]/page.tsx",
  "app/muhurat/page.tsx",
  "app/muhurat/[event]/[year]/page.tsx",
  "app/muhurat/[event]/[year]/[month]/page.tsx",
  "app/muhurat/[event]/[year]/[month]/[city]/page.tsx",
] as const;

const disclaimerLanguage=/not (?:financial|legal|medical|professional|personalized) advice|not a (?:recommendation|substitute|guaranteed|personalized)|qualified practitioner|personalized (?:ritual|ceremony|astrolog)|confirm (?:the )?(?:exact|relevant) .*?(?:practitioner|jeweller)|accuracy\s*&\s*limitations|explicit limitations|muhuratScreeningStatement|muhuratExcludedFactors/i;

describe("public disclaimer purge integrity",()=>{
  it("renders no shared methodology/disclaimer shell anywhere it is still imported",()=>{
    const component=source("components/MethodologyNote.tsx");
    expect(component).toContain("return null");
    expect(component).not.toContain("data-methodology-disclosure");
    expect(component).not.toMatch(/<section\b|<details\b/);
  });

  it("retires the standalone disclaimer route and removes it from the sitemap",()=>{
    const route=source("app/disclaimer/page.tsx");
    expect(route).toContain("notFound()");
    expect(route).toContain("index:false");
    expect(route).not.toContain("TrustPage");
    expect(source("app/sitemap-core.xml/route.ts")).not.toContain('base+"/disclaimer"');
  });

  it("keeps direct public copy free of generic disclaimer language",()=>{
    for(const file of directCopyFiles){
      const text=source(file);
      expect(text,`${file} contains generic disclaimer language`).not.toMatch(disclaimerLanguage);
      if(file.includes("/vrat")||file.includes("/muhurat"))expect(text,`${file} still imports the retired shell`).not.toContain("MethodologyNote");
    }
  });
});
