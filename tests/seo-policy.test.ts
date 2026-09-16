import {afterEach,describe,expect,it} from "vitest";
import {coreCities,supportedCities} from "../lib/cities";
import {
  activeIndexCitySlugs,
  dailyIndexWindow,
  isDailyIndexable,
  isMonthlyIndexable,
  isMuhuratMonthIndexable,
  isPriorityCity,
  monthlyIndexWindow,
  muhuratMonthIndexWindow,
  phase1PriorityCities,
  robotsFor,
} from "../lib/seo-policy";
import {
  indexableCalendarMonths,
  indexableDailyDates,
  indexableMuhuratMonths,
  rollingDailyDates,
  rollingMonths,
} from "../lib/seo-sitemap";

const originalExtra=process.env.SEO_EXTRA_INDEX_CITIES;

afterEach(()=>{
  if(originalExtra===undefined)delete process.env.SEO_EXTRA_INDEX_CITIES;
  else process.env.SEO_EXTRA_INDEX_CITIES=originalExtra;
});

describe("SEO launch guardrails",()=>{
  it("keeps the full runtime city pool larger than the curated core set",()=>{
    expect(supportedCities.length).toBeGreaterThan(coreCities.length);
    expect(phase1PriorityCities.length).toBe(20);
    for(const slug of phase1PriorityCities)expect(isPriorityCity(slug)).toBe(true);
  });

  it("activates only valid supported city slugs from the runtime allowlist",()=>{
    const expansion=supportedCities.find(city=>!phase1PriorityCities.includes(city.slug as any));
    expect(expansion).toBeDefined();
    process.env.SEO_EXTRA_INDEX_CITIES=`${expansion!.slug},not-a-supported-city,${expansion!.slug}`;

    expect(isPriorityCity(expansion!.slug)).toBe(true);
    expect(activeIndexCitySlugs()).toContain(expansion!.slug);
    expect(activeIndexCitySlugs()).not.toContain("not-a-supported-city");
    expect(activeIndexCitySlugs().filter(slug=>slug===expansion!.slug)).toHaveLength(1);
  });

  it("keeps non-approved expansion cities noindex while allowing links to be followed",()=>{
    delete process.env.SEO_EXTRA_INDEX_CITIES;
    const expansion=supportedCities.find(city=>!phase1PriorityCities.includes(city.slug as any));
    expect(expansion).toBeDefined();
    expect(isPriorityCity(expansion!.slug)).toBe(false);
    expect(robotsFor(isPriorityCity(expansion!.slug))).toMatchObject({index:false,follow:true});
  });

  it("generates sitemap windows directly from the canonical index policy",()=>{
    delete process.env.SEO_EXTRA_INDEX_CITIES;
    const city=phase1PriorityCities[0];
    const dates=indexableDailyDates();
    const months=indexableCalendarMonths();
    const muhuratMonths=indexableMuhuratMonths();

    expect(dates).toHaveLength(dailyIndexWindow.pastDays+dailyIndexWindow.futureDays+1);
    expect(new Set(dates).size).toBe(dates.length);
    expect(months).toHaveLength(monthlyIndexWindow.backMonths+monthlyIndexWindow.forwardMonths+1);
    expect(new Set(months.map(item=>`${item.year}-${item.slug}`)).size).toBe(months.length);
    expect(muhuratMonths).toHaveLength(muhuratMonthIndexWindow.backMonths+muhuratMonthIndexWindow.forwardMonths+1);
    expect(new Set(muhuratMonths.map(item=>`${item.year}-${item.slug}`)).size).toBe(muhuratMonths.length);

    for(const date of dates)expect(isDailyIndexable(city,date)).toBe(true);
    for(const item of months)expect(isMonthlyIndexable(city,item.year,item.month)).toBe(true);
    for(const item of muhuratMonths)expect(isMuhuratMonthIndexable("wedding",item.year,item.month,city)).toBe(true);
  });

  it("noindexes pages immediately outside every sitemap launch window",()=>{
    delete process.env.SEO_EXTRA_INDEX_CITIES;
    const city=phase1PriorityCities[0];

    const expandedDates=rollingDailyDates(dailyIndexWindow.pastDays+1,dailyIndexWindow.futureDays+1);
    expect(isDailyIndexable(city,expandedDates[0])).toBe(false);
    expect(isDailyIndexable(city,expandedDates.at(-1)!)).toBe(false);

    const expandedMonths=rollingMonths(monthlyIndexWindow.backMonths+1,monthlyIndexWindow.forwardMonths+1);
    expect(isMonthlyIndexable(city,expandedMonths[0].year,expandedMonths[0].month)).toBe(false);
    expect(isMonthlyIndexable(city,expandedMonths.at(-1)!.year,expandedMonths.at(-1)!.month)).toBe(false);

    const expandedMuhuratMonths=rollingMonths(muhuratMonthIndexWindow.backMonths+1,muhuratMonthIndexWindow.forwardMonths+1);
    expect(isMuhuratMonthIndexable("wedding",expandedMuhuratMonths[0].year,expandedMuhuratMonths[0].month,city)).toBe(false);
    expect(isMuhuratMonthIndexable("wedding",expandedMuhuratMonths.at(-1)!.year,expandedMuhuratMonths.at(-1)!.month,city)).toBe(false);
  });
});
