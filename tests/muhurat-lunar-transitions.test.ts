import {describe,expect,it} from "vitest";
import {boundMuhuratWindowsByLunarTransitions} from "../lib/muhurat-lunar-transitions";

const references=[
  {start:"09:00",end:"10:00",sources:["Shubh Choghadiya"]},
  {start:"10:20",end:"11:30",sources:["Amrit Choghadiya"]},
  {start:"11:50",end:"12:40",sources:["Abhijit Muhurat"]},
];
const evidence={date:"2026-10-13",tithiEnd:"11:05",tithiEndDate:"2026-10-13",nakshatraEnd:"13:30",nakshatraEndDate:"2026-10-13"};

describe("Wave 3B: local Tithi and Nakshatra boundary protection",()=>{
  it("clips each daytime reference to the first ending sunrise-active lunar factor",()=>{
    const result=boundMuhuratWindowsByLunarTransitions(evidence,references);
    expect(result.status).toBe("lunar-bounded");
    expect(result.limitMinutes).toBe(11*60+5);
    expect(result.windows).toEqual([
      references[0],
      {...references[1],end:"11:05"},
    ]);
    expect(references[1].end).toBe("11:30");
  });
  it("uses the earlier Nakshatra end when Tithi lasts longer",()=>{
    const result=boundMuhuratWindowsByLunarTransitions({...evidence,nakshatraEnd:"09:45"},references);
    expect(result.windows).toEqual([{...references[0],end:"09:45"}]);
  });
  it("preserves same-civil-date daytime clocks if both factors end the next day",()=>{
    const result=boundMuhuratWindowsByLunarTransitions({
      date:"2026-10-13",tithiEnd:"01:30",tithiEndDate:"2026-10-14",
      nakshatraEnd:"03:00",nakshatraEndDate:"2026-10-14"
    },references);
    expect(result.status).toBe("lunar-bounded");
    expect(result.windows).toEqual(references);
  });
  it("does not certify existing version-2 sunrise-only precomputed snapshots",()=>{
    const result=boundMuhuratWindowsByLunarTransitions({date:"2026-10-13"},references);
    expect(result.status).toBe("sunrise-only");
    expect(result.windows).toEqual(references);
  });
  it("fails closed on partial, malformed, missing, or backwards transition data",()=>{
    const invalid=[
      {...evidence,nakshatraEndDate:null},
      {...evidence,tithiEnd:"—"},
      {...evidence,tithiEndDate:"2026-10-12"},
      {...evidence,tithiEndDate:"2026-13-13"},
      {...evidence,tithiEndDate:"2026-10-16"},
      {...evidence,nakshatraEnd:undefined},
    ];
    for(const snapshot of invalid){
      const result=boundMuhuratWindowsByLunarTransitions(snapshot,references);
      expect(result.status).toBe("invalid-evidence");
      expect(result.windows).toEqual([]);
    }
  });
  it("rejects short fragments under fifteen minutes and invalid source clocks",()=>{
    const result=boundMuhuratWindowsByLunarTransitions({...evidence,tithiEnd:"10:30"},[
      {start:"10:20",end:"11:00",sources:["Shubh Choghadiya"]},
      {start:"10:10",end:"10:40",sources:["Amrit Choghadiya"]},
      {start:"bad",end:"12:00",sources:["Abhijit Muhurat"]}
    ]);
    expect(result.windows).toEqual([{start:"10:10",end:"10:30",sources:["Amrit Choghadiya"]}]);
  });
});
