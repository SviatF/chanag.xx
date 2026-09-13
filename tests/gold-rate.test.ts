import {afterEach,describe,expect,it} from "vitest";
import {goldRateCandidateCitySlugs,goldRateGate,goldRateIndexCitySlugs,parseGoldRateDataset,type GoldRateDataset} from "../lib/gold-rate";

const previous={...process.env};
afterEach(()=>{process.env={...previous};});

function dataset(validationPassed=true):GoldRateDataset{
  const history=Array.from({length:14},(_,index)=>({date:`2026-09-${String(index+1).padStart(2,"0")}`,rates:{"24k":10000+index,"22k":9200+index,"18k":7500+index}}));
  return {
    updatedAt:new Date().toISOString(),
    validatedSince:new Date(Date.now()-15*86400000).toISOString(),
    updateFrequency:"hourly",
    source:{name:"Test source",url:"https://example.com"},
    national:{rates:{"24k":10020,"22k":9220,"18k":7520},history},
    cities:{mumbai:{rates:{"24k":10030,"22k":9230,"18k":7530},history}},
    validation:{
      passed:validationPassed,
      firstValidationDate:"2026-08-29",
      lastValidationDate:"2026-09-12",
      elapsedDays:15,
      observations:11,
      minDays:14,
      minObservations:10,
      averageDifferencePct:validationPassed?1.2:2.4,
      maxDifferencePct:validationPassed?3.1:5.3,
      averageThresholdPct:2,
      singleDayThresholdPct:5,
    },
  };
}

describe("gold rate launch guardrails",()=>{
  it("keeps a bounded candidate pool",()=>{expect(goldRateCandidateCitySlugs.length).toBeGreaterThanOrEqual(30);expect(goldRateCandidateCitySlugs.length).toBeLessThanOrEqual(50);});
  it("requires explicit demand-approved cities",()=>{process.env.GOLD_RATE_INDEX_CITIES="mumbai,not-a-city,mumbai";expect(goldRateIndexCitySlugs()).toEqual(["mumbai"]);});
  it("does not index unless public and indexing gates are explicitly enabled",()=>{process.env.GOLD_RATE_PUBLIC_ENABLED="false";process.env.GOLD_RATE_INDEXING_ENABLED="false";process.env.GOLD_RATE_INDEX_CITIES="mumbai";expect(goldRateGate(dataset()).ready).toBe(false);});
  it("opens only after accuracy validation, freshness and city history pass",()=>{process.env.GOLD_RATE_PUBLIC_ENABLED="true";process.env.GOLD_RATE_INDEXING_ENABLED="true";process.env.GOLD_RATE_INDEX_CITIES="mumbai";expect(goldRateGate(dataset()).ready).toBe(true);});
  it("does not treat elapsed validation time alone as accuracy approval",()=>{process.env.GOLD_RATE_PUBLIC_ENABLED="true";process.env.GOLD_RATE_INDEXING_ENABLED="true";process.env.GOLD_RATE_INDEX_CITIES="mumbai";const value=dataset(false);expect(goldRateGate(value).ready).toBe(false);expect(goldRateGate(value).reasons.join(" ")).toContain("IBJA");});
  it("rejects malformed rate payloads rather than inventing missing purities",()=>{expect(parseGoldRateDataset({updatedAt:new Date().toISOString(),source:{name:"x"},national:{rates:{"24k":1,"22k":1}},cities:{}})).toBeNull();});
});
