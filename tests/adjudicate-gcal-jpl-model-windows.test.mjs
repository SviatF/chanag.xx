import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {adjudicateGcalJplModelWindows} from "../scripts/adjudicate-gcal-jpl-model-windows.mjs";
const example=(city,date,category,fast,subtype)=>({
 city,year:2026,date,sunriseThreeWayAgreement:category,
 fastDateMismatch:fast,subtypeDisagreement:subtype,
 sourceSubtype:subtype?"Trisprsa Mahadvadasi":null,
 independentSubtype:null,sourceGcalTithiIndex:11,
 jplAtOriginalGcalSunriseIndex:11,swissAtOriginalGcalSunriseIndex:11,
 nearestRealJplTithiBoundaryUtc:"2026-06-25T00:00:00.000Z",
 nearestJplBoundarySignedSecondsFromGcalSunrise:37,
 swissVsJplExactTithiRoot:null
});
function fixture(){
 const a=example("agra","2026-06-25","ALL_AGREE",true,false);
 const b=example("amravati","2026-11-21","SWISS_AND_JPL_AGREE_GCAL_DIFFERS",false,true);
 return {status:"GCAL_JPL_DE440S_SWISS_TITHI_RESEARCH_DIAGNOSED",
  originalGcalExecutableGitBlob:"source",jpl:{kernelSha256:"jpl"},
  coverage:{caseRows:2,sameInstantRows:2},
  independentlyCertified:false,publicRitualApproval:false,
  disputedEventRows:[a,b],everyMatchedRawGcalDawnRow:[a,b]};
}
describe("remaining GCal date/subtype case-level evidence only",()=>{
 it("separates a potential ritual-rule case from JPL and Swiss concordance against original GCal",()=>{
  const v=adjudicateGcalJplModelWindows(fixture(),2);
  assert.equal(v.coverage.disputedCases,2);
  assert.equal(v.coverage.fastDateDisagreements,1);
  assert.equal(v.coverage.bidirectionalSubtypeDisagreements,1);
  assert.equal(v.causeEvidenceByCategory.NO_OBSERVED_TITHI_MODEL_CONFLICT_CHECK_RITUAL_OR_NAKSHATRA,1);
  assert.equal(v.causeEvidenceByCategory.JPL_MATCHES_SWISS_GCAL_DIVERGES,1);
  assert.equal(v.independentlyCertified,false);
  assert.equal(v.publicRitualApproval,false);
 });
 it("fails closed on an unexplained or unrecorded source discrepancy",()=>{
  const x=fixture();x.everyMatchedRawGcalDawnRow=[];
  assert.throws(()=>adjudicateGcalJplModelWindows(x,2),/source window entirely missing/);
 });
 it("refuses to substitute a green scientific audit for ritual certification",()=>{
  const x=fixture();x.publicRitualApproval=true;
  assert.throws(()=>adjudicateGcalJplModelWindows(x,2),/invalid original/);
 });
});
