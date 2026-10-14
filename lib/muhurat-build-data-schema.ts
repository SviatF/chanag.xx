import type {City} from "./cities";
import type {ChoghadiyaPeriod,Panchang,TimeWindow} from "./panchang";

export const MUHURAT_BUILD_DATA_VERSION=5 as const;
export const MUHURAT_BUILD_DATA_SHARD_MAX_BYTES=1_500_000;

export type MuhuratPanchangSnapshot={
  date:string;
  tithi:string;
  nakshatra:string;
  /** Local end clock and explicit India civil date; required for V3 fail-closed clipping. */
  tithiEnd:string;
  tithiEndDate:string|null;
  nakshatraEnd:string;
  nakshatraEndDate:string|null;
  /** Sunrise Karana transition; needed to remove prohibited Vishti wedding hours. */
  karana:string;
  karanaEnd:string;
  karanaEndDate:string|null;
  rahu:TimeWindow;
  yamaganda:TimeWindow;
  gulika:TimeWindow;
  abhijit:TimeWindow|null;
  dayChoghadiya:ChoghadiyaPeriod[];
};

export type MuhuratBuildDataShard={
  version:typeof MUHURAT_BUILD_DATA_VERSION;
  shardId:string;
  signature:string;
  generatedAt:string;
  targets:string[];
  entries:Record<string,MuhuratPanchangSnapshot[]>;
};

export function muhuratBuildDataKey(year:number,month:number,city:City){
  return `${city.slug}|${city.lat.toFixed(6)}|${city.lng.toFixed(6)}|${year}-${String(month).padStart(2,"0")}`;
}

export function muhuratBuildDataShardId(year:number,month:number){
  return `${year}-${String(month).padStart(2,"0")}`;
}

export function toMuhuratPanchangSnapshot(data:Panchang):MuhuratPanchangSnapshot{
  return {
    date:data.date,
    tithi:data.tithi,
    nakshatra:data.nakshatra,
    tithiEnd:data.tithiEnd,
    tithiEndDate:data.tithiEndDate,
    nakshatraEnd:data.nakshatraEnd,
    nakshatraEndDate:data.nakshatraEndDate,
    karana:data.karana,
    karanaEnd:data.karanaEnd,
    karanaEndDate:data.karanaEndDate,
    rahu:{...data.rahu},
    yamaganda:{...data.yamaganda},
    gulika:{...data.gulika},
    abhijit:data.abhijit?{...data.abhijit}:null,
    dayChoghadiya:data.dayChoghadiya.map(period=>({...period})),
  };
}
