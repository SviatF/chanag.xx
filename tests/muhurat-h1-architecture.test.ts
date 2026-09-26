import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {findCityBySlug} from "../lib/cities";
import {muhuratRules} from "../lib/muhurat";
import {buildMuhuratCityMonthHeading,muhuratMonthName} from "../lib/muhurat-heading";
import {muhuratCityMonthSsgPriority} from "../lib/static-seo-routes";

describe("Muhurat city-month H1 architecture",()=>{
  it("gives every indexed city-month Muhurat URL a distinct visible heading",()=>{
    expect(muhuratCityMonthSsgPriority).toHaveLength(780);
    const headings=muhuratCityMonthSsgPriority.map(item=>{
      const city=findCityBySlug(item.city)!;
      const rule=muhuratRules[item.event];
      const year=Number(item.year),month=Number(item.month);
      const heading=buildMuhuratCityMonthHeading(rule.title,city.name,year,month);
      expect(heading.primary).toBe(`${rule.title} in ${city.name}`);
      expect(heading.period).toBe(`${muhuratMonthName(year,month)} ${year}`);
      expect(heading.full).toContain(city.name);
      expect(heading.full).toContain(String(year));
      return heading.full;
    });
    expect(new Set(headings).size).toBe(headings.length);
  });

  it("renders event, city, month and year in the public H1 instead of the old repeated template",()=>{
    const source=readFileSync("app/muhurat/[event]/[year]/[month]/[city]/page.tsx","utf8");
    expect(source).toContain("buildMuhuratCityMonthHeading");
    expect(source).toContain('<h1 className="page-title">{heading.primary}<br/>{heading.period}</h1>');
    expect(source).not.toContain('<h1 className="page-title">{rule.title}<br/>{city.name}</h1>');
  });
});
