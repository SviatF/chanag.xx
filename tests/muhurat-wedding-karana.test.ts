import {describe,expect,it} from "vitest";
import {cityBySlug} from "../lib/cities";
import {getMonthlyMuhurat,buildRecommendedMuhuratWindows} from "../lib/muhurat";
import {screenWeddingVishtiKarana,hasCompleteWeddingKaranaEvidence} from "../lib/muhurat-wedding-karana";
import {buildYearlyMuhuratSummary} from "../lib/yearly-expansion";
import {boundMuhuratWindowsByLunarTransitions} from "../lib/muhurat-lunar-transitions";

const date="2026-05-06";
const evidence={
  date,karana:"Vanija",karanaEnd:"11:00",karanaEndDate:date,
  tithiEnd:"19:00",tithiEndDate:date
};
const windows=[
  {start:"09:00",end:"13:00",sources:["Amrit Choghadiya"]},
  {start:"16:00",end:"18:00",sources:["Abhijit Muhurat"]},
];

describe("Wave 3K: Wedding Vishti is a time interval, not a false all-day ban",()=>{
  it("subtracts the SECOND Karana Vishti after sunrise Vanija, respecting Tithi end",()=>{
    const r=screenWeddingVishtiKarana(evidence,windows);
    expect(r.status).toBe("vishti-screened");
    expect(r.blocked).toEqual([{start:"11:00",end:"19:00"}]);
    expect(r.windows).toEqual([{start:"09:00",end:"11:00",sources:["Amrit Choghadiya"]}]);
    expect(windows[0].end).toBe("13:00");
  });
  it("removes only the early Vishti hours when Bhadra is already active at sunrise",()=>{
    const r=screenWeddingVishtiKarana({...evidence,karana:"Vishti",karanaEnd:"10:30"},windows);
    expect(r.blocked).toEqual([{start:"00:00",end:"10:30"}]);
    expect(r.windows).toEqual([
      {start:"10:30",end:"13:00",sources:["Amrit Choghadiya"]},
      windows[1]
    ]);
  });
  it("treats Shakuni as its own Tithi-ending half and does not invent an extra prohibition",()=>{
    // Krishna Chaturdashi ends with Shakuni. The next Chatushpada
    // belongs to Amavasya and cannot extend sunrise-Tithi evidence.
    const candidate={...evidence,karana:"Shakuni",karanaEnd:"11:00",tithiEnd:"11:00"};
    const result=screenWeddingVishtiKarana(candidate,windows);
    expect(result.blocked).toEqual([{start:"00:00",end:"11:00"}]);
    // Windows are already clipped to the Tithi end upstream.
    const lunar=[{start:"09:00",end:"11:00",sources:["Amrit Choghadiya"]}];
    expect(screenWeddingVishtiKarana(candidate,lunar).windows).toEqual([]);
  });
  it("does not reopen wedding hours after Chatushpada transitions to prohibited Naga",()=>{
    const candidate={...evidence,karana:"Chatushpada",karanaEnd:"11:00"};
    const result=screenWeddingVishtiKarana(candidate,windows);
    expect(result.blocked).toEqual([{start:"00:00",end:"19:00"}]);
    expect(result.windows).toEqual([]);
  });
  it("allows post-transition clocks after the terminal prohibited Naga moves to Kimstughna",()=>{
    const candidate={...evidence,karana:"Naga",karanaEnd:"11:00"};
    const result=screenWeddingVishtiKarana(candidate,windows);
    expect(result.blocked).toEqual([{start:"00:00",end:"11:00"}]);
    expect(result.windows).toEqual([
      {start:"11:00",end:"13:00",sources:["Amrit Choghadiya"]},
      windows[1]
    ]);
  });
  it("keeps fixed-Karana exclusions until midnight for next-day Tithi ends",()=>{
    const candidate={
      ...evidence,karana:"Chatushpada",karanaEnd:"21:00",
      tithiEnd:"02:00",tithiEndDate:"2026-05-07"
    };
    const result=screenWeddingVishtiKarana(candidate,windows);
    expect(result.windows).toEqual([]);
    expect(result.blocked).toEqual([{start:"00:00",end:"23:59"}]);
  });
  it("does not invent a Vishti period if sunrise Vanija lasts until Tithi end",()=>{
    const r=screenWeddingVishtiKarana({...evidence,karanaEnd:"19:00"},windows);
    expect(r.blocked).toEqual([]);
    expect(r.windows).toEqual(windows);
  });
  it("handles next-day Karana ends with correct civil-date boundaries",()=>{
    const r=screenWeddingVishtiKarana({
      ...evidence,karana:"Vishti",karanaEnd:"02:00",karanaEndDate:"2026-05-07",
      tithiEnd:"03:00",tithiEndDate:"2026-05-07"
    },windows);
    expect(r.windows).toEqual([]);
    expect(r.blocked).toEqual([{start:"00:00",end:"23:59"}]);
  });
  it("rejects incomplete, unknown or chronologically invalid Karana evidence rather than approving windows",()=>{
    const invalid=[
      {...evidence,karana:""},
      {...evidence,karana:"Nonexistent"},
      {...evidence,karanaEnd:"—"},
      {...evidence,karanaEndDate:null},
      {...evidence,karanaEndDate:"2026-05-05"},
      {...evidence,karanaEndDate:"2026-05-10"},
      {...evidence,tithiEnd:"10:30"},
    ];
    for(const row of invalid){
      expect(hasCompleteWeddingKaranaEvidence(row)).toBe(false);
      const r=screenWeddingVishtiKarana(row,windows);
      expect(r.status).toBe("invalid-evidence");
      expect(r.windows).toEqual([]);
    }
  });
  it("leaves non-Vishti controls and zero-seconds fragments unaltered",()=>{
    const r=screenWeddingVishtiKarana({...evidence,karana:"Garaja"},[
      {start:"10:59",end:"11:05",sources:["Shubh Choghadiya"]}
    ]);
    expect(r.blocked).toHaveLength(0);
    expect(r.windows).toEqual([]);
  });
  it("publishes year-specific Bhadra changes derived from real candidates, not fabricated SEO prose",async()=>{
    const summary=await buildYearlyMuhuratSummary("wedding",2026,cityBySlug("mumbai"));
    const monthTotal=summary.months.reduce((sum,m)=>sum+(m.vishtiExcludedReferenceMinutes??0),0);
    expect(summary.vishtiExcludedReferenceMinutes).toBe(monthTotal);
    expect(summary.vishtiAffectedDates).toBe(summary.months.reduce((sum,m)=>sum+(m.vishtiAffectedDates??0),0));
    expect(monthTotal).toBeGreaterThan(0);
  });
  it("wedding candidate dates in a real precomputed month never overlap reviewed Vishti blocks",async()=>{
    const city=cityBySlug("mumbai");
    const {rows}=await getMonthlyMuhurat("wedding",2026,5,city);
    expect(rows.length).toBeGreaterThan(0);
    let verified=0;
    for(const row of rows){
      expect(row.karanaEvidenceStatus).toBe("vishti-screened");
      expect(hasCompleteWeddingKaranaEvidence(row.data)).toBe(true);
      const original=boundMuhuratWindowsByLunarTransitions(row.data,buildRecommendedMuhuratWindows(row.data));
      const checked=screenWeddingVishtiKarana(row.data,original.windows);
      expect(checked.windows).toEqual(row.recommendedWindows);
      for(const prohibited of checked.blocked){
        const toMinutes=(s:string)=>Number(s.slice(0,2))*60+Number(s.slice(3));
        for(const w of row.recommendedWindows){
          expect(toMinutes(w.end)<=toMinutes(prohibited.start)||toMinutes(w.start)>=toMinutes(prohibited.end)).toBe(true);
        }
      }
      verified++;
    }
    expect(verified).toBeGreaterThan(0);
  });
});
