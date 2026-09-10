import {describe,expect,it} from "vitest";
import type {OpportunityLifecycleRecord} from "../lib/opportunity-lifecycle";
import type {SearchOpportunity} from "../lib/search-opportunities";
import {buildSeoActionPlan} from "../lib/seo-action-intelligence";
import {buildSeoExecutionBrief} from "../lib/seo-build-brief";

function activationOpportunity():SearchOpportunity{return {
  key:"regional:tamil:rahu-kalam:coimbatore:evergreen",
  intent:"regional:tamil:rahu-kalam",
  label:"Tamil Panchangam Rahu Kalam",
  topQuery:"tamil rahu kalam coimbatore",
  queryCount:3,
  city:"coimbatore",
  clicks:9,
  impressions:520,
  ctr:9/520,
  position:12.2,
  currentLanding:"/regional/tamil/coimbatore",
  recommendedPath:"/regional/tamil/coimbatore/rahu-kalam",
  template:"Existing regional intent route · demand-gated index activation",
  status:"NEW_CLUSTER",
  action:"REVIEW",
  score:88,
  reason:"The regional intent route already exists but is intentionally noindex until demand review. Approve tamil:coimbatore:rahu-kalam through SEO_EXTRA_REGIONAL_INTENTS only if GSC evidence justifies activation."
};}

function record(item:SearchOpportunity):OpportunityLifecycleRecord{return {
  key:item.key,stage:"DETECTED",owner:"",note:"",createdAt:"2026-09-10T00:00:00.000Z",updatedAt:"2026-09-10T00:00:00.000Z",
  context:{label:item.label,topQuery:item.topQuery,city:item.city,recommendedPath:item.recommendedPath,template:item.template},outcomes:[],history:[]
};}

describe("Regional SEO execution intelligence",()=>{
  it("reviews index activation instead of instructing a duplicate regional build",()=>{
    const item=activationOpportunity();
    const plan=buildSeoActionPlan({opportunity:item,record:record(item)});
    expect(plan.headline).toContain("index activation");
    expect(plan.steps[0].area).toBe("INDEXING");
    expect(plan.steps[0].action).toContain("SEO_EXTRA_REGIONAL_INTENTS");
    expect(plan.steps.every(step=>!step.action.startsWith("Build the approved"))).toBe(true);
  });

  it("produces a regional-specific review brief with localized and city-local quality gates",()=>{
    const item=activationOpportunity();
    const brief=buildSeoExecutionBrief({opportunity:item,record:record(item)});
    expect(brief.readiness).toBe("READY_FOR_REVIEW");
    expect(brief.sections.some(section=>section.title==="Localized intent answer"&&section.required)).toBe(true);
    expect(brief.sections.some(section=>section.title==="City-local calculation"&&section.required)).toBe(true);
    expect(brief.internalLinks.some(line=>line.includes("matching language hub"))).toBe(true);
    expect(brief.technicalChecks.some(line=>line.includes("Do not add the route to indexable expansion"))).toBe(true);
  });
});
