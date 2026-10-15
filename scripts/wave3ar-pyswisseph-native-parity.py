#!/usr/bin/env python3
"""Wave3AR: independently check JS Swiss/Moshier root times with native C Swiss.

Pinned pyswisseph 2.10.3.2 (Swiss Ephemeris C v2.10.03) is not the
@typescriptify/sweph JavaScript binding. This detects implementation drift
independently of JPL and does NOT certify either model as universally correct.
"""
import json,math,datetime
from pathlib import Path
import swisseph as swe

DAY=86_400_000
ROOTS_PATH=Path("artifacts/wave3ar-swiss-jpl-transition-clock-reconciliation.json")
GLOBAL_PATH=Path("artifacts/wave3ao-jpl-global-sidereal-transitions.json")
OUT=Path("artifacts/wave3ar-pyswisseph-binding-parity.json")

def instant(s):
    return datetime.datetime.fromisoformat(s.replace("Z","+00:00")).timestamp()*1000

def iso(ms):
    return datetime.datetime.fromtimestamp(ms/1000,datetime.timezone.utc).isoformat(timespec="milliseconds").replace("+00:00","Z")

def signed(angle,target):
    return (angle-target+540)%360-180

def longitude(at_ms,family):
    jd=2440587.5+at_ms/DAY
    trop=swe.FLG_MOSEPH|swe.FLG_SPEED
    sid=trop|swe.FLG_SIDEREAL
    if family=="sunRashi":
        return swe.calc_ut(jd,swe.SUN,sid)[0][0]%360
    if family in ("moonPada","nakshatra","moonRashi"):
        return swe.calc_ut(jd,swe.MOON,sid)[0][0]%360
    if family=="yoga":
        return (swe.calc_ut(jd,swe.SUN,sid)[0][0]+
            swe.calc_ut(jd,swe.MOON,sid)[0][0])%360
    if family=="halfTithi":
        return (swe.calc_ut(jd,swe.MOON,trop)[0][0]-
                swe.calc_ut(jd,swe.SUN,trop)[0][0])%360
    raise ValueError("Unknown physical family "+family)

MODULUS={"halfTithi":60,"moonPada":108,"nakshatra":27,
         "yoga":27,"moonRashi":12,"sunRashi":12}
def physical_root(family,at_ms,index):
    target=index*360/MODULUS[family]
    lo,hi=at_ms-30*60000,at_ms+30*60000
    a=signed(longitude(lo,family),target)
    b=signed(longitude(hi,family),target)
    if not a<0<=b:
        raise RuntimeError("Native Swiss physical root not bracketed "+
          str((family,iso(at_ms),index,a,b)))
    for _ in range(24):
        mid=(lo+hi)/2
        if signed(longitude(mid,family),target)<0:lo=mid
        else:hi=mid
    return (lo+hi)/2

def main():
    if str(swe.version)!="2.10.03":
        raise RuntimeError("Unpinned native Swiss C version "+str(swe.version))
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    research=json.loads(ROOTS_PATH.read_text())
    catalog=json.loads(GLOBAL_PATH.read_text())
    if research["wave"]!="3AR" or research["scientificJudgment"]["fullProductionV6Released"]:
        raise RuntimeError("Incorrect research-only source contract")
    if catalog["solarLunarKernelSha256"]!=research["JplSource"]["kernelSha256"] or \
      research["JplSource"]["siderealCatalogSha256"] not in (
      "b898fefb8b23fd689c6c841828a6a2ff915df2e8c5cdd13cf3dfd9312b83a554",):
        raise RuntimeError("SHA-locked JPL catalog provenance changed")
    rows=[]
    native_sun=[]
    for t,index in catalog["events"]["sunRashi"]:
        native=physical_root("sunRashi",t,index)
        native_sun.append({"jplUtc":iso(t),"nativeSwissUtc":iso(native),
            "nativeMinusJplSeconds":round((native-t)/1000,3),"segment":index})
    for family,details in research["family"].items():
        for row in details["worst"]:
            t=instant(row["atUtc"])
            native=physical_root(family,t,row["targetIndex"])
            js=instant(row["swissUtc"])
            drift=(js-native)/1000
            rows.append({"family":family,"atUtc":row["atUtc"],
              "jplTargetIndex":row["targetIndex"],
              "nativeSwissUtc":iso(native),"jsSwissUtc":row["swissUtc"],
              "nativeMinusJplSeconds":round((native-t)/1000,3),
              "jsMinusNativeSwissSeconds":round(drift,3),
              "sameSourceBindingsAgreeWithinTwoSeconds":abs(drift)<=2})
    biggest=max(abs(row["jsMinusNativeSwissSeconds"]) for row in rows)
    per_family={}
    for family in MODULUS:
        group=[r for r in rows if r["family"]==family]
        per_family[family]={
          "reviewedMostSensitiveRoots":len(group),
          "maxJsVsNativeSwissSeconds":max(abs(r["jsMinusNativeSwissSeconds"]) for r in group),
          "bindingParityWithin2Seconds":all(r["sameSourceBindingsAgreeWithinTwoSeconds"] for r in group)
        }
    report={
      "wave":"3AR","source":"Python native Swiss Ephemeris C 2.10.03 via pyswisseph 2.10.3.2",
      "comparison":"@typescriptify/sweph V5-style sweCalcUt(MOSEPH,Lahiri) vs native Swiss C same UT/flags",
      "jplKernelSha256":research["JplSource"]["kernelSha256"],
      "nativeSwissVersion":str(swe.version),
      "completeSunRashiGlobalRootsChecked":len(native_sun),
      "maxJsVsNativeSwissSeconds":round(biggest,3),
      "bindingParityIndependentlyApproved":biggest<=2,
      "observations":rows,
      "globalNativeSolarRoots":native_sun,
      "byFamily":per_family,
      "ritualDatesApproved":False,"publicV6ReleaseAllowed":False,
      "knownLimitations":["Binding difference does not by itself establish which source is astronomically accurate",
                          "One Lahiri name may still conceal reference-frame conventions",
                          "Native crosscheck covers all solar roots and 12 highest-delay roots per lunar family"]
    }
    if len(native_sun)!=36 or any(len([x for x in rows if x["family"]==f])<10 for f in MODULUS):
        raise RuntimeError("Incomplete native independent source comparison")
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(report,indent=2)+"\n")
    print("[Wave3AR native Swiss] solarRoots="+str(len(native_sun))+
        " maxJsVsNativeSeconds="+str(round(biggest,3))+
        " independentParityApproved="+str(report["bindingParityIndependentlyApproved"]).lower()+
        " publicV6=false",flush=True)

if __name__=="__main__":main()
