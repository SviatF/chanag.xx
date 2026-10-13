# PANCHVANI Wave 3Q — Asta method crosswalk & uncertainty, not a ceremony model

**Date:** 2026-10-13 · **Review status:** research only · **Release:** no automatic Guru/Shukra exclusions.

## Independently supported methodological facts
The Drik Panchang [Jupiter Asta publisher page](https://www.drikpanchang.com/planet/asta/guru-asta-date-time.html) explicitly distinguishes a **traditional ~11° Surya Siddhanta angular cutoff** from the publisher's **modern, observer-location-dependent** calculations. Drik does **not** publish an independently reproducible mapping from those Asta/udaya boundaries to Swiss Ephemeris `SE_HELIACAL_SETTING` / `SE_HELIACAL_RISING`, a sky-altitude angle, an optical contrast threshold, or its own threshold choices.

The [Swiss Ephemeris programmer's guide](https://www.astro.com/swisseph-download/doc/swephprg.pdf) describes `swe_heliacal_ut` events as **morning first (event 1)** and **evening last (event 2)**, and describes atmospheric extinction / meteorological range / observer assumptions. Its documentation explicitly warns that Venus can be visible even by day and that the algorithm does not model all these circumstances. Neither event family is, by definition, a ceremony prohibition or necessarily a published religious Asta clock.

## Implementation
`lib/asta-uncertainty-audit.ts` is a pure, fail-closed crosswalk:
- Key `planet × year × exact locality × atmosphere.id × native event type`.
- Pair only **evening-last followed by morning-first**, in correct civil order and explicitly within the targeted year.
- Reject unpaired event types, duplicate event types, invalid time, and cases like **2028** Venus native output requested as **2027**.
- Treat two or more assumed profiles as a **sampled hypothetical scenario envelope**. Reports latest/earliest event time and spread in minutes and variability in the inferred hidden-period duration. This is **NOT a calibrated physical uncertainty interval or confidence interval**.
- For a sole matching published city/minute interval, separately record `temporalOnlyOffsetsMinutes`. They are clock differences **between possibly different phenomena** and cannot be labeled scientifically validated residuals.
- Report `sourceMethodMapping: UNESTABLISHED`, `independentlyValidated:false` and `safeForCeremonyFiltering:false` unconditionally.
- Preserve independent city-pinned reference gate from Wave 3N; multiple scraped views of Drik do not become multiple sources.

`scripts/asta-wave3q-reconciliation.ts` reads the **actual** 3O geometric and 3P native heliacal artifacts from the same CI execution, fails if inputs are not explicitly research-only, and outputs `artifacts/asta-wave3q-uncertainty-crosswalk.json`. The new GitHub Quality artifact is `asta-wave3q-methodology-uncertainty`; all three source stages remain separately downloadable.

### What remains uncertain
Wave 3P's hypothetical **Mumbai 2027 Jupiter** predictions have *clear/hazy* scenarios:
- clear: last evening 2027-08-07 19:41; first morning 2027-09-20 05:57 IST;
- hazy: last evening 2027-07-17 19:52; first morning 2027-10-07 05:57 IST.

This wide spread shows how sensitive Swiss heliacal predictions can be to those **assumed** atmosphere inputs. It does not prove that either profile reflects actual atmospheric conditions, nor that the visibility disappearance interval means the same as the published **Mumbai 2027 Jupiter Asta** snapshot (2027-08-19 19:34 → 2027-09-13 05:46 IST). Do **not** optimize atmospheric parameters merely to force an agreement with the publisher.

Venus's next native events from the 2027-06-01 search appeared in **May/June 2028**; they are **out-of-year**, not evidence for a fabricated Shukra 2027 interval. Published Venus Wardha/Latur 2027 snapshots are also different localities, so no Mumbai interval may be inferred from them.

The Wave 3O **New Delhi 2026 Jupiter** ecliptic-longitude model being within a minute of a **fixed-angular publisher** is evidence of agreement for a *mathematical convention* with that one source. It does not validate naked-eye visibility, wedding muhurat, or another publisher's observability convention.

## Release safety and SEO
The Asta crosswalk is independent of `lib/muhurat.ts`, the curated closures, precomputed V4 calendar shards, sitemap, index/noindex and user-facing scores. A perfect same-minute observation still cannot bypass `sourceMethodMapping=UNESTABLISHED`. `unknown` must never silently become `allowed`. No new indexed programmatic URLs or source-less regional verdicts are produced.

## Blocking next work
1. Obtain at least two **independent, reproducibly city-pinned** same-convention Guru and Shukra minute sources (not multiple pages from the same publisher) for priority 2025–2027 cities. Current Wave 3N scope remains 0/300 model-benchmark-ready.
2. Get a published detailed methodology or an independently agreed primary event definition for Asta. Quantify geometry/visibility differences under **measured** atmospheric conditions and terrain for the original city.
3. Separate confidence assessment for observed heliacal events from *tradition-specific* forbidden ceremony dates and Shishutva/Vriddhatva intervals.
4. Independently resolve Wedding/Griha Pravesh regional/Lagna, Festival/Vrat and GSC evidence gaps in issue #82.

**Pass criteria:** deterministic reproducible CI, source-method mismatch explicit, no unverified filter in production, original Muhurat/SEO quality unchanged. Passing tests never proves astronomical ritual correctness.
