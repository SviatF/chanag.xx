# PANCHVANI Wave 3P — observer-specific heliacal visibility research

**Date:** 2026-10-13. **Status:** research only; 0 verified ritual Guru/Shukra Asta conversions.

## Motivation and method
Wave 3O demonstrated that Mumbai 2027 Drik Jupiter Asta differs from the fixed-angle Swiss Ephemeris spherical model by −4238 / +2653 minutes. Merely adding topocentric parallax yielded essentially the **same residual**, so this wave measures more relevant observer physics instead of relabeling fixed-angle separation as visibility.

Native Swiss Ephemeris provides `sweAzalt()` (true/apparent altitudes with atmospheric refraction) and `sweHeliacalUt()` (searches heliacal rise/setting using observer, atmospheric extinction and naked-eye conditions). Sources:
- [Astrodienst Swiss Ephemeris Programmer's Guide §7.14 and §7.17](https://www.astro.com/swisseph-download/doc/swephprg.2.10.htm).
- [@typescriptify/sweph package API examples](https://www.npmjs.com/package/@typescriptify/sweph).

### Model A: local physical twilight geometry
Uses **UT**, `sweCalcUt()`, topocentric Sun and Jupiter/Venus RA/Dec, `sweAzalt()` with assumed pressure/temperature. Samples IST local dawn 04:00–08:30 and dusk 15:30–20:30 every **10 minutes**, including local dates of **both published boundaries**. Records:
- Geometric and apparent Sun and planet altitude, planet/sun azimuth.
- Civil (Sun 0…−6°), nautical (−6…−12°), astronomical (−12…−18°) twilight.
- Screened *geometry-only* windows with planet apparent altitude ≥ max(2°, assumed obstruction) and Sun −6…−18°.
- Counterfactual pressure, temperature, humidity, meteorological visibility, and obstruction. Humidity/meteorological range are passed to the **native heliacal** API, not claimed to be encoded in the simpler `sweAzalt` geometric screen.

Three **hypothetical**, not measured, profiles: clear (1013.25hPa, 20°C, 40% RH, 40km range), hazy (1000hPa, 32°C, 75%, 10km, 2° horizon obstruction), and low-pressure (900hPa, 12°C, 30%, 80km). All observer eye heights in the first study are **assumed 0m**, not real topographic altitude. Ten-minute grids do not pinpoint first/last visibility.

### Model B: native heliacal visibility sensitivity
Runs `sweHeliacalUt` with assumed naked-eye adult (36 years; Snellen ratio 1), site coordinates and clear/hazy atmospheric profiles, using **evening-last** event type 2 and **morning-first** event type 1 for Jupiter and Venus from June 1, 2027 in Mumbai. Native model factors include astronomical geometry and an empirical visual limiting magnitude algorithm rather than pure angular separation. A search result is recorded as a **hypothesis**; failed/non-finite/native-API results remain visibly unresolved, never silently substituted.

**Crucial:** A publisher's traditional Guru/Shukra Asta can be defined by a conventional angular rule, invisibility interval, planet motion or custom scripture-specific onset. Swiss native heliacal *evening-last/morning-first* is **not automatically the same definition** as a Drik Panchang Asta timestamp. Venus can have morning/evening first/last behavior near an inferior conjunction and cannot always be mapped to a single interval. A multi-day deviation by itself does not tell us the publisher is wrong.

## First observed native research run (PR #97, pre-merge)
The first native search **executed** (8 scenarios), with no Swiss function exceptions. For a Mumbai observer and search start **2027-06-01**:
- Jupiter **clear**: last evening **2027-08-07 19:41 IST**; next morning **2027-09-20 05:57 IST**.
- Jupiter **hazy**: last evening **2027-07-17 19:52 IST**; next morning **2027-10-07 05:57 IST**.
- Venus **clear**: next returned evening/morning events **2028-05-24 19:24** and **2028-06-10 05:41 IST**, respectively.
- Venus **hazy**: next returned events **2028-05-17 19:29** and **2028-06-19 05:38 IST**.

The Venus events are **not in target year 2027**. The data pipeline explicitly marks `native-event-outside-target-year` rather than projecting a 2028 clock back onto Shukra Asta 2027. The *first next heliacal event after the supplied search start* is not the same as asking for a traditional Asta interval around a known exact conjunction; the search definition must be reconciled before comparing residuals. The Jupiter evening-last + morning-first can span materially different periods under these hypothetical atmospheric assumptions. This proves sensitivity **within the model**, not a successful verification of Drik dates or physical naked-eye sighting.

## Coverage, evidence, and safeguards
- 6 minute-precision source observations in the Wave 3N fixture; no invented city-bound Venus comparison.
- Mumbai, Kolkata, Delhi are matched only by exact reviewed `coreCities` coordinates. Wardha, Latur, Alibag are skipped until **their own** coordinates exist in reviewed source metadata.
- `geolocated-snapshot` evidence is still not independently pinned; atmospheric sensitivity is not proof of agreement or ritual validity.
- Even strong model agreement against **one** publisher only merits further research; Wave 3N source-certification status remains **0/300**.
- Script returns JSON and fixed release status `safeForCeremonyFiltering:false`. **Neither the report nor model is imported into the public Muhurat engine.**
- Local observational obstacles, cloud conditions, aerosol optical depth, sky background and real observer acuity are uncertain or absent; profiles are assumptions, not live data.
- Statistical accuracy cannot be claimed without multiple independent city-pinned minute sources and uncertainty envelopes.

## Running / CI
```bash
npm run research:asta-visibility
npm run research:asta-heliacal -- --report=artifacts/asta-heliacal-deep.json
```
Quality CI runs both research variants and archives `asta-wave3p-visibility-geometry` and `asta-wave3p-heliacal-sensitivity`. The latter has an explicit seven-minute execution cap; neither may mutate a public Asta exclusion list. Add no forced global noindex, sitemap expansion or risky search-traffic changes.

## Acceptance and remaining blockers
1. Validate that the native TS Swiss Ephemeris implementation returns physical heliacal events consistently and that atmospheric sensitivity results are stable and finite; record, do not hide, failures.
2. Obtain two independent, **observer-city-pinned**, minute sources **with same event convention** for Guru/Shukra Asta across 2025–27. Distinguish true published visibility and conventional geometry.
3. Derive calibrated observability **with bounds**, local horizon and pressure/extinction uncertainty and compare at actual same-city locations; no 100% claim.
4. Only after method validation add separately reviewed wedding and Griha Pravesh event-specific date exclusions and Lagna/Panchang Shuddhi. Unknown stays unknown.
5. Continue Issue #82 festival/vrat and GSC verification. Existing SEO structural CI cannot certify Search Console recovery.
