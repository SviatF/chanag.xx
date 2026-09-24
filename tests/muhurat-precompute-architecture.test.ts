import {describe,expect,it} from "vitest";
import {existsSync,readFileSync,readdirSync} from "node:fs";
import {getPrecomputedMonthlyRows,precomputedDatasetKey} from "../lib/muhurat-precomputed";
import {muhuratRules} from "../lib/muhurat";
import {
  calendarMonthSsgPriority,
  muhuratCityMonthSsgPriority,
  muhuratMonthSsgPriority,
  muhuratYearSsgPriority,
} from "../lib/static-seo-routes";

function shardFile(year:string,month:string){return `generated/muhurat-build-data/${year}-${month}.json`;}

function shardSources(){
  return readdirSync("generated/muhurat-build-data").filter(name=>/^\d{4}-\d{2}\.json$/.test(name));
}

function shardKeys(path:string){
  const artifact=JSON.parse(readFileSync(path,"utf8")) as {rows?:Record<string,unknown>};
  return new Set(Object.keys(artifact.rows??{}));
}

describe("Muhurat precomputed build-data architecture",()=>{
  it("ships bounded month shards covering monthly calendar and Muhurat SSG plus yearly Mumbai baselines",()=>{
    const calendarMonths=new Set(calendarMonthSsgPriority.map(item=>`${item.year}-${item.month}`));
    const muhuratMonths=new Set(muhuratMonthSsgPriority.map(item=>`${item.year}-${item.month}`));
    const yearlyMonths=new Set(muhuratYearSsgPriority.flatMap(item=>Array.from({length:12},(_,index)=>`${item.year}-${String(index+1).padStart(2,"0")}`)));
    const expectedMonths=new Set([...calendarMonths,...muhuratMonths,...yearlyMonths]);
    expect(expectedMonths.size).toBeGreaterThanOrEqual(48);

    const sources=shardSources();
    expect(new Set(sources.map(name=>name.replace(/\.json$/,"")))).toEqual(expectedMonths);

    const expectedKeysByMonth=new Map<string,Set<string>>();
    const add=(year:string,month:string,event:string,city:string)=>{
      const monthKey=`${year}-${month}`;
      const keys=expectedKeysByMonth.get(monthKey)??new Set<string>();
      keys.add(precomputedDatasetKey(event,Number(year),Number(month),city));
      expectedKeysByMonth.set(monthKey,keys);
    };

    for(const item of muhuratCityMonthSsgPriority)add(item.year,item.month,item.event,item.city);
    for(const item of muhuratMonthSsgPriority)add(item.year,item.month,item.event,"mumbai");
    for(const item of muhuratYearSsgPriority){
      for(let month=1;month<=12;month++)add(item.year,String(month).padStart(2,"0"),item.event,"mumbai");
    }
    for(const item of calendarMonthSsgPriority){
      for(const event of Object.keys(muhuratRules))add(item.year,item.month,event,item.city);
    }

    for(const [monthKey,expectedKeys] of expectedKeysByMonth){
      const [year,month]=monthKey.split("-");
      const keys=shardKeys(shardFile(year,month));
      for(const key of expectedKeys)expect(keys.has(key),`${monthKey} missing ${key}`).toBe(true);
    }
  });

  it("uses a generated lazy-loader registry and removes the monolithic artifact",()=>{
    const loader=readFileSync("lib/muhurat-build-shards.generated.ts","utf8");
    expect(loader).toContain("MUHURAT_BUILD_SHARD_LOADERS");
    expect(loader).toContain('import("@/generated/muhurat-build-data/');
    expect(existsSync("generated/muhurat-build-data.json")).toBe(false);
  });

  it("derives per-shard freshness from calendar, monthly and yearly targets, Panchang engine and snapshot schema",()=>{
    const script=readFileSync("scripts/precompute-muhurat.ts","utf8");
    expect(script).toContain("calendarMonthSsgPriority");
    expect(script).toContain("muhuratCityMonthSsgPriority");
    expect(script).toContain("muhuratMonthSsgPriority");
    expect(script).toContain("muhuratYearSsgPriority");
    expect(script).toContain("PANCHANG_ENGINE_VERSION");
    expect(script).toContain("CALENDAR_CONVENTIONS_VERSION");
    expect(script).toContain("MUHURAT_BUILD_SNAPSHOT_VERSION");
    expect(script).toContain("sourceFingerprint");
    expect(script).not.toContain("Promise.all");
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
    // Other diagnostics (for example the rendered content-quality report) may
    // use generic artifacts; only generated Muhurat build-data artifacts are forbidden.
    expect(workflow).not.toMatch(/artifact[^\n]*muhurat|muhurat[^\n]*artifact/i);
  });

  it("lazy-loads only the requested month shard and preserves live fallback",()=>{
    const loader=readFileSync("lib/muhurat-precomputed.ts","utf8");
    const muhurat=readFileSync("lib/muhurat.ts","utf8");
    const calendar=readFileSync("app/calendar/[city]/[year]/[month]/page.tsx","utf8");
    expect(loader).toContain("loadMuhuratBuildShard");
    expect(loader).toContain("getPrecomputedMonthlyRows");
    expect(muhurat).toContain("getPrecomputedMonthlyRows");
    expect(muhurat).toContain("getMonthlyMuhuratLive");
    expect(calendar).toContain("getMonthlyMuhurat");
    expect(typeof getPrecomputedMonthlyRows).toBe("function");
  });
});
