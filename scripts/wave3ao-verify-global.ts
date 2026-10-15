/**
 * Wave 3AO: independently sample root-catalog states at the same 15 real
 * JPL DE440s instants used in Wave 3AN, plus full index continuity proof.
 * Do not treat near-boundary differences as approval: expose them.
 */
import {createHash} from "node:crypto";
import {readFileSync,writeFileSync} from "node:fs";
import {getJplSiderealCandidate,type JplSiderealObservation} from "../lib/jpl-v6-sidereal-candidate";
import {validateSiderealTransitionTable,siderealStateAtUtc} from "../lib/jpl-v6-sidereal-transitions";
const tablePath="artifacts/wave3ao-jpl-global-sidereal-transitions.json";
const anchors=readFileSync("artifacts/wave3ao-lahiri-6h-anchors.json");
const table=validateSiderealTransitionTable(JSON.parse(readFileSync(tablePath,"utf8")));
const digest=createHash("sha256").update(anchors).digest("hex");
if(digest!==table.lahiriAnchorSha256)throw Error("Wave3AO source Lahiri anchor SHA mismatch");
const old=JSON.parse(readFileSync("artifacts/wave3an-jpl-sidereal-candidates.json","utf8")) as {
  sampledInstants:number;samples:Array<{observation:JplSiderealObservation;tags:string[]}>;
};
const MONTH=360/27;
const cases:Record<string,number>={moonPada:0,nakshatra:0,yoga:0,moonRashi:0,sunRashi:0};
const ambiguities=[];
for(const row of old.samples){
  const observation=row.observation;
  const reference=getJplSiderealCandidate(observation);
  const global=siderealStateAtUtc(table,observation.atUtc);
  const ideal={
    moonPada:Math.floor(reference.moonSiderealDeg/(360/108)),
    nakshatra:Math.floor(reference.moonSiderealDeg/MONTH),
    yoga:Math.floor(reference.yogaLongitudeDeg/MONTH),
    moonRashi:Math.floor(reference.moonSiderealDeg/30),
    sunRashi:Math.floor(reference.sunSiderealDeg/30)
  };
  for(const [name,expected] of Object.entries(ideal)){
    const actual=global[name as keyof typeof ideal].index;
    if(actual!==expected){
      const relevant=name==="moonPada"?"Nakshatra Pada":
        name==="nakshatra"?"Nakshatra":
        name==="yoga"?"Yoga":
        name==="moonRashi"?"Moon Rashi":"Sun Rashi";
      const close=reference.nearBoundary.find(item=>item.field===relevant);
      if(!close)throw Error("JPL source sampling changes "+name+" label away from a reviewed boundary "+observation.atUtc);
      ambiguities.push({atUtc:observation.atUtc,tags:row.tags,
        field:name,independentExactJplLabelIndex:expected,catalogIndex:actual,
        sourceAngularDistanceDegrees:close.angularDistanceDegrees});
    }else cases[name]++;
  }
}
if(old.samples.length<12||old.samples.length!==old.sampledInstants)
  throw Error("Wave3AN independent exact reference unavailable");
const transitions=Object.fromEntries(Object.entries(table.events).map(([name,rows])=>[name,rows.length]));
const report={
  wave:"3AO",catalogYears:table.years,sourceCatalogSha256:createHash("sha256").update(readFileSync(tablePath)).digest("hex"),
  verifiedAgainstWave3ANInstants:old.samples.length,exactIndexAgreements:cases,
  boundedNearEdgeUnresolved:ambiguities.length,unresolvedCases:ambiguities,
  catalogTransitions:transitions,
  interpolationMaxMeasuredMidpointErrorArcsec:table.maxMeasuredAnchorMidpointErrorArcsec,
  releaseApproved:false,allCitySunriseReconciliationComplete:false,
  independentLahiriApproved:false,ritualRulesApproved:false
};
writeFileSync("artifacts/wave3ao-global-sidereal-verification.json",JSON.stringify(report,null,2)+"\n");
console.log("[Wave3AO Verify] "+JSON.stringify({
  instants:old.samples.length,transitions,exact:cases,nearEdge:ambiguities.length,
  release:false
}));
