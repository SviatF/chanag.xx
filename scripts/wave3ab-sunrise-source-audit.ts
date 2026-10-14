/**
 * Wave 3AB release-blocked source-method reconciliation.
 * Creates reproducible second-resolution Swiss model output, contrasted with
 * still-only minute-precision city-pinned publisher labels.
 *
 * A comparative sunrise convention from the SAME ephemeris is not
 * independent confirmation. No ritual or production day is changed.
 */
import {mkdirSync,writeFileSync} from "node:fs";
import {cityBySlug} from "../lib/cities";
import {calculateVratCalendar} from "../lib/vrat";
import {getPanchang} from "../lib/panchang";
import {compareVratTimeScales} from "../lib/vrat-ut-et-diagnostic";
import {compareEkadashiArunodaya} from "../lib/ekadashi-observance-research";
import {compareSunriseConventions} from "../lib/sunrise-convention-differential";
import {patnaJan2027PublishedClocks,sunriseMethodProvenance} from "../tests/fixtures/patna-wave3ab-observations";

const target=process.argv.find(x=>x.startsWith("--report="))?.slice(9)||
  "artifacts/wave3ab-patna-method-reconciliation.json";
const issues:string[]=[];
const city=cityBySlug("patna"), date="2027-01-31";
const panchang=await getPanchang(new Date(date+"T06:00:00Z"),city);
const patna=compareSunriseConventions(city,date);
const diagnostic=compareVratTimeScales(city,date);
const vedicspaceCoordinateSample=compareSunriseConventions(
  {...city,lat:25.6093},date);
const publisherDomains=new Set(patnaJan2027PublishedClocks.map(x=>x.domain));
const exactIndependent=patnaJan2027PublishedClocks.filter(x=>
  x.exactSecondSunriseAvailable&&x.exactSecondTithiEndAvailable&&x.matchedSwissMethodProven);
if(panchang.tithi!=="Dashami"||panchang.paksha!=="Krishna"||
   patna.defaultApparentUpperLimb.tithi!==panchang.paksha+" "+panchang.tithi)
  issues.push("Patna corrected exact UT Panchang disagrees with model differential");
const minuteRoundedIst=(jdUT:number)=>new Date(
  Math.round(((jdUT-2440587.5)*86400000+330*60000)/60000)*60000
).toISOString().slice(11,16);
if(minuteRoundedIst(patna.defaultApparentUpperLimb.sunrise.jdUT)!==panchang.sunrise)
  issues.push("Patna sunrise second clock does not round identically to daily Panchang");
if(patna.sunriseTithiChangesByConvention&&patna.safeToSwitchProductionConvention)
  issues.push("Unreviewed sunrise convention was promoted to production");
if(patnaJan2027PublishedClocks.some(x=>
  x.date!==date||x.reportedPrecision!=="minute"||x.exactSecondTithiEndAvailable))
  issues.push("Patna source resolution provenance invalid");
if(publisherDomains.size!==4||exactIndependent.length!==0)
  issues.push("Patna source independence proof incorrectly promoted");

const cities=["delhi","kanpur","mumbai","chennai"] as const;
const caseList=[];
let scanned=0;
for(const slug of cities){
  const region=cityBySlug(slug);
  for(const year of [2026,2027]){
    const rows=calculateVratCalendar("ekadashi",year,region);
    scanned+=rows.length;
    for(const row of rows){
      const arunodaya=compareEkadashiArunodaya(region,row.date);
      if(arunodaya.dashamiArunodayaScreen!=="dashami-at-arunodaya")continue;
      const alternate=compareSunriseConventions(region,row.date);
      if(alternate.defaultApparentUpperLimb.tithi!==arunodaya.sunriseTithi||
        alternate.defaultApparentUpperLimb.arunodayaTithi!==arunodaya.arunodayaTithi)
        issues.push("3Z arunodaya differs from second-resolution audit at "+slug+"/"+row.date);
      if(alternate.certifiedFastingDate!==null||alternate.certifiedParana!==null||
         alternate.safeToSwitchProductionConvention)
        issues.push("Unreviewed observance promoted "+slug+"/"+row.date);
      caseList.push({
        city:slug,date:row.date,year,referenceTithi:row.paksha+" "+row.tithi,
        defaultSunrise:alternate.defaultApparentUpperLimb.sunrise.ist,
        defaultArunodaya:alternate.defaultApparentUpperLimb.arunodaya96MinutesBeforeSunrise.ist,
        defaultArunodayaTithi:alternate.defaultApparentUpperLimb.arunodayaTithi,
        hinduSunrise:alternate.hinduGeometricCenter.sunrise.ist,
        hinduArunodaya:alternate.hinduGeometricCenter.arunodaya96MinutesBeforeSunrise.ist,
        hinduArunodayaTithi:alternate.hinduGeometricCenter.arunodayaTithi,
        secondsHinduSunriseAfterDefault:alternate.secondsHinduSunriseAfterApparent,
        vedhaSignalChangesBySunriseConvention:alternate.arunodayaTithiChangesByConvention,
        independentGCalClockVerified:false,
        selectedSmartaFast:null,selectedISKCONFast:null,
        releaseApproval:false
      });
    }
  }
}
caseList.sort((a,b)=>a.date.localeCompare(b.date)||a.city.localeCompare(b.city));
const uniqueDays=new Set(caseList.map(x=>x.city+"|"+x.date));
if(scanned<150||caseList.length!==8||uniqueDays.size!==8)
  issues.push("Expected 193 reference days / 8 unique mathematical Vedha signals, got "+scanned+" / "+caseList.length);
