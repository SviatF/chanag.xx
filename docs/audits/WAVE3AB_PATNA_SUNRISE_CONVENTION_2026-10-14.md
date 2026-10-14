# PANCHVANI Wave 3AB — Patna and Vedha sunrise-convention reconciliation

**Date:** 2026-10-14. **Scope:** exact-UT computational-method differential + publisher evidence queue. **Do not publish selected fasting, Parana or reclassify Tithi from this research.**

## What we learned (genuine issue, not another generic audit)

The Swiss Ephemeris official programming guide [defines two different solar-rise methods](https://www.astro.com/swisseph/swephprg.htm): apparent upper limb with atmospheric refraction (default `SE_CALC_RISE`); and Hindu rising (center of solar disk at geometric horizon, no refraction and geocentric/no-ecliptic-latitude). The latter uses `SE_CALC_RISE|SE_BIT_DISC_CENTER|SE_BIT_NO_REFRACTION|SE_BIT_GEOCTR_NO_ECL_LAT` (1|256|512|128). **PANCHVANI V5 production uses the first convention.** It would be scientifically unsound to claim this is the only possible traditional Panchang definition or silently change production to another convention merely because another publisher prints a different rounded time.

### Patna Jan 31 2027: concrete source discrepancy

**V5 PANCHVANI:** UT-correct `Krishna Dashami` at computed upper-limb sunrise. The historical V4 implementation wrongly produced `Krishna Navami` because a UT Julian day was passed to the ET-only `sweCalc`. Wave 3V corrected the UT/ET problem for all future calculations and replaced V4 precomputed shards with V5. This correction is **not** reverted here.

**Independent publisher records manually inspected 2026-10-14:**

| Publisher | Patna URL | Sunrise (IST, publisher precision) | Navami ends (IST, publisher precision) | Day-label published |
| --- | --- | --- | --- | --- |
| Dev Panchang | https://devpanchang.in/en/panchang/patna/2027-01-31 | 06:33 | 06:34 | Navami |
| Astrology Divine | https://www.astrologydivine.com/31-january-2027-daily-panchang?country=India&date=2027-01-31&lang=en&lat=25.5941&lon=85.1376&place=Patna%2C+Bihar%2C+IN | 06:33 | 06:33 | Navami |
| VedicSpace | https://vedicspace.com/hi/panchang/patna/2027-01-31/ | 06:33 | 06:34 | Navami |
| Vedic Tithi | https://vedictithi.com/calendar/hindu/city/patna/2027-01 | not exposed in inspected row | 06:33 | Navami |

The domains are **four distinct publishers, not four independently proven astronomical algorithms**. None provides exact *both* sunrise and Tithi-end seconds and full matched observer settings. VedicSpace labels Patna as 25.6093°N (PANCHVANI/ASTROLOGY DIVINE use 25.5941°N); longitude 85.1376°E. A few rounded city/day clocks do not prove a different ephemeris is correct. Third-party day-label semantics also might differ from exact Tithi state at a particular instant.

### Method-sensitivity implementation

- `lib/sunrise-convention-differential.ts` calculates the **two sunrise instants independently within one Swiss UT/Moshier model**, resolves the preceding and following lunar-transition roots to about a second, records raw Julian UT, UTC ISO, and local IST with seconds, and gives Tithi-at-sunrise / Tithi-at-Arunodaya for each observer convention.
- The Patna audit checks the existing daily Panchang and Time Scale audit against the default calculation, and tests an alternate published city latitude at unchanged longitude.
- The yearly `Wave3Z` sample (four cities × 2026/27) contains 193 sunrise Ekadashi observations and **eight** default-convention Dashami-at-Arunodaya *mathematical candidates*. `scripts/wave3ab-sunrise-source-audit.ts` records city/date, both precise rise/Arunodaya instants, whether that signal survives alternate sunrise definition, without claiming a particular Smarta/ISKCON fast or Parana.
- Human-readable machine report: `artifacts/wave3ab-patna-method-reconciliation.json` as GitHub CI artifact `wave3ab-patna-convention-differential`; required `npm run audit:sunrise-conventions`.
- The website's `/accuracy` explicitly distinguishes both sunrise conventions; no automatic rewrite of V5, festival, or Muhurat results.

## Proof obligations before changing live calendar dates

1. Obtain an **independently implemented Sun/Moon + sunrise source** with UT/TT and topocentric/geocentric observer settings documented, **both events to seconds**. Distinct publisher domains and rounded screenshots are NOT enough.
2. Compare sunrise conventions at the exact city coordinates and publication rounding; independently locate the Sun–Moon elongation reaching the Dashami transition near Patna sunrise. If no independently reproducible match, retain the published-source warning and the V5 mathematically computed result. Do not use publisher-count voting.
3. Use the exact eight Vedha city/day queue to get matching **GCal/ISKCON and Smarta** tradition outputs (with location, elevation, solar definition and timezone). Review Kshaya Ekadashi separately: neither Wave3Z nor Wave3AB exhaustively covers sunrise-skipped Ekadashi.
4. Verify all Mahadwadashi types and validated Parana clock windows **before** any ritual-approved fast day or time is offered.
5. Only then propose a narrowly scoped production algorithm change and regenerate all impacted calendars, monthly/yearly snapshots, URL outputs and references in a single versioned migration, with exact-head CI and user-visible regression proof.

**Hard boundaries:** this work does not independently certify Patna's ritual sunrise, eight Ekadashi fast days, Guru/Shukra Asta or any 2027 city-level Puja/marriage eligibility. All such claims are blocked.
