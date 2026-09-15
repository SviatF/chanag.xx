export const MUHURAT_PANCHANG_SHARD_IDS=["2026-09","2026-10","2026-11","2026-12","2027-01"] as const;
export const MUHURAT_PANCHANG_SHARD_LOADERS:Record<string,()=>Promise<{default:string}>>={
  "2026-09":()=>import("./muhurat-panchang-shard-2026-09"),
  "2026-10":()=>import("./muhurat-panchang-shard-2026-10"),
  "2026-11":()=>import("./muhurat-panchang-shard-2026-11"),
  "2026-12":()=>import("./muhurat-panchang-shard-2026-12"),
  "2027-01":()=>import("./muhurat-panchang-shard-2027-01"),
};
