#!/usr/bin/env python3
"""Wave 3AG — prove checked-in compact V6 data is EXACT DE440s output.

No majority voting, handwritten timestamps, codegen drift, silent asset
substitution, or regeneration of V5: compares the actual first-party JPL
numerical generation output, pinned binary & Skyfield version.
"""
from __future__ import annotations
import hashlib
import json
from pathlib import Path

EXPECTED_KERNEL_SHA="c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2"
EXPECTED_RAW_SHA="0cab0c6accaf2e2125fe417bf4a4f14a22453a4013a1609dce6dce84ec44142e"
EXPECTED_RAW_BYTES=85589
EXPECTED_EVENTS=4512
SOURCE=Path("artifacts/wave3af-jpl-global-tithi-transitions.json")
CHECKED_IN=Path("generated/jpl-v6-half-tithi-2025-2030.ts")

raw=SOURCE.read_bytes()
if len(raw)!=EXPECTED_RAW_BYTES or hashlib.sha256(raw).hexdigest()!=EXPECTED_RAW_SHA:
    raise SystemExit("Regenerated JPL event stream does not match exact independently checked reference bytes")
data=json.loads(raw)
if data.get("kernelSha256")!=EXPECTED_KERNEL_SHA or \
   data.get("halfTithiBoundaryCount")!=EXPECTED_EVENTS or \
   data.get("skyfieldVersion")!="1.55" or \
   data.get("canaryOnly") is not True or \
   data.get("ritualSelectionCertified") is not False:
    raise SystemExit("JPL asset provenance or non-production safety fields mutated")
checked=b"export default "+raw.strip()+b";\n"
actual=CHECKED_IN.read_bytes()
if checked!=actual:
    raise SystemExit("Committed 6-degree JPL module is NOT byte-identical to the SHA-pinned DE440s oracle: regenerate/review!")
if len(set(tuple(row) for row in data["halfTithiTransitions"]))!=EXPECTED_EVENTS:
    raise SystemExit("Duplicate or missing JPL 6-degree root")
print("[3ag-assets] PASS: 4512 exact independently generated events, source SHA256 "+
      EXPECTED_RAW_SHA+" bytes="+str(len(raw))+" committed="+str(len(actual)),flush=True)
