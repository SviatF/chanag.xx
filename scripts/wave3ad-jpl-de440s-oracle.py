#!/usr/bin/env python3
"""Wave 3AD: high-precision JPL DE440s Sun/Moon reference, NOT production code.

Skyfield computes GEOCENTRIC apparent Moon-Sun ecliptic longitude difference
(ecliptic/equinox of date) from independent JPL DE440s SPK positions.
This is specifically not the great-circle Sun-Moon angular separation.
Sunrise is USNO apparent upper-limb/refraction convention (~-50 arcmin);
unmatched pressure/temperature/elevation still change seconds of sunrise.

The code must *never* select or overwrite any user-facing Hindu ritual date.
JPL kernel is downloaded only in CI, SHA256 recorded, not committed.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from datetime import datetime, timedelta, timezone
from pathlib import Path

from skyfield.api import load, load_file, wgs84
from skyfield import almanac
import skyfield

UTC = timezone.utc
IST = timezone(timedelta(hours=5,minutes=30))
EXPECTED_SKYFIELD = "1.55"
KERNEL_NAME = "de440s.bsp"

def parsed_utc(value: str) -> datetime:
    result = datetime.fromisoformat(value.replace("Z","+00:00"))
    if result.tzinfo is None or result.utcoffset() != timedelta(0):
        raise ValueError("UTC timestamp required: "+value)
    return result

def iso(dt: datetime) -> str:
    return dt.astimezone(UTC).isoformat(timespec="milliseconds").replace("+00:00","Z")

def ist(dt: datetime) -> str:
    return dt.astimezone(IST).isoformat(timespec="milliseconds")

def diff_seconds(a: datetime, b: datetime) -> float:
    return round((a-b).total_seconds(),3)

def normalize_delta(angle: float, target: float) -> float:
    return (angle-target+180.0)%360.0-180.0

def tithi_index(angle: float) -> int:
    result=int(math.floor(angle%360.0/12.0))
    if result not in range(30):
        raise ValueError("Invalid Tithi 0–29")
    return result

def tithi_name(index:int)->str:
    names=["Pratipada","Dvitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami",
           "Ashtami","Navami","Dashami","Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Purnima"]
    return ("Shukla " if index<15 else "Krishna ") + ("Amavasya" if index==29 else names[index%15])

class JplDe440sOracle:
    def __init__(self, kernel: Path):
        self.ts=load.timescale(builtin=True)  # offline, built-in leap seconds/time rules
        self.eph=load_file(str(kernel))
        self.sun=self.eph["sun"]
        self.earth=self.eph["earth"]

    def phase_deg(self, dt:datetime)->float:
        # Skyfield almanac.moon_phase is the *difference of apparent ecliptic
        # longitude*, not Astronomy Engine's angle between apparent directions.
        degrees=float(almanac.moon_phase(self.eph,self.ts.from_datetime(dt)).degrees)
        if not math.isfinite(degrees):
            raise ValueError("Nonfinite JPL geocentric ecliptic elongation")
        return degrees%360.0

    def tithi(self,dt:datetime)->str:
        return tithi_name(tithi_index(self.phase_deg(dt)))

    def phase_root(self,target:float,around:datetime)->dict:
        if target%12!=0 or not 0<=target<360:
            raise ValueError("Tithi transition target must be 12° multiple")
        lo=around-timedelta(hours=5)
        hi=around+timedelta(hours=5)
        low=normalize_delta(self.phase_deg(lo),target)
        high=normalize_delta(self.phase_deg(hi),target)
        if not (-6 < low < 0 < high < 6):
            raise ValueError(f"No proper independent DE440s root bracket at {around.isoformat()}, phase differences: {low:.5f}/{high:.5f}")
        for _ in range(48):
            if (hi-lo).total_seconds()<0.002:
                break
            mid=lo+(hi-lo)/2
            if normalize_delta(self.phase_deg(mid),target)<0:
                lo=mid
            else:
                hi=mid
        root=lo+(hi-lo)/2
        before=tithi_index(self.phase_deg(root-timedelta(seconds=3)))
        after=tithi_index(self.phase_deg(root+timedelta(seconds=3)))
        target_index=int(target//12)%30
        if before!=(target_index+29)%30 or after!=target_index:
            raise ValueError(f"JPL Tithi boundary fails ±3s bracketing: {before}/{after} target={target_index}")
        return {"utc":iso(root),"ist":ist(root),"unixMs":round(root.timestamp()*1000),
                "phaseDegrees":round(self.phase_deg(root),10),
                "tithiIndexBefore":before,"tithiIndexAfter":after}

    def sunrise(self,date:str,lat:float,lng:float)->dict:
        local_start=datetime.strptime(date,"%Y-%m-%d").replace(tzinfo=IST)
        observer=self.earth+wgs84.latlon(latitude_degrees=lat,longitude_degrees=lng,elevation_m=0)
        t0=self.ts.from_datetime(local_start.astimezone(UTC))
        t1=self.ts.from_datetime((local_start+timedelta(days=1)).astimezone(UTC))
        times,flags=almanac.find_risings(observer,self.sun,t0,t1)
        matches=[t.utc_datetime() for t,ok in zip(times,flags) if bool(ok)
                 and t.utc_datetime().astimezone(IST).strftime("%Y-%m-%d")==date]
        if len(matches)!=1:
            raise ValueError(f"JPL solar sunrise count != 1 for {date} {lat} {lng}: {len(matches)}")
        dt=matches[0]
        return {"utc":iso(dt),"ist":ist(dt),"unixMs":round(dt.timestamp()*1000),
                "tithi":self.tithi(dt),"phaseDegrees":round(self.phase_deg(dt),9)}

def main()->None:
    parser=argparse.ArgumentParser()
    parser.add_argument("--kernel",required=True)
    parser.add_argument("--baseline",default="artifacts/wave3ad-swiss-baseline.json")
    parser.add_argument("--report",default="artifacts/wave3ad-jpl-de440s-comparison.json")
    parser.add_argument("--expected-sha256",default="")
    args=parser.parse_args()
    if skyfield.__version__!=EXPECTED_SKYFIELD:
        raise RuntimeError(f"Unpinned Skyfield: {skyfield.__version__}")
    kernel=Path(args.kernel)
    data=kernel.read_bytes()
    digest=hashlib.sha256(data).hexdigest()
    if kernel.name!=KERNEL_NAME or len(data)<25_000_000 or len(data)>40_000_000 or data[:7]!=b"DAF/SPK":
        raise RuntimeError("Invalid, truncated or unexpected JPL de440s SPK")
    if args.expected_sha256 and digest!=args.expected_sha256:
        raise RuntimeError("Downloaded DE440s kernel hash mismatch against pinned official reference")
    baseline=json.loads(Path(args.baseline).read_text(encoding="utf8"))
    oracle=JplDe440sOracle(kernel)
    errors=[]
    boundary_cases=[]
    for row in baseline["boundaryCases"]:
        ref_sun=parsed_utc(row["sunriseUt"])
        ref_cross=parsed_utc(row["nearestBoundaryUt"])
        rise=oracle.sunrise(row["date"],row["lat"],row["lng"])
        root=oracle.phase_root(float(row["targetEclipticElongationDeg"]),ref_cross)
        jpl_rise=parsed_utc(rise["utc"])
        jpl_cross=parsed_utc(root["utc"])
        tithi_at_swiss_rise=oracle.tithi(ref_sun)
        side_at_swiss_rise="AFTER" if ref_sun>=jpl_cross else "BEFORE"
        side_at_jpl_rise="AFTER" if jpl_rise>=jpl_cross else "BEFORE"
        sunrise_delta=diff_seconds(jpl_rise,ref_sun)
        root_delta=diff_seconds(jpl_cross,ref_cross)
        if abs(sunrise_delta)>900: errors.append(row["city"]+" astronomical sunrise models disagree > 15min")
        if abs(root_delta)>3600: errors.append(row["city"]+" astronomical Moon phase root models disagree > 1h")
        result={
            "city":row["city"],"date":row["date"],"observer":{"latitude":row["lat"],"longitude":row["lng"],"elevationMeters":0},
            "swissMoshier":{"sunriseUTC":row["sunriseUt"],"sunriseIST":row["sunriseIst"],
                           "nearTithiTransitionUTC":row["nearestBoundaryUt"],
                           "nearTithiTransitionIST":row["nearestBoundaryIst"],
                           "tithiAtSwissSunrise":row["swissTithiAtSunrise"]},
            "jplDe440s":{"sunrise":rise,"nearTithiTransition":root,
                         "tithiAtSwissSunrise":tithi_at_swiss_rise,
                         "tithiAtJplSunrise":rise["tithi"],
                         "transitionSideAtSwissSunrise":side_at_swiss_rise,
                         "transitionSideAtJplSunrise":side_at_jpl_rise},
            "jplMinusSwissSeconds":{"sunrise":sunrise_delta,"tithiTransition":root_delta},
            "modelsAgreeOnTithiAtOwnSunrise":rise["tithi"]==row["swissTithiAtSunrise"],
            "sameInstantMoonModelAgreement":tithi_at_swiss_rise==row["swissTithiAtSunrise"],
            "publishedPublisherRuleFullyReproduced":False,
            "ritualDayCertified":False
        }
        boundary_cases.append(result)
        print(f"[3ad-{row['city']}] SwissSunrise={row['sunriseIst']} JplSunrise={rise['ist']} dRise={sunrise_delta:+.3f}s "
              f"SwissTransition={row['nearestBoundaryIst']} JplTransition={root['ist']} dPhase={root_delta:+.3f}s "
              f"SwissTithi={row['swissTithiAtSunrise']} JplAtSwiss={tithi_at_swiss_rise} JplAtOwn={rise['tithi']}",flush=True)
    vedha=[]
    for row in baseline["vedhaCases"]:
        rise=oracle.sunrise(row["date"],row["lat"],row["lng"])
        jpl_rise=parsed_utc(rise["utc"])
        arunodaya=jpl_rise-timedelta(minutes=96)
        swiss_dawn=parsed_utc(row["arunodayaUt"])
        at_swiss_dawn=tithi_index(oracle.phase_deg(swiss_dawn))
        at_jpl_dawn=tithi_index(oracle.phase_deg(arunodaya))
        at_jpl_rise=tithi_index(oracle.phase_deg(jpl_rise))
        is_dashami=lambda t:t in (9,24)
        is_ekadashi=lambda t:t in (10,25)
        invariant=is_dashami(at_swiss_dawn) and is_dashami(at_jpl_dawn) and is_ekadashi(at_jpl_rise)
        vedha.append({"date":row["date"],"city":row["city"],
                      "JplSunriseIST":rise["ist"],"JplArunodayaIST":ist(arunodaya),
                      "atSwissArunodayaTithiIndex":at_swiss_dawn,
                      "atJplArunodayaTithiIndex":at_jpl_dawn,
                      "atJplSunriseTithiIndex":at_jpl_rise,
                      "SwissScreenStillTrueInJpl":invariant,
                      "fastSelected":False,"paranaCertified":False})
        print(f"[3ad-vedha] {row['date']} {row['city']} JPL indices={at_swiss_dawn}/{at_jpl_dawn}/{at_jpl_rise} screen={invariant}",flush=True)
    if len(boundary_cases)!=3 or len(vedha)!=8:
        errors.append("Incomplete source or eight-case verification")
    if any(x["ritualDayCertified"] for x in boundary_cases) or any(x["paranaCertified"] for x in vedha):
        errors.append("False ritual certification")
    report={
        "wave":"3AD","scientificReference":"JPL DE440s planetary/lunar SPK via skyfield==1.55",
        "kernel":{"file":KERNEL_NAME,"source":"https://ssd.jpl.nasa.gov/ftp/eph/planets/bsp/de440s.bsp",
                  "sha256":digest,"bytes":len(data),"sha256Enforced":bool(args.expected_sha256)},
        "methods":{"lunar":"Skyfield almanac.moon_phase: geocentric apparent ecliptic longitudes of date, Moon minus Sun",
                   "rise":"USNO apparent upper limb, 50 arcmin below horizon, zero elevation, differs from Swiss site-specific refraction",
                   "ttUt":"Skyfield built-in leap seconds / delta-T time scale, JPL SPK evaluated at TDB/TT",
                   "lunarTarget":"multiples of 12 degrees, not angular great-circle separation",
                   "astronomyEngineComparisonAvailableSeparately":True,
                   "externalPublisherRuleCalibrated":False},
        "boundaryCases":boundary_cases,
        "vedha":{"tested":len(vedha),"retainedScreens":sum(1 for row in vedha if row["SwissScreenStillTrueInJpl"]),
                 "cases":vedha,"certifiedFasts":0,"certifiedParana":0},
        "releaseDecision":{"productionV5NotChanged":True,"PatnaSourceConflictNotYetCertified":True,
                           "thirdEphemerisGivesModelEvidenceNotRitualValidation":True,
                           "productionSelectionRequiresMethodReview":True},
        "errors":errors
    }
    Path(args.report).parent.mkdir(parents=True,exist_ok=True)
    Path(args.report).write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
    print(f"[3ad] JPL_SHA256={digest} kernel_bytes={len(data)} boundary={len(boundary_cases)} vedha={len(vedha)} stable={report['vedha']['retainedScreens']} errors={len(errors)}",flush=True)
    for error in errors:print("[3ad] FAIL "+error,flush=True)
    if errors: raise SystemExit(1)

if __name__=="__main__":
    main()
