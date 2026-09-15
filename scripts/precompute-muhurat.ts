import {createHash} from "node:crypto";
import {mkdir,readFile,readdir,unlink,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {gzipSync,gunzipSync} from "node:zlib";
import {findCityBySlug,type City} from "../lib/cities";
import {
  MUHURAT_BUILD_DATA_SHARD_MAX_BYTES,
  MUHURAT_BUILD_DATA_VERSION,
  muhuratBuildDataKey,
  muhuratBuildDataShardId,
  toMuhuratPanchangSnapshot,
  type MuhuratBuildDataShard,
} from "../lib/muhurat-build-data-schema";
import {clearMuhuratPanchangMonthCache,getMuhuratPanchangMonth} from "../lib/muhurat";
import {muhuratCityMonthSsgPriority,muhuratMonthSsgPriority} from "../lib/static-seo-routes";

const root=resolve(process.cwd());
const generatedDir=resolve(root,"generated");
const registryPath=resolve(generatedDir,"muhurat-panchang-shards.ts");
const shardPrefix="muhurat-panchang-shard-";
const legacyIndex="muhurat-panchang-data.ts";
const legacyChunkPattern=/^muhurat-panchang-chunk-\d+\.ts$/;
const shardPattern=/^muhurat-panchang-shard-(\d{4}-\d{2})\.ts$/;
const verifyOnly=process.argv.includes("--verify");

type Target={city:City;year:number;month:number;key:string;shardId:string};

function collectTargets():Target[]{
  const raw=[
    ...muhuratMonthSsgPriority.map(item=>({city:"mumbai",year:Number(item.year),month:Number(item.month)})),
    ...muhuratCityMonthSsgPriority.map(item=>({city:item.city,year:Number(item.year),month:Number(item.month)})),
  ];
  const unique=new Map<string,Target>();
  for(const item of raw){
    const city=findCityBySlug(item.city);
    if(!city)throw new Error(`Unknown Muhurat precompute city: ${item.city}`);
    const key=muhuratBuildDataKey(item.year,item.month,city);
    unique.set(key,{city,year:item.year,month:item.month,key,shardId:muhuratBuildDataShardId(item.year,item.month)});
  }
  return [...unique.values()].sort((a,b)=>a.key.localeCompare(b.key));
}

function groupTargets(targets:Target[]){
  const grouped=new Map<string,Target[]>();
  for(const target of targets){
    const list=grouped.get(target.shardId)??[];
    list.push(target);
    grouped.set(target.shardId,list);
  }
  return new Map([...grouped.entries()].sort(([a],[b])=>a.localeCompare(b)));
}

async function freshnessSources(){
  const [engine,schema]=await Promise.all([
    readFile(resolve(root,"lib/panchang.ts"),"utf8"),
    readFile(resolve(root,"lib/muhurat-build-data-schema.ts"),"utf8"),
  ]);
  return {engine,schema};
}

function expectedSignature(shardId:string,targets:Target[],engine:string,schema:string){
  return createHash("sha256")
    .update(JSON.stringify({version:MUHURAT_BUILD_DATA_VERSION,shardId,targets:targets.map(target=>target.key)}))
    .update(engine)
    .update(schema)
    .digest("hex");
}

function registrySource(shardIds:string[]){
  const ids=JSON.stringify(shardIds);
  const loaders=shardIds.map(shardId=>`  ${JSON.stringify(shardId)}:()=>import("./${shardPrefix}${shardId}"),`).join("\n");
  return `export const MUHURAT_PANCHANG_SHARD_IDS=${ids} as const;\nexport const MUHURAT_PANCHANG_SHARD_LOADERS:Record<string,()=>Promise<{default:string}>>={\n${loaders}\n};\n`;
}

function shardPath(shardId:string){return resolve(generatedDir,`${shardPrefix}${shardId}.ts`);}

function decodeShardModule(source:string):MuhuratBuildDataShard|null{
  try{
    const match=source.match(/^export default (.+);\s*$/);
    if(!match)return null;
    const base64=JSON.parse(match[1]) as string;
    const json=gunzipSync(Buffer.from(base64,"base64")).toString("utf8");
    return JSON.parse(json) as MuhuratBuildDataShard;
  }catch{return null;}
}

async function readCommittedShard(shardId:string){
  try{return decodeShardModule(await readFile(shardPath(shardId),"utf8"));}
  catch{return null;}
}

function isFreshShard(shard:MuhuratBuildDataShard|null,signature:string,shardId:string,targets:Target[]){
  if(!shard||shard.version!==MUHURAT_BUILD_DATA_VERSION||shard.shardId!==shardId||shard.signature!==signature)return false;
  const keys=targets.map(target=>target.key);
  if(shard.targets.length!==keys.length||shard.targets.some((key,index)=>key!==keys[index]))return false;
  if(Object.keys(shard.entries).length!==keys.length)return false;
  for(const target of targets){
    const rows=shard.entries[target.key];
    const expectedDays=new Date(Date.UTC(target.year,target.month,0)).getUTCDate();
    if(!rows||rows.length!==expectedDays)return false;
    if(rows.some(row=>!row.date||!row.tithi||!row.nakshatra||!row.rahu||!row.yamaganda||!row.gulika||!Array.isArray(row.dayChoghadiya)))return false;
  }
  return true;
}

async function generatedFileSetMatches(shardIds:string[]){
  const files=await readdir(generatedDir);
  const actualShards=files.map(file=>file.match(shardPattern)?.[1]).filter((item):item is string=>Boolean(item)).sort();
  if(actualShards.length!==shardIds.length||actualShards.some((id,index)=>id!==shardIds[index]))return false;
  if(files.includes(legacyIndex)||files.some(file=>legacyChunkPattern.test(file)))return false;
  try{return (await readFile(registryPath,"utf8"))===registrySource(shardIds);}
  catch{return false;}
}

async function cleanGeneratedFiles(expectedShardIds:string[]){
  const expected=new Set(expectedShardIds);
  for(const file of await readdir(generatedDir)){
    const shardMatch=file.match(shardPattern);
    if(shardMatch&&!expected.has(shardMatch[1]))await unlink(resolve(generatedDir,file));
    if(file===legacyIndex||legacyChunkPattern.test(file))await unlink(resolve(generatedDir,file));
  }
}

async function writeShard(shard:MuhuratBuildDataShard){
  const encoded=`${JSON.stringify(shard)}\n`;
  const rawBytes=Buffer.byteLength(encoded);
  if(rawBytes>MUHURAT_BUILD_DATA_SHARD_MAX_BYTES){
    throw new Error(`Muhurat shard ${shard.shardId} is ${rawBytes} bytes, above the ${MUHURAT_BUILD_DATA_SHARD_MAX_BYTES} byte shard safety cap.`);
  }
  const compressed=gzipSync(Buffer.from(encoded,"utf8"),{level:9});
  const base64=compressed.toString("base64");
  await writeFile(shardPath(shard.shardId),`export default ${JSON.stringify(base64)};\n`,"utf8");
  return {rawBytes,compressedBytes:compressed.byteLength,base64Chars:base64.length};
}

const targets=collectTargets();
const grouped=groupTargets(targets);
const shardIds=[...grouped.keys()];
const {engine,schema}=await freshnessSources();
const stale:string[]=[];
let verifiedTargets=0;

for(const [shardId,shardTargets] of grouped){
  const signature=expectedSignature(shardId,shardTargets,engine,schema);
  const existing=await readCommittedShard(shardId);
  if(isFreshShard(existing,signature,shardId,shardTargets))verifiedTargets+=shardTargets.length;
  else stale.push(shardId);
}

const fileSetFresh=await generatedFileSetMatches(shardIds);
if(stale.length===0&&fileSetFresh){
  console.log(`[muhurat-precompute] verified ${shardIds.length} month shards / ${verifiedTargets} datasets; no Swiss Ephemeris work needed`);
  process.exit(0);
}

if(verifyOnly){
  const reason=stale.length?`stale shards: ${stale.join(", ")}`:"generated shard registry/file set is stale";
  throw new Error(`Muhurat build data is stale (${reason}). Run npm run precompute:muhurat and commit generated/muhurat-panchang-shards.ts plus its shard files.`);
}

await mkdir(generatedDir,{recursive:true});
clearMuhuratPanchangMonthCache();
let totalRaw=0,totalGzip=0,totalBase64=0,generatedTargets=0;
for(const [shardId,shardTargets] of grouped){
  const signature=expectedSignature(shardId,shardTargets,engine,schema);
  const existing=await readCommittedShard(shardId);
  if(isFreshShard(existing,signature,shardId,shardTargets)){
    const source=await readFile(shardPath(shardId),"utf8");
    const match=source.match(/^export default (.+);\s*$/);
    const base64=match?JSON.parse(match[1]) as string:"";
    const compressed=Buffer.from(base64,"base64");
    const raw=compressed.length?gunzipSync(compressed).byteLength:0;
    totalRaw+=raw; totalGzip+=compressed.byteLength; totalBase64+=base64.length;
    console.log(`[muhurat-precompute] reused ${shardId} (${shardTargets.length} datasets)`);
    continue;
  }

  const entries:MuhuratBuildDataShard["entries"]={};
  for(const target of shardTargets){
    console.log(`[muhurat-precompute] calculating ${target.key}`);
    const month=await getMuhuratPanchangMonth(target.year,target.month,target.city);
    entries[target.key]=month.map(toMuhuratPanchangSnapshot);
  }
  const shard:MuhuratBuildDataShard={
    version:MUHURAT_BUILD_DATA_VERSION,
    shardId,
    signature,
    generatedAt:new Date().toISOString(),
    targets:shardTargets.map(target=>target.key),
    entries,
  };
  const packed=await writeShard(shard);
  totalRaw+=packed.rawBytes; totalGzip+=packed.compressedBytes; totalBase64+=packed.base64Chars; generatedTargets+=shardTargets.length;
  console.log(`[muhurat-precompute] wrote shard ${shardId}: ${shardTargets.length} datasets, ${packed.rawBytes} raw bytes -> ${packed.compressedBytes} gzip bytes`);
}

await cleanGeneratedFiles(shardIds);
await writeFile(registryPath,registrySource(shardIds),"utf8");
console.log(`[muhurat-precompute] ready ${shardIds.length} month shards / ${targets.length} datasets (${generatedTargets} recalculated): ${totalRaw} raw bytes -> ${totalGzip} gzip bytes -> ${totalBase64} base64 chars`);
