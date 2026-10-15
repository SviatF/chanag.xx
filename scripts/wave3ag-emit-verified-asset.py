#!/usr/bin/env python3
"""One-shot transfer of authenticated JPL JSON from isolated CI to GitHub.

The CI log is a transport channel, NOT a replacement for full byte-for-byte
verification. Output is emitted in bounded JSON chunks. Only the exact
SHA-pinned artifact will be accepted for the V6 canary asset import.
This diagnostic transport step will be deleted once the asset is committed.
"""
import hashlib
import json
from pathlib import Path

PATH=Path("artifacts/wave3af-jpl-global-tithi-transitions.json")
EXPECTED="0cab0c6accaf2e2125fe417bf4a4f14a22453a4013a1609dce6dce84ec44142e"
raw=PATH.read_bytes()
digest=hashlib.sha256(raw).hexdigest()
if digest!=EXPECTED or len(raw)!=85589:raise SystemExit("JPL transfer source digest/size mismatch")
body=raw.decode("utf-8").strip()
table=json.loads(body)
if table["halfTithiBoundaryCount"]!=4512 or table["kernelSha256"]!="c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2":
    raise SystemExit("Untrusted 6 degree table")
chunks=[body[i:i+2200] for i in range(0,len(body),2200)]
print(f"[3ag-export] sha={digest} chunkCount={len(chunks)} charLength={len(body)}",flush=True)
for n,chunk in enumerate(chunks):
    print(f"JPL3AG_PART::{n:03d}::{chunk}",flush=True)
print("[3ag-export] complete",flush=True)
