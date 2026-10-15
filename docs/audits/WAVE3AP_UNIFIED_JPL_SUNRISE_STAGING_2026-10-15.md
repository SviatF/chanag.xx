# PANCHVANI — Wave 3AP: one coherent JPL sunrise research engine

Date: 2026-10-15. **V5 remains live, V6 research is not a public calendar.**

## Implemented

- `lib/v6-unified-calendar-staging.ts` takes raw SHA-256-pinned Wave 3AO global JPL sidereal catalog and its actual measured Lahiri anchors, checks both against **independently stored expected hashes**, the known DE440s and 6° root source, chronological completeness, non-production flags and cross-family Pada/Nakshatra identity. All arrays are frozen after verification.
- Exact reviewed catalog SHA-256: `b898fefb8b23fd689c6c841828a6a2ff915df2e8c5cdd13cf3dfd9312b83a554`.
- Exact Lahiri anchor SHA-256: `f5a346251079734c66187f3b068ca97f12fae0dbb5bf9373e3fcf863ad6c9e54`.
- `getV6UnifiedSunrise(date, city, verifiedSource)` uses the **same Swiss upper-limb city sunrise instant** for the JPL DE440s 6° Tithi/Karana/new moon and JPL DE440s Nakshatra, Pada, Yoga, lunar/solar Rashi. It returns explicit UTC + India local civil day and time for known next transitions, with `null` where the sidereal catalog ends; no fabricated future roots.
- `getV6UnifiedMonth` provides a full research input month with a cache key combining V6 schema 7, coordinates and both SHA-pinned source identities. It **does not** publish Muhurat decisions, Vrat observance, festival day choices, or mixed-era Panchang fields.
- Quality CI reconstructs the exact source artifacts, typechecks this research loader and verifies every supported city on **four representative dates** (2026-06-30, 2026-11-21, 2027-01-31, 2028-12-31), plus complete JPL input months for Delhi 2026-06, Kanpur 2026-11, Patna 2027-01: **91 additional month-day computations**. Reports which values differ from V5 on the three known sunrise flips.
- Reject invalid/corrupt source bytes, unsupported civil dates, incorrect city/source cache identity, wrong source pairing, missing calendar fields and accidental V6 promotion. All scientific data stays in `artifacts/` and GitHub Actions, not in runtime `generated/` or the Cloudflare Worker.

## Exact scientific boundaries still open

**This is not all 454×1,096 sunrise instances**, not complete Hindu calendar correctness. The JPL Sun/Moon positions are precise but Lahiri is still based on **Swiss/Moshier source convention**. City sunrise uses the existing Swiss model deliberately to isolate lunar/sidereal changes, not independent USNO atmospheric sunrise certification.

The staged astronomical output is **not** a certified regional fasting calendar. Hindu Month, Samvat/Adhika, lunar illumination, sunrise model methodology, festivals and Vrat/Parana, wedding/Griha/Asta and Muhurat ranking remain individually unapproved and production versioned shard migration has not occurred. `V6_UNIFIED_RESEARCH_SCHEMA=7` is distinct from legacy `V6_STAGING_SHARD_SCHEMA=6` and V5 `MUHURAT_BUILD_DATA_VERSION=5`. A green gate never implies finished SEO/editorial uniqueness or approval of ritual advice.

## Next release deliverables

1. Expand all-city and full-day sunrise parity without approximated sunrise shortcuts; reconcile flagged near-boundary data against external ephemeris/frame choices.
2. Derive local Amanta/Purnimanta/Samvat from one approved Sun/Moon reference frame and explicitly accepted regional methods.
3. Regenerate ALL dependent Muhurat/Vrat/Festival shards from **the same versioned source** and obtain tradition-specific review.
4. Canary/switch public routing with deterministic rollback, preserving V5 until go/no-go review.

No production V6 promotion from Wave 3AP.
