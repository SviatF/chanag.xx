import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {compareResearchRuns} from "../scripts/verify-independent-454-research-gate.mjs";
const makeSummary=()=>({
 status:"RESEARCH_COMPLETE_WITH_OPEN_GAPS",
 independentlyCertified:false,publicRitualApproval:false,
 coverage:{cities:454,years:[2026,2027],cityYears:908,shards:16},
 totals:{sourceEkadashiFasts:22246,unrelatedSourceFastsExcluded:2724,
  candidateMismatches:160,subtypeMismatches:87,paranaStartComparisons:18993,
  paranaEndComparisons:18993,paranaStartOverFiveMinutes:0,paranaEndOverFiveMinutes:0},
 parana:{missingNumericBounds:3253}
});
const event={date:"2026-01-14",gcalEkadashiFast:true,mismatch:false,sourceSubtype:null,subtypeMatch:true,
 startResidualMinutes:0,endResidualMinutes:0};
function scenario(){
 const baseline=makeSummary(),current=structuredClone(baseline);
 current.totals.candidateMismatches=159;
 current.totals.independentOnlySubtypeCandidates=0;
 const oldRows=new Map(),newRows=new Map();
 for(let i=0;i<18993;i++){
  const key="city/"+(2026+i%2)+"/event-"+i;
  oldRows.set(key,{...event});
  newRows.set(key,{...event});
 }
 return {baseline,current,oldRows,newRows};
}
describe("PANCHVANI strict 908-year parity and no-regression gate",()=>{
 it("accepts real improvement with all old ordinary Parana endpoints still intact",()=>{
  const {baseline,current,oldRows,newRows}=scenario();
  const r=compareResearchRuns(baseline,current,oldRows,newRows);
  assert.equal(r.status,"RESEARCH_PARITY_PROGRESS_VERIFIED");
  assert.equal(r.metrics.caseLevel.retainedOldPairs,18993);
  assert.equal(r.independentCertification,false);
 });
 it("blocks aggregate calendar candidate regression",()=>{
  const a=scenario();a.current.totals.candidateMismatches=161;
  assert.equal(compareResearchRuns(...Object.values(a)).status,"REGRESSION_GATE_FAILED");
 });
 it("blocks newly compared Parana with over-five-minute residual",()=>{
  const a=scenario();a.current.totals.paranaStartOverFiveMinutes=1;
  assert.match(compareResearchRuns(...Object.values(a)).errors.join(" "),/exceeds 5 minutes/);
 });
 it("blocks one previously verified ordinary Parana clock regression even if totals improve",()=>{
  const a=scenario();
  const key=a.newRows.keys().next().value;
  a.newRows.set(key,{...a.newRows.get(key),startResidualMinutes:4});
  assert.match(compareResearchRuns(...Object.values(a)).errors.join(" "),/Parana numerical endpoints regressed/);
 });
 it("blocks an old matched fasting day becoming a mismatch",()=>{
  const a=scenario();const key=a.newRows.keys().next().value;
  a.newRows.set(key,{...a.newRows.get(key),mismatch:true});
  assert.match(compareResearchRuns(...Object.values(a)).errors.join(" "),/Previously matched fast dates regressed/);
 });
 it("blocks newly invented Mahadvadashi subtype when GCal has no subtype",()=>{
  const a=scenario(),key=a.newRows.keys().next().value;
  a.newRows.set(key,{...a.newRows.get(key),subtype:"UNMILANI"});
  a.current.totals.independentOnlySubtypeCandidates=1;
  const result=compareResearchRuns(...Object.values(a));
  assert.equal(result.status,"REGRESSION_GATE_FAILED");
  assert.match(result.errors.join(" "),/independent-only Mahadvadashi/i);
 });
 it("blocks unreported independently invented subtype count",()=>{
  const a=scenario(),key=a.newRows.keys().next().value;
  a.newRows.set(key,{...a.newRows.get(key),subtype:"UNMILANI"});
  const result=compareResearchRuns(...Object.values(a));
  assert.match(result.errors.join(" "),/source disagreement totals invalid/);
 });
 it("rejects false ritual certification",()=>{
  const a=scenario();a.current.publicRitualApproval=true;
  assert.match(compareResearchRuns(...Object.values(a)).errors.join(" "),/flags must remain disabled/);
 });
 it("rejects a green-but-unimproved audit",()=>{
  const a=scenario();a.current.totals.candidateMismatches=160;
  assert.match(compareResearchRuns(...Object.values(a)).errors.join(" "),/No measurable improvement/);
 });
});