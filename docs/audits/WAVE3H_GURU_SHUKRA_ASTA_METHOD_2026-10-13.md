# Wave 3H — Guru/Shukra Asta calculation-method audit (RESEARCH ONLY)

**Date:** 2026-10-13  
**Status:** Prototype proved **unsuitable for production ritual filtering**. No Muhurat, canonical, sitemap, city-index policy or astrology source data modified.

## Goal and method
A benchmark computes **geocentric true angular separation** of Sun and Jupiter/Venus from the project's existing Swiss Ephemeris Moshier engine, scans 2025–2027 at six-hour intervals and refines threshold crossings with bisection. It uses indicative traditional cutoffs:
- Jupiter: 11°;
- Venus in direct apparent longitude motion: 10°;
- Venus during retrograde longitude motion: 8°.

Venus' forward/retrograde distinction is documented in the [Drik Panchang Venus Asta explanation](https://www.drikpanchang.com/planet/asta/shukra-asta-date-time.html?year=2027). These are explanatory classic thresholds, **not a validated implementation of Drik's local apparent planetary observability rule**.

The prototype runs only in `scripts/planetary-asta-research.ts` under an isolated GitHub Actions workflow and produces `artifacts/planetary-asta-research.json`. It is *not imported* by runtime `lib/muhurat.ts`.

## Direct comparison: Guru Asta 2027, Mumbai

[Drik Panchang 2027 Guru Asta — Mumbai](https://www.drikpanchang.com/planet/asta/guru-asta-date-time.html?year=3206) explicitly lists:

| Boundary | Publisher Mumbai local time | Experimental model India local time | Difference (model − published) |
|---|---|---|---|
| Jupiter Asta starts | 2027-08-19 19:34 | 2027-08-16 20:56 | **−4,238 minutes (−2d 22h 38m)** |
| Jupiter Asta ends | 2027-09-13 05:46 | 2027-09-15 01:59 | **+2,653 minutes (+1d 20h 13m)** |

The primary evidence is a real GitHub Actions computation, [Wave 3H benchmark run](https://github.com/SviatF/chanag.xx/actions/runs/38437258740). **A multi-day difference is materially unsafe for deciding whether a ceremony may be recommended.** It is **not** an error in PANCHVANI's Tithi/Nakshatra sunrise engine; it exposes that *this simplistic Asta model cannot reproduce the selected publisher's distinct geographic/observability methodology*.

## Model predictions, NOT verified ceremonial dates
- Jupiter prototype 2025: June 9 17:46 IST to July 10 00:19 IST.
- Jupiter prototype 2026: July 14 18:23 IST to August 13 15:33 IST.
- Jupiter prototype 2027: August 16 20:56 IST to September 15 01:59 IST.
- Venus prototype 2025/26: November 26, 2025 15:30 IST to February 17, 2026 04:33 IST.
- Venus prototype 2026 (retrograde): October 21 20:30 IST to October 27 18:47 IST.
- Venus prototype 2027: July 6 20:45 IST to September 17 15:58 IST.

These are mathematical outputs from the **declared geocentric threshold model**, not validated Asta start/end dates. They must not be quoted as calendar truth or stored as production dates. A secondary corroborating source on an equivalent observer and convention is still absent.

## Root-cause hypotheses to test, not yet conclusions
1. Publisher uses a different observational/visibility model than a fixed great-circle separation.
2. Topocentric observer, planetary magnitude/atmosphere/refraction, solar depression and local visibility conventions may shift reported boundaries.
3. "Shishutva" (infant) and "Vriddhatva" (senior) customary intervals may extend exclusions beyond Asta proper, and thresholds may be asymmetric.
4. Zodiac/longitude-only angular measures do not equal 3D sky separation, especially for Venus at nonzero latitude.
5. Swiss Moshier vs publisher ephemeris, time scales and exact station/retrograde classification require cross-validation.

## Required next steps before any production exclusion
- Obtain and independently corroborate at least 2 suitably localized references each for Mumbai/Pune/Delhi/Chennai across 2025, 2026, 2027, including Shukra and Guru.
- Reconcile source methods explicitly and separately for Jupiter (11°) and Venus (10° direct / 8° retrograde); establish clock-boundary tolerance and policy on infanthood/seniority.
- Build a location-aware reference fixture suite for **all start/end instants**, including after-midnight local-civil dates, then validate a revised model and only *then* enable per-event, per-convention rule filters.
- Until such verification, show candidate times as **unverified for complete Panchang Shuddhi**, never a 100% ritual suitability claim.

### Audit acceptance
The workflow must create the report and print the published-versus-computed deltas. Passing the research workflow means the **computation executed**, not that the method matched an independent source; the report contains `safeForCeremonyFiltering=false` and mismatch flags. The Github artifact is intentionally retained for 30 days.
