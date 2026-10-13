import {describe,expect,it} from "vitest";
import {getPanchang,type Panchang} from "../lib/panchang";
import {cityBySlug} from "../lib/cities";
import {festivalBySlugYear} from "../lib/festivals";
import {rakhiBhadraAtSunrise} from "../lib/rakhi-bhadra-evidence";
import {getFestivalLocalReference} from "../lib/religious-integrity";
import {rakhiBhadraReferences} from "./fixtures/rakhi-bhadra-reference";
import {readFileSync} from "node:fs";

function mins(s:string){const [h,m]=s.split(":").map(Number);return h*60+m;}
describe("source-calibrated Bhadra/Purnima Rakhi morning screening",()=>{
  for(const reference of rakhiBhadraReferences){
    it(`${reference.year} ${reference.city}: independently observed local sunrise/Purnima end`,async()=>{
      const festival=festivalBySlugYear("raksha-bandhan",reference.year)!;
      expect(festival.date).toBe(reference.date);
      const data=await getPanchang(new Date(reference.date+"T06:00:00Z"),cityBySlug(reference.city));
      const ev=rakhiBhadraAtSunrise(data);
      expect(ev.status).toBe("purnima-bhadra-cleared");
      expect(data.karana).toBe("Bava");
      expect(ev.start).toBe(data.sunrise);
      expect(ev.end).toBe(data.tithiEnd);
      expect(Math.abs(mins(ev.start!)-mins(reference.sunrise))).toBeLessThanOrEqual(3);
      expect(Math.abs(mins(ev.end!)-mins(reference.purnimaEnd))).toBeLessThanOrEqual(3);
      const ref=getFestivalLocalReference(festival,data);
      expect(ref?.label).toBe("Bhadra-free Purnima reference");
      expect(ref?.value).toBe(`${ev.start} — ${ev.end}`);
    });
  }
  it("never infers a safe Rakhi interval while Vishti Bhadra is active",async()=>{
    const data=await getPanchang(new Date("2026-08-28T06:00:00Z"),cityBySlug("delhi"));
    const ev=rakhiBhadraAtSunrise({...data,karana:"Vishti"} as Panchang);
    expect(ev.status).toBe("vishti-at-sunrise");
    expect(ev.start).toBeNull();
    expect(ev.end).toBeNull();
    const festival=festivalBySlugYear("raksha-bandhan",2026)!;
    expect(getFestivalLocalReference(festival,{...data,karana:"Vishti"} as Panchang)?.value).toBe("Bhadra check required");
  });
  it("rejects missing date, impossible boundary, or non-Purnima sunrise",async()=>{
    const data=await getPanchang(new Date("2026-08-28T06:00:00Z"),cityBySlug("delhi"));
    for(const corrupted of [
      {...data,tithi:"Chaturdashi"}, {...data,tithiEndDate:null},
      {...data,tithiEnd:"00:01"},{...data,paksha:"Krishna"}
    ] as Panchang[]){
      const e=rakhiBhadraAtSunrise(corrupted);
      expect(e.status).not.toBe("purnima-bhadra-cleared");
      expect(e.start).toBeNull();
    }
  });
  it("keeps the reader-facing Rakhi explanation conditional on factual evidence",()=>{
    const jsx=readFileSync("app/festivals/[festival]/[year]/[city]/page.tsx","utf8");
    expect(jsx).toContain("rakhiEvidence.status");
    expect(jsx).toContain("rakhiEvidence.explanation");
    expect(jsx).toContain("Purnima");
    expect(jsx).not.toContain("content.ritualBody");
  });
});
