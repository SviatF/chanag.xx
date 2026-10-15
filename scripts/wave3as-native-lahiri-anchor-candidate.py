#!/usr/bin/env python3
"""Wave 3AS: parallel C-native Lahiri anchor candidate, never production.

Regenerates exact same 6-hour grid and JPL reference identity as prior Wave3AO
but uses native Swiss Ephemeris C 2.10.03 instead of the pure TypeScript port.
Preserves original reviewed artifacts intact and records every delta.
"""
import hashlib,json,math,statistics
from pathlib import Path
import swisseph as swe

BASE=Path("artifacts/wave3ao-lahiri-6h-anchors.json")
NATIVE=Path("artifacts/wave3as-native-swiss-lahiri-candidate.json")
EVIDENCE=Path("artifacts/wave3as-native-lahiri-grid-differences.json")
ORIGINAL_SHA="f5a346251079734c66187f3b068ca97f12fae0dbb5bf9373e3fcf863ad6c9e54"
DAY=86400000
PERIOD=6*3600000

def signed(a,b):
    return (a-b+540)%360-180

def measured(at):
    jd=2440587.5+at/DAY
    flags=swe.FLG_MOSEPH
    trop=swe.calc_ut(jd,swe.SUN,flags)[0][0]
    side=swe.calc_ut(jd,swe.SUN,flags|swe.FLG_SIDEREAL)[0][0]
    offset=(trop-side)%360
    if not 20<offset<29 or not math.isfinite(offset):
        raise RuntimeError("Nonphysical native Swiss Lahiri correction")
    return offset

def main():
    if str(swe.version)!="2.10.03":raise RuntimeError("Unpinned native C Swiss version")
    source=BASE.read_bytes()
    if hashlib.sha256(source).hexdigest()!=ORIGINAL_SHA:
        raise RuntimeError("Wave3AS original TS Swiss Lahiri anchors changed since reviewed Wave3AP")
    prev=json.loads(source)
    if prev.get("wave")!="3AO" or prev.get("version")!=1 or \
       prev.get("fullyIndependentAyanamsa") is not False or \
       prev.get("releaseApproved") is not False:
        raise RuntimeError("Original Lahiri report not research-only")
    times=[int(r[0]) for r in prev["samples"]]
    if len(times)<4300 or any(b-a!=PERIOD for a,b in zip(times,times[1:])):
        raise RuntimeError("Missing regular UTC grid")
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    candidates=[]
    residuals=[]
    body_offset_mismatches=[]
    for old in prev["samples"]:
        at=int(old[0])
        val=measured(at)
        candidates.append([at,val])
        residuals.append(signed(val,float(old[1]))*3600)
        if (at-times[0])%(DAY*7)==0:
            jd=2440587.5+at/DAY
            mt=swe.calc_ut(jd,swe.MOON,swe.FLG_MOSEPH)[0][0]
            ms=swe.calc_ut(jd,swe.MOON,swe.FLG_MOSEPH|swe.FLG_SIDEREAL)[0][0]
            mismatch=abs(signed((mt-ms)%360,val))*3600
            body_offset_mismatches.append(mismatch)
            if mismatch>1:raise RuntimeError("Native C apparent Lahiri Moon/Sun frame disagreement")
    mid=[]
    for (start,previous),(end,following) in zip(candidates,candidates[1:]):
        at=(start+end)/2
        interp=(previous+following)/2
        mid.append(abs(signed(measured(at),interp))*3600)
    max_mid=max(mid)
    if max_mid>0.5:
        raise RuntimeError("C-native Lahiri 6h midpoint precision inadequate "+str(max_mid))
    native={
       "wave":"3AO","version":1,
       "source":"native Swiss Ephemeris C 2.10.03 Lahiri UT apparent tropical-minus-sidereal Sun; research candidate",
       "rootSourceSha256":prev["rootSourceSha256"],
       "jplKernelSha256":prev["jplKernelSha256"],
       "periodHours":6,
       "coverageStartUtc":prev["coverageStartUtc"],
       "coverageEndUtc":prev["coverageEndUtc"],
       "maxMeasuredMidpointInterpolationErrorArcsec":max_mid,
       "maxMeasuredSunMoonOffsetMismatchArcsec":max(body_offset_mismatches),
       "fullyIndependentAyanamsa":False,
       "releaseApproved":False,
       "samples":candidates
    }
    NATIVE.parent.mkdir(parents=True,exist_ok=True)
    NATIVE.write_text(json.dumps(native,separators=(",",":"))+"\n")
    out={
      "wave":"3AS","rootSourceSha256":prev["rootSourceSha256"],
      "jplKernelSha256":prev["jplKernelSha256"],
      "originalJsAnchorSha256":ORIGINAL_SHA,
      "parallelNativeAnchorSha256":hashlib.sha256(NATIVE.read_bytes()).hexdigest(),
      "sampleCount":len(times),"sixHourGridIdentityPreserved":True,
      "jsMinusNativeLahiriArcsec":{
         "mean":round(-statistics.mean(residuals),6),
         "maxAbs":round(max(abs(v) for v in residuals),6),
         "medianAbs":round(statistics.median(abs(v) for v in residuals),6),
      },
      "nativeMidpointMaxArcsec":max_mid,
      "nativeSunMoonFrameMismatchMaxArcsec":max(body_offset_mismatches),
      "independentAyanamsaApproved":False,
      "candidateProductionApproved":False,
      "originalV6Wave3AOSourceUnchanged":True
    }
    EVIDENCE.write_text(json.dumps(out,indent=2)+"\n")
    print("[Wave3AS native Lahiri] "+json.dumps({
        "anchors":len(times),"maxJsVsNativeArcsec":out["jsMinusNativeLahiriArcsec"]["maxAbs"],
        "nativeMidpointArcsec":round(max_mid,6),"release":False
    }),flush=True)

if __name__=="__main__":main()
