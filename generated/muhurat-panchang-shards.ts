export const MUHURAT_PANCHANG_SHARD_IDS=["2026-09","2026-10","2026-11","2026-12","2027-01","2027-02","2027-03","2027-04","2027-05","2027-06","2027-07","2027-08","2027-09"] as const;
export const MUHURAT_PANCHANG_SHARD_LOADERS:Record<string,()=>Promise<{default:string}>>={
  "2026-09":()=>import("./muhurat-panchang-shard-2026-09"),
  "2026-10":()=>import("./muhurat-panchang-shard-2026-10"),
  "2026-11":()=>import("./muhurat-panchang-shard-2026-11"),
  "2026-12":()=>import("./muhurat-panchang-shard-2026-12"),
  "2027-01":()=>import("./muhurat-panchang-shard-2027-01"),
  "2027-02":()=>import("./muhurat-panchang-shard-2027-02"),
  "2027-03":()=>import("./muhurat-panchang-shard-2027-03"),
  "2027-04":()=>import("./muhurat-panchang-shard-2027-04"),
  "2027-05":()=>import("./muhurat-panchang-shard-2027-05"),
  "2027-06":()=>import("./muhurat-panchang-shard-2027-06"),
  "2027-07":()=>import("./muhurat-panchang-shard-2027-07"),
  "2027-08":()=>import("./muhurat-panchang-shard-2027-08"),
  "2027-09":()=>import("./muhurat-panchang-shard-2027-09"),
};
