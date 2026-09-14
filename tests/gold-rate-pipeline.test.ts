import {afterEach,describe,expect,it} from "vitest";
import {buildGoldRatePublicDataset,buildGoldRateValidationSummary,calculateIndiaGoldRates,goldRatePipelineDefaults,type GoldRatePipelineState,type GoldRateValidationEntry} from "../lib/gold-rate-pipeline";

const previous={...process.env};
afterEach(()=>{process.env={...previous};});

function validation(date:string,differencePct:number):GoldRateValidationEntry{
  return {date,ibja999Per10g:100000,ibja999PerGram:10000,calculatedPreGst24kPerGram:10000*(1+differencePct/100),differencePct,recordedAt:`${date}T12:00:00.000Z`,note:"manual test"};
}

function state():GoldRatePipelineState{
  return {
    version:1,
    startedAt:"2026-09-01T00:00:00.000Z",
    lastAttemptAt:"2026-09-13T12:00:00.000Z",
    lastSuccessAt:"2026-09-13T12:00:00.000Z",
    lastError:null,
    observations:[
      {at:"2026-09-12T12:00:00.000Z",spotUpdatedAt:"2026-09-12T12:00:00.000Z",spotSource:"gold-api.com",spotUsdPerOz:3600,fxDate:"2026-09-12",fxSource:"Frankfurter/ECB",usdInr:90,importDutyRate:.15,gstRate:.03,spotInrPerGram:10000,benchmarkComparable24k:11500,rates:{"24k":11845,"22k":10857.9167,"18k":8883.75}},
      {at:"2026-09-13T12:00:00.000Z",spotUpdatedAt:"2026-09-13T12:00:00.000Z",spotSource:"gold-api.com",spotUsdPerOz:3620,fxDate:"2026-09-13",fxSource:"Frankfurter/ECB",usdInr:90,importDutyRate:.15,gstRate:.03,spotInrPerGram:10050,benchmarkComparable24k:11557.5,rates:{"24k":11904.225,"22k":10912.20625,"18k":8928.16875}},
    ],
    validations:[],
  };
}

describe("Gold Rate free-stack pipeline",()=>{
  it("derives 22K and 18K from one 24K domestic base and keeps IBJA comparison pre-GST",()=>{
    const result=calculateIndiaGoldRates(3600,90,.15,.03);
    expect(result.rates["22k"]).toBeCloseTo(result.rates["24k"]*(22/24),8);
    expect(result.rates["18k"]).toBeCloseTo(result.rates["24k"]*(18/24),8);
    expect(result.rates["24k"]).toBeCloseTo(result.benchmarkComparable24k*1.03,8);
    expect(result.benchmarkComparable24k).toBeLessThan(result.rates["24k"]);
  });

  it("passes validation only after enough elapsed days and observations stay inside thresholds",()=>{
    const entries=Array.from({length:10},(_,index)=>validation(`2026-09-${String(index+1).padStart(2,"0")}`,index===9?4.9:1.1));
    const summary=buildGoldRateValidationSummary(entries,new Date("2026-09-15T12:00:00Z"));
    expect(summary.passed).toBe(true);
    expect(summary.averageDifferencePct).toBeLessThanOrEqual(2);
    expect(summary.maxDifferencePct).toBeLessThanOrEqual(5);
  });

  it("fails validation when any benchmark day exceeds 5 percent",()=>{
    const entries=Array.from({length:10},(_,index)=>validation(`2026-09-${String(index+1).padStart(2,"0")}`,index===9?5.01:1));
    expect(buildGoldRateValidationSummary(entries,new Date("2026-09-15T12:00:00Z")).passed).toBe(false);
  });

  it("builds city estimates deterministically and keeps configured default premiums below one percent",()=>{
    const dataset=buildGoldRatePublicDataset(state(),new Date("2026-09-13T12:30:00Z"));
    expect(dataset).not.toBeNull();
    expect(dataset!.national.history).toHaveLength(2);
    expect(dataset!.cities.mumbai.rates["24k"]).toBeCloseTo(dataset!.national.rates["24k"],8);
    const chennaiPremium=dataset!.cities.chennai.rates["24k"]/dataset!.national.rates["24k"]-1;
    expect(chennaiPremium).toBeGreaterThan(0);
    expect(chennaiPremium).toBeLessThan(0.01);
    expect(Math.max(...Object.values(goldRatePipelineDefaults.cityPremiums))).toBeLessThan(0.01);
  });

  it("keeps the last known valid rate visible when a later live refresh fails",()=>{
    const value=state();
    value.lastAttemptAt="2026-09-13T13:00:00.000Z";
    value.lastSuccessAt="2026-09-13T12:00:00.000Z";
    value.lastError="Both spot sources failed in staging test";
    const dataset=buildGoldRatePublicDataset(value,new Date("2026-09-13T13:05:00Z"));
    expect(dataset).not.toBeNull();
    expect(dataset!.status?.mode).toBe("last-known");
    expect(dataset!.status?.message).toContain("showing last known rate");
    expect(dataset!.national.rates["24k"]).toBeGreaterThan(0);
  });
});