const localCandidate={
  city:"patna",date,
  sourceCase:"Published Navami with 06:33/06:34 minute clocks; UT-correct upper-limb PANCHVANI Dashami at sunrise",
  coordinatesCore:{latitude:city.lat,longitude:city.lng},
  coordinatesVedicSpace:{latitude:25.6093,longitude:city.lng},
  productionTithi:panchang.paksha+" "+panchang.tithi,
  productionSunriseMinute:panchang.sunrise,
  exactUtReference:patna,
  alternateCoordinateSameMethod:vedicspaceCoordinateSample,
  timeScaleCrossCheck:{
    correctUtTithiIndex:diagnostic.utCorrectTithiIndex,
    previousTransitionSecondsBeforeSunrise:diagnostic.utLastTransitionSecondsBeforeSunrise,
    nextTransitionSecondsAfterSunrise:diagnostic.utNextTransitionSecondsAfterSunrise
  },
  publisherClockRecords:patnaJan2027PublishedClocks,
  numberOfPublisherDomains:publisherDomains.size,
  numberOfIndependentSecondResolutionMatches:exactIndependent.length,
  publishedSourceMethodReconciled:false,
  canChangeProductionTithi:false,
  assessment:"PUBLISHED-MINUTE-STATE-DISAGREEMENT-NO-EXACT-SECOND-METHOD-CERTIFICATION"
};
const report={
  wave:"3AB",generatedAt:new Date().toISOString(),
  status:"ASTRONOMICAL-SUNRISE-CONVENTION-DIFFERENTIAL-WITH-INDEPENDENT-METHOD-GAP",
  sourceMethodProvenance:sunriseMethodProvenance,
  keyFinding:"Default Swiss apparent upper-limb and Hindu geometric-center sunrise are different observer conventions, not independent lunar ephemerides.",
  sourceCase:localCandidate,
  sampledAnnualYears:[2026,2027],sampledAnnualCities:cities,
  sunriseEkadashiDaysScanned:scanned,vedhaCandidates:caseList.length,
  vedhaChangesByRiseConvention:caseList.filter(x=>x.vedhaSignalChangesBySunriseConvention).length,
  vedhaReviewQueue:caseList,
  independentGCalMethodsVerified:0,
  cityPinnedSecondLevelExternalClocksVerified:0,
  selectedTraditionFastDays:0,
  approvedParanaWindows:0,
  allowedToPatchAstronomy:false,
  allowedToChangeCuratedObservances:false,
  errors:issues
};
mkdirSync("artifacts",{recursive:true});
writeFileSync(target,JSON.stringify(report,null,2)+"\n");
const iso=(v:string)=>v.slice(11,19);
console.log("[3ab-patna] model="+panchang.paksha+" "+panchang.tithi+
  " apparent="+iso(patna.defaultApparentUpperLimb.sunrise.ist)+
  " Hindu="+iso(patna.hinduGeometricCenter.sunrise.ist)+
  " offset="+patna.secondsHinduSunriseAfterApparent+"s");
console.log("[3ab-patna] last-Tithi-before-apparent="+patna.defaultApparentUpperLimb.secondsSincePreviousTithi+
  "s last-Tithi-before-Hindu="+patna.hinduGeometricCenter.secondsSincePreviousTithi+
  "s sunrise-label-changes="+patna.sunriseTithiChangesByConvention);
console.log("[3ab-vedha] reference-days="+scanned+" candidates="+caseList.length+
  " convention-sensitive="+report.vedhaChangesByRiseConvention+
  " independent-GCal=0 approved-fast=0");
for(const r of caseList)console.log("[3ab-vedha] "+r.date+" "+r.city+
  " defaultArunodaya="+iso(r.defaultArunodaya)+
  " HinduArunodaya="+iso(r.hinduArunodaya)+
  " changed="+r.vedhaSignalChangesBySunriseConvention);
console.log("[3ab] report="+target+" errors="+issues.length);
for(const e of issues)console.error("[3ab] FAIL "+e);
if(issues.length||report.vedhaCandidates!==8||report.cityPinnedSecondLevelExternalClocksVerified!==0)
  process.exitCode=1;
