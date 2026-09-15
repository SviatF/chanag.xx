import {createHash} from "node:crypto";
import {mkdir,readFile,readdir,unlink,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {gzipSync,gunzipSync} from "node:zlib";
import {MUHURAT_PANCHANG_GZIP_BASE64} from "../generated/muhurat-panchang-data";
import {findCityBySlug,type City} from "../lib/cities";
import {
  MUHURAT_BUILD_DATA_MAX_BYTES,
  MUHURAT_BUILD_DATA_VERSION,
  muhuratBuildDataKey,
  toMuhuratPanchangSnapshot,
  type MuhuratBuildDataManifest,
} from "../lib/muhurat-build-data-schema";
import {clearMuhuratPanchangMonthCache,getMuhuratPanchangMonth} from "../lib/muhurat";
import {muhuratCityMonthSsgPriority,muhuratMonthSsgPriority} from "../lib/static-seo-routes";

const root=resolve(process.cwd());
const generatedDir=resolve(root,"generated");
const indexPath=resolve(generatedDir,"muhurat-panchang-data.ts");
const chunkPrefix="muhurat-panchang-chunk-";
const chunkSize=6000;
const verifyOnly=process.argv.includes("--verify");

type Target={city:City;year:number;month:number;key:string};

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
    unique.set(key,{city,year:item.year,month:item.month,key});
  }
  return [...unique.values()].sort((a,b)=>a.key.localeCompare(b.key));
}

async function expectedSignature(targets:Target[]){
  const [engine,schema]=await Promise.all([
    readFile(resolve(root,"lib/panchang.ts"),"utf8"),
    readFile(resolve(root,"lib/muhurat-build-data-schema.ts"),"utf8"),
  ]);
  return createHash("sha256")
    .update(JSON.stringify({version:MUHURAT_BUILD_DATA_VERSION,targets:targets.map(target=>target.key)}))
    .update(engine)
    .update(schema)
    .digest("hex");
}

function readCommittedManifest():MuhuratBuildDataManifest|null{
  try{
    const json=gunzipSync(Buffer.from(MUHURAT_PANCHANG_GZIP_BASE64,"base64")).toString("utf8");
    return JSON.parse(json) as MuhuratBuildDataManifest;
  }catch{return null;}
}

function isFresh(manifest:MuhuratBuildDataManifest|null,signature:string,targets:Target[]){
  if(!manifest||manifest.version!==MUHURAT_BUILD_DATA_VERSION||manifest.signature!==signature)return false;
  const keys=targets.map(target=>target.key);
  if(manifest.targets.length!==keys.length||manifest.targets.some((key,index)=>key!==keys[index]))return false;
  if(Object.keys(manifest.entries).length!==keys.length)return false;
  for(const target of targets){
    const rows=manifest.entries[target.key];
    const expectedDays=new Date(Date.UTC(target.year,target.month,0)).getUTCDate();
    if(!rows||rows.length!==expectedDays)return false;
    if(rows.some(row=>!row.date||!row.tithi||!row.nakshatra||!row.rahu||!row.yamaganda||!row.gulika||!Array.isArray(row.dayChoghadiya)))return false;
  }
  return true;
}

async function writeCompressedPayload(encoded:string){
  await mkdir(generatedDir,{recursive:true});
  const compressed=gzipSync(Buffer.from(encoded,"utf8"),{level:9});
  const base64=compressed.toString("base64");
  const chunks:string[]=[];
  for(let offset=0;offset<base64.length;offset+=chunkSize)chunks.push(base64.slice(offset,offset+chunkSize));

  for(const file of await readdir(generatedDir)){
    if(new RegExp(`^${chunkPrefix}\\d+\\.ts$`).test(file))await unlink(resolve(generatedDir,file));
  }
  for(const [index,chunk] of chunks.entries()){
    await writeFile(resolve(generatedDir,`${chunkPrefix}${index}.ts`),`export default ${JSON.stringify(chunk)};\n`,"utf8");
  }
  const imports=chunks.map((_,index)=>`import chunk${index} from "./${chunkPrefix}${index}";`).join("\n");
  const expression=chunks.map((_,index)=>`chunk${index}`).join("+");
  await writeFile(indexPath,`${imports}\n\nexport const MUHURAT_PANCHANG_GZIP_BASE64=${expression};\n`,"utf8");
  return {compressedBytes:compressed.byteLength,base64Chars:base64.length,chunks:chunks.length};
}

const targets=collectTargets();
const signature=await expectedSignature(targets);
const existing=readCommittedManifest();

if(isFresh(existing,signature,targets)){
  console.log(`[muhurat-precompute] verified ${targets.length} committed month datasets; no Swiss Ephemeris work needed`);
  process.exit(0);
}

if(verifyOnly){
  throw new Error(`Muhurat build data is stale. Run npm run precompute:muhurat and commit generated/muhurat-panchang-data.ts plus its chunk files (${targets.length} month datasets expected).`);
}

clearMuhuratPanchangMonthCache();
const entries:MuhuratBuildDataManifest["entries"]={};
for(const target of targets){
  console.log(`[muhurat-precompute] calculating ${target.key}`);
  const month=await getMuhuratPanchangMonth(target.year,target.month,target.city);
  entries[target.key]=month.map(toMuhuratPanchangSnapshot);
}

const manifest:MuhuratBuildDataManifest={
  version:MUHURAT_BUILD_DATA_VERSION,
  signature,
  generatedAt:new Date().toISOString(),
  targets:targets.map(target=>target.key),
  entries,
};
const encoded=`${JSON.stringify(manifest)}\n`;
const bytes=Buffer.byteLength(encoded);
if(bytes>MUHURAT_BUILD_DATA_MAX_BYTES){
  throw new Error(`Muhurat build data is ${bytes} bytes, above the ${MUHURAT_BUILD_DATA_MAX_BYTES} byte safety cap. Shard or reduce the static matrix before shipping.`);
}
const packed=await writeCompressedPayload(encoded);
console.log(`[muhurat-precompute] wrote ${targets.length} month datasets: ${bytes} raw bytes -> ${packed.compressedBytes} gzip bytes -> ${packed.base64Chars} base64 chars across ${packed.chunks} chunks`);
