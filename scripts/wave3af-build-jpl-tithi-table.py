#!/usr/bin/env python3
"""Wave 3AF: reproducible, compact, GLOBAL JPL DE440s Tithi transition table.

Every change of geocentric apparent ecliptic Moon−Sun elongation by 6° is
global, not city-specific. Store UTC epoch milliseconds and the Tithi index
*after* each transition. All geocentric events are from JPL DE440s using
Skyfield moon_phase (true ecliptic and equinox of date, apparent position).

This is a V6 CANARY DATA SOURCE, not an authorized ritual calendar. No JPL
binary in repo/Worker; artifact is built from SHA-pinned JPL in CI only.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
from collections import Counter
from datetime import datetime,timedelta,timezone
from pathlib import Path

import numpy as np
import skyfield
from skyfield.api import load,load_file
from skyfield import almanac

EXPECTED_SKYFIELD="1.55"
EXPECTED_KERNEL_SHA="c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2"
START=datetime(2024,12,15,tzinfo=timezone.utc)
END=datetime(2031,1,15,tzinfo=timezone.utc)

def phases(ephemeris,timescale,epochs):
    datetimes=[datetime.fromtimestamp(float(s),tz=timezone.utc) for s in epochs]
    t=timescale.from_datetimes(datetimes)
    result=np.asarray(almanac.moon_phase(ephemeris,t).degrees,dtype=np.float64)%360.0
    if len(result)!=len(epochs) or not np.all(np.isfinite(result)):
        raise RuntimeError("Nonfinite or incomplete Skyfield lunar phase samples")
    return result

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--kernel",required=True)
    ap.add_argument("--output",default="artifacts/wave3af-jpl-global-tithi-transitions.json")
    args=ap.parse_args()
    if skyfield.__version__!=EXPECTED_SKYFIELD:
        raise RuntimeError("Skyfield 1.55 required")
    kernel=Path(args.kernel)
    if kernel.name!="de440s.bsp" or kernel.stat().st_size!=32_726_016:
        raise RuntimeError("Expected authentic full JPL DE440s binary")
    digest=hashlib.sha256(kernel.read_bytes()).hexdigest()
    if digest!=EXPECTED_KERNEL_SHA:
        raise RuntimeError("Unpinned or replaced JPL DE440s kernel")
    eph=load_file(str(kernel))
    ts=load.timescale(builtin=True)
    low_epoch=START.timestamp()
    high_epoch=END.timestamp()
    step=8*3600
    samples=np.arange(low_epoch,high_epoch+step,step,dtype=np.float64)
    phase=phases(eph,ts,samples)
    delta=(phase[1:]-phase[:-1])%360.0
    if np.min(delta)<=0 or np.max(delta)>=8:
        raise RuntimeError("Sampling interval too sparse for a unique lunar phase crossing")
    idx=np.floor(phase/6).astype(np.int16)
    crossing=np.flatnonzero(idx[1:]!=idx[:-1])
    if len(crossing)<4200 or len(crossing)>5000:
        raise RuntimeError("Unexpected lunar boundary count over 2025–2030")
    if not np.all(idx[crossing+1]==(idx[crossing]+1)%60):
        raise RuntimeError("Skipped or non-monotonic lunar transition")
    lo=samples[crossing].copy()
    hi=samples[crossing+1].copy()
    target=6.0*idx[crossing+1].astype(np.float64)
    # One vectorized JPL phase computation for thousands of brackets per round.
    # 27 rounds over 8h gives much better than 1ms timestamp resolution.
    for _ in range(27):
        mid=(lo+hi)/2
        mid_phase=phases(eph,ts,mid)
        signed=(mid_phase-target+540.0)%360.0-180.0
        keep_left=signed<0
        lo=np.where(keep_left,mid,lo)
        hi=np.where(keep_left,hi,mid)
    result_ms=np.rint((lo+hi)/2*1000.0).astype(np.int64)
    if not np.all(np.diff(result_ms)>8*3600*1000):
        raise RuntimeError("Lunar boundaries overlap or are too close")
    if not np.all(np.diff(result_ms)<18*3600*1000):
        raise RuntimeError("Lunar boundaries missing a day")
    # Prove each transition bracket is the actual phase root, not simple
    # astronomical tick interpolation or a shifted ET/UT convention.
    before=phases(eph,ts,(result_ms-4000)/1000.0)
    after=phases(eph,ts,(result_ms+4000)/1000.0)
    if np.any(np.floor(before/6).astype(np.int16)!=idx[crossing]) or \
       np.any(np.floor(after/6).astype(np.int16)!=idx[crossing+1]):
        raise RuntimeError("±4-second JPL phase root classification check failed")
    transitions=[[int(ms),int(tithi)] for ms,tithi in zip(result_ms,idx[crossing+1])]
    expected={
      "patna-2027-01-31":(datetime(2027,1,31,1,4,15,tzinfo=timezone.utc).timestamp()*1000,48),
      "kanpur-2026-11-21":(datetime(2026,11,21,1,2,1,tzinfo=timezone.utc).timestamp()*1000,22),
    }
    for label,(near,expected_index) in expected.items():
        matches=[(t,i) for t,i in transitions if abs(t-near)<120000]
        if len(matches)!=1 or matches[0][1]!=expected_index or abs(matches[0][0]-near)>1500:
            raise RuntimeError(f"Known high-resolution JPL 3AD anchor disagrees: {label}: {matches}")
    by_year=Counter(datetime.fromtimestamp(t/1000,tz=timezone.utc).strftime("%Y") for t,_ in transitions)
    payload={
      "wave":"3AF","ephemeris":"JPL DE440s",
      "kernelSha256":digest,"skyfieldVersion":EXPECTED_SKYFIELD,
      "longitudeConvention":"geocentric apparent ecliptic of date Moon minus Sun; 6deg half-Tithi/Karana steps",
      "timeScale":"UTC epoch milliseconds via Skyfield built-in timescale",
      "coverageStartUtc":START.isoformat().replace("+00:00","Z"),
      "coverageEndUtc":END.isoformat().replace("+00:00","Z"),
      "halfTithiBoundaryCount":len(transitions),"yearCounts":dict(sorted(by_year.items())),
      "halfTithiTransitions":transitions,
      "ritualSelectionCertified":False,
      "canaryOnly":True
    }
    out=Path(args.output)
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(payload,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf8")
    print("[3af-jpl-table] roots="+str(len(transitions))+
          " years="+str(dict(sorted(by_year.items())))+
          " bytes="+str(out.stat().st_size)+
          " sha256="+hashlib.sha256(out.read_bytes()).hexdigest(),flush=True)
    for label,(near,i) in expected.items():
        hit=min(transitions,key=lambda entry:abs(entry[0]-near))
        print(f"[3af-jpl-anchor] {label} UTC={datetime.fromtimestamp(hit[0]/1000,timezone.utc).isoformat()} afterIndex={hit[1]}",flush=True)

if __name__=="__main__":
    main()
