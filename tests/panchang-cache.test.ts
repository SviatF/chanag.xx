import {beforeEach,describe,expect,it} from "vitest";
import type {Panchang} from "../lib/panchang";
import {clearPanchangCacheForTests,getOrComputeCachedPanchang,panchangCacheKey,setPanchangKvBinding} from "../lib/panchang-cache";

class FakeKv{
  data=new Map<string,string>();
  gets=0;
  puts=0;
  async get(key:string){this.gets++;return this.data.get(key)??null;}
  async put(key:string,value:string){this.puts++;this.data.set(key,value);}
}

const sample={date:"2026-09-15",sunrise:"06:12",tithi:"Chaturthi"} as Panchang;

describe("Panchang calculation cache",()=>{
  beforeEach(()=>clearPanchangCacheForTests());

  it("persists a computed day and reuses it without recomputing",async()=>{
    const kv=new FakeKv();
    setPanchangKvBinding(kv);
    let computes=0;
    const key=panchangCacheKey("mumbai","2026-09-15");
    const first=await getOrComputeCachedPanchang(key,async()=>{computes++;return sample;});
    expect(first).toEqual(sample);
    expect(computes).toBe(1);
    expect(kv.puts).toBe(1);

    clearPanchangCacheForTests();
    setPanchangKvBinding(kv);
    const second=await getOrComputeCachedPanchang(key,async()=>{computes++;return sample;});
    expect(second).toEqual(sample);
    expect(computes).toBe(1);
    expect(kv.gets).toBeGreaterThan(0);
  });

  it("falls back to authoritative calculation if persisted JSON is corrupt",async()=>{
    const kv=new FakeKv();
    const key=panchangCacheKey("delhi","2026-09-15");
    kv.data.set(key,"{broken");
    setPanchangKvBinding(kv);
    let computes=0;
    const value=await getOrComputeCachedPanchang(key,async()=>{computes++;return sample;});
    expect(value).toEqual(sample);
    expect(computes).toBe(1);
    expect(kv.puts).toBe(1);
  });

  it("deduplicates simultaneous misses inside one isolate",async()=>{
    let release!:()=>void;
    const gate=new Promise<void>(resolve=>{release=resolve;});
    let computes=0;
    const key=panchangCacheKey("hyderabad","2026-09-15");
    const compute=async()=>{computes++;await gate;return sample;};
    const a=getOrComputeCachedPanchang(key,compute);
    const b=getOrComputeCachedPanchang(key,compute);
    await Promise.resolve();
    expect(computes).toBe(1);
    release();
    await Promise.all([a,b]);
    expect(computes).toBe(1);
  });
});
