#!/usr/bin/env python3
"""Wave3AS: quantify exact JPL root effect of native-Swiss Lahiri correction.

No public V6 migration. This is a source-policy counterfactual:
same JPL kernel, same Skyfield, same root algorithm, one changed
native-C versus pure-TS Swiss sidereal reference-frame anchor source.
"""
import hashlib,json,datetime,statistics
from pathlib import Path

ORIGINAL=Path("artifacts/wave3ao-jpl-global-sidereal-transitions.json")
ALTERNATE=Path("artifacts/wave3as-jpl-native-lahiri-root-candidate.json")
NATIVE_ANCHOR=Path("artifacts/wave3as-native-swiss-lahiri-candidate.json")
NATIVE_SWISS=Path("artifacts/wave3ar-pyswisseph-binding-parity.json")
OUT=Path("artifacts/wave3as-native-lahiri-jpl-root-counterfactual.json")
REVIEWED_SHA="b898fefb8b23fd689c6c841828a6a2ff915df2e8c5cdd13cf3dfd9312b83a554"
FAMILIES=["moonPada","nakshatra","yoga","moonRashi","sunRashi"]
def secs(a,b):return (a-b)/1000
def parsed(s):return datetime.datetime.fromisoformat(s.replace("Z","+00:00")).timestamp()*1000
def metrics(vals):
    return {"n":len(vals),"meanAbsSeconds":round(statistics.mean(abs(v) for v in vals),3),
            "maxAbsSeconds":round(max(abs(v) for v in vals),3),
            "meanSignedSeconds":round(statistics.mean(vals),3)}
def main():
    old_bytes=ORIGINAL.read_bytes()
    if hashlib.sha256(old_bytes).hexdigest()!=REVIEWED_SHA:
        raise RuntimeError("Review source Wave3AO SHA changed unexpectedly")
    old=json.loads(old_bytes)
    candidate=json.loads(ALTERNATE.read_bytes())
    anchor=json.loads(NATIVE_ANCHOR.read_bytes())
    native=json.loads(NATIVE_SWISS.read_bytes())
    native_ah=hashlib.sha256(NATIVE_ANCHOR.read_bytes()).hexdigest()
    if old.get("wave")!="3AO" or candidate.get("wave")!="3AO" or \
      candidate.get("solarLunarKernelSha256")!=old.get("solarLunarKernelSha256") or \
      candidate.get("lunarRootSourceSha256")!=old.get("lunarRootSourceSha256") or \
      candidate.get("lahiriAnchorSha256")!=native_ah or \
      anchor.get("fullyIndependentAyanamsa") is not False or \
      candidate.get("productionSwitchAllowed") is not False or \
      native.get("bindingParityIndependentlyApproved") is not False or \
      native.get("completeSunRashiGlobalRootsChecked")!=36:
        raise RuntimeError("Wave3AS original/alternate/native C source identities unsafe or mixed")
    data={}
    total=0
    shifted={}
    for family in FAMILIES:
        a=old["events"][family]
        b=candidate["events"][family]
        if len(a)!=len(b):raise RuntimeError("Missing/extra native-frame JPL root in "+family)
        deltas=[]
        for i,(orig,new) in enumerate(zip(a,b)):
            if orig[1]!=new[1]:
                raise RuntimeError("Physical JPL sidereal index sequence changed "+family+" "+str(i))
            lag=secs(new[0],orig[0])
            if abs(lag)>1800:raise RuntimeError("Alternate native Lahiri root shift exceeds a safe 30min bracket")
            deltas.append(lag)
        total+=len(a)
        shifted[family]=sum(1 for x in deltas if abs(x)>=0.1)
        data[family]={"count":len(a),
            "rootShiftNativeAnchorMinusOriginalJsAnchor":metrics(deltas),
            "shiftedSubsecondOrMore":shifted[family]}
    if total!=7096 or len(old["events"]["sunRashi"])!=36:
        raise RuntimeError("Lost global 7096-event JPL source parity")
    errors_old=[]
    errors_new=[]
    improved=0
    worse=0
    solar=[]
    for i,row in enumerate(native["globalNativeSolarRoots"]):
        old_event=old["events"]["sunRashi"][i]
        new_event=candidate["events"]["sunRashi"][i]
        if old_event[1]!=new_event[1] or row["segment"]!=old_event[1] or \
          abs(parsed(row["jplUtc"])-old_event[0])>1:
            raise RuntimeError("Wrong native C solar root and JPL event alignment "+str(i))
        ref=parsed(row["nativeSwissUtc"])
        old_residual=secs(old_event[0],ref)
        new_residual=secs(new_event[0],ref)
        errors_old.append(old_residual)
        errors_new.append(new_residual)
        if abs(new_residual)<abs(old_residual):improved+=1
        elif abs(new_residual)>abs(old_residual):worse+=1
        solar.append({"index":old_event[1],"oldJplUTC":row["jplUtc"],
            "nativeSwissCUTC":row["nativeSwissUtc"],
            "newJplNativeLahiriUTC":datetime.datetime.fromtimestamp(new_event[0]/1000,
                datetime.timezone.utc).isoformat(timespec="milliseconds").replace("+00:00","Z"),
            "beforeJplMinusNativeSwissCSeconds":round(old_residual,3),
            "afterJplMinusNativeSwissCSeconds":round(new_residual,3),
            "candidateImprovesNativeSwissCClockAgreement":abs(new_residual)<abs(old_residual)})
    candidate["lahiriSource"]="native Swiss Ephemeris C 2.10.03 UT tropical-minus-sidereal Lahiri apparent Sun"
    candidate["wave3asAlternateResearchOnly"]=True
    ALTERNATE.write_text(json.dumps(candidate,separators=(",",":"))+"\n")
    report={
        "wave":"3AS","status":"research-only","originalCatalogSha256":REVIEWED_SHA,
        "nativeLahiriAnchorSha256":native_ah,
        "nativeLahiriCatalogSha256":hashlib.sha256(ALTERNATE.read_bytes()).hexdigest(),
        "jplKernelSha256":old["solarLunarKernelSha256"],
        "originalSourceUnmodified":True,
        "checkedMatchingJplEventRoots":total,
        "byFamily":data,
        "SolarRashiNativeSwissCClocks":{
            "count":36,
            "originalJplVsNativeSwissC":metrics(errors_old),
            "nativeLahiriJplVsNativeSwissC":metrics(errors_new),
            "closerToNativeC":improved,"furtherFromNativeC":worse,
            "rootComparison":solar
        },
        "fullyIndependentAyanamsaCertified":False,
        "ritualCalendarReleaseAllowed":False,
        "sourcePolicyMustBeApprovedBeforeUsingCandidate":True
    }
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(report,indent=2)+"\n")
    print("[Wave3AS alternate JPL] "+json.dumps({
        "rootsCompared":total,"sourceHash":native_ah,
        "solarRashiBeforeMeanAbsSeconds":report["SolarRashiNativeSwissCClocks"]["originalJplVsNativeSwissC"]["meanAbsSeconds"],
        "solarRashiAfterMeanAbsSeconds":report["SolarRashiNativeSwissCClocks"]["nativeLahiriJplVsNativeSwissC"]["meanAbsSeconds"],
        "solarCClockImproved":improved,"worse":worse,"publicV6":False
    }),flush=True)
if __name__=="__main__":main()
