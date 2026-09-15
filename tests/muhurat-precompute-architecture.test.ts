import {existsSync,readFileSync,readdirSync} from "node:fs";
import {gunzipSync} from "node:zlib";
import {describe,expect,it} from "vitest";
import {MUHURAT_BUILD_DATA_SHARD_MAX_BYTES,type MuhuratBuildDataShard} from "../lib/muhurat-build-data-schema";
import {muhuratMonthSsgPriority} from "../lib/static-seo-routes";

function decodeShard(path:string){
  const source=readFileSync(path,"utf8");
  const match=source.match(/^export default (.+);\s*$/s);
  if(!match)throw new Error(`Invalid generated shard module: ${path}`);
  const base64=JSON.parse(match[1]) as string;
  return {
    base64Length:base64.length,
    data:JSON.parse(gunzipSync(Buffer.from(base64,"base64")).toString("utf8")) as MuhuratBuildDataShard,
  };
}

describe("Muhurat precomputed build-data architecture",()=>{
  it("ships five bounded month shards covering the complete 100-context priority matrix",()=>{
    const expectedShardIds=[...new Set(muhuratMonthSsgPriority.map(item=>`${item.year}-${item.month}`))].sort();
    expect(expectedShardIds).toHaveLength(5);

    const shardFiles=readdirSync("generated")
      .filter(file=>/^muhurat-panchang-shard-\d{4}-\d{2}\.ts$/.test(file))
      .sort();
    expect(shardFiles).toHaveLength(expectedShardIds.length);

    let totalTargets=0;
    for(const [index,file] of shardFiles.entries()){
      const {data,base64Length}=decodeShard(`generated/${file}`);
      expect(data.version).toBe(2);
      expect(data.shardId).toBe(expectedShardIds[index]);
      expect(data.signature).toMatch(/^[a-f0-9]{64}$/);
      expect(data.targets).toHaveLength(20);
      expect(Object.keys(data.entries)).toHaveLength(20);
      expect(Buffer.byteLength(JSON.stringify(data))).toBeLessThan(MUHURAT_BUILD_DATA_SHARD_MAX_BYTES);
      expect(base64Length).toBeLessThan(100_000);
      totalTargets+=data.targets.length;

      for(const target of data.targets){
        const rows=data.entries[target];
        expect(rows.length===28||rows.length===29||rows.length===30||rows.length===31).toBe(true);
        for(const row of rows){
          expect(Object.keys(row).sort()).toEqual([
            "abhijit","date","dayChoghadiya","gulika","nakshatra","rahu","tithi","yamaganda",
          ]);
        }
      }
    }
    expect(totalTargets).toBe(100);
  });

  it("uses a generated lazy-loader registry and removes the monolithic artifact",()=>{
    const registry=readFileSync("generated/muhurat-panchang-shards.ts","utf8");
    expect(registry).toContain("MUHURAT_PANCHANG_SHARD_IDS");
    expect(registry).toContain("MUHURAT_PANCHANG_SHARD_LOADERS");
    expect(registry).toContain('()=>import("./muhurat-panchang-shard-');
    expect(existsSync("generated/muhurat-panchang-data.ts")).toBe(false);
    expect(readdirSync("generated").some(file=>/^muhurat-panchang-chunk-\d+\.ts$/.test(file))).toBe(false);
  });

  it("derives per-shard freshness from the priority matrix, Panchang engine and snapshot schema",()=>{
    const source=readFileSync("scripts/precompute-muhurat.ts","utf8");
    expect(source).toContain("muhuratMonthSsgPriority");
    expect(source).toContain("muhuratCityMonthSsgPriority");
    expect(source).toContain('readFile(resolve(root,"lib/panchang.ts"');
    expect(source).toContain('readFile(resolve(root,"lib/muhurat-build-data-schema.ts"');
    expect(source).toContain("muhuratBuildDataShardId");
    expect(source).toContain("groupTargets");
    expect(source).toContain("isFreshShard");

    const calculation=source.slice(source.indexOf("clearMuhuratPanchangMonthCache()"));
    expect(calculation).toContain("for(const [shardId,shardTargets] of grouped)");
    expect(calculation).toContain("for(const target of shardTargets)");
    expect(calculation).toContain("await getMuhuratPanchangMonth");
    expect(calculation).not.toContain("Promise.all");
  });

  it("keeps normal CI and production builds verify-only",()=>{
    const pkg=JSON.parse(readFileSync("package.json","utf8")) as {scripts:Record<string,string>};
    expect(pkg.scripts.build).toContain("verify:muhurat-precompute");
    expect(pkg.scripts["build:next"]).toContain("verify:muhurat-precompute");
    expect(pkg.scripts.build).not.toContain("precompute:muhurat &&");
    expect(pkg.scripts["build:next"]).not.toContain("precompute:muhurat &&");

    const workflow=readFileSync(".github/workflows/quality.yml","utf8");
    expect(workflow).toContain("Verify committed Muhurat build data");
    expect(workflow).not.toContain("Generate Muhurat pilot build data");
    expect(workflow).not.toContain("Upload Muhurat build data");
    expect(workflow).not.toContain("actions/upload-artifact");
  });

  it("lazy-loads only the requested month shard and preserves live fallback",()=>{
    const loader=readFileSync("lib/muhurat-precomputed.ts","utf8");
    const muhurat=readFileSync("lib/muhurat.ts","utf8");
    expect(loader).toContain('new DecompressionStream("gzip")');
    expect(loader).toContain("MUHURAT_PANCHANG_SHARD_LOADERS[shardId]");
    expect(loader).toContain("shardPromises.get(shardId)");
    expect(loader).toContain("muhuratBuildDataShardId(year,month)");
    expect(muhurat).toContain("await getPrecomputedMuhuratPanchangMonth(year,month,city)");
    expect(muhurat).toContain("precomputed??await getMuhuratPanchangMonth(year,month,city)");
  });
});
