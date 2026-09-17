import {afterEach,describe,expect,it} from "vitest";
import {coreCities,supportedCities} from "../lib/cities";
import {activeIndexCitySlugs,isDailyIndexable,isMonthlyIndexable,isMonthlyMuhuratIndexable,isPriorityCity,phase1PriorityCities,robotsFor} from "../lib/seo-policy";
import {rollingDailyDates,rollingMonths} from "../lib/seo-sitemap";

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

  it("generates unique rolling daily and monthly windows inside the launch policy",()=>{
    delete process.env.SEO_EXTRA_INDEX_CITIES;
    const city=phase1PriorityCities[0];
    const dates=rollingDailyDates(14,45);
    const months=rollingMonths(2,12);

    expect(dates).toHaveLength(60);
    expect(new Set(dates).size).toBe(dates.length);
    expect(months).toHaveLength(15);
    expect(new Set(months.map(item=>`${item.year}-${item.slug}`)).size).toBe(months.length);

    for(const date of dates)expect(isDailyIndexable(city,date)).toBe(true);
    for(const item of months)expect(isMonthlyIndexable(city,item.year,item.month)).toBe(true);
  });

  it("keeps daily robots aligned to the -14/+45 day sitemap window",()=>{
    const city=phase1PriorityCities[0];
    const inWindow=rollingDailyDates(14,45);
    const first=new Date(`${inWindow[0]}T00:00:00Z`);
    const last=new Date(`${inWindow[inWindow.length-1]}T00:00:00Z`);
    const tooOld=new Date(first.getTime()-86400000).toISOString().slice(0,10);
    const tooFuture=new Date(last.getTime()+86400000).toISOString().slice(0,10);

    expect(isDailyIndexable(city,tooOld)).toBe(false);
    expect(isDailyIndexable(city,tooFuture)).toBe(false);
  });

  it("keeps month-level Muhurat robots aligned to the current/+12 month sitemap window",()=>{
    const city=phase1PriorityCities[0];
    const months=rollingMonths(0,12);
    for(const item of months){
      expect(isMonthlyMuhuratIndexable("wedding",item.year,item.month)).toBe(true);
      expect(isMonthlyMuhuratIndexable("griha-pravesh",item.year,item.month,city)).toBe(true);
    }

    const first=months[0];
    const previousMonth=new Date(Date.UTC(first.year,first.month-2,1));
    expect(isMonthlyMuhuratIndexable("wedding",previousMonth.getUTCFullYear(),previousMonth.getUTCMonth()+1)).toBe(false);

    const last=months[months.length-1];
    const afterWindow=new Date(Date.UTC(last.year,last.month,1));
    expect(isMonthlyMuhuratIndexable("wedding",afterWindow.getUTCFullYear(),afterWindow.getUTCMonth()+1)).toBe(false);
  });
});
