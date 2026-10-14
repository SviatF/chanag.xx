# PANCHVANI Wave 3R — cross-publisher fixed-angle astronomy; local Asta still unverified

**Evidence reviewed:** 2026-10-13. **Code scope:** research-only. **Status:** no automatic ceremony-date filtering or SEO expansion.

## Main independent PUBLICATION finding
Two publishers display near-identical **fixed angular** Jupiter combustion events in 2026 after properly accounting for India and Nepal time zones. This is a demonstrable *agreement between two published astronomical-convention tables*, NOT independently audited calculation engines, and NOT evidence of a Mumbai/Delhi visually observed planet disappearance.

| 2026 Jupiter | Published start | Published end | Display timezone |
|---|---|---|---|
| [VedicMarga](https://vedicmarga.com/transit/jupiter/combust/) | Jul 14 **18:19** | Aug 13 **16:09** | **Nepal (NPT, UTC+05:45)** |
| [Swarn Siddhi](https://swarnsiddhi.com/griha-pravesh-muhurat/2026) | Jul 14 **18:04** | Aug 13 **15:53** | **India (IST, UTC+05:30)** |
| VedicMarga converted to IST | Jul 14 **18:04** | Aug 13 **15:54** | IST |

**Start gap 0 minutes; end gap 1 minute.** Swarn Siddhi labels a New Delhi context but calculates the conventional Jupiter Sun-within-11° event. VedicMarga gives a nonlocal, geocentric/sidereal fixed-angle combustion event from a Nepal-time transit table. Agreement suggests the fixed-angle family is being applied consistently to the published minute but neither explicitly documents mathematical identity of formula, planet source files, shared data pipeline or independence of software code.

For 2027, VedicMarga and Swarn Siddhi also publish matching **calendar dates** (Jupiter Aug 16–Sep 15, Venus Jul 6–Sep 17), but Swarn's cited 2027 intervals are **day-only**, and CANNOT verify minute precision.

## Key cross-method discovery: Mumbai Guru 2027
[VedicMarga 2027 Jupiter](https://vedicmarga.com/transit/jupiter/combust/) reports 2027-08-16 19:58 NPT to 2027-09-15 03:28 NPT, or **Aug 16 19:43 IST → Sep 15 03:13 IST**.

[Drik Panchang Mumbai 2027](https://www.drikpanchang.com/planet/asta/guru-asta-date-time.html?year=3206) reports **Aug 19 19:34 IST → Sep 13 05:46 IST**. The angular-vs-Drik signed gaps are:
- start **−4311 minutes** (nonlocal fixed angular event occurs more than 2 days before Drik observer-aware published start);
- end **+2727 minutes** (fixed angular event ends later than the Drik observer-aware end).

These are **cross-method temporal differences**, NOT errors in Drik or validation of a wedding prohibition. This agrees in sign and approximate size with the Wave 3O Swiss geometric ecliptic-longitude result (−4310/+2728 minutes relative to Drik), which helps isolate the divergence to **different event definitions** rather than a simple NPT/IST offset. Differences of one minute may be ephemeris, timestamp rounding, or model convention; avoid asserting exact computational identity.

## Wave 3R controls
- `lib/asta-global-angular-evidence.ts` validates dates, publisher/source URLs, declared precise time zone, fixed-angle evidence family, whether a source is nonlocal or city-labeled, and minute vs day-only precision.
- Explicit **NPT UTC+05:45 → IST UTC+05:30 (−15 minutes)** instant conversion, including civil midnight/year rollover; date-only references stay date-only.
- Sources with different domain names are distinct *publishers* but not automatically distinct calculation engines. Never upgrade these to the Wave 3N **city-specific, observer-pinned two-minute-source requirement**.
- `tests/fixtures/asta-global-angular-evidence.ts` contains sourced 2025–27 snapshots; not part of `tests/fixtures/asta-evidence-ledger.ts` city observer records and not imported by `lib/muhurat.ts`.
- `npm run audit:asta-angular-sources` creates `artifacts/asta-wave3r-independent-angular-sources.json` and is required by GitHub Quality, archived under `asta-wave3r-independent-sources`.
- Report always maintains `safeForCeremonyFiltering:false`, `validatedLocalObserverAstaCount:0`, `independentlyAuditedComputationCount:0`. Global angular date agreements cannot create a public Muhurat ban, auto penalty, canonical or indexed date page.

## What can be concluded today
* A 2026 Jupiter fixed angular window is **corroborated as published clock times** by VedicMarga and Swarn Siddhi, with minute 0/1 differences after normalization. This is significant progress on the *convention*. It does not independently prove methodology or sky visibility.
* 2027 fixed angular window dates have two publishing sources but only one minute-precision source. Do not upcast day-only to exact clocks.
* Drik's site itself explicitly distinguishes Surya Siddhanta approximate angular threshold from the publisher's location-dependent modern calculated Asta times. A two-day+ discrepancy with the fixed-angle family is method-dependent until shown otherwise, not a falsified site/calendar date.
* Independent same-city, same-event, pinned-observer time corroboration for PANCHVANI's target 2025–2027 ritual calendar remains **0/300**. No scientific or ritual "100%" accuracy claim.
* Date-only, cross-time-zone, different-city or different-event claims must never become ceremony suitability filters. All Wave 3Q and precomputed Muhurat data stay unchanged.

## Next remaining work
1. Acquire a second independently calculated, city-pinned Jupiter/Venus Asta reference with **identical event definitions**, preferably publicly documented code/algorithm and minute clocks.
2. Trace provenance of Swarn Siddhi and VedicMarga astronomy implementations, determine if they're independently derived, and verify traditional vs Drik observer mapping.
3. Provide uncertainty and method validation with multiple atmospheric/horizon conditions measured at the precise locality. Only then independently review ritual conventions, Lagna and `unknown | excluded | allowed`.
4. Complete Festival/Vrat and live GSC export investigation in issue #82. Passing source and SEO CI does not show real indexing recovery.
