#!/usr/bin/env python3
"""Wave 3AE: validate EVERY Swiss V5 near-sunrise shard candidate using JPL DE440s.
Only committed city-month source rows, not arbitrary dynamic URL space.
No lunar/ceremony/routine/SEO production writes.
"""
from __future__ import annotations
import argparse
import importlib.util
import json
import math
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

SELF=Path(__file__).resolve()
spec=importlib.util.spec_from_file_location("wave3ad_jpl",str(SELF.with_name("wave3ad-jpl-de440s-oracle.py")))
assert spec and spec.loader
module=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=module
spec.loader.exec_module(module)
Oracle=module.JplDe440sOracle
tithi_index=module.tithi_index
tithi_name=module.tithi_name
parsed_utc=module.parsed_utc
ist=module.ist
iso=module.iso

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--kernel",required=True)
    p.add_argument("--baseline",default="artifacts/wave3ae-swiss-shard-screen.json")
    p.add_argument("--report",default="artifacts/wave3ae-jpl-full-impact.json")
    p.add_argument("--expected-sha256",required=True)
    args=p.parse_args()
    import skyfield
    if skyfield.__version__!="1.55":raise RuntimeError("Skyfield version not pinned")
    kernel=Path(args.kernel)
    digest=__import__("hashlib").sha256(kernel.read_bytes()).hexdigest()
    if digest!=args.expected_sha256:raise RuntimeError("JPL DE440s SHA mismatch")
    source=json.loads(Path(args.baseline).read_text(encoding="utf8"))
    meta=source["sourceScope"]
    candidates=source["candidates"]
    if meta["shardCount"]!=48 or meta["cityDays"]<10000 or meta["cityDays"]!=meta["uniqueCityDays"]:
        raise ValueError("Not exhaustive for V5 committed snapshots")
    if len(candidates)<5 or len(candidates)!=source["screening"]["swissCandidateCount"]:
        raise ValueError("Candidate export incomplete")
    if len({(x["city"],x["date"]) for x in candidates})!=len(candidates):
        raise ValueError("Candidate source duplicates")
    oracle=Oracle(kernel)
    rows=[]
    changed=[]
    method_warnings=[]
    for i,c in enumerate(candidates):
        t_sun=parsed_utc(c["swissSunrise"]["utc"])
        t_root=parsed_utc(c["swissBoundary"]["utc"])
        jpl_sun=oracle.sunrise(c["date"],c["lat"],c["lng"])
        jpl_root=oracle.phase_root(c["rootTargetDegrees"],t_root)
        t_jpl_sun=parsed_utc(jpl_sun["utc"])
        t_jpl_root=parsed_utc(jpl_root["utc"])
        swiss_index=int(c["swissIndexAtSunrise"])
        jpl_index_at_swiss=tithi_index(oracle.phase_deg(t_sun))
        jpl_index_at_jpl=tithi_index(oracle.phase_deg(t_jpl_sun))
        jpl_index_at_root_before=tithi_index(oracle.phase_deg(t_jpl_root.replace(microsecond=0)-
            __import__("datetime").timedelta(seconds=4)))
        rise_delta=(t_jpl_sun-t_sun).total_seconds()
        boundary_delta=(t_jpl_root-t_root).total_seconds()
        jpl_gap=(t_jpl_sun-t_jpl_root).total_seconds()
        changed_index=swiss_index!=jpl_index_at_jpl
        method_error=abs(rise_delta)>900 or abs(boundary_delta)>3600
        if method_error:method_warnings.append(f"{c['city']}|{c['date']} impossible >15min rise / >1h phase mismatch")
        row={
            "city":c["city"],"date":c["date"],"lat":c["lat"],"lng":c["lng"],
            "snapshotTithi":c["sourceSnapshotTithi"],
            "snapshotTithiMatchedSwiss":c["sourceSnapshotMatchesSwissAtSunrise"],
            "swissIndexAtSwissSunrise":swiss_index,
            "swissTithi":c["swissSunriseTithi"],
            "swissSunrise":c["swissSunrise"],"swissBoundary":c["swissBoundary"],
            "swissSunriseMinusBoundarySeconds":c["swissSunriseMinusBoundarySeconds"],
            "jplSunrise":jpl_sun,"jplBoundary":jpl_root,
            "jplIndexAtSwissSunrise":jpl_index_at_swiss,
            "jplIndexAtJplSunrise":jpl_index_at_jpl,
            "jplTithiAtJplSunrise":jpl_sun["tithi"],
            "jplSunriseMinusBoundarySeconds":round(jpl_gap,3),
            "jplMinusSwissSunriseSeconds":round(rise_delta,3),
            "jplMinusSwissBoundarySeconds":round(boundary_delta,3),
            "modelSunriseTithiDisagrees":changed_index,
            "jplModelStableAtBothSolarInstants":jpl_index_at_swiss==jpl_index_at_jpl,
            "sameInstantJplVsSwissDisagrees":jpl_index_at_swiss!=swiss_index,
            "publishedSourceMethodCertified":False,
            "fastOrPujaCertified":False,
            "automaticRewriteAllowed":False,
        }
        rows.append(row)
        if changed_index:
            changed.append(row)
            print("[3ae-FLIP] "+c["date"]+" "+c["city"]+
                  " Swiss="+c["swissSunriseTithi"]+" JPL="+jpl_sun["tithi"]+
                  " SwissGap="+str(c["swissSunriseMinusBoundarySeconds"])+"s"+
                  " JPLGap="+str(round(jpl_gap,3))+"s",flush=True)
        if (i+1)%50==0:
            print(f"[3ae-progress] JPL candidate {i+1}/{len(candidates)} changed={len(changed)}",flush=True)
    if method_warnings:raise ValueError("Inconsistent independent JPL method/observer: "+", ".join(method_warnings[:5]))
    rows.sort(key=lambda x:(x["date"],x["city"]))
    changed.sort(key=lambda x:(x["date"],x["city"]))
    by_year=Counter(r["date"][:4] for r in rows)
    flips_by_year=Counter(r["date"][:4] for r in changed)
    by_city=Counter(r["city"] for r in rows)
    flips_by_city=Counter(r["city"] for r in changed)
    by_tithi=Counter(r["swissTithi"].split()[-1] for r in changed)
    near_3m=[r for r in rows if abs(r["swissSunriseMinusBoundarySeconds"])<=180]
    report={
      "wave":"3AE","independentAstronomy":"JPL DE440s via Skyfield 1.55, geocentric apparent Moon-Sun ecliptic longitude",
      "kernelSha256":digest,
      "snapshotScope":meta,
      "coverages":{
        "fullyScannedCommittedCityDays":meta["cityDays"],
        "fullyScannedCommittedCityMonths":meta["cityMonthDatasets"],
        "shards":meta["shardCount"],
        "allDynamicCityDateRoutesScanned":False,
        "candidateScreenWindowMinutesEachSide":15,
        "swissBoundaryCandidates":len(candidates),
        "jplComputedCandidates":len(rows),
        "modelSunriseTithiFlipCount":len(changed),
        "modelAgreementCount":len(rows)-len(changed),
        "criticalWithinSwiss3Minutes":len(near_3m),
        "candidateGroupByYear":dict(sorted(by_year.items())),
        "flipGroupByYear":dict(sorted(flips_by_year.items())),
        "flipGroupByCity":dict(sorted(flips_by_city.items())),
        "flipGroupByPriorTithi":dict(sorted(by_tithi.items())),
        "sourceSnapshotMismatchCandidates":sum(not r["snapshotTithiMatchedSwiss"] for r in rows)
      },
      "impactedCityDays":changed,
      "allCandidateModelComparisons":rows,
      "migrationGate":{
        "astronomicalChangeCandidates":len(changed),
        "automaticallyApprovedChanges":0,
        "productionEngineVersionToReplace":"V5 Swiss/Moshier (only after separate mathematical method review)",
        "precomputedSnapshotRebuildRequiredIfEngineChanged":True,
        "allDynamicDailyPanchangConsumersNeedSameEngine":True,
        "fastDaysAndParanaRequireSeparateIndependentTraditionValidation":True,
        "muhuratRitualRankingMayBeAffected":True,
        "requiresVersionedCompleteRegenerationAndCacheInvalidation":True,
        "publicRoutesAutomaticallyRewritten":False,
        "productionCodeUnchanged":True,
        "comparisonIsNotIndependentProofOfAllRitualRules":True
      }
    }
    Path(args.report).parent.mkdir(parents=True,exist_ok=True)
    Path(args.report).write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print(f"[3ae-summary] snapshots={meta['cityDays']} cityMonths={meta['cityMonthDatasets']} "
          f"swissRiskCandidates={len(candidates)} independentJpl={len(rows)} "
          f"flips={len(changed)} near3min={len(near_3m)}",flush=True)
    print(f"[3ae-summary] yearCandidates={dict(by_year)} flipsByYear={dict(flips_by_year)} flipsByCity={dict(flips_by_city)}",flush=True)
    print("[3ae] report="+args.report+" noProductionRewrite=true",flush=True)

if __name__=="__main__":
    main()
