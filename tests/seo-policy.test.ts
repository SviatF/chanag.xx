import {afterEach,describe,expect,it} from "vitest";
import {coreCities,supportedCities} from "../lib/cities";
import {activeIndexCitySlugs,isDailyIndexable,isMonthlyIndexable,isMonthlyMuhuratIndexable,isPriorityCity,phase1PriorityCities,primaryMuhuratEvents,robotsFor} from "../lib/seo-policy";
import {rollingDailyDates,rollingMonths} from "../lib/seo-sitemap";

const originalExtra=process.env.SEO_EXTRA_INDEX_CITIES;

afterEach(()=>{
  if(originalExtra===undefined)delete process.env.SEO_EXTRA_INDEX_CITIES;
  else process.env.SEO_EXTRA_INDEX_CITIES=originalExtra;
});

function shiftDate(dateIso:string,days:number){
  const value=new Date(`${dateIso}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate()+days);
  return value.toISOString().slice(0,10);
}

function shiftMonth(year:number,month:number,offset:number){
  const value=new Date(Date.UTC(year,month-1+offset,1,6));
  return {year:value.getUTCFullYear(),month:value.getUTCMonth()+1};
}

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

  it("keeps daily and monthly robots windows identical to their sitemap windows",()=>{
    delete process.env.SEO_EXTRA_INDEX_CITIES;
    const city=phase1PriorityCities[0];
    const dates=rollingDailyDates(14,45);
    const months=rollingMonths(2,12);

    expect(dates).toHaveLength(60);
    expect(new Set(dates).size).toBe(dates.length);
    expect(months).toHaveLength(15);
    expect(new Set(months.map(item=>`${item.year}-${item.slug}`)).size).toBe(months.length);

    for(const date of dates)expect(isDailyIndexable(city,date)).toBe(true);
    expect(isDailyIndexable(city,shiftDate(dates[0],-1))).toBe(false);
    expect(isDailyIndexable(city,shiftDate(dates.at(-1)! as string,1))).toBe(false);

    for(const item of months)expect(isMonthlyIndexable(city,item.year,item.month)).toBe(true);
    const beforeMonths=shiftMonth(months[0].year,months[0].month,-1);
    const afterMonths=shiftMonth(months.at(-1)!.year,months.at(-1)!.month,1);
    expect(isMonthlyIndexable(city,beforeMonths.year,beforeMonths.month)).toBe(false);
    expect(isMonthlyIndexable(city,afterMonths.year,afterMonths.month)).toBe(false);
  });

  it("keeps monthly Muhurat robots on the exact current-through-12-month sitemap horizon",()=>{
    delete process.env.SEO_EXTRA_INDEX_CITIES;
    const city=phase1PriorityCities[0];
    const months=rollingMonths(0,12);
    const event=primaryMuhuratEvents[0];

    expect(months).toHaveLength(13);
    for(const item of months){
      expect(isMonthlyMuhuratIndexable(event,item.year,item.month)).toBe(true);
      expect(isMonthlyMuhuratIndexable(event,item.year,item.month,city)).toBe(true);
    }
    const before=shiftMonth(months[0].year,months[0].month,-1);
    const after=shiftMonth(months.at(-1)!.year,months.at(-1)!.month,1);
    expect(isMonthlyMuhuratIndexable(event,before.year,before.month,city)).toBe(false);
    expect(isMonthlyMuhuratIndexable(event,after.year,after.month,city)).toBe(false);
    expect(isMonthlyMuhuratIndexable("gold-purchase",months[0].year,months[0].month,city)).toBe(false);
  });
});
