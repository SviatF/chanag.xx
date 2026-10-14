# Wave 3AE — Impact census over **every committed V5 city-day**, before changing the astronomical engine

**Created:** 2026-10-14. **Scope:** all immutable 48 committed 2025–2028 month shards, expected >300 city-month datasets / >10,000 city-day snapshots. **NOT all potential dynamic Panchang routes or all Indian cities.**

## Context
High-accuracy JPL DE440s found a ~41–45 second shift in apparent geocentric Tithi transition relative to Swiss/Moshier UT for three reference city/days. Sunrise differences are separately ~6 seconds. The confirmed model disagreement changed sunrise Tithi at **Patna 2027-01-31** and **Kanpur 2026-11-21**, but not Lucknow 2027-09-17 (JPL boundary only 0.833 seconds before modeled sunrise, hence highly sensitive).

We cannot assume a globally constant 42s correction and change every future calendar. The **actual population at risk** must be enumerated with real city coordinates, actual committed V5 source rows, and independent JPL solar/lunar geometry.

## Implementation

1. \`scripts/wave3ae-swiss-full-shard-screen.ts\` loads all actual 48 gzip-encoded version 5 city-month shards. For **every** retained city/date row it evaluates Swiss UT lunar phase at a 30-min window around rounded first Choghadiya sunrise clock: ±15min. That proxy is checked against precise astronomical sunrise to ±65s *for selected candidates*. If Tithi crosses in the window, it computes the **exact Swiss sunrise**, **exact 12° transition**, **currently committed Tithi**, signed margin in seconds and city/date identifiers. This picks up Tithi changes before OR after sunrise and across month/day boundaries, without generating new snapshots or using a 42-second assumption. Non-candidates are provably without any Tithi boundary within the 30-minute Swiss window, conditional on source sunrise metadata being accurate; the proposed runtime upgrade must perform independent spot checks and tune conservatism.
2. \`scripts/wave3ae-jpl-full-impact.py\` independently reruns **every** Swiss candidate using the same authentic pinned DE440s kernel & Skyfield 1.55 from Wave3AD. For each it evaluates JPL sunrise, JPL exact phase root at the same 12° longitude target, lunar label at Swiss sunrise, lunar label at JPL sunrise, and pairwise time offsets. Every model discrepancy is retained in JSON. It never treats the independent model as a ritual fasting selector.
3. \`artifacts/wave3ae-swiss-shard-screen.json\` inventories **all** committed rows, per-year and per-city counts, candidate list, and source integrity. \`artifacts/wave3ae-jpl-full-impact.json\` lists every candidate/model comparison, exact solar times, changed Tithi label, counts grouped by year/city/previous Tithi and explicit follow-up gates. Both go into GitHub artifact \`wave3ae-all-committed-city-days-jpl-impact\`.
4. This becomes a mandatory **exact-head** CI step before Next.js build and SEO audits. Fail hard for missing shards, duplicate city dates, malformed site sunrise clocks, inconsistent location keys, missing expected data or JPL root bracket, or radically incompatible source coordinate/method assumptions.

## Production migration gate — **not yet executed**

Before changing a single live Panchang day or replacing current V5:
- Determine which reference frame matters: Swiss/Moshier \`sweCalcUt\` versus JPL apparent ecliptic of date. No unsupported global "subtract 42s" patch. Normalize phase target/ΔT/time scales, sunrise pressure/refraction/center convention, local elevation, and calendar-coordinate source.
- Quantify the exact changed city/day list within committed V5 snapshots; separately examine **dynamic on-demand daily routes and cities not represented in shards**, 2029+, and regional content dependencies. Our first census covers only persisted V5.
- Implement a versioned consistent astronomical engine for daily Panchang, annual Vrat, Yoga/Karana/Nakshatra, Muhurat precomputed writer, Janmashtami/Ekadashi and festival rule engines that actually use lunar values. One website must never show different truth between daily and Vrat/Muhurat.
- Rebuild every affected month shard and invalidate stale Cloudflare cache; update canonical and existing SEO content only for grounded date/ritual facts and **DO NOT MASS AUTO-CERTIFY** Smarta/ISKCON/Parana/Guru-Shukra Asta/Wedding/Griha Pravesh.
- Add high precision exact-second regression cases for Patna, Kanpur, Lucknow **plus every model-flip identified**. Independently inspect samples from every distinct month/rashi and lunar phase. Test on a canary branch/preview and only then migrate production.

**This wave's release meaning:** data-dependent impact analysis and readiness for controlled upgrade. It does not fix the live model or retroactively claim a validated religious ceremony date. The truth-status matrix and issue #82 remain open.
