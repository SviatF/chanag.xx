#!/usr/bin/env python3
"""Wave 3AO — global JPL DE440s sidereal transition roots, NOT a public calendar.

JPL apparent Sun/Moon longitudes of date are independent Skyfield positions;
the apparent Lahiri correction is interpolated from six-hour Swiss UT anchors
whose midpoint errors were actually measured against direct Swiss. Explicitly
do not claim fully independent Lahiri or convention-specific ritual validity.
"""
from __future__ import annotations
import argparse, hashlib, json, math
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
import numpy as np
import skyfield
from skyfield.api import load,load_file
from skyfield.framelib import ecliptic_frame

KERNEL_SHA="c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2"
ROOT_SHA="0cab0c6accaf2e2125fe417bf4a4f14a22453a4013a1609dce6dce84ec44142e"
DAY=86400.0
START=datetime(2026,1,1,tzinfo=timezone.utc).timestamp()
END=datetime(2029,1,1,tzinfo=timezone.utc).timestamp()
COARSE_STEP=3*3600.0
BOUNDARIES={"moonPada":360/108,"yoga":360/27,"moonRashi":30.0,"sunRashi":30.0}
UTC=timezone.utc

def iso(t):
    return datetime.fromtimestamp(float(t),UTC).isoformat(timespec="milliseconds").replace("+00:00","Z")

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--kernel",required=True)
    ap.add_argument("--anchors",default="artifacts/wave3ao-lahiri-6h-anchors.json")
    ap.add_argument("--report",default="artifacts/wave3ao-jpl-global-sidereal-transitions.json")
    args=ap.parse_args()
    if skyfield.__version__!="1.55":
        raise RuntimeError("Unpinned Skyfield version")
    kernel=Path(args.kernel)
    if kernel.name!="de440s.bsp" or kernel.stat().st_size!=32_726_016 or hashlib.sha256(kernel.read_bytes()).hexdigest()!=KERNEL_SHA:
        raise RuntimeError("Unverified official JPL DE440s kernel")
    source=Path(args.anchors).read_bytes()
    anchors=json.loads(source)
    if anchors.get("wave")!="3AO" or anchors.get("version")!=1 or \
       anchors.get("rootSourceSha256")!=ROOT_SHA or anchors.get("jplKernelSha256")!=KERNEL_SHA or \
       anchors.get("fullyIndependentAyanamsa") is not False or anchors.get("releaseApproved") is not False or \
       anchors.get("maxMeasuredMidpointInterpolationErrorArcsec",float("inf"))>0.5:
        raise RuntimeError("Unverified or poorly calibrated Swiss Lahiri anchor data")
    samples=np.asarray(anchors["samples"],dtype=np.float64)
    if samples.ndim!=2 or samples.shape[1]!=2 or samples.shape[0]<4300 or \
       np.any(np.diff(samples[:,0])!=6*3600*1000) or \
       samples[0,0]>START*1000 or samples[-1,0]<END*1000:
        raise RuntimeError("Lahiri anchor grid missing complete 2026–2028 with margins")
    anchor_t=samples[:,0]/1000.0
    offsets=samples[:,1]
    if not np.all((offsets>20)&(offsets<29)) or not np.all(np.isfinite(samples)):
        raise RuntimeError("Invalid sidereal frame anchor")
    eph=load_file(str(kernel))
    ts=load.timescale(builtin=True)

    def positions(epoch_seconds):
        epochs=np.asarray(epoch_seconds,dtype=np.float64).reshape(-1)
        solar=np.empty(len(epochs),dtype=np.float64)
        lunar=np.empty(len(epochs),dtype=np.float64)
        for i in range(0,len(epochs),900):
            chunk=epochs[i:i+900]
            times=ts.from_datetimes([datetime.fromtimestamp(float(t),UTC) for t in chunk])
            earth=eph["earth"].at(times)
            solar[i:i+len(chunk)]=(np.asarray(
                earth.observe(eph["sun"]).apparent().frame_latlon(ecliptic_frame)[1].degrees)%360)
            lunar[i:i+len(chunk)]=(np.asarray(
                earth.observe(eph["moon"]).apparent().frame_latlon(ecliptic_frame)[1].degrees)%360)
        if not np.all(np.isfinite(solar)) or not np.all(np.isfinite(lunar)):
            raise RuntimeError("Nonfinite real JPL position")
        offset=np.interp(epochs,anchor_t,offsets)
        return {"moonPada":(lunar-offset)%360,
                "yoga":(lunar+solar-2*offset)%360,
                "moonRashi":(lunar-offset)%360,
                "sunRashi":(solar-offset)%360}

    # 3-hour coarse brackets: the fastest angle (moon) moves well below a
    # 3⅓-degree Pada step per bracket, and each series must advance by one.
    coarse=np.arange(START,END+COARSE_STEP/2,COARSE_STEP,dtype=np.float64)
    coarse[-1]=END
    initial=positions(coarse)
    events={}
    stats={}
    for family,step in BOUNDARIES.items():
        unwrapped=np.rad2deg(np.unwrap(np.deg2rad(initial[family])))
        progress=np.diff(unwrapped)
        if np.min(progress)<=0 or np.max(progress)>=step:
            raise RuntimeError(f"Ambiguous/missing {family} 3h samples min={progress.min()} max={progress.max()}")
        idx=np.floor(unwrapped/step).astype(np.int32)
        cross=np.flatnonzero(idx[1:]!=idx[:-1])
        if not np.all(idx[cross+1]==idx[cross]+1):
            raise RuntimeError("Skipped or retrograde sidereal event "+family)
        lo=coarse[cross].copy()
        hi=coarse[cross+1].copy()
        after=(idx[cross]+1)%round(360/step)
        target=(idx[cross]+1)*step
        target_mod=target%360
        if not len(lo):
            raise RuntimeError("Empty sidereal event catalog "+family)
        # Bisection in UTC; no linear interpolation of lunar positions.
        for _ in range(25):
            mid=(lo+hi)/2
            values=positions(mid)[family]
            signed=(values-target_mod+180)%360-180
            below=signed<0
            lo=np.where(below,mid,lo)
            hi=np.where(below,hi,mid)
        roots=(lo+hi)/2
        before=positions(roots-5)[family]
        after_values=positions(roots+5)[family]
        old_indices=np.floor(before/step).astype(np.int32)%round(360/step)
        new_indices=np.floor(after_values/step).astype(np.int32)%round(360/step)
        expected_after=after.astype(np.int32)
        if not np.all((old_indices+1)%round(360/step)==expected_after) or \
           not np.array_equal(new_indices,expected_after):
            mismatch=np.flatnonzero(((old_indices+1)%round(360/step)!=expected_after)|(new_indices!=expected_after))
            raise RuntimeError(f"JPL {family} ±5s root classification failed at {mismatch[:12].tolist()}")
        rows=[[int(round(float(t)*1000)),int(index)] for t,index in zip(roots,after)]
        if any(a[0]>=b[0] for a,b in zip(rows,rows[1:])):
            raise RuntimeError("Out-of-order sidereal root "+family)
        events[family]=rows
        stats[family]={"count":len(rows),"firstUtc":iso(roots[0]),"lastUtc":iso(roots[-1]),
                       "expectedStepDegrees":step}
        print(f"[Wave3AO] {family} transitions={len(rows)} first={stats[family]['firstUtc']} last={stats[family]['lastUtc']}",flush=True)

    if not 3600<len(events["moonPada"])<5400 or \
       not 900<len(events["yoga"])<1500 or \
       not 400<len(events["moonRashi"])<580 or \
       not 30<len(events["sunRashi"])<45:
        raise RuntimeError("Sidereal full-coverage event count outside physical bounds")
    nak=[[t,i//4] for t,i in events["moonPada"] if i%4==0]
    events["nakshatra"]=nak
    stats["nakshatra"]={"count":len(nak),"derivedExactlyFromPada":True}
    if not 900<len(nak)<1400:
        raise RuntimeError("Nakshatra event count incomplete")
    digest=hashlib.sha256(source).hexdigest()
    result={
        "wave":"3AO","schema":1,"status":"research-only",
        "coverageStartUtc":iso(START),"coverageEndUtc":iso(END),
        "years":[2026,2027,2028],
        "coordinateSource":"JPL DE440s geocentric apparent ecliptic and equinox of date, Skyfield 1.55",
        "solarLunarKernelSha256":KERNEL_SHA,"lunarRootSourceSha256":ROOT_SHA,
        "lahiriSource":"Swiss/Moshier UT tropical-minus-Lahiri-sidereal apparent Sun, 6h anchors",
        "lahiriAnchorSha256":digest,
        "maxMeasuredAnchorMidpointErrorArcsec":anchors["maxMeasuredMidpointInterpolationErrorArcsec"],
        "yearDateTimezone":"UTC transition moments, geographic sunrise applied separately",
        "fullIndependentAyanamsaApproved":False,"ritualSelectionCertified":False,
        "productionSwitchAllowed":False,
        "coarseStepHours":3,"refinementIterations":25,
        "events":events,"eventStats":stats,
        "geographicCoverageClaim":"global geocentric transitions; not yet checked at every India city sunrise",
    }
    path=Path(args.report)
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(result,separators=(",",":"),ensure_ascii=False)+"\n",encoding="utf8")
    print("[Wave3AO] totalRoots="+str(sum(len(v) for v in events.values()))+
          " sourceSHA="+digest+" bytes="+str(path.stat().st_size)+
          " JPL=verified release=false",flush=True)

if __name__=="__main__":
    main()
