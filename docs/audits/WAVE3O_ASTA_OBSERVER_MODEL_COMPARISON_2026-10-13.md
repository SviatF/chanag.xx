# PANCHVANI Wave 3O — local Asta geometric model benchmarking

**Status:** Scientific research only / no production ritual exclusions. **Date:** 2026-10-13.

## Question
Can the existing Swiss Ephemeris Moshier engine reproduce the *published source snapshots* of Jupiter/Venus Asta more accurately by changing geometric assumptions? Previous Wave 3H geocentric spherical separation diverged from one Mumbai Drik Jupiter 2027 snapshot by several DAYS at each endpoint. A successful execution here will NOT establish the correct Drik visibility model or ritual suitability.

## Implemented independent variants
1. **Geocentric spherical:** true angular separation of equatorial Sun/body direction (existing 3H baseline).
2. **Geocentric ecliptic longitude:** absolute wrapped difference in apparent ecliptic longitudes, which is *not* equivalent to spherical angular separation when the planet has ecliptic latitude.
3. **Topocentric spherical:** equatorial Sun/body separation computed with `SEFLG_TOPOCTR` after setting observer coordinates in Swiss Ephemeris, on the same 11° Jupiter and Venus 10° direct / 8° retrograde angular thresholds.

These are **geometric** models, not models of first/last **visibility**. The third uses an observer point but STILL ignores horizon geometry, atmospheric extinction, solar depression, planet brightness, twilight and local conditions. It therefore must not be called a validated Asta observer method.

## Integrity rules
- The benchmark reads ONLY the Wave 3N source ledger and exact India local timestamps; does not change, fit or average original source times.
- It benchmarks published **minute** entries only where the project has a reviewed core-city coordinate (e.g. Mumbai, Kolkata, New Delhi). Any Alibag/Wardha/Latur entry lacking curated coordinates is explicitly **skipped**, not assigned a nearby city.
- Reference records retain `geolocated-snapshot` / `publisher-pinned` flags; one publisher alone is not independent confirmation. Even an apparently close model residual with one publisher is only an exploratory comparison.
- Each model scans at six-hour increments and bisects bracketed threshold crossings. Changes of Venus retrograde classification across an interval cause `station-switch-unresolved`, not a fabricated precise clock.
- Every output records signed **start/end residual minutes** and missing/ambiguous crossings, plus explicit `safeForCeremonyFiltering:false`. A signed residual does not imply a good ritual day.
- No production imports into `lib/muhurat.ts`, `lib/verified-muhurat-closures.ts` or route components; no ephemeris, Muhurat shard, SEO or index-policy changes.
- `npm run research:asta-models` now runs in Quality CI after the evidence ledger audit; it saves `artifacts/asta-observer-model-comparison.json` as `asta-wave3o-model-comparison`.

## Scientific and release criteria
A model **cannot** be released for ceremony filtering without independently pinned, same-locality, same-method minute references for both interval endpoints. Compare the geometric predictions first; proceed to **solar-horizon/twilight, heliacal visibility and uncertainty** only if there is sufficient primary evidence. Check Venus retrograde/direct station events and distinguish conventional Shishutva/Vriddhatva exclusions from astronomical Asta.

Wave 3O is **not full Asta calibration**: it isolates discrepancies between three models and source snapshots, and makes numerical uncertainty testable. The Wave 3N audit currently reports 0/300 city × year × planet combinations ready for independent model comparison; this cannot be repaired by improving curve fitting alone.

## Next open work
- Genuine topocentric heliacal/horizon visibility model with weather/atmosphere sensitivity and source method mapping;
- Acquire two reproducibly **city-pinned independent minute sources** (Mumbai, Pune, Delhi, Chennai × 2025–2027 × Jupiter/Venus), with historic snapshots;
- If model agreement is confirmed, establish **separate** event × region × tradition wedding/Griha eligibility rules and fail-closed `unknown` states;
- Festival/Vrat residual source audit and real GSC export evidence remain open under Issue #82.

**Do not declare PANCHVANI ritually accurate, Guru/Shukra Asta completed, or ranking recovery from passing CI alone.**
