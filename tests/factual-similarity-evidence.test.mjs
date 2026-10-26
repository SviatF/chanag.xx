import {describe,expect,it} from "vitest";
import {evidenceDistinctSimilarityPair as reviewed} from "../scripts/factual-similarity-evidence.mjs";
const make=(clockValues,distinctIsoDates=6)=>({factualEvidence:{clockValues,distinctIsoDates}});
describe("similarity factual evidence gate",()=>{
  const a=Array.from({length:24},(_,i)=>`${String(i).padStart(2,"0")}:11`);
  const b=Array.from({length:24},(_,i)=>`${String(i).padStart(2,"0")}:27`);
  it("retains every identical fact set and severe duplicate as a blocker",()=>{
    expect(reviewed(make(a),make(a),0.73)).toBe(false);
    expect(reviewed(make(a),make(b),0.91)).toBe(false);
    expect(reviewed(make(a,1),make(b),0.73)).toBe(false);
  });
  it("preserves substantial independently different local clock evidence for review rather than claiming identical data",()=>{
    expect(reviewed(make(a),make(b),0.73)).toBe(true);
  });
});
