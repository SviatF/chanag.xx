import {describe,expect,it} from "vitest";
import {createBoundedPromiseCache} from "../lib/bounded-promise-cache";

describe("bounded promise cache",()=>{
  it("deduplicates concurrent work for the same key",async()=>{
    const cache=createBoundedPromiseCache<string,{value:number}>(2);
    let calls=0;
    const factory=async()=>{calls+=1;return {value:42};};
    const first=cache.getOrCreate("same",factory);
    const second=cache.getOrCreate("same",factory);
    expect(first).toBe(second);
    expect(await first).toEqual({value:42});
    expect(await second).toEqual({value:42});
    expect(calls).toBe(1);
    expect(cache.size()).toBe(1);
  });

  it("evicts the least recently used entry when the bound is exceeded",async()=>{
    const cache=createBoundedPromiseCache<string,number>(2);
    await cache.getOrCreate("a",()=>1);
    await cache.getOrCreate("b",()=>2);
    await cache.getOrCreate("a",()=>99);
    await cache.getOrCreate("c",()=>3);
    expect(cache.has("a")).toBe(true);
    expect(cache.has("b")).toBe(false);
    expect(cache.has("c")).toBe(true);
    expect(cache.size()).toBe(2);
  });

  it("drops rejected work so a later call can retry",async()=>{
    const cache=createBoundedPromiseCache<string,number>(2);
    let calls=0;
    await expect(cache.getOrCreate("retry",async()=>{calls+=1;throw new Error("boom");})).rejects.toThrow("boom");
    expect(cache.has("retry")).toBe(false);
    await expect(cache.getOrCreate("retry",async()=>{calls+=1;return 7;})).resolves.toBe(7);
    expect(calls).toBe(2);
  });
});
