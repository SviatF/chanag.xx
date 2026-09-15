import {describe,expect,it} from "vitest";
import {MUHURAT_PANCHANG_SHARD_IDS} from "../generated/muhurat-panchang-shards";
import {findCityBySlug} from "../lib/cities";
import {getPrecomputedMuhuratPanchangMonth,loadMuhuratPrecomputedShard} from "../lib/muhurat-precomputed";

describe("Muhurat precomputed shard runtime",()=>{
  it("dynamically imports and decompresses a committed 20-city monthly shard",async()=>{
    const shardId="2026-09";
    expect(MUHURAT_PANCHANG_SHARD_IDS).toContain(shardId);
    const [year,month]=shardId.split("-").map(Number);
    const shard=await loadMuhuratPrecomputedShard(shardId);
    expect(shard).not.toBeNull();
    expect(shard?.shardId).toBe(shardId);
    expect(shard?.targets).toHaveLength(20);

    const mumbai=findCityBySlug("mumbai");
    expect(mumbai).toBeTruthy();
    const rows=await getPrecomputedMuhuratPanchangMonth(year,month,mumbai!);
    expect(rows).toHaveLength(new Date(Date.UTC(year,month,0)).getUTCDate());
    expect(rows?.[0]?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("dynamically imports a single-city yearly baseline shard",async()=>{
    const shardId="2025-01";
    expect(MUHURAT_PANCHANG_SHARD_IDS).toContain(shardId);
    const shard=await loadMuhuratPrecomputedShard(shardId);
    expect(shard).not.toBeNull();
    expect(shard?.shardId).toBe(shardId);
    expect(shard?.targets).toHaveLength(1);
    expect(shard?.targets[0].startsWith("mumbai|")).toBe(true);

    const mumbai=findCityBySlug("mumbai");
    expect(mumbai).toBeTruthy();
    const rows=await getPrecomputedMuhuratPanchangMonth(2025,1,mumbai!);
    expect(rows).toHaveLength(31);
  });

  it("returns null for a month outside the generated registry so live fallback can run",async()=>{
    const mumbai=findCityBySlug("mumbai");
    expect(mumbai).toBeTruthy();
    expect(await getPrecomputedMuhuratPanchangMonth(2099,1,mumbai!)).toBeNull();
  });
});
