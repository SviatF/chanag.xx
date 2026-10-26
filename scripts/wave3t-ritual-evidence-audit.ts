/**
 * Wave 3T ritual truth: festival national published date ≠ per-city ritual;
 * Vrat sunrise Tithi ≠ fast/Parana; reviewed Marathi closure ≠ India-wide ban.
 */
import {mkdirSync,writeFileSync} from "node:fs";
import {festivalBySlugYear,festivalsForYear} from "../lib/festivals";
import {festivalCityPageIsIndexable} from "../lib/festival-expansion";
import {findCityBySlug,supportedCities} from "../lib/cities";
import {getVerifiedMuhuratClosure} from "../lib/verified-muhurat-closures";
import {getMuhuratVerificationNotice} from "../lib/muhurat-verification-notice";
import {getFestivalRuleProfile} from "../lib/religious-integrity";
import {calculateVratCalendar,vratDefinitions,vratSlugs} from "../lib/vrat";
import {festivalDateEvidence,independentFestivalDateChecks,festivalTraditionDateEvidence} from "../tests/fixtures/festival-date-evidence";
import {marathiMarriage2025to2027} from "../tests/fixtures/muhurat-closure-2025-27-evidence";
import {auditVratSunriseRows,festivalDateEvidenceStatus} from "../lib/ritual-evidence-matrix";

const result=process.argv.find(s=>s.startsWith("--report="))?.slice(9)||
  "artifacts/wave3t-ritual-evidence-matrix.json";
const failures:string[]=[];
const events=["wedding","griha-pravesh"] as const;
const cities=["mumbai","pune","delhi","chennai"] as const;
const annualFestivals=[2026,2027].flatMap(year=>festivalsForYear(year));
const festivalEvidence=annualFestivals.map(festival=>{
  const audit=festivalDateEvidenceStatus(
    festival.slug,festival.year,festival.date,festivalDateEvidence,
    independentFestivalDateChecks
  );
  const profile=getFestivalRuleProfile(festival);
  return {
    ...audit,
    ruleProfileExactness:profile.exactness,
    namedRuleSources:profile.sources.length,
    // The year-level record is not a universal city-local ritual date;
    // geo-dependent Puja windows require an independent local review.
    regionalTraditionApproved:false,
    absoluteFestivalTimeApproved:false
  };
});
const festivalConflicts=festivalEvidence.filter(f=>
  f.status==="published-date-mismatch"||f.status==="no-published-date");
