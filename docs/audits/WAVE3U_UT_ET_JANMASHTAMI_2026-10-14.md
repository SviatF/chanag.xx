# PANCHVANI Wave 3U — UT/ET astronomical time and Janmashtami method gap
**Date:** 2026-10-14. **Status:** research-only, no changes to public dates, Muhurat exclusions, Vrat fasting status, V4 shards, sitemap or index policy.

## Confirmed Swiss Ephemeris API contract
Swiss Ephemeris [published manual](https://sources.debian.org/src/libswe/2.10.03-3.1/doc/swisseph.md) specifies that swe_calc() expects Ephemeris/Terrestrial Time (ET/TT), whereas swe_calc_ut() expects Universal Time (UT) and handles the ΔT conversion. swe_rise_trans() accepts and returns UT Julian Days. At the Wave 3U start, both lib/panchang.ts and lib/vrat.ts use sweCalc() with UT Julian Days obtained from sunrise. That is a confirmed *code time-scale mismatch*, not an estimate or harmless rounding detail.

Correcting just Vrat without daily Panchang and the generated 48 shards/338 city-month datasets would yield a new internal inconsistency. Before a production switch, version all of these together, compare astronomical instants and published city-locality examples, and execute full migration and human-reviewed indexed date diffs.

## Implementation and reproducibility
- lib/vrat-ut-et-diagnostic.ts: uses the same sunrise-in-UT, asks Swiss for Sun/Moon longitude in both independently called UT-correct (sweCalcUt) and legacy (sweCalc) modes. It brackets the prior and next lunar-Tithi changes by one-hour stepping followed by ~31 binary-search refinements. Reports the true UT mode at sunrise; signed next-boundary drift in seconds; nearest transition distance from the actual UT sunrise; and mismatched sunrise Tithi state.
- scripts/wave3u-time-scale-audit.ts samples Delhi, Mumbai, Chennai, Kolkata over 8 targeted 2026–2027 dates (32 location-date samples) and tests Janmashtami 2026/2027 in 4 cities, exporting research JSON in artifacts/wave3u-ut-et-janmashtami-diagnostic.json.
- Each sunrise sample has a conservative ±5-minute investigation trigger; NOT a calibrated physical uncertainty interval. No source says a minute-rounded HH:mm timestamp is enough to determine an exact sunrise-boundary order.
- CI adds mandatory npm run audit:vrat-time-scale and an artifact wave3u-ut-et-janmashtami. Tests ensure public runtime never imports this diagnostic.
- A positive local sunrise Tithi is not an Ekadashi fast day, a Parana time, a certified Purnima ritual date, or a wedding Muhurat.

## Observed scientific differential on actual repository calculations
The first successful research CI head (run 38606430463) returned **32 sunrise locality/date samples**, **one opposite Tithi classification at sunrise** and **one near-boundary sample**. Across the other 31 comparable next-boundary events, the *UT-correct minus legacy transition offset was −69 seconds* (reported min/max/mean all −69 s under identical numerical rounding). This is an actual call-level measurement from Swiss, not a heuristic constant to subtract from times.

**Delhi 2026-06-30** is a reproducible counterexample:
- In the existing public legacy Vrat output, `sunrise=05:27`, `TithiEnd=05:27`, and **Purnima** is included.
- Correct UT call calculates Tithi index **15** (next Krishna Pratipada) at sunrise; the Purnima boundary is **40 seconds before sunrise**.
- Legacy ET-as-UT calculates Tithi index **14** (Purnima) at sunrise; the lunar boundary is **29 seconds after sunrise**.
- The divergent classification is therefore a **real false positive for the mathematical Purnima-at-sunrise list** caused by the time-scale mismatch. It does not automatically establish the preferred full-moon ritual observance day.
- Corrected sunrise-time astronomical reference is still **research-only**. User-facing Vrat pages, shared daily Panchang, Festival dates and 48 precomputed Muhurat shards have **not** been changed. Synchronizing all callers plus a source-reviewed rebuild is required.

The reported −69 seconds concerns the sampled lunar transition, **not** an instruction to adjust every public clock by a hardcoded 69 seconds, and not a calibrated observer/horizon confidence interval.

## Verified Janmashtami 2027 method mismatch
[Drik Panchang city-pinned Kalyan 2027 entry](https://www.drikpanchang.com/dashavatara/lord-krishna/krishna-janmashtami-date-time.html?geoname-id=1268295) prints:
- Janmashtami **August 25, 2027** (Wednesday).
- Ashtami 2027-08-24 **20:24 IST** through 2027-08-25 **19:19 IST**.
- Rohini 2027-08-25 **12:27 IST** through 2027-08-26 **11:42 IST**.
- Nishita Kalyan 2027-08-26 **00:17–01:02 IST** (the 24+ notation refers to the following civil day).

Therefore Ashtami does not overlap the publisher's own Nishita window for this locality, yet the published Janmashtami date is Aug 25. One cannot assume a single universal Ashtami-at-Nishita test certifies the festival date. Smarta, Vaishnava, Rohini and Parana variants must be source-reviewed separately. The diagnostic records city-local computed statuses, not a fast selector: selectedSmartaOrVaishnavaFastDay:null; approvedCeremonyMuhurat:false; paranaCertified:false.

## Production gates (not bypassed)
1. Independently establish UTC/UT-to-ET correction and recheck local subminute transitions, sunrise definition and timezone.
2. Regenerate all Panchang computations / Muhurat shards consistently after review. Publish zero unverifiable ceremony bans.
3. Independently pin two sources with explicit city/observer and a documented festival-date rule; separate published date from Puja Muhurat and fast-day selection.
4. Audit every candidate date diff and complete regression, Next, Vinext, Festival/Muhurat truth checks, and SEO corpus quality before any production date migration.

A clean CI test is engineering validation, not independent religious correctness. All Wave 3T and 3S gates remain binding.
