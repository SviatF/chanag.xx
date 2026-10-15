#!/usr/bin/env python3
"""Wave 3AN: real JPL DE440s Sun/Moon apparent ecliptic-of-date sidereal candidates.

Input: UT-matched Swiss Lahiri APPARENT effective correction from Wave 3AN TS.
JPL astronomical positions come only from SHA-pinned DE440s, never Swiss.
Produces unapproved research data, not a deployable runtime table.
"""
from __future__ import annotations
import argparse, hashlib, json, math
from datetime import datetime,timezone
from pathlib import Path

import numpy as np
import skyfield
from skyfield.api import load, load_file
from skyfield.framelib import ecliptic_frame
from skyfield import almanac

KERNEL_SHA="c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2"
ROOTS_SHA="0cab0c6accaf2e2125fe417bf4a4f14a22453a4013a1609dce6dce84ec44142e"
FRAME="geocentric apparent ecliptic and equinox of date"
OFFSET="Swiss/Moshier Lahiri UT, tropical-minus-sidereal solar longitude"

def shortest(a,b):
    return (a-b+180.0)%360.0-180.0

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--kernel",required=True)
    ap.add_argument("--baseline",default="artifacts/wave3an-swiss-apparent-lahiri-baseline.json")
    ap.add_argument("--report",default="artifacts/wave3an-jpl-sidereal-candidates.json")
    a=ap.parse_args()
    if skyfield.__version__!="1.55":
        raise RuntimeError("Expected pinned skyfield==1.55")
    kernel=Path(a.kernel)
    if kernel.name!="de440s.bsp" or kernel.stat().st_size!=32_726_016 or hashlib.sha256(kernel.read_bytes()).hexdigest()!=KERNEL_SHA:
        raise RuntimeError("Unverified JPL DE440s 32 MB SPK")
    baseline=json.loads(Path(a.baseline).read_text("utf8"))
    if baseline.get("wave")!="3AN" or baseline.get("jplRootsSha256")!=ROOTS_SHA or baseline.get("productionSwitchAllowed") is not False:
        raise RuntimeError("Incorrect Swiss/JPL source contract")
    rows=baseline.get("samples",[])
    if len(rows)<12 or len(rows)>20:
        raise RuntimeError("Incomplete geocentric reference sample")
    times=[]
    for sample in rows:
        s=sample["atUtc"]
        if not s.endswith("Z"):raise RuntimeError("UTC required")
        times.append(datetime.fromisoformat(s.replace("Z","+00:00")).astimezone(timezone.utc))
    ephemeris=load_file(str(kernel))
    ts=load.timescale(builtin=True)
    t=ts.from_datetimes(times)
    earth=ephemeris["earth"].at(t)
    sun=earth.observe(ephemeris["sun"]).apparent()
    moon=earth.observe(ephemeris["moon"]).apparent()
    sun_tropical=np.asarray(sun.frame_latlon(ecliptic_frame)[1].degrees)%360.0
    moon_tropical=np.asarray(moon.frame_latlon(ecliptic_frame)[1].degrees)%360.0
    phase=np.asarray(almanac.moon_phase(ephemeris,t).degrees)%360.0
    residual=((moon_tropical-sun_tropical-phase+180.0)%360.0)-180.0
    if np.max(np.abs(residual))>1e-9:
        raise RuntimeError("JPL lunar phase model and JPL coordinate frame differ")
    out=[]
    for i,row in enumerate(rows):
        effective=float(row["lahiriEffectiveDeg"])
        correction_difference=float(row["effectiveSunMoonOffsetDisagreementArcsec"])
        swiss=row["swiss"]
        if not 20<effective<29 or correction_difference>300 or correction_difference<0:
            raise RuntimeError("Unverified Lahiri apparent offset")
        jpl_sun=float(sun_tropical[i])
        jpl_moon=float(moon_tropical[i])
        jpl_sun_sid=(jpl_sun-effective)%360.0
        jpl_moon_sid=(jpl_moon-effective)%360.0
        sun_delta=shortest(jpl_sun,float(swiss["tropicalSunDeg"]))
        moon_delta=shortest(jpl_moon,float(swiss["tropicalMoonDeg"]))
        if not all(math.isfinite(x) for x in [jpl_sun,jpl_moon,jpl_sun_sid,jpl_moon_sid,sun_delta,moon_delta]):
            raise RuntimeError("Nonfinite geocentric JPL coordinate")
        if abs(sun_delta)>1 or abs(moon_delta)>1:
            raise RuntimeError("JPL and Swiss astronomical positions disagree by >1 degree")
        observation={
            "atUtc":row["atUtc"],
            "sunTropicalDeg":jpl_sun,"moonTropicalDeg":jpl_moon,
            "lahiriEffectiveDeg":effective,
            "effectiveSunMoonOffsetDisagreementArcsec":correction_difference,
            "kernelSha256":KERNEL_SHA,"skyfieldVersion":"1.55",
            "coordinateFrame":FRAME,"lunarRootAssetSha256":ROOTS_SHA,
            "siderealOffsetSource":OFFSET
        }
        out.append({"tags":row["tags"],"observation":observation,
            "independentJplPhaseDegrees":float(phase[i]),
            "modelResidual":{"jplMinusSwissTropicalSunDegrees":sun_delta,
                "jplMinusSwissTropicalMoonDegrees":moon_delta,
                "swissVsJplSiderealSunArcsec":sun_delta*3600,
                "swissVsJplSiderealMoonArcsec":
                    shortest(jpl_moon_sid,float(swiss["siderealMoonDeg"]))*3600},
            "approved":False})
    result={
        "wave":"3AN","source":"JPL DE440s Skyfield 1.55 geocentric apparent Sun/Moon longitude of date",
        "kernelSha256":KERNEL_SHA,"jplRootsSha256":ROOTS_SHA,
        "siderealOffsetSource":OFFSET,
        "independentJplSiderealAyanamsaVerified":False,
        "ritualOrFestivalDatesCertified":False,
        "productionSwitchAllowed":False,
        "sampledInstants":len(out),
        "samples":out
    }
    path=Path(a.report)
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n","utf8")
    print("[Wave3AN JPL] instants="+str(len(out))+
          " maxSunResidualArcsec="+str(round(max(abs(x["modelResidual"]["swissVsJplSiderealSunArcsec"]) for x in out),3))+
          " maxMoonResidualArcsec="+str(round(max(abs(x["modelResidual"]["swissVsJplSiderealMoonArcsec"]) for x in out),3))+
          " certified=false production=false",flush=True)

if __name__=="__main__":
    main()
