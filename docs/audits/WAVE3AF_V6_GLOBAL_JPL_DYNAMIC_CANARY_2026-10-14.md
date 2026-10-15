# PANCHVANI Wave 3AF — JPL V6 canary for all dynamic city-days

**Created:** 2026-10-14. **Status:** research-only canary, full production migration still BLOCKED.

## Why Wave 3AE is not enough

Wave 3AE verified **10,299 immutable V5 city-day snapshots** in 48 shards, identifying 215 near-sunrise Tithi candidates and exactly **2** Swiss/Moshier ↔ JPL sunrise Tithi flips (Patna 2027-01-31, Kanpur 2026-11-21). These snapshots are not every supported dynamic route. PANCHVANI has a larger \`supportedCities\` set; the same Tithi boundary can cross sunrise on other nearby longitude/latitude combinations.

We must also prevent a partial conversion that updates sunrise Tithi while leaving Karana, Tithi end clocks, annual Vrat, rituals and Muhurat shards on a different model.

## A viable V6 architecture without shipping the 32MB JPL binary

**Global JPL half-Tithi transition table:** \`scripts/wave3af-build-jpl-tithi-table.py\` evaluates the *authenticated* DE440s binary SHA256 \`c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2\` via Skyfield 1.55. It finds the exact UTC transition of geocentric **apparent ecliptic Moon−Sun elongation every 6°**, using 8-hour source sampling and a 27-iteration vectorized root solver, verifying each root ±4 seconds. A **6° boundary** is a Karana phase transition; each pair of 6° changes defines a complete **12° Tithi**. Half-phase index after each root is 0–59.

- Table date envelope: **2024-12-15 through 2031-01-15 UTC**, supporting the full 2025–2030 civil years with boundary margins. Any time outside actual populated root coverage must fail closed.
- \`lib/jpl-v6-tithi-karana-canary.ts\`: pure TypeScript validated data structure, O(log N) lookup of current Tithi/Karana index plus exact next Tithi and Karana UTC transition. Deliberately no remote requests, Python or JPL binary in the Worker.
- Do not approximate a Karana midpoint in minutes or add any fixed ~42-second offset to Swiss; phase roots are numerically computed globally.
- For this wave, generated source tables are **CI research artifacts only**, not committed production runtime data. Shipping deterministic checked tables to runtime is a subsequent explicit, versioned migration.

**All supported-city dynamic census:** \`scripts/wave3af-dynamic-all-city-days-v6-canary.ts\` enumerates every supported city (core + supported candidates, deduplicated) × **every India-local date in 2026–2028**, not only the 338 precomputed city-months.

- Compute a NOAA analytic sunrise estimate for every city/day. If a precomputed JPL 6° root is within ±120 minutes of the estimate, solve the **actual V5 Swiss** sunrise using its documented upper-limb/1013.25 hPa/25 °C observer convention and compare exact **Swiss vs JPL Tithi at the SAME sunrise instant**. This avoids conflating solar refraction conventions with Moon-phase accuracy. The 6° boundary table also supports independent Karana comparisons for the eventual migration.
- Fail on any examined estimated-vs-real solar clock mismatch above **35 minutes**; thus the ±120-minute candidate screen conservatively covers any crossing within ±85 minutes of physical sunrise, conditional on the stated, audited approximation bound.
- Check every 93rd day per city even if the JPL root is outside the window, to expose unexpected missed method disagreements and independently sample analytic solar clock errors. This is an empirical guard, **not an analytical proof of every omitted sunrise**.
- Report actual physical-sunrise evaluations, conservative prefiltered cases, number of model-flip day labels, city/date/phase, near-boundary minutes, year/month and observer coordinates, sample counts, far-out-of-window sentinels.
- Regression-fail if either JPL-confirmed Patna/Kanpur discrepancy is absent.
- Do not make a blanket claim that a 2029+ dynamic route has been audited solely because its lunar roots have been generated.

## Required production migration after the canary

1. Inspect all newly exposed non-shard city-day flips and review sampled third-party observer/tithi evidence. Distinguish **method discrepancy** from verified religious fasting rules.
2. Finalize the **uniform geometric source**: Tithi, next Tithi transition, Karana, Karana transitions and previous new moon should be from **one JPL dataset**. Keep Sidereal Lahiri/Sun/Moon, Nakshatra, Yoga and Rashi on Swiss until specifically benchmarked; ensure semantic labels clearly disclose mixed-but-coherent model provenance and boundaries.
3. Test updated JPL V6 daily, Vrat and Muhurat algorithms in a private runtime canary; never silently use JPL only in one page family. Validate Janmashtami regional source conventions, Ekadashi vedha/Kshaya/Mahadvadashi and Parana separately.
4. Commit appropriately partitioned, authenticated 6° JPL transition assets into V6 runtime, regenerate **every affected** monthly shard and its version+hash freshness signature, invalidate edge cache, and verify identical Tithi/Karana values across daily/Vrat/Muhurat for 2025–2030. For dates beyond the table's physical scope, fail closed or explicitly use separately declared Swiss fallback; never claim JPL precision there.
5. Pass full GitHub quality gate, independent JPL generation reproducibility, 3326 existing SEO URLs and Workers deploy before production switch.

**This wave does NOT:** flip a live calendar date, declare an ISKCON/Smarta fasting or Parana day, approve Wedding/Griha Pravesh, or claim high accuracy for Yoga/Nakshatra/Asta. Open issue #82 remains open until cross-family model migration and independent ritual source review are complete.
