import {createHash} from "node:crypto";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {dirname,resolve} from "node:path";
import {findCityBySlug,type City} from "../lib/cities";
import {
  MUHURAT_BUILD_DATA_MAX_BYTES,
  MUHURAT_BUILD_DATA_VERSION,
  muhuratBuildDataKey,
  toMuhuratPanchangSnapshot,
  type MuhuratBuildDataManifest,
} from "../lib/muhurat-build-data-schema";
import {clearMuhuratPanchangMonthCache,getMuhuratPanchangMonth} from "../lib/muhurat";
import {muhuratCityMonthSsgPilot,muhuratMonthSsgPilot} from "../lib/static-seo-routes";

const root=resolve(process.cwd());
const outputPath=resolve(root,"generated/muhurat-panchang.json");
const verifyOnly=process.argv.includes("--verify");
const printManifest=process.argv.includes("--print");

type Target={city:City;year:number;month:number;key:string};

function collectTargets():Target[]{
  const raw=[
    ...muhuratMonthSsgPilot.map(item=>({city:"mumbai",year:Number(item.year),month:Number(item.month)})),
    ...muhuratCityMonthSsgPilot.map(item=>({city:item.city,year:Number(item.year),month:Number(item.month)})),
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

async function readExisting():Promise<MuhuratBuildDataManifest|null>{
  try{
    return JSON.parse(await readFile(outputPath,"utf8")) as MuhuratBuildDataManifest;
  }catch{return null;}
}

function isFresh(manifest:MuhuratBuildDataManifest|null,signature:string,targets:Target[]){
  if(!manifest||manifest.version!==MUHURAT_BUILD_DATA_VERSION||manifest.signature!==signature)return false;
  if(manifest.targets.length!==targets.length)return false;
  for(const target of targets){
    if(!manifest.targets.includes(target.key))return false;
    const rows=manifest.entries[target.key];
    const expectedDays=new Date(Date.UTC(target.year,target.month,0)).getUTCDate();
    if(!rows||rows.length!==expectedDays)return false;
  }
  return true;
}

function print(manifest:MuhuratBuildDataManifest){
  if(!printManifest)return;
  console.log("MUHURAT_BUILD_DATA_BEGIN");
  console.log(JSON.stringify(manifest));
  console.log("MUHURAT_BUILD_DATA_END");
}

const targets=collectTargets();
const signature=await expectedSignature(targets);
const existing=await readExisting();

if(isFresh(existing,signature,targets)){
  console.log(`[muhurat-precompute] fresh ${targets.length} month datasets; no Swiss Ephemeris work needed`);
  print(existing!);
  process.exit(0);
}

if(verifyOnly){
  throw new Error(`Muhurat build data is stale. Run npm run precompute:muhurat and commit generated/muhurat-panchang.json (${targets.length} month datasets expected).`);
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
await mkdir(dirname(outputPath),{recursive:true});
await writeFile(outputPath,encoded,"utf8");
console.log(`[muhurat-precompute] wrote ${targets.length} month datasets (${bytes} bytes)`);
print(manifest);
