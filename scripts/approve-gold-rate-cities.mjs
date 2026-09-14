import {readFile,writeFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";

const registryUrl=new URL("../config/gold-rate-city-approvals.json",import.meta.url);
const registryPath=fileURLToPath(registryUrl);

function usage(){
  console.log(`Gold Rate city approval workflow\n\nCommands:\n  node scripts/approve-gold-rate-cities.mjs list\n  node scripts/approve-gold-rate-cities.mjs env\n  node scripts/approve-gold-rate-cities.mjs approve <slug> --reason \"...\" --evidence \"Google Trends ...\"\n  node scripts/approve-gold-rate-cities.mjs revoke <slug> --reason \"...\"\n\nApproval is operational evidence only. It does not enable GOLD_RATE_INDEXING_ENABLED.`);
}

function option(args,name){
  const index=args.indexOf(name);
  return index>=0&&typeof args[index+1]==="string"?args[index+1].trim():"";
}

async function load(){
  const raw=JSON.parse(await readFile(registryPath,"utf8"));
  if(raw?.version!==1||!Array.isArray(raw.candidates)||!raw.approvals||typeof raw.approvals!=="object")throw new Error("Gold Rate city approval registry is malformed.");
  return raw;
}

async function save(registry){
  registry.lastReviewedAt=new Date().toISOString();
  await writeFile(registryPath,`${JSON.stringify(registry,null,2)}\n`,`utf8`);
}

function approvedSlugs(registry){
  return registry.candidates.filter(slug=>registry.approvals?.[slug]?.approved===true);
}

const args=process.argv.slice(2);
const command=args[0];
if(!command||command==="help"||command==="--help"||command==="-h"){usage();process.exit(0);}

const registry=await load();

if(command==="list"){
  console.log(`Candidates: ${registry.candidates.length}`);
  for(const slug of registry.candidates){
    const row=registry.approvals?.[slug];
    console.log(`${row?.approved?"APPROVED":"PENDING "}  ${slug}${row?.approvedAt?`  ${row.approvedAt}`:""}${row?.reason?`  ${row.reason}`:""}`);
  }
  process.exit(0);
}

if(command==="env"){
  const slugs=approvedSlugs(registry);
  console.log(`GOLD_RATE_INDEX_CITIES=${slugs.join(",")}`);
  console.log(`${slugs.length} approved of ${registry.candidates.length} candidates.`);
  process.exit(0);
}

if(command!=="approve"&&command!=="revoke"){
  usage();
  throw new Error(`Unknown command: ${command}`);
}

const slug=(args[1]??"").trim().toLowerCase();
if(!registry.candidates.includes(slug))throw new Error(`Unknown candidate city: ${slug||"(empty)"}`);
const reason=option(args,"--reason");
if(!reason)throw new Error("--reason is required.");

if(command==="approve"){
  const evidence=option(args,"--evidence");
  if(!evidence)throw new Error("--evidence is required. Record the Google Trends comparison/date or equivalent demand evidence.");
  registry.approvals[slug]={approved:true,approvedAt:new Date().toISOString(),reason:reason.slice(0,240),evidence:evidence.slice(0,500)};
  await save(registry);
  console.log(`Approved ${slug}.`);
}else{
  delete registry.approvals[slug];
  await save(registry);
  console.log(`Revoked ${slug}: ${reason}`);
}

const slugs=approvedSlugs(registry);
console.log(`GOLD_RATE_INDEX_CITIES=${slugs.join(",")}`);
console.log("Indexing remains controlled separately by GOLD_RATE_INDEXING_ENABLED.");
