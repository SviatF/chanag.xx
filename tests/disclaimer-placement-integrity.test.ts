import {readFileSync} from "node:fs";
import path from "node:path";
import {describe,expect,it} from "vitest";
import {jaccardTextSimilarity} from "../lib/content-uniqueness";
import {regionalPureLocale} from "../lib/regional-pure-copy";
import {regionalLanguageSlugs} from "../lib/regional-seo";

function source(relative:string){return readFileSync(path.join(process.cwd(),relative),"utf8");}
function rendered(relative:string){const text=source(relative);const start=text.indexOf("return <main");expect(start,`${relative} must contain a main render`).toBeGreaterThanOrEqual(0);return text.slice(start);}
function count(value:string,pattern:RegExp){return value.match(pattern)?.length??0;}
function proseLiterals(value:string){
  return [...value.matchAll(/(["'`])([^\n]{32,}?)\1/g)]
    .map(match=>match[2].replace(/\$\{[^}]+\}/g," ").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim())
    .filter(item=>item.length>=32&&!/^(?:https?:|\/|[a-z-]+\s[a-z-]+$)/i.test(item));
}

const scopedTemplates=[
  "app/tools/moon-sign-calculator/page.tsx",
  "app/tools/nakshatra-finder/page.tsx",
  "app/tools/rahu-kalam-calculator/page.tsx",
  "app/tools/hindu-baby-names/page.tsx",
  "app/tools/hindu-baby-names/[nakshatra]/page.tsx",
  "app/tools/choghadiya/page.tsx",
  "app/tools/choghadiya/[city]/page.tsx",
  "app/panchang/[city]/[[...date]]/page.tsx",
  "app/vrat/page.tsx",
  "app/vrat/[vrat]/[year]/page.tsx",
  "app/vrat/[vrat]/[year]/[city]/page.tsx",
  "app/muhurat/page.tsx",
  "app/muhurat/[event]/[year]/page.tsx",
  "app/muhurat/[event]/[year]/[month]/page.tsx",
  "app/muhurat/[event]/[year]/[month]/[city]/page.tsx",
  "app/festivals/page.tsx",
  "app/festivals-calendar/[year]/page.tsx",
  "app/festivals/[festival]/[year]/page.tsx",
  "app/festivals/[festival]/[year]/[city]/page.tsx",
  "app/regional/[language]/page.tsx",
  "app/regional/[language]/[city]/page.tsx",
  "app/regional/[language]/[city]/[intent]/page.tsx",
] as const;

const earlyLimitation=/not a complete Panchang Shuddhi|personalized ceremony certification|exact natal Moon Sign requires|exact Janma Nakshatra and Pada require|date-level estimate|date-only (?:Nakshatra )?(?:Finder )?is an estimate|not financial advice|does not certify|not certified by this route|universal festival Muhurat/i;

describe("methodology disclosure placement integrity",()=>{
  it("keeps the shared disclosure fully visible and crawler-readable",()=>{
    const component=source("components/MethodologyNote.tsx");
    expect(component).toContain('data-methodology-disclosure="true"');
    expect(component).not.toMatch(/<details\b|aria-hidden|display\s*:\s*["']?none|visibility\s*:\s*["']?hidden|opacity\s*:\s*0/i);
    expect(component).toMatch(/fontSize:12/);
    expect(component).toMatch(/color:"#8f918a"/);
  });

  it("renders exactly one final disclosure block per scoped template, outside the hero and primary result flow",()=>{
    for(const file of scopedTemplates){
      const render=rendered(file);
      const note=render.indexOf("<MethodologyNote");
      expect(count(render,/<MethodologyNote/g),`${file} should have exactly one visible methodology block`).toBe(1);
      expect(note,`${file} methodology block must exist`).toBeGreaterThan(0);
      expect(note/render.length,`${file} disclosure should live in the lower part of the page source`).toBeGreaterThan(0.45);
      expect(note,`${file} disclosure must follow the H1`).toBeGreaterThan(render.indexOf("page-title"));
      expect(render.slice(0,note),`${file} must not lead with limitation language`).not.toMatch(earlyLimitation);
      const script=render.indexOf("<script");
      if(script>=0)expect(note,`${file} disclosure must remain visible before structured data`).toBeLessThan(script);
    }
  });

  it("does not repeat the final disclosure thought earlier in the rendered page",()=>{
    for(const file of scopedTemplates){
      const render=rendered(file);
      const noteIndex=render.indexOf("<MethodologyNote");
      const before=proseLiterals(render.slice(0,noteIndex));
      const disclosure=proseLiterals(render.slice(noteIndex));
      for(const finalText of disclosure){
        for(const earlierText of before){
          expect(jaccardTextSimilarity(finalText,earlierText,[]),`${file} repeats a disclosure thought before the final block: “${finalText}”`).toBeLessThan(0.8);
        }
      }
    }
  });

  it("keeps regional methodology localized for all five supported languages and only at the final block",()=>{
    expect([...regionalLanguageSlugs].sort()).toEqual(["bengali","gujarati","malayalam","marathi","tamil"]);
    for(const language of regionalLanguageSlugs){
      const copy=regionalPureLocale(language);
      expect(copy.methodologyTitle.trim().length,`${language} methodology title`).toBeGreaterThan(3);
      expect(copy.methodologyText.trim().length,`${language} methodology text`).toBeGreaterThan(20);
    }
    const regionalTemplates=[
      "app/regional/[language]/page.tsx",
      "app/regional/[language]/[city]/page.tsx",
      "app/regional/[language]/[city]/[intent]/page.tsx",
    ];
    for(const file of regionalTemplates){
      const render=rendered(file);
      const note=render.indexOf("<MethodologyNote");
      expect(render.slice(0,note),`${file} should not render localized methodology early`).not.toContain("copy.methodologyText");
      expect(render.slice(note),`${file} must retain localized methodology in the final visible block`).toContain("copy.methodologyText");
      expect(render.slice(note),`${file} must expose the native language to assistive/crawler context`).toContain("lang={copy.hreflang}");
    }
  });
});
