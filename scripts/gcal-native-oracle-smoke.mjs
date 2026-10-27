import {readFileSync,writeFileSync,statSync} from "node:fs";
import {createHash} from "node:crypto";
const name=process.argv[2];
if(!name)throw Error("Expected generated GCal output pathname");
const buf=readFileSync(name);
const raw=buf[0]===0xff&&buf[1]===0xfe?buf.subarray(2).toString("utf16le"):buf.toString("utf8");
const scan={
  provenance:"upstream-archived-gcal-11c-Windows-PE-original-binary",
  inputCommand:"-R calendar -L 28N37;77E12 -N Delhi -TZ 5:30 -SG 1-1-2027 -EG 31-12-2027 -O output.xml",
  sha256:createHash("sha256").update(buf).digest("hex"),
  bytes:statSync(name).size,
  firstChars:raw.slice(0,900),
  mentionsCalendarYear:raw.includes("2027"),
  mentionsDelhi:/Delhi/i.test(raw),
  xmlLike:/<\?xml|<calendar|<day\b|<date\b/i.test(raw),
  isRituallyCertified:false,
  note:"The archived GCal 11c executable predates third-party Build 5 annual exports; source-version parity not assumed."
};
writeFileSync("artifacts/gcal-native/smoke-diagnostics.json",JSON.stringify(scan,null,2)+"\n");
console.log(JSON.stringify(scan,null,2));
if(scan.bytes<500||!scan.mentionsCalendarYear)throw Error("Native GCal output lacks expected year or is too small; fail closed.");