const verifiedByTwo=festivalEvidence.filter(f=>f.status==="two-publisher-date-corroboration");
const primaryOnly=festivalEvidence.filter(f=>f.status==="one-publisher-date-only");
const precisePujaCertified=festivalEvidence.filter(f=>f.exactPujaTimeCertified);
const vratResults=[] as Array<Record<string,unknown>>;
for(const slug of cities){
  const city=findCityBySlug(slug);
  if(!city){failures.push("City missing: "+slug);continue}
  for(const year of [2026,2027]){
    // Year calculation is cached across the 3 vrat types and the same city.
    for(const vrat of vratSlugs){
      const rows=calculateVratCalendar(vrat,year,city);
      const checked=auditVratSunriseRows(vrat,year,rows);
      vratResults.push({...checked,city:slug,
        explanation:vratDefinitions[vrat].ritualCaution});
      if(checked.errors.length){
        const details=checked.errors.slice(0,3).map(err=>{
          const date=err.split(":").slice(-1)[0];
          const sourceRow=rows.find(r=>r.date===date);
          return err+" [sunrise="+sourceRow?.sunrise+
            " end="+sourceRow?.tithiEnd+" endDate="+sourceRow?.tithiEndDate+"]";
        });
        failures.push(slug+"/"+year+"/"+vrat+": "+details.join("|"));
      }
    }
  }
}
const mahCity=supportedCities.filter(c=>c.state==="Maharashtra");
const closures=[] as Array<Record<string,unknown>>;
let customaryReviews=0;
for(const event of events){
  for(const year of [2025,2026,2027]){
    for(const month of [8,9,10]){
      for(const city of cities){
        const resolved=findCityBySlug(city);
        if(!resolved){failures.push("missing city: "+city);continue}
        const closure=getVerifiedMuhuratClosure(event,year,month,resolved);
        const notice=getMuhuratVerificationNotice(event,year,month,resolved);
        // A Delhi-only, independently source-reviewed Vivaha convention is
        // permitted; blanket non-Maharashtra replication is still a failure.
        const reviewedDelhiVivaha=resolved.slug==="delhi"&&event==="wedding"&&year===2026&&month===10&&closure?.convention==="Published New Delhi Vivaha Panchang Shuddhi";
        const calendarSources=event==="wedding"?
          marathiMarriage2025to2027.sourcesByYear[year as 2025|2026|2027]:[];
        const sourceLocations=calendarSources.map(s=>s.location);
        const traditionScoped=calendarSources.filter(s=>
          s.location.includes("Maharashtra")&&
          !s.location.includes("not Maharashtra")&&
          s.verdict.includes("zero"));
        const row={
          event,year,month,city:resolved.slug,state:resolved.state,
          sourcePublisherCount:calendarSources.length,
          MaharashtraScopedPublishers:traditionScoped.length,
          publisherLocationScope:sourceLocations,
          closureObserved:Boolean(closure),
          convention:closure?.convention??null,
          status:reviewedDelhiVivaha?"reviewed-delhi-vivaha-convention":closure?"reviewed-customary-monthly-exclusion":"astronomical-candidate-only",
          userNoticeStatus:notice.status,
          independentlyCertifiedExactDay:false,
          stateWideAndAllTraditionsBan:false,
          safeForNewCeremonyRuleExpansion:false
        };
        if(Boolean(closure)!==(notice.status==="reviewed-closed-calendar"))
          failures.push("Notice/closure conflict: "+event+"/"+city+"/"+year+"/"+month);
        if(resolved.state!=="Maharashtra"&&closure&&!reviewedDelhiVivaha)
          failures.push("Region leakage: "+event+"/"+city+"/"+year+"/"+month);
        if(event==="griha-pravesh"&&year!==2026&&closure)
          failures.push("Unsupported 2025/27 Griha closure");
        if(closure)customaryReviews++;
        closures.push(row);
      }
    }
  }
}
for(const year of [2026,2027])for(const f of festivalsForYear(year)){
  if(!festivalBySlugYear(f.slug,year))failures.push("Missing canonical festival "+f.slug);
  if(year===2027&&festivalCityPageIsIndexable(f.slug,year,"mumbai"))
    failures.push("2027 festival date pages must stay held from indexing");
}
const report={
  createdAt:new Date().toISOString(),
  wave:"3T",
  status:"RESEARCH-ONLY-FESTIVAL-VRAT-CEREMONY-CROSS-DOMAIN",
  safeForCeremonyFiltering:false,
  certifiedRegionalRitualDates:0,
  certifiedVratFastOrParanaTimings:0,
  firstPublisherDateCount:festivalDateEvidence.length,
  festivalDates:festivalEvidence.length,
  festivalTwoPublisherDateOnlyCount:verifiedByTwo.length,
  festivalOnePublisherDateOnlyCount:primaryOnly.length,
  festivalSourceConflicts:festivalConflicts,
  festivalTraditionVariants:festivalTraditionDateEvidence,
  priorityRitualProfiles:festivalEvidence.filter(f=>["diwali","janmashtami","raksha-bandhan",
    "karwa-chauth","chhath-puja"].includes(f.slug)),
  vratCityYearTypeAudits:vratResults.length,
  vratSunriseRecords:vratResults.reduce((n,r)=>n+Number(r.sunriseRows),0),
  vratRepeatedSunriseRecords:vratResults.reduce((n,r)=>n+Number(r.repeatedAtSunrise),0),
  vratUnresolvedTransitions:vratResults.reduce((n,r)=>n+Number(r.unresolvedTransitions),0),
  vratNearSunriseBoundaryCount:vratResults.reduce((n,r)=>n+Number(r.boundarySensitiveCount),0),
  nearSunriseCases:vratResults.filter(r=>Number(r.boundarySensitiveCount)>0).map(r=>({
    city:r.city,year:r.year,slug:r.slug,boundaries:r.nearSunriseBoundaryRows,
    actualVratDateCertified:false
  })),
  vratResults,
  monthEventCityReviews:closures.length,
  customaryMonthClosures:customaryReviews,
  closureRows:closures,
  staticSourceVsRuleConclusions:[
    "Two independent festival publisher domains corroborate a NATIONAL CALENDAR DATE only. They do not certify correct local Puja Muhurat, Pradosh+Amavasya+Sthir Lagna or regional observance.",
    "Janmashtami's Smarta versus Vaishnava/Rohini conventions remain separate; sunrise Tithi is not alone enough to adjudicate the correct fast day.",
    "Rakhi requires a Bhadra-free overlap, not a generic afternoon Choghadiya label.",
    "Ekadashi Vrat is a sunrise-based Tithi list; Dashami Vedha, special sampradaya exceptions, and next-day Parana have NOT been independently approved.",
    "If a Tithi boundary and local sunrise are within five displayed minutes, the observation is marked needs-independent-minute-review; never treat a rounded same-minute endpoint as certain.",
    "Purnima/Amavasya are sunrise Panchang observations; Sraddha/night ritual date may require another temporal rule.",
    "Maharashtra wedding and Griha Pravesh reviewed monthly closures and separately reviewed Delhi October Vivaha are convention-scoped; no India-wide restrictions or inferred daily Asta dates.",
    "A Muhurat planning score of 100/100 is availability of daytime windows, not 100% auspicious or ceremonial validity.",
    "This audit is not a replacement for primary source verification and does not automatically change any published event date or indexability."
  ],
  auditFailures:failures
};
mkdirSync("artifacts",{recursive:true});
writeFileSync(result,JSON.stringify(report,null,2)+"\n");
console.log("[ritual-3t] festival="+festivalEvidence.length+" two-publisher-DATE="+
  verifiedByTwo.length+" primary-only="+primaryOnly.length+" conflicts="+festivalConflicts.length);
console.log("[ritual-3t] vrat city-year-type="+vratResults.length+" sunrise="+report.vratSunriseRecords+
  " repeated="+report.vratRepeatedSunriseRecords+" missing-transition="+report.vratUnresolvedTransitions+
  " near-sunrise-uncertain="+report.vratNearSunriseBoundaryCount);
console.log("[ritual-3t] closure reviews="+closures.length+" customary closures="+customaryReviews+
  " regions="+mahCity.length+" MH-supported-city-count");
console.log("[ritual-3t] RESEARCH ONLY; never ceremony permission: "+result);
for(const fail of failures.slice(0,10))console.error("[ritual-3t] FAIL "+fail);
if(failures.length||festivalConflicts.length||precisePujaCertified.length||
  verifiedByTwo.length!==independentFestivalDateChecks.length||
  report.certifiedRegionalRitualDates||report.certifiedVratFastOrParanaTimings)
  process.exitCode=1;
