import {describe,expect,it} from "vitest";
import {festivalCityAuthorityLinks,cityYearAuthorityLinks,muhuratCityAuthorityLinks,vratCityAuthorityLinks} from "../lib/authority-city-links";
import {activeIndexCitySlugs} from "../lib/seo-policy";
import {rollingMonths} from "../lib/seo-sitemap";
import {todayInIndia} from "../lib/dates";

function expectFullPriorityCoverage(rows:{slug:string;href:string}[]){
  expect(rows).toHaveLength(activeIndexCitySlugs().length);
  expect(new Set(rows.map(row=>row.slug)).size).toBe(activeIndexCitySlugs().length);
  expect(new Set(rows.map(row=>row.href)).size).toBe(activeIndexCitySlugs().length);
  expect(new Set(rows.map(row=>row.slug))).toEqual(new Set(activeIndexCitySlugs()));
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
