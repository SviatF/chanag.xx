import {mkdirSync,writeFileSync} from "node:fs";
import {cityBySlug} from "../lib/cities";
import {getPanchang} from "../lib/panchang";
import {getLunarMonthConventions} from "../lib/calendar-conventions";
import {getPinnedV6HalfTithiTable,JPL_V6_ROOTS_ASSET_SHA256} from "../lib/jpl-v6-pinned-data";
import {getJplV6SunriseLunarCanary} from "../lib/jpl-v6-crossfamily-canary";
import {
  jplLunationAtMs,jplLunarMonthCandidate,jplNewYearCandidate,jplNewMoonBoundaries
} from "../lib/jpl-v6-lunation-candidate";
const cases=[
  ["delhi","2026-06-30"],["kanpur","2026-11-21"],
  ["patna","2027-01-31"],["lucknow","2027-09-17"],
  ["mumbai","2027-03-17"],["chennai","2026-12-09"],
  ["kolkata","2027-10-25"],["bengaluru","2028-01-31"]
] as const;
const table=getPinnedV6HalfTithiTable();
const roots=jplNewMoonBoundaries(table);
const daily=[];
let monthCandidateDifferences=0;
for(const [slug,date] of cases){
  const city=cityBySlug(slug);
  const v6=getJplV6SunriseLunarCanary(date,city,table);
  const candidate=jplLunarMonthCandidate(v6,table);
  const instant=Date.parse(v6.sunriseUtc);
  const anchored=jplLunationAtMs(table,instant);
  if(new Date(anchored.previous).toISOString()!==candidate.previousNewMoonUtc||
     candidate.sourceSha256!==JPL_V6_ROOTS_ASSET_SHA256||
     candidate.siderealEphemerisUnified||candidate.ritualOrPublicationApproved)
    throw Error("Wave3AM invalid source provenance / false release gate "+slug+" "+date);
  const v5=await getPanchang(new Date(date+"T12:00:00Z"),city);
  const previous=getLunarMonthConventions(new Date(date+"T12:00:00Z"),city,v5);
  const differs=previous.amantaLabel!==candidate.monthLabels.amanta||
    previous.purnimantaLabel!==candidate.monthLabels.purnimanta;
  if(differs)monthCandidateDifferences++;
  daily.push({city:slug,date,oldSource:v5.engine,
    v5:{tithi:v5.paksha+" "+v5.tithi,hinduMonth:v5.hinduMonth,
      amanta:previous.amantaLabel,purnimanta:previous.purnimantaLabel,
      samvatYearStart:v5.samvatYearStart},
    v6:{tithi:v6.paksha+" "+v6.tithi,
      previousNewMoonUtc:candidate.previousNewMoonUtc,
      nextNewMoonUtc:candidate.nextNewMoonUtc,
      amantaCandidate:candidate.monthLabels.amanta,
      purnimantaCandidate:candidate.monthLabels.purnimanta},
    monthLabelDisagreement:differs,
    sourceApproval:false});
}
const years=[];
for(const slug of ["mumbai","patna"] as const){
  for(const year of [2026,2027,2028]){
    const city=cityBySlug(slug);
    const chaitra=jplNewYearCandidate(year,city,"chaitra");
    const gujarati=jplNewYearCandidate(year,city,"gujarati");
    if(chaitra.productionReleaseAllowed||gujarati.productionReleaseAllowed||
       !(chaitra.effectiveStart.slice(0,4)===String(year))||
       !(gujarati.effectiveStart.slice(0,4)===String(year)))
      throw Error("Unsafe year-start candidate "+slug+" "+year);
    const v5=await getPanchang(new Date(chaitra.effectiveStart+"T12:00:00Z"),city);
    years.push({city:slug,year,chaitra,gujarati,
      v5ChaitraYearStart:v5.samvatYearStart,
      chaitraDateAgreement:chaitra.effectiveStart===v5.samvatYearStart});
  }
}
const report={
  wave:"3AM",
  generatedAt:new Date().toISOString(),
  ephemeris:"JPL DE440s pinned 6-degree roots (Tithi, Karana and new moons)",
  pinnedRootSourceSha256:JPL_V6_ROOTS_ASSET_SHA256,
  newMoonRootCount:roots.length,
  analyzedDays:daily.length,
  monthCandidateDisagreements:monthCandidateDifferences,
  analyzedRegionalYearStarts:years.length*2,
  siderealSolarSource:"Swiss/Moshier Lahiri via UT-correct sweCalcUt; NOT independently JPL reconciled",
  productionEngine:"V5 Swiss/Moshier",
  releaseAllowed:false,
  remainingBlockingDependencies:[
    "Independent JPL sidereal Sun/Moon and chosen Lahiri ayanamsa",
    "Nakshatra, Pada, Rashi, Yoga, month naming and Samvat cross-source approval",
    "Festival/Smarta/Vaishnava/ISKCON fasting and Parana",
    "Wedding/Griha Pravesh and Guru/Shukra Asta tradition review",
    "Rebuild and pin production V6 shards, invalidate cache and controlled rollback"
  ],
  daily,years
};
mkdirSync("artifacts",{recursive:true});
writeFileSync("artifacts/wave3am-jpl-lunation-month-yearstart.json",JSON.stringify(report,null,2)+"\n");
console.log("[Wave3AM] "+JSON.stringify({roots:roots.length,days:daily.length,
  monthCandidateDisagreements:monthCandidateDifferences,regionalYearStarts:years.length*2,
  publicEngine:"V5",siderealUnified:false,approved:false}));
