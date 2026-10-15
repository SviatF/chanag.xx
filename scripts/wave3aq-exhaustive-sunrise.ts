/**
 * Wave 3AQ — exhaustive, no-NOAA-prefilter census:
 * each unique India city x every 2026–2028 civil day gets an EXACT Swiss
 * upper-limb sunrise, a JPL DE440s Tithi/Karana state and all five JPL
 * sidereal states from a SHA-locked catalog.
 *
 * This proves computational census coverage, not independent ritual rules.
 * Swiss/JPL DIFFERENCES are evidence, not automatically errors.
 */
import {createHash} from "node:crypto";
import {mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {createDefaultSweData} from "@typescriptify/sweph/dist/types.js";
import {sweCalcUt,sweClose,sweSetSidMode} from "@typescriptify/sweph/dist/sweph.js";
import {sweRiseTrans} from "@typescriptify/sweph/dist/swecl.js";
import {SE_MOON,SE_SUN,SEFLG_MOSEPH,SEFLG_SPEED,SEFLG_SIDEREAL,SE_SIDM_LAHIRI,SE_CALC_RISE} from "@typescriptify/sweph/dist/constants.js";
import {supportedCities,type City} from "../lib/cities";
import {indiaCivilDayStartJulian} from "../lib/india-time";
import {getPinnedV6HalfTithiTable,JPL_V6_ROOTS_ASSET_SHA256} from "../lib/jpl-v6-pinned-data";
import {jplHalfTithiAtMs} from "../lib/jpl-v6-tithi-karana-canary";
import {openVerifiedV6SiderealSource,getV6UnifiedSunrise} from "../lib/v6-unified-calendar-staging";
import {siderealStateAtUtc,SIDEREAL_FAMILY_MODULUS,type SiderealFamily} from "../lib/jpl-v6-sidereal-transitions";
import {nearestExactRoot,sourceLabelsAreAdjacent,daysInGregorianYear} from "../lib/v6-exhaustive-sunrise-evidence";
import {assertProductionLunarEngine,PUBLIC_LUNAR_ENGINE_VERSION,STAGED_LUNAR_ENGINE_VERSION} from "../lib/v6-calendar-staging";

const requestedYear=Number(process.argv.find(x=>x.startsWith("--year="))?.slice(7));
if(![2026,2027,2028].includes(requestedYear))
  throw Error("Wave3AQ requires --year=2026, 2027 or 2028 to partition the exhaustive census");
const START=Date.UTC(requestedYear,0,1),END=Date.UTC(requestedYear+1,0,1);
const DAY=86_400_000, IST=330*60_000,JD_UNIX=2440587.5;
const ONE_MIN=60_000;
const families=["halfTithi","moonPada","nakshatra","yoga","moonRashi","sunRashi"] as const;
type Family=typeof families[number];
const yearCounters=()=>({cityDays:0,physicalSunrises:0,near2min:0,near10min:0,swissCompared:0,
    modelChanged:{halfTithi:0,moonPada:0,nakshatra:0,yoga:0,moonRashi:0,sunRashi:0}});
type Annual=ReturnType<typeof yearCounters>;
const byYear:Record<string,Annual>={"2026":yearCounters(),"2027":yearCounters(),"2028":yearCounters()};
const familyNear2:Record<Family,number>=Object.fromEntries(families.map(f=>[f,0])) as Record<Family,number>;
const familyNear10:Record<Family,number>=Object.fromEntries(families.map(f=>[f,0])) as Record<Family,number>;
const familyDisagree:Record<Family,number>=Object.fromEntries(families.map(f=>[f,0])) as Record<Family,number>;
const sha=(s:string)=>createHash("sha256").update(s).digest("hex");
const norm=(v:number)=>((v%360)+360)%360;
function canonicalCities(){
  const unique=new Map<string,City>();
  const repeated:string[]=[];
  for(const city of supportedCities){
    const previous=unique.get(city.slug);
    if(previous){
      if(previous.name!==city.name||previous.state!==city.state||
         previous.lat!==city.lat||previous.lng!==city.lng||
         previous.language.join(",")!==city.language.join(","))
        throw Error("Contradictory city coordinates under duplicate slug "+city.slug);
      repeated.push(city.slug);
    }else unique.set(city.slug,city);
  }
  const cities=[...unique.values()].sort((a,b)=>a.slug.localeCompare(b.slug));
  if(cities.length!==454)throw Error("Unexpected canonical India city count "+cities.length);
  return {cities,repeated};
}
const catalog=readFileSync("artifacts/wave3ao-jpl-global-sidereal-transitions.json","utf8");
const lahiri=readFileSync("artifacts/wave3ao-lahiri-6h-anchors.json","utf8");
const source=openVerifiedV6SiderealSource(catalog,lahiri);
const half=getPinnedV6HalfTithiTable();
const {cities,repeated}=canonicalCities();
const sunriseModel="Swiss/Moshier upper-limb sunrise, pressure 1013.25 hPa, temperature 25 C, sea-level";
const digest=createHash("sha256"),riskDigest=createHash("sha256");
const mismatches:Array<{city:string;date:string;sunriseUtc:string;family:Family;
  v5Index:number;v6Index:number;closestJplBoundarySeconds:number}>=[];
const nearRootExamples:Array<{city:string;date:string;sunriseUtc:string;
  nearest:Partial<Record<Family,number>>}>=[];
let allCount=0,exactSunrises=0,within2=0,within10=0,swissCompared=0;
let rootNoData=0,referenceChecks=0,swissComparedOutsideRisk=0;
const swed=createDefaultSweData();
sweSetSidMode(swed,SE_SIDM_LAHIRI,0,0);
try{
  for(const city of cities){
    const geopos=[city.lng,city.lat,0];
    let dayIndex=0;
    for(let civil=START;civil<END;civil+=DAY,dayIndex++){
      const date=new Date(civil).toISOString().slice(0,10);
      const year=date.slice(0,4);
      const annual=byYear[year];
      annual.cityDays++;allCount++;
      const [yy,mm,dd]=date.split("-").map(Number);
      const rise=sweRiseTrans(swed,indiaCivilDayStartJulian(yy,mm,dd),
        SE_SUN,null,SEFLG_MOSEPH,SE_CALC_RISE,geopos,1013.25,25,null);
      if(rise.retval<0||!Number.isFinite(rise.tret))
        throw Error("No exact physical sunrise "+city.slug+" "+date);
      const ms=Math.round((rise.tret-JD_UNIX)*DAY);
      if(new Date(ms+IST).toISOString().slice(0,10)!==date)
        throw Error("Sunrise outside India civil day "+city.slug+" "+date);
      exactSunrises++;annual.physicalSunrises++;
      const lunar=jplHalfTithiAtMs(half,ms);
      const sidereal=siderealStateAtUtc(source.table,new Date(ms).toISOString());
      if(sidereal.nakshatra.index!==Math.floor(sidereal.moonPada.index/4)||
         sidereal.nakshatraPada!==sidereal.moonPada.index%4+1)
        throw Error("Cross-family Pada/Nakshatra contradiction "+city.slug+" "+date);
      const indices:Record<Family,number>={
        halfTithi:lunar.halfPhaseIndex,moonPada:sidereal.moonPada.index,
        nakshatra:sidereal.nakshatra.index,yoga:sidereal.yoga.index,
        moonRashi:sidereal.moonRashi.index,sunRashi:sidereal.sunRashi.index
      };
      const near:Partial<Record<Family,number>>={};
      let smallest=Infinity,near2=false,near10=false;
      for(const f of families){
        const rows=f==="halfTithi"?half.halfTithiTransitions:source.table.events[f];
        const neighbor=nearestExactRoot(rows,ms);
        if(!Number.isFinite(neighbor.distanceMs)||neighbor.distanceMs<0)throw Error("Bad JPL root coverage "+f+" "+date);
        smallest=Math.min(smallest,neighbor.distanceMs);
        if(neighbor.distanceMs<=2*ONE_MIN){
          near2=true;familyNear2[f]++;
          near[f]=Math.round(neighbor.distanceMs/1000)/60;
        }
        if(neighbor.distanceMs<=10*ONE_MIN){near10=true;familyNear10[f]++;}
      }
      if(near2){
        within2++;annual.near2min++;
        riskDigest.update(city.slug+"|"+date+"|"+JSON.stringify(near)+"\n");
        if(nearRootExamples.length<250)nearRootExamples.push({
          city:city.slug,date,sunriseUtc:new Date(ms).toISOString(),nearest:near
        });
      }
      if(near10){within10++;annual.near10min++;}
      // Full precision compare within ±10 min of ANY JPL root; independent
      // deterministic controls otherwise. Never assert source agreement
      // on unexamined days.
      const control=(dayIndex%97===0);
      if(near10||control){
        const sidFlags=SEFLG_MOSEPH|SEFLG_SPEED|SEFLG_SIDEREAL;
        const tropFlags=SEFLG_MOSEPH|SEFLG_SPEED;
        const sunSid=norm(sweCalcUt(swed,rise.tret,SE_SUN,sidFlags).xx[0]);
        const moonSid=norm(sweCalcUt(swed,rise.tret,SE_MOON,sidFlags).xx[0]);
        const sunTrop=norm(sweCalcUt(swed,rise.tret,SE_SUN,tropFlags).xx[0]);
        const moonTrop=norm(sweCalcUt(swed,rise.tret,SE_MOON,tropFlags).xx[0]);
        if([sunSid,moonSid,sunTrop,moonTrop].some(n=>!Number.isFinite(n)))
          throw Error("Nonfinite Swiss sidereal comparison "+city.slug+" "+date);
        const old:Record<Family,number>={
          halfTithi:Math.floor(norm(moonTrop-sunTrop)/6),
          moonPada:Math.floor(moonSid/(360/108)),
          nakshatra:Math.floor(moonSid/(360/27)),
          yoga:Math.floor(norm(sunSid+moonSid)/(360/27)),
          moonRashi:Math.floor(moonSid/30),
          sunRashi:Math.floor(sunSid/30)
        };
        if(old.nakshatra!==Math.floor(old.moonPada/4))
          throw Error("Inconsistent V5 sidereal classification "+city.slug+" "+date);
        swissCompared++;annual.swissCompared++;
        if(!near10)swissComparedOutsideRisk++;
        for(const f of families){
          const modulus=f==="halfTithi"?60:SIDEREAL_FAMILY_MODULUS[f as SiderealFamily];
          if(old[f]===indices[f])continue;
          // V5 and JPL may disagree near boundaries, but nonadjacent
          // states mean more than ephemeris source rounding and are fatal.
          if(!sourceLabelsAreAdjacent(old[f],indices[f],modulus))
            throw Error("Nonadjacent V5/JPL classification "+f+" "+city.slug+" "+date);
          familyDisagree[f]++;annual.modelChanged[f]++;
          const boundary=nearestExactRoot(f==="halfTithi"?
            half.halfTithiTransitions:source.table.events[f as SiderealFamily],ms);
          const mismatch={city:city.slug,date,sunriseUtc:new Date(ms).toISOString(),
            family:f,v5Index:old[f],v6Index:indices[f],
            closestJplBoundarySeconds:Math.round(boundary.distanceMs/1000)};
          if(mismatches.length<5000)mismatches.push(mismatch);
          riskDigest.update(JSON.stringify(mismatch)+"\n");
        }
      }
      digest.update(city.slug+"|"+date+"|"+ms+"|"+families.map(f=>indices[f]).join(",")+"\n");
      if(dayIndex===0){
        const unified=getV6UnifiedSunrise(date,city,source);
        if(unified.sunriseUtc!==new Date(ms).toISOString()||
          unified.lunar.tithiIndex!==lunar.tithiIndex||
          unified.lunar.karanaHalfIndex!==lunar.halfPhaseIndex||
          unified.sidereal.nakshatra.index!==sidereal.nakshatra.index||
          unified.sidereal.yoga.index!==sidereal.yoga.index)
          throw Error("Exhaustive direct sunrise vs live research interface divergence "+city.slug+" "+date);
        referenceChecks++;
      }
    }
    if((cities.indexOf(city)+1)%50===0)
      console.log("[Wave3AQ progress] cities="+(cities.indexOf(city)+1)+"/"+cities.length+
        " exactSunrises="+exactSunrises+" comparisons="+swissCompared+
        " near2="+within2+" near10="+within10);
  }
}finally{sweClose(swed);}
const daysPerCity=(END-START)/DAY,expected=cities.length*daysPerCity;
if(daysPerCity!==daysInGregorianYear(requestedYear)||exactSunrises!==expected||allCount!==expected||
   swissCompared<1000||referenceChecks!==cities.length)
  throw Error("Incomplete direct sunrise census "+JSON.stringify({
    expected,exactSunrises,allCount,swissCompared,referenceChecks}));
assertProductionLunarEngine(PUBLIC_LUNAR_ENGINE_VERSION);
let productionDenied=false;
try{assertProductionLunarEngine(STAGED_LUNAR_ENGINE_VERSION);}catch{productionDenied=true;}
if(!productionDenied)throw Error("V6 production promotion was not blocked");
const summary={
  wave:"3AQ",schema:1,year:requestedYear,yearRange:[requestedYear],uniqueCities:cities.length,
  duplicatedIdenticalCityRecords:repeated,daysPerCity,
  expectedCityDays:expected,examinedCityDays:allCount,
  exactSwissUpperLimbSunrises:exactSunrises,sunriseModel,
  NOAAApproximationUsed:false,
  fullJplLunarAndSiderealClassificationCoverage:true,
  crossInterfaceExactSunriseChecks:referenceChecks,
  nearJplBoundaryTwoMinutes:within2,nearJplBoundaryTenMinutes:within10,
  countsNear2MinutesByFamily:familyNear2,countsNear10MinutesByFamily:familyNear10,
  checkedV5SwissSiderealAndLunarReferenceCityDays:swissCompared,
  independentlySampledNonBoundarySwissChecks:swissComparedOutsideRisk,
  disagreementByFamily:familyDisagree,
  modelDisagreementRowsStored:mismatches.length,
  modelDisagreementRowsCappedAt:5000,
  capturedMismatchSamples:mismatches,
  nearJplBoundaryExamples:nearRootExamples,
  annual:byYear,
  allClassificationRowsSha256:digest.digest("hex"),
  allSensitivityAndMismatchRowsSha256:riskDigest.digest("hex"),
  source:{lunarRootSha256:JPL_V6_ROOTS_ASSET_SHA256,
    siderealCatalogSha256:source.sourceDigest,
    lahiriAnchorSha256:source.lahiriAnchorDigest,
    combinedIdentity:source.combinedIdentity},
  release:{siderealAyanamsaIndependentlyApproved:false,
    v6LunarMonthSamvatApproved:false,
    festivalVratParanaMuhuratApproved:false,
    exactTransitionTimesOutside2026To2028Approved:false,
    fullSwissModelComparisonAllDays:false,
    publicEngineRemainsV5:true,productionV6ActivationDenied:productionDenied}
};
mkdirSync("artifacts",{recursive:true});
writeFileSync("artifacts/wave3aq-full-city-day-jpl-sunrise-"+requestedYear+".json",JSON.stringify(summary,null,2)+"\n");
console.log("[Wave3AQ] "+JSON.stringify({year:requestedYear,cities:cities.length,daysPerCity,
  exactSunrises,near2:within2,near10:within10,swissCompared,
  outsideRisk:swissComparedOutsideRisk,modelDifferences:familyDisagree,
  researchOnly:true,publicV5:true}));
