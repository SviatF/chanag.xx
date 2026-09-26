import {describe,expect,it} from "vitest";
import {nakshatraNaming} from "../lib/baby-names";
import {buildNakshatraNamingQuality} from "../lib/baby-name-quality";

function corpus(slug:string){
  const item=nakshatraNaming.find(entry=>entry.slug===slug)!;
  const quality=buildNakshatraNamingQuality(item,nakshatraNaming);
  return [
    quality.directAnswer,
    ...quality.facts.flatMap(fact=>[fact.label,fact.value,fact.note??""]),
    ...quality.padaGuides.flatMap(guide=>[guide.title,guide.body]),
    quality.transliterationTitle,quality.transliterationBody,
    quality.examplesTitle,quality.examplesBody,
    quality.workflowTitle,quality.workflowBody,
    quality.sequenceTitle,quality.sequenceBody,
    ...quality.faqs.flatMap(faq=>[faq.question,faq.answer])
  ].join(" ").replace(/\s+/g," ").trim();
}

function wordCount(value:string){return value.split(/\s+/).filter(Boolean).length;}

describe("Nakshatra baby-name mass-content quality",()=>{
  it("builds a deep four-Pada reference for every maintained Nakshatra",()=>{
    expect(nakshatraNaming).toHaveLength(27);
    for(const item of nakshatraNaming){
      const quality=buildNakshatraNamingQuality(item,nakshatraNaming);
      expect(quality.padaGuides).toHaveLength(4);
      expect(quality.padaGuides.map(guide=>guide.sound)).toEqual(item.sounds);
      expect(quality.faqs).toHaveLength(4);
      expect(wordCount(corpus(item.slug))).toBeGreaterThan(500);
      expect(quality.workflowBody).toMatch(/birth time/i);
      expect(quality.workflowBody).toMatch(/birthplace/i);
    }
  });

  it("keeps all 27 generated page corpora materially page-specific",()=>{
    const texts=nakshatraNaming.map(item=>corpus(item.slug));
    expect(new Set(texts).size).toBe(27);
    for(let i=0;i<nakshatraNaming.length;i++){
      const text=texts[i];
      expect(text).toContain(nakshatraNaming[i].name);
      for(const sound of nakshatraNaming[i].sounds)expect(text).toContain(sound);
      expect(text).toContain(`${i+1} of 27`);
    }
  });

  it("does not force a fabricated example when a Pada sound has no clean prefix match",()=>{
    const shravana=nakshatraNaming.find(item=>item.slug==="shravana")!;
    const quality=buildNakshatraNamingQuality(shravana,nakshatraNaming);
    expect(quality.examplesBody).toContain("Khem, Khemraj, Kheya");
    expect(quality.padaGuides.some(guide=>guide.body.includes("does not contain a clean Roman-prefix match"))).toBe(true);
  });
});
