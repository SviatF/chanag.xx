import rawManifest from "../generated/muhurat-panchang.json";
import type {City} from "./cities";
import {
  MUHURAT_BUILD_DATA_VERSION,
  muhuratBuildDataKey,
  type MuhuratBuildDataManifest,
  type MuhuratPanchangSnapshot,
} from "./muhurat-build-data-schema";

const manifest=rawManifest as unknown as MuhuratBuildDataManifest;

export function getPrecomputedMuhuratPanchangMonth(year:number,month:number,city:City):ReadonlyArray<MuhuratPanchangSnapshot>|null{
  if(manifest.version!==MUHURAT_BUILD_DATA_VERSION)return null;
  return manifest.entries[muhuratBuildDataKey(year,month,city)]??null;
}

export function getMuhuratPrecomputedManifestMeta(){
  return {
    version:manifest.version,
    signature:manifest.signature,
    generatedAt:manifest.generatedAt,
    targets:[...manifest.targets],
    entryCount:Object.keys(manifest.entries).length,
  };
}
