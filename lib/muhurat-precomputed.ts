import {MUHURAT_PANCHANG_GZIP_BASE64} from "../generated/muhurat-panchang-data";
import type {City} from "./cities";
import {
  MUHURAT_BUILD_DATA_VERSION,
  muhuratBuildDataKey,
  type MuhuratBuildDataManifest,
  type MuhuratPanchangSnapshot,
} from "./muhurat-build-data-schema";

let manifestPromise:Promise<MuhuratBuildDataManifest|null>|null=null;

function decodeBase64(value:string){
  const binary=atob(value);
  const bytes=new Uint8Array(binary.length);
  for(let index=0;index<binary.length;index++)bytes[index]=binary.charCodeAt(index);
  return bytes;
}

async function decodeManifest():Promise<MuhuratBuildDataManifest|null>{
  try{
    const compressed=decodeBase64(MUHURAT_PANCHANG_GZIP_BASE64);
    const source=new Response(compressed).body;
    if(!source)return null;
    const stream=source.pipeThrough(new DecompressionStream("gzip"));
    const manifest=JSON.parse(await new Response(stream).text()) as MuhuratBuildDataManifest;
    if(manifest.version!==MUHURAT_BUILD_DATA_VERSION)return null;
    return manifest;
  }catch(error){
    console.error("[muhurat-precompute] unable to decode committed build data",error);
    return null;
  }
}

export function loadMuhuratPrecomputedManifest(){
  manifestPromise??=decodeManifest();
  return manifestPromise;
}

export async function getPrecomputedMuhuratPanchangMonth(year:number,month:number,city:City):Promise<ReadonlyArray<MuhuratPanchangSnapshot>|null>{
  const manifest=await loadMuhuratPrecomputedManifest();
  if(!manifest)return null;
  return manifest.entries[muhuratBuildDataKey(year,month,city)]??null;
}

export async function getMuhuratPrecomputedManifestMeta(){
  const manifest=await loadMuhuratPrecomputedManifest();
  if(!manifest)return null;
  return {
    version:manifest.version,
    signature:manifest.signature,
    generatedAt:manifest.generatedAt,
    targets:[...manifest.targets],
    entryCount:Object.keys(manifest.entries).length,
  };
}
