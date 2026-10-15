# PANCHVANI — Wave 3AR exact transition-clock reconciliation and release decision register

**2026-10-15.** Production remains Swiss/Moshier V5; JPL DE440s V6 remains **research-only**. Wave 3AQ established **497,584 actual city/date sunrises** across 454 unique Indian cities for 2026–2028, but only **53,491** of those city/dates were independently compared to Swiss/Moshier lunar/sidereal values, selected by ±10-minute event risk plus independent periodic controls. **Neither coverage nor difference counts prove that every ritual date is correct.**

## Actual observed Wave 3AQ classification differences

All 2,562 stored source mismatches for the three years are in the original complete, uncapped 3AQ evidence (2026=577, 2027=1,029, 2028=956). They cover **2,179 distinct (city, civil date)** observations; multiple different fields can disagree on one city/date. By family:

| Family | V5/JPL mismatches | Largest distance to nearest JPL event |
|---|---:|---:|
| Half-Tithi / Karana | 514 | 44 seconds |
| Moon Pada | 1,030 | 66 seconds |
| Nakshatra | 253 | 63 seconds |
| Yoga | 578 | 147 seconds |
| Moon Rashi | 120 | 66 seconds |
| Solar Rashi | 67 | 598 seconds |

**Solar Rashi is the unusual case**: all 67 mismatches occur on **2027-03-15 (10 cities)** and **2027-07-17 (57 cities)**. The highest-risk discrepancies reach nearly 10 minutes rather than ordinary seconds at the JPL boundary. These are actionable global root-clock comparison cases, not 67 independent solar-model mistakes. Changing Lahiri conventions without independent scientific agreement could shift regional festival or Sankranti logic.

## What Wave 3AR implements

1. For **every** published JPL DE440s 2026–2028 Tithi-half-phase, Nakshatra/Pada, Yoga, Moon Rashi and Solar Rashi event timestamp, solve an **actual Swiss/Moshier continuous-coordinate crossing** using `sweCalcUt` at the same UT and `SE_SIDM_LAHIRI` (for sidereal families). No sunrise interpolation, rounded clock strings or guessed root offsets. Bound with ±30 minutes and bisect to better than 0.1 seconds.
2. Record per-family signed and absolute UTC model-clock residuals, year coverage and every physical transition exceeding 2 minutes. A missing crossing in ±30 minutes **fails** rather than being silently treated as data agreement.
3. Download all three genuine 3AQ yearly city-day reports from the **same run** (not unrelated samples) and independently audit **every** stored mismatched field row: correct city/date year, source SHA, modulo-adjacent classification, distance to actual JPL event, no >10-minute differences, family totals exactly matching the source year's aggregate; preserve distinct city/date counts and two 2027 solar date clusters.
4. Publish high-priority review queues and residual metrics as research artifacts. Never automatically rewrite V5, Vrat, Parana, Sankranti, Muhurat or Hindu Month/Samvat based on whichever ephemeris looks newer. Code is gated by CI and unit tested for zodiac wrap and physically meaningful UTC bisection.

The official Swiss Ephemeris Programming Guide describes **SE_SIDM_LAHIRI** and alternative sidereal coordinate-frame modes: https://www.astro.com/swisseph/swephprg.htm . The 3AR comparison keeps that same convention on both sides to isolate **ephemeris-clock** differences, but is **not an independent ayanamsa certification**. The underlying Lahiri 6-hour anchors still originate from Swiss/Moshier.

## Release decision register

- **Astronomical physical root times:** review quantified signed JPL-vs-Swiss differences first, with particular attention to 2027-03-15/07-17 solar transitions; assign source/convention/model explanation and reproducibility evidence, not a generic green badge.
- **Ayanamsa policy:** choose an explicitly named astronomical frame and independently verify at boundary instants. `SE_SIDM_LAHIRI`, True Chitra, IAU frame choices, mean-vs-apparent treatment, Delta-T and sunrise model are not interchangeable.
- **Dependent day selection:** only after frame review, recompute Hindu Month/Adhika/Samvat, all Vrat/Parana, Festival/Sankranti, Guru/Shukra Asta and wedding/Griha Muhurat **from one versioned source**; require regional/ritual policy review. Individual days may be correct on V5 or V6 without a blanket migration.
- **Production:** no V6 release, no indexable-page regeneration or cache invalidation until exact provenance and dependent ritual gates pass. Public V5 and SEO controls remain unchanged.

**Wave 3AR is a concrete scientific reconciliation step, not a claim that all religious calendar recommendations are certified.**
