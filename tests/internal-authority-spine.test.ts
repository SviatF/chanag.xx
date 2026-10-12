import {describe,expect,it} from "vitest";
import {festivalCityAuthorityLinks,cityYearAuthorityLinks,muhuratCityAuthorityLinks,vratCityAuthorityLinks} from "../lib/authority-city-links";
import {phase1PriorityCities} from "../lib/seo-policy";
import {rollingMonths} from "../lib/seo-sitemap";
import {todayInIndia} from "../lib/dates";

function expectFullPriorityCoverage(rows:{slug:string;href:string}[]){
  expect(rows).toHaveLength(phase1PriorityCities.length);
  expect(new Set(rows.map(row=>row.slug)).size).toBe(phase1PriorityCities.length);
  expect(new Set(rows.map(row=>row.href)).size).toBe(phase1PriorityCities.length);
  expect(new Set(rows.map(row=>row.slug))).toEqual(new Set(phase1PriorityCities));
}

describe("internal authority city spine",()=>{
  const currentYear=todayInIndia().getUTCFullYear();

  it("links every active city from the yearly city authority hub",()=>{
    expectFullPriorityCoverage(cityYearAuthorityLinks(currentYear));
  });

  it("links every active city from validated festival parents",()=>{
    expectFullPriorityCoverage(festivalCityAuthorityLinks("diwali",2026));
  });

  it("links every active city from current rolling Muhurat month parents",()=>{
    const month=rollingMonths(0,12)[0];
    expectFullPriorityCoverage(muhuratCityAuthorityLinks("wedding",month.year,month.month));
  });

  it("links every active city from yearly Vrat parents",()=>{
    expectFullPriorityCoverage(vratCityAuthorityLinks("ekadashi",currentYear));
  });
});
