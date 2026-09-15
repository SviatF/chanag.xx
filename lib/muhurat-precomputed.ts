import {MUHURAT_PANCHANG_SHARD_IDS,MUHURAT_PANCHANG_SHARD_LOADERS} from "../generated/muhurat-panchang-shards";
import type {City} from "./cities";
import {
  MUHURAT_BUILD_DATA_VERSION,
  muhuratBuildDataKey,
  muhuratBuildDataShardId,
  type MuhuratBuildDataShard,
  type MuhuratPanchangSnapshot,
} from "./muhurat-build-data-schema";

const shardPromises=new Map<string,Promise<MuhuratBuildDataShard|null>>();

function decodeBase64(value:string){
  const binary=atob(value);
  const bytes=new Uint8Array(binary.length);
  for(let index=0;index<binary.length;index++)bytes[index]=binary.charCodeAt(index);
  return bytes;
}

async function decodeShard(shardId:string):Promise<MuhuratBuildDataShard|null>{
  try{
    const loader=MUHURAT_PANCHANG_SHARD_LOADERS[shardId];
    if(!loader)return null;
    const module=await loader();
    const compressed=decodeBase64(module.default);
    const source=new Response(compressed).body;
    if(!source)return null;
    const stream=source.pipeThrough(new DecompressionStream("gzip"));
    const shard=JSON.parse(await new Response(stream).text()) as MuhuratBuildDataShard;
    if(shard.version!==MUHURAT_BUILD_DATA_VERSION||shard.shardId!==shardId)return null;
    return shard;
  }catch(error){
    console.error(`[muhurat-precompute] unable to decode committed shard ${shardId}`,error);
    return null;
  }
}

export function loadMuhuratPrecomputedShard(shardId:string){
  let promise=shardPromises.get(shardId);
  if(!promise){
    promise=decodeShard(shardId);
    shardPromises.set(shardId,promise);
  }
  return promise;
}

/**
 * Backward-compatible aggregate loader for diagnostics only. Normal Muhurat page
 * requests use `loadMuhuratPrecomputedShard` and therefore load exactly one month.
 */
export async function loadMuhuratPrecomputedManifest(){
  const shards=(await Promise.all(MUHURAT_PANCHANG_SHARD_IDS.map(loadMuhuratPrecomputedShard))).filter((item):item is MuhuratBuildDataShard=>Boolean(item));
  if(shards.length!==MUHURAT_PANCHANG_SHARD_IDS.length)return null;
  return {
    version:MUHURAT_BUILD_DATA_VERSION,
    signature:shards.map(shard=>shard.signature).join(":"),
    generatedAt:shards.map(shard=>shard.generatedAt).sort().at(-1)??"",
    targets:shards.flatMap(shard=>shard.targets),
    entries:Object.assign({},...shards.map(shard=>shard.entries)) as Record<string,MuhuratPanchangSnapshot[]>,
  };
}

export async function getPrecomputedMuhuratPanchangMonth(year:number,month:number,city:City):Promise<ReadonlyArray<MuhuratPanchangSnapshot>|null>{
  const shard=await loadMuhuratPrecomputedShard(muhuratBuildDataShardId(year,month));
  if(!shard)return null;
  return shard.entries[muhuratBuildDataKey(year,month,city)]??null;
}

export async function getMuhuratPrecomputedManifestMeta(){
  return {
    version:MUHURAT_BUILD_DATA_VERSION,
    shardIds:[...MUHURAT_PANCHANG_SHARD_IDS],
    shardCount:MUHURAT_PANCHANG_SHARD_IDS.length,
    loadedShardCount:shardPromises.size,
  };
}
