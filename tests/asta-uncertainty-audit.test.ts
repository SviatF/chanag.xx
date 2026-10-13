import {describe,expect,it} from "vitest";
import {reconcileAstaScenarios,type AstaNativeRecord} from "../lib/asta-uncertainty-audit";
import type {AstaReference} from "../lib/asta-reference-audit";
import {astaEvidenceLedger} from "./fixtures/asta-evidence-ledger";

const reference:AstaReference={
  planet:"Jupiter",year:2027,locality:"Mumbai, Maharashtra",
  publisher:"Drik Panchang",url:"https://www.drikpanchang.com/planet/asta/guru-asta-date-time.html",
  method:"observer-sensitive",precision:"minute",sourceLocationMode:"geolocated-snapshot",
  startLocal:"2027-08-19T19:34",endLocal:"2027-09-13T05:46",
  reviewedOn:"2026-10-13"
};
function events(profile:string,evening:string,morning:string):AstaNativeRecord[]{
  return [
    {locality:reference.locality,planet:"Jupiter",event:"evening-last",atmosphere:{id:profile},
      status:"predicted-native-swiss-heliacal",instantLocalIst:evening,targetYear:2027},
    {locality:reference.locality,planet:"Jupiter",event:"morning-first",atmosphere:{id:profile},
      status:"predicted-native-swiss-heliacal",instantLocalIst:morning,targetYear:2027}
  ];
}
describe("Wave 3Q Asta method comparison is never ceremony eligibility",()=>{
  it("builds honest sampled scenario spreads without mistaking them for uncertainty confidence",()=>{
    const res=reconcileAstaScenarios("Jupiter",2027,reference.locality,[
      ...events("clear","2027-08-07T19:41","2027-09-20T05:57"),
      ...events("hazy","2027-07-17T19:52","2027-10-07T05:57")
    ],[reference]);
    expect(res.status).toBe("exploratory-scenario-spread");
    expect(res.usableProfiles).toBe(2);
    expect(res.scenarioSensitivity).not.toBeNull();
    expect(res.scenarioSensitivity?.notAConfidenceInterval).toBe(true);
    expect(res.scenarioSensitivity?.lastEveningSpreadMinutes).toBeGreaterThan(20000);
    expect(res.scenarioSensitivity?.firstMorningSpreadMinutes).toBeGreaterThan(20000);
    expect(res.sourceEvidence).toBe("insufficient-independent-minute-sources");
    expect(res.independentlyValidated).toBe(false);
    expect(res.safeForCeremonyFiltering).toBe(false);
    expect(res.sourceMethodMapping).toBe("UNESTABLISHED");
    expect(res.pairs.every(p=>p.temporalOnlyOffsetsMinutes!==null)).toBe(true);
  });
  it("rejects 2028 heliacal events as Shukra 2027 matches",()=>{
    const res=reconcileAstaScenarios("Venus",2027,"Mumbai, Maharashtra",[
      {locality:"Mumbai, Maharashtra",planet:"Venus",event:"evening-last",atmosphere:{id:"clear"},
        status:"native-event-outside-target-year",instantLocalIst:"2028-05-24T19:24"},
      {locality:"Mumbai, Maharashtra",planet:"Venus",event:"morning-first",atmosphere:{id:"clear"},
        status:"native-event-outside-target-year",instantLocalIst:"2028-06-10T05:41"}
    ],astaEvidenceLedger);
    expect(res.status).toBe("outside-target-year");
    expect(res.usableProfiles).toBe(0);
    expect(res.scenarioSensitivity).toBeNull();
    expect(res.pairs).toEqual([]);
    expect(res.safeForCeremonyFiltering).toBe(false);
  });
  it("rejects inverted event chronology, not an imaginary negative combustion",()=>{
    const res=reconcileAstaScenarios("Jupiter",2027,reference.locality,
      events("clear","2027-09-14T07:00","2027-09-13T08:00"),[reference]);
    expect(res.status).toBe("invalid-native-pair");
    expect(res.excluded).toEqual([{profile:"clear",reason:"invalid-native-order-or-civil-time"}]);
    expect(res.usableProfiles).toBe(0);
  });
  it("never pools different planets, different cities or mismatched atmosphere IDs",()=>{
    const records=events("clear","2027-08-07T19:41","2027-09-20T05:57");
    const unpaired=[records[0],{...records[1],atmosphere:{id:"hazy"}}];
    const u=reconcileAstaScenarios("Jupiter",2027,reference.locality,unpaired,[reference]);
    expect(u.status).toBe("unpaired-atmosphere");
    expect(u.usableProfiles).toBe(0);
    const other=reconcileAstaScenarios("Jupiter",2027,"Pune, Maharashtra",records,[reference]);
    expect(other.status).toBe("missing-native-events");
    expect(other.sampleCount).toBe(0);
    expect(other.sameCityMinuteSourceCount).toBe(0);
  });
  it("quarantines duplicate event types instead of trusting the first one",()=>{
    const original=events("clear","2027-08-07T19:41","2027-09-20T05:57");
    const contaminated=[...original,{...original[0],instantLocalIst:"2027-08-12T19:41"}];
    const res=reconcileAstaScenarios("Jupiter",2027,reference.locality,contaminated,[reference]);
    expect(res.status).toBe("invalid-native-pair");
    expect(res.rejectedNativeRecords).toBe(1);
    expect(res.usableProfiles).toBe(0);
    expect(res.excluded).toContainEqual({profile:"clear",reason:"duplicate-native-event-type"});
  });
  it("does not silently approve a matching same-city published timestamp",()=>{
    const predicted=events("clear",reference.startLocal,reference.endLocal);
    const res=reconcileAstaScenarios("Jupiter",2027,reference.locality,predicted,[reference]);
    expect(res.pairs[0].temporalOnlyOffsetsMinutes).toEqual({publishedStart:0,publishedEnd:0});
    expect(res.sourceMethodMapping).toBe("UNESTABLISHED");
    expect(res.independentlyValidated).toBe(false);
    expect(res.safeForCeremonyFiltering).toBe(false);
  });
  it("never rebrands duplicate publisher evidence as independent validation",()=>{
    const another={...reference,url:"https://m.drikpanchang.com/duplicate",publisher:"Drik Panchang"};
    const res=reconcileAstaScenarios("Jupiter",2027,reference.locality,
      events("clear","2027-08-07T19:41","2027-09-20T05:57"),[reference,another]);
    expect(res.reproduciblePublisherMinuteSourceCount).toBe(0);
    expect(res.pairs[0].temporalOnlyOffsetsMinutes).toBeNull();
    expect(res.independentlyValidated).toBe(false);
  });
});
