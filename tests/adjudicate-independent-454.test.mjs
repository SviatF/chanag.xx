import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {adjudicate} from "../scripts/adjudicate-independent-454.mjs";
const base={
 status:"RESEARCH_COMPLETE_WITH_OPEN_GAPS",independentlyCertified:false,publicRitualApproval:false,
 coverage:{cities:454,cityYears:908},
 totals:{candidateMismatches:1,subtypeMismatches:1,independentOnlySubtypeCandidates:1},
 mahadvadashi:{totalBidirectionalDisagreements:2},
 parana:{missingNumericBounds:2,gcalEventsWithEmptyClocks:1,
  originalGcalAfterOnlyEvents:1,verifiedAfterOnlyLowerBounds:1}
};
const row=(city,date,values)=>({
 city,year:2026,date,gcalEkadashiFast:false,independentFastCandidate:null,mismatch:false,
 subtype:null,sourceSubtype:null,subtypeMatch:true,calculatedParana:null,gcalParana:null,
 startResidualMinutes:null,endResidualMinutes:null,oneSidedAfterResidualMinutes:null,independentResearchAmbiguities:[],
 researchDawnSequence:[],certified:false,...values
});
const samples=()=>[
 row("first","2026-01-01",{
  gcalEkadashiFast:true,independentFastCandidate:"2026-01-01",gcalParana:{from:"",to:"",after:"10:50"},
  oneSidedAfterResidualMinutes:1,calculatedParana:{status:"calculated-research-only"}
 }),
 row("second","2026-01-02",{
  gcalEkadashiFast:true,independentFastCandidate:"2026-01-02",
  sourceSubtype:"Vyanjuli Mahadvadasi",subtypeMatch:false,
  gcalParana:{from:"06:00",to:"10:00"},calculatedParana:{status:"calculated-research-only"}
 }),
 row("third","2026-01-03",{
  gcalEkadashiFast:false,independentFastCandidate:"2026-01-03",mismatch:true,
  subtype:"UNMILANI",subtypeMatch:false
 })
];
describe("454-city forensic ledger preserves GCal evidence distinctions",()=>{
 it("fully explains empty oracle clocks versus incompatible types",()=>{
  const l=adjudicate(samples(),structuredClone(base));
  assert.equal(l.status,"RESEARCH_GAPS_FULLY_ACCOUNTED_FOR_NOT_CERTIFIED");
  assert.deepEqual(l.totals,{fastDateDisagreements:1,sourceOnlySubtypeDisagreements:1,
   independentOnlySubtypeDisagreements:1,bidirectionalSubtypeDisagreements:2,
   paranaNotNumericallyComparable:2,sourceClockTrulyMissing:0,
   originalGcalAfterOnlyParana:1,afterOnlyLowerBoundsVerified:1,
   subtypeDisagreementBlocksParana:1});
  assert.equal(l.paranaCases.find(r=>r.city==="first").category,"GCAL_VERIFIED_ONE_SIDED_AFTER");
  assert.equal(l.paranaCases.find(r=>r.city==="second").category,"SUBTYPE_DISAGREEMENT_BLOCKS_PARANA_COMPARISON");
  assert.equal(l.independentCertification,false);
 });
 it("refuses incomplete summary / mismatched audited source counts",()=>{
  const s=structuredClone(base);s.parana.missingNumericBounds=1;
  assert.throws(()=>adjudicate(samples(),s),/not reconciled/);
 });
 it("blocks claiming numerically missing Parana without a known cause",()=>{
  const rs=samples();rs[1]={...rs[1],sourceSubtype:null,subtype:null,subtypeMatch:true};
  const s=structuredClone(base);s.totals.subtypeMismatches=0;s.mahadvadashi.totalBidirectionalDisagreements=1;
  assert.throws(()=>adjudicate(rs,s),/unexplained Parana gaps/);
 });
 it("rejects a falsely blank clock when original source has not been verified",()=>{
  const rs=samples();rs[0].gcalParana.after="";
  const result=()=>adjudicate(rs,structuredClone(base));
  assert.throws(result,/missing GCal Parana clock/);
 });
 it("rejects a true after-only source bound that is more than five minutes off",()=>{
  const rs=samples();rs[0].oneSidedAfterResidualMinutes=7;
  assert.throws(()=>adjudicate(rs,structuredClone(base)),/within five minutes/);
 });
 it("fails closed on a falsely certified audit",()=>{
  const s=structuredClone(base);s.publicRitualApproval=true;
  assert.throws(()=>adjudicate(samples(),s),/tries to certify/);
 });
});
