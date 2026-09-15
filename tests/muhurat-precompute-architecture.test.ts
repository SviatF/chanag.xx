import {existsSync,readFileSync} from "node:fs";
import {gunzipSync} from "node:zlib";
import {describe,expect,it} from "vitest";
import {MUHURAT_PANCHANG_GZIP_BASE64} from "../generated/muhurat-panchang-data";
import {MUHURAT_BUILD_DATA_MAX_BYTES,type MuhuratBuildDataManifest} from "../lib/muhurat-build-data-schema";

function manifest(){
  return JSON.parse(gunzipSync(Buffer.from(MUHURAT_PANCHANG_GZIP_BASE64,"base64")).toString("utf8")) as MuhuratBuildDataManifest;
}

describe("Muhurat precomputed build-data architecture",()=>{
  it("ships a compact, complete 50-month-context priority artifact",()=>{
    const data=manifest();
    expect(data.version).toBe(1);
    expect(data.signature).toMatch(/^[a-f0-9]{64}$/);
    expect(data.targets).toHaveLength(50);
    expect(Object.keys(data.entries)).toHaveLength(50);
    expect(Buffer.byteLength(JSON.stringify(data))).toBeLessThan(MUHURAT_BUILD_DATA_MAX_BYTES);

    for(const target of data.targets){
      const rows=data.entries[target];
      expect(rows.length===28||rows.length===29||rows.length===30||rows.length===31).toBe(true);
      for(const row of rows){
        expect(Object.keys(row).sort()).toEqual([
          "abhijit","date","dayChoghadiya","gulika","nakshatra","rahu","tithi","yamaganda",
        ]);
      }
    }
  });

  it("does not ship the old raw JSON artifact",()=>{
    expect(existsSync("generated/muhurat-panchang.json")).toBe(false);
    expect(MUHURAT_PANCHANG_GZIP_BASE64.length).toBeLessThan(1_000_000);
  });

  it("derives freshness from the priority target matrix, Panchang engine and snapshot schema",()=>{
    const source=readFileSync("scripts/precompute-muhurat.ts","utf8");
    expect(source).toContain("muhuratMonthSsgPriority");
    expect(source).toContain("muhuratCityMonthSsgPriority");
    expect(source).toContain('readFile(resolve(root,"lib/panchang.ts"');
    expect(source).toContain('readFile(resolve(root,"lib/muhurat-build-data-schema.ts"');
    expect(source).toContain("muhuratBuildDataKey");

    const calculation=source.slice(source.indexOf("clearMuhuratPanchangMonthCache()"));
    expect(calculation).toContain("for(const target of targets)");
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

  it("uses portable gzip decompression and preserves live fallback",()=>{
    const loader=readFileSync("lib/muhurat-precomputed.ts","utf8");
    const muhurat=readFileSync("lib/muhurat.ts","utf8");
    expect(loader).toContain('new DecompressionStream("gzip")');
    expect(loader).toContain("manifestPromise??=decodeManifest()");
    expect(muhurat).toContain("await getPrecomputedMuhuratPanchangMonth(year,month,city)");
    expect(muhurat).toContain("precomputed??await getMuhuratPanchangMonth(year,month,city)");
  });
});
