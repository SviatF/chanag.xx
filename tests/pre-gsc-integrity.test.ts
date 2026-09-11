import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

function source(path:string){return readFileSync(path,"utf8");}

describe("Pre-GSC technical indexation integrity",()=>{
  it("keeps self-canonicals on core and utility sitemap owners",()=>{
    const expected:Record<string,string>={
      "app/page.tsx":"/",
      "app/cities/page.tsx":"/cities",
      "app/about/page.tsx":"/about",
      "app/regional/page.tsx":"/regional",
      "app/methodology/page.tsx":"/methodology",
      "app/accuracy/page.tsx":"/accuracy",
      "app/editorial-policy/page.tsx":"/editorial-policy",
      "app/data-sources/page.tsx":"/data-sources",
      "app/disclaimer/page.tsx":"/disclaimer",
      "app/corrections/page.tsx":"/corrections",
      "app/photo-credits/page.tsx":"/photo-credits",
      "app/festivals/page.tsx":"/festivals",
      "app/vrat/page.tsx":"/vrat",
      "app/tools/page.tsx":"/tools",
      "app/tools/moon-sign-calculator/page.tsx":"/tools/moon-sign-calculator",
      "app/tools/rahu-kalam-calculator/page.tsx":"/tools/rahu-kalam-calculator",
      "app/tools/nakshatra-finder/page.tsx":"/tools/nakshatra-finder",
    };
    for(const [path,canonical] of Object.entries(expected)){
      expect(source(path),path).toContain(`canonical:"${canonical}"`);
    }
  });

  it("keeps the regional root in only the core sitemap",()=>{
    const core=source("app/sitemap-core.xml/route.ts");
    const regional=source("app/sitemap-regional.xml/route.ts");
    expect(core).toContain('base+"/regional"');
    expect(regional).toContain("const urls:string[]=[]");
    expect(regional).not.toContain('const urls:string[]=[`${base}/regional`]');
  });

  it("keeps monthly Muhurat SERP titles month-specific",()=>{
    const muhurat=source("app/muhurat/[event]/[year]/[month]/page.tsx");
    expect(muhurat).toContain("const monthName=monthLabel(year,month)");
    expect(muhurat).toContain('title:`${rule.title} — ${monthName} ${year} Candidate Dates`');
    expect(muhurat).not.toContain('title:`${rule.title} ${year} — Candidate Dates & Planning Windows`');
  });

  it("keeps shared Panchang navigation on dated canonical daily URLs",()=>{
    const header=source("components/Header.tsx");
    expect(header).toContain('href={`/panchang/${city.slug}/${todayIso}`}');
    expect(header).toContain('href:`/panchang/${item.slug}/${todayIso}`');
    expect(header).not.toContain('href={`/panchang/${city.slug}`}');
  });

  it("globally links only primary Muhurat events from the shared header",()=>{
    const header=source("components/Header.tsx");
    expect(header).toContain('import {primaryMuhuratEvents} from "@/lib/seo-policy"');
    expect(header).toContain("const muhuratItems=primaryMuhuratEvents.map");
    expect(header).not.toContain("const muhuratItems=Object.entries(muhuratRules)");
  });

  it("emits reciprocal hreflang from today's daily Panchang and Choghadiya",()=>{
    const daily=source("app/panchang/[city]/[[...date]]/page.tsx");
    const regional=source("app/regional/[language]/[city]/page.tsx");
    const choghadiya=source("app/tools/choghadiya/[city]/page.tsx");
    expect(daily).toContain("if(ds===today)alternates.languages=regionalAlternates(city,undefined,ds)");
    expect(regional).toContain("regionalAlternates(city,undefined,date)");
    expect(choghadiya).toContain('regionalAlternates(city,"choghadiya")');
  });

  it("does not create a false English hreflang target for Rahu Kalam",()=>{
    const regionalSeo=source("lib/regional-seo.ts");
    expect(regionalSeo).toContain('if(intent==="choghadiya")');
    expect(regionalSeo).toContain("}else if(!intent&&date){");
    expect(regionalSeo).not.toContain('intent==="choghadiya"?`/tools/choghadiya/${city.slug}`:`/panchang/${city.slug}`');
  });
});
