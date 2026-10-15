import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {extractSeoIdentity,auditSeoIdentity,normalizedSeoValue} from "../scripts/seo-identity-quality.mjs";

const page=(pathname,html,options={})=>({
  pathname,
  family:options.family??"panchang-daily",
  robots:options.robots??"index,follow",
  h1:options.h1??"Patna Panchang 2027-01-31",
  seo:extractSeoIdentity(html)
});
const doc=(title,description)=>
  `<!doctype html><html><head><meta content="${description}" name="description"><title>${title}</title></head><body></body></html>`;

describe("Wave 3AI: real rendered HTML identity is not boilerplate uniqueness",()=>{
  it("reads Next.js title and description regardless of meta attribute order",()=>{
    const html='<html><head><meta content="Local &amp; exact" name="description"><title>Patna &amp; Kanpur</title></head></html>';
    expect(extractSeoIdentity(html)).toEqual({
      title:"patna & kanpur",description:"local & exact",
      titleCount:1,descriptionCount:1
    });
    expect(normalizedSeoValue(" Café  &#39;Local&#39;  ")).toBe("café 'local'");
  });
  it("catches title/description collisions across different families and clusters",()=>{
    const d=doc("Identical city page","Shared generic SEO description");
    const pages=[
      page("/calendar/patna/2027/01",d,{family:"calendar-month",h1:"Patna Calendar"}),
      page("/vrat/purnima/2027/patna",d,{family:"vrat-city",h1:"Purnima Patna 2027"})
    ];
    const r=auditSeoIdentity(pages);
    expect(r.programmaticPages).toBe(2);
    expect(r.duplicateTitles).toHaveLength(1);
    expect(r.duplicateDescriptions).toHaveLength(1);
    expect(r.duplicateTitles[0].owners).toHaveLength(2);
  });
  it("does not confuse genuinely different city/date titles and descriptions",()=>{
    const pages=[
      page("/panchang/patna/2027-01-31",doc(
        "Patna Panchang for 2027-01-31 — Tithi",
        "Sunrise and Tithi in Patna on 2027-01-31"
      )),
      page("/panchang/kanpur/2026-11-21",doc(
        "Kanpur Panchang for 2026-11-21 — Tithi",
        "Sunrise and Tithi in Kanpur on 2026-11-21"
      ),{h1:"Kanpur Panchang 2026-11-21"})
    ];
    const r=auditSeoIdentity(pages);
    expect(r.issues).toEqual([]);
    expect(r.duplicateTitles).toEqual([]);
    expect(r.duplicateDescriptions).toEqual([]);
  });
  it("rejects a stale Today label, missing date evidence, or absent SEO metadata",()=>{
    const wrong=page("/panchang/patna/2027-01-31",
      doc("Today Panchang in Patna","Generic Panchang overview"),
      {h1:"Patna Panchang 2026-01-31"});
    const missing=page("/vrat/purnima/2027/patna",
      "<html><title></title></html>",{family:"vrat-city"});
    const r=auditSeoIdentity([wrong,missing]);
    expect(r.issues.some(x=>x.issue.includes("claims today"))).toBe(true);
    expect(r.issues.some(x=>x.issue.includes("requested civil date"))).toBe(true);
    expect(r.issues.some(x=>x.issue.includes("missing or multiple HTML titles"))).toBe(true);
    expect(r.issues.some(x=>x.issue.includes("missing or multiple meta descriptions"))).toBe(true);
  });
  it("does not treat non-indexable support pages as indexed programmatic duplicates",()=>{
    const d=doc("Shared shell","Shared description");
    const r=auditSeoIdentity([
      page("/about",d,{family:"authority-singleton"}),
      page("/vrat/ekadashi/2026/mumbai",d,{family:"vrat-city",robots:"noindex,follow"}),
      page("/tools",d,{family:"navigation"})
    ]);
    expect(r.programmaticPages).toBe(0);
    expect(r.duplicateTitles).toHaveLength(0);
  });
  it("guards source: dated calendar SEO does not claim every day is today",()=>{
    const daily=readFileSync("app/panchang/[city]/[[...date]]/page.tsx","utf8");
    expect(daily).not.toContain("title:`Today Panchang");
    expect(daily).toContain("Panchang for ${ds}");
    const audit=readFileSync("scripts/content-quality-audit.mjs","utf8");
    const gate=readFileSync("scripts/content-quality-gate.mjs","utf8");
    expect(audit).toContain("auditSeoIdentity(pages)");
    for(const metric of ["seoIdentityIssues","duplicateSeoTitles","duplicateMetaDescriptions"]){
      expect(audit).toContain(metric);
      expect(gate).toContain(metric);
    }
  });
});
