#!/usr/bin/env python3
"""Wave 3AS: explicit same-instant source/coordinate decomposition.

Separates (1) ephemeris tropical longitude errors (2) effective Lahiri
tropical-minus-sidereal transform and (3) Delta-T/UT-ET convention.
Do NOT automatically rewrite production V5/V6 from these observations.
"""
import json,math,statistics,datetime
from pathlib import Path
import swisseph as swe

JPL_SHA="b898fefb8b23fd689c6c841828a6a2ff915df2e8c5cdd13cf3dfd9312b83a554"
PATH=Path("artifacts/wave3as-js-swiss-coordinate-baseline.json")
OUT=Path("artifacts/wave3as-native-swiss-coordinate-decomposition.json")
JD0=2440587.5
def signed(a,b):
    return ((a-b+540)%360)-180
def validate_float(x):
    return isinstance(x,(int,float)) and math.isfinite(x)
def stats(values):
    return {"n":len(values),"mean":round(statistics.mean(values),6),
      "meanAbs":round(statistics.mean(abs(x) for x in values),6),
      "maxAbs":round(max(abs(x) for x in values),6),
      "medianAbs":round(statistics.median(abs(x) for x in values),6)}

def main():
    if str(swe.version)!="2.10.03":
        raise RuntimeError("Native C Swiss 2.10.03 is not pinned")
    data=json.loads(PATH.read_text())
    if data.get("wave")!="3AS" or data.get("sourceCatalogSha256")!=JPL_SHA or \
      data.get("productionChangeAllowed") is not False or \
      data.get("all36SolarRashiRootsCovered") is not True:
        raise RuntimeError("Wrong research-only canonical JPL catalog")
    points=data.get("samples",[])
    if len(points)<90 or len(points)!=data.get("sampleCount"):
        raise RuntimeError("Incomplete same-instant independent source sample")
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    flags=swe.FLG_MOSEPH|swe.FLG_SPEED
    seen=set()
    rows=[]
    solar_root_samples=0
    deltat_differences=[]
    for point in points:
        at=point["atUtc"]
        if at in seen or not at.endswith("Z"):raise RuntimeError("Duplicate/missing UTC sample")
        seen.add(at)
        ms=datetime.datetime.fromisoformat(at.replace("Z","+00:00")).timestamp()*1000
        jd=JD0+ms/86_400_000
        native_dt_days=swe.deltat_ex(jd,swe.FLG_MOSEPH)
        js_dt=point.get("jsDeltaTSeconds")
        if not validate_float(js_dt):raise RuntimeError("Missing JS DeltaT at shared UT")
        deltat_differences.append(js_dt-native_dt_days*86400)
        if not 50<native_dt_days*86400<100:raise RuntimeError("Unexpected astronomical Delta-T")
        native={}
        for name,body in (("sun",swe.SUN),("moon",swe.MOON)):
            tropical=swe.calc_ut(jd,body,flags)[0]
            sidereal=swe.calc_ut(jd,body,flags|swe.FLG_SIDEREAL)[0]
            et=swe.calc(jd+native_dt_days,body,flags)[0]
            if abs(signed(et[0],tropical[0]))*3600>0.01:
                raise RuntimeError("Independent Swiss native UT-vs-ET semantic inconsistency")
            src=point[name]
            offset=(tropical[0]-sidereal[0])%360
            result={
              "nativeTropicalDeg":tropical[0]%360,
              "nativeSiderealDeg":sidereal[0]%360,
              "nativeEffectiveLahiriDeg":offset,
              "jsMinusNativeTropicalArcsec":signed(src["tropicalDeg"],tropical[0])*3600,
              "jsMinusNativeSiderealArcsec":signed(src["siderealDeg"],sidereal[0])*3600,
              "jsMinusNativeEffectiveLahiriArcsec":signed(src["effectiveLahiriDeg"],offset)*3600,
              "jsMinusNativeTropicalSpeedArcsecDay":(src["tropicalSpeedDegPerDay"]-tropical[3])*3600,
              "jsMinusNativeSiderealSpeedArcsecDay":(src["siderealSpeedDegPerDay"]-sidereal[3])*3600,
            }
            for k,v in result.items():
                if not validate_float(v):raise RuntimeError("Nonfinite differential "+k)
            if abs(result["jsMinusNativeTropicalArcsec"]-
                   result["jsMinusNativeEffectiveLahiriArcsec"]-
                   result["jsMinusNativeSiderealArcsec"])>0.01:
                raise RuntimeError("Tropical/Lahiri/sidereal source decomposition does not close")
            native[name]=result
        if any("Solar Rashi JPL root" in r for r in point["roles"]):solar_root_samples+=1
        rows.append({"atUtc":at,"roles":point["roles"],
          "nativeDeltaTSeconds":native_dt_days*86400,
          "jsDeltaTSeconds":js_dt,
          "jsMinusNativeDeltaTSeconds":js_dt-native_dt_days*86400,
          "sun":native["sun"],"moon":native["moon"]})
    if solar_root_samples!=36 or len(rows)!=len(points):
        raise RuntimeError("Did not compare all 36 actual Solar Rashi JPL events")
    aggregates={}
    for body in ("sun","moon"):
        aggregates[body]={}
        for measurement in (
          "jsMinusNativeTropicalArcsec","jsMinusNativeSiderealArcsec",
          "jsMinusNativeEffectiveLahiriArcsec",
          "jsMinusNativeTropicalSpeedArcsecDay","jsMinusNativeSiderealSpeedArcsecDay"
        ):
            aggregates[body][measurement]=stats([x[body][measurement] for x in rows])
    # classify possible causes only, do not assert a proven cause from a
    # 96-instant sample. A 1-arcsecond discrepancy is already meaningful
    # at a Nakshatra or Sankranti transition.
    sun=aggregates["sun"]
    frame=sun["jsMinusNativeEffectiveLahiriArcsec"]["maxAbs"]
    trop=sun["jsMinusNativeTropicalArcsec"]["maxAbs"]
    sid=sun["jsMinusNativeSiderealArcsec"]["maxAbs"]
    result={
      "wave":"3AS","method":"native Swiss Ephemeris C 2.10.03 calc_ut same UT versus pure TS Swiss sweCalcUt; identical MOSEPH, SPEED, SE_SIDM_LAHIRI flags",
      "actualSharedUtcInstants":len(rows),"all36SolarRashiRootsChecked":solar_root_samples,
      "sourceCatalogSha256":JPL_SHA,
      "nativeDeltaTSecondsRange":[round(min(r["nativeDeltaTSeconds"] for r in rows),6),
                                  round(max(r["nativeDeltaTSeconds"] for r in rows),6)],
      "nativeEtVsUtConsistent":True,
      "jsMinusNativeDeltaTSeconds":stats(deltat_differences),
      "sourceComponentResidualArcsec":aggregates,
      "diagnostic":{
        "SunTropicalDriftOver1Arcsec":trop>1,
        "LahiriEffectiveFrameDriftOver1Arcsec":frame>1,
        "SunSiderealDriftOver1Arcsec":sid>1,
        "sourceBindingParityProven":False,
        "jplSolarRootCanBePromoted":False,
        "correctCauseNeedsSourceCodeOrIndependentFrameReview":True
      },
      "astronomicalReferenceFullyCertified":False,
      "ritualOrFestivalDatesApproved":False,
      "publicV6ActivationAllowed":False,
      "points":rows
    }
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(result,indent=2)+"\n")
    print("[Wave3AS coordinate source] "+json.dumps({
      "UTCs":len(rows),"SolarJplRoots":solar_root_samples,
      "sunTropicalMaxArcsec":round(trop,4),
      "sunLahiriMaxArcsec":round(frame,4),
      "sunSiderealMaxArcsec":round(sid,4),
      "moonTropicalMaxArcsec":aggregates["moon"]["jsMinusNativeTropicalArcsec"]["maxAbs"],
      "moonLahiriMaxArcsec":aggregates["moon"]["jsMinusNativeEffectiveLahiriArcsec"]["maxAbs"],
      "nativeEtUtValidated":True,
      "DeltaTmaxDifferenceSeconds":round(max(abs(x) for x in deltat_differences),6),
      "productionChange":False
    }),flush=True)

if __name__=="__main__":
    main()
