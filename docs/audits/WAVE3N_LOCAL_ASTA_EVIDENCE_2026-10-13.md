# Wave 3N — independent local Guru/Shukra Asta evidence gate

**Reviewed:** 2026-10-13 · **Status:** RESEARCH / provenance gate, not a production Asta calendar.

## What was checked
The existing geocentric 11-degree Jupiter / 10- or 8-degree Venus prototype does **not** reproduce the Drik Mumbai Jupiter 2027 observer-relative Asta interval. This is a methodological mismatch rather than an excuse to smooth or average dates. Per-city astronomical visibility and an independently verified ceremony convention remain open.

Published evidence added alongside the existing Wave 3J ledger (Drik URLs can resolve to a different visitor-selected city, so exact locality is a captured source observation, not guaranteed by the URL alone):
- [Drik, Alibag 2026 Guru Asta](https://www.drikpanchang.com/planet/asta/guru-asta-date-time.html?time-format=24plushour) — July 17 at 19:52 to **August 11 at 05:39**. Original page displayed **Aug 10 29:39+**, normalized to the following civil date.
- [Swarn Siddhi, New Delhi 2026](https://swarnsiddhi.com/griha-pravesh-muhurat/2026) — July 14 at 18:04 to August 13 at 15:53, **fixed 11° separation**, not local visibility.
- [Swarn Siddhi, New Delhi 2027 Shukra](https://swarnsiddhi.com/vivah-muhurat/2027) — July 6 to September 17, **date only** and 10°/8°-type angular convention, not an independent minute reference.
- [Drik, Latur 2027 Shukra](https://www.drikpanchang.com/planet/asta/shukra-asta-date-time.html?year=5786) — July 22 at 05:33 to September 4 at 18:59. Original start was **July 21 29:33+**.
- Existing [Mumbai Guru](https://www.drikpanchang.com/planet/asta/guru-asta-date-time.html?year=3206), [Kolkata Guru](https://www.drikpanchang.com/planet/asta/guru-asta-date-time.html?year=2216) and [Wardha Shukra](https://www.drikpanchang.com/planet/asta/shukra-asta-date-time.html?lang=en&year=4898) 2027 observations remain preserved, not overwritten.

**These are different observers and algorithms.** For instance, Alibag and New Delhi Jupiter 2026 dates cannot be subtracted to claim a source discrepancy at the *same* location. Likewise two New Delhi 2027 day-only references do not certify an exact Mumbai Asta boundary.

## What is now enforced
- Every snapshot must have a valid date/time (including real Gregorian day), year overlap, city, planet, HTTPS publisher URL and declared method/precision.
- The Drik **24+ hour** clock must be normalized to an explicit next civil date.
- Only **two distinct publisher domains with same city, same planet, same year, minute precision and declared compatible methods** can be evaluated for a model benchmark. Each source must also **pin the named observer reproducibly**; a Drik page that reverts to a visitor-dependent location is only a dated geolocated snapshot, not self-verifying city evidence.
- Two minute sources including a dynamic geolocated page remain **location-not-reproducible** until the original city binding can be reproduced/archived.\n- Even independent minute publications remain **method-disagreement** if one is fixed-angular and the other location-sensitive/undisclosed. They remain **boundary-disagreement** if their starts/ends differ by more than five minutes. The five-minute threshold is a *conservative source screening policy*, not an established physical measurement tolerance.
- A hypothetical perfectly corroborated pair may reach `comparison-ready`; this means *run an independent physical-model benchmark*, **never** automatic `allowed` / `blocked` wedding dates.
- For the current source ledger, **no priority city/year/planet pair is comparison-ready**. Do not implement ceremony filtering or 100% suitability claims.
- CI now runs `npm run audit:asta-evidence` and preserves `artifacts/asta-evidence-audit.json`, alongside dedicated negative-control tests.

## Coverage and limitations
The audit reports **all coreCities × 2025–27 × Jupiter/Venus** combinations, with special views for Mumbai, Pune, New Delhi and Chennai. Core city candidates do not necessarily equal public sitemap city routes. No attempt is made to repurpose day-only or geocentric outputs into location-validated exact Asta boundaries.

This work modifies no astronomy engine, production `lib/muhurat.ts` selection, V4 compressed shard, sitemap, canonical, GSC status, robots policy or user-facing ceremony approval notices. Legacy Source Wave 3J tests still require Asta data to remain untrusted.

## Next acceptance gates
1. Collect **two independently published minute-precision sources** for both planets, priority cities and each 2025–27 interval, preserving their exact observer/civil date.
2. Confirm whether sources actually share a method and observer convention; compare independent start/end with a declared tolerance and record dissent.
3. Benchmark topocentric visibility / first-last visibility models against same-locality sources (including retrograde station and atmosphere choices); keep geocentric fixed threshold as an explicitly separate mathematical convention.
4. Only after tested physical agreement, separately assess ritual per-city/per-event/per-tradition exclusions, including Shishutva/Vriddhatva. Distinguish `excluded`, `unknown` and `allowed` rather than making unknown appear allowed.
5. Independently finish remaining Wedding/Griha Pravesh, Festival/Vrat and direct GSC audit tasks in #82.
