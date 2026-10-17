# DATA-01 — Actual correction to physical Moon illumination (17 October 2026)

## Incorrect production result
Prior `lib/panchang.ts` calculated `moonIllumination` as `round(50 × (1 − cos(MoonLongitude − SunLongitude)))`. This is geocentric longitude-only lunar elongation, **not** physical illuminated fraction. It ignores ecliptic latitude and distances, and can publish a demonstrably wrong percent. The value flows to Daily, knowledge/local context and other UI as an actual numerical datum, not merely SEO text.

## Correct algorithm
Evaluate tropical geocentric `sweCalcUt` Sun and Moon positions at **exactly local sunrise Julian UT** with production's current Moshier flags and convert (ecliptic longitude, latitude, distance in AU) into the physical Sun-Moon-Earth phase angle. Illuminated fraction is `(1+cos(phaseAngle))/2`. Input validity fails closed for impossible ephemeris state. This preserves **ALL** current V5 Tithi, Nakshatra, Yoga, Karana, Sunrise, Moonrise, regional ritual convention, cache schema and sitemap/index rules. No V6 activation.

## Independent evidence
Reference oracle: native Swiss Ephemeris C via `pyswisseph 2.10.03`, `swe.pheno_ut(julday(year,month,day,1.0), swe.MOON, swe.FLG_MOSEPH)[1]`. All dates at **01:00 UT** (06:30 IST), with independent `swe.calc_ut(..., FLG_MOSEPH)` physical vectors recorded in `tests/lunar-illumination-physical.test.ts`. A separate live Mumbai local-sunrise test proves the actual production function changes, not just presentation.

| India date | Old longitude-only rounded | Native Swiss physical at 06:30 IST | Expected physical rounded |
|---|---:|---:|---:|
| 2027-01-15 | 41% | 41.58312% | 42% |
| 2027-10-29 | 0% | 0.53528% | 1% |
| 2026-10-13 | 6% | 6.03480% | 6% |
| 2026-09-09 | 6% | 5.60332% | 6% |
| 2026-11-08 | 2% | 1.73191% | 2% |

Precise sunset/sunrise instants vary by city; oracle input date/time and live-city test are explicitly separated. **This is one proven numeric correction, NOT a certification of festival/Vrat/Muhurat or whole-calendar truth.** Reference mathematics: Meeus `Astronomical Algorithms`, lunar illuminated fraction; Swiss Ephemeris `swe_pheno_ut` planetary phenomena documentation.

## Safe deployment gates
- `npm test` and Next reference build must pass.
- 3,326 indexed pages must pass existing no-duplicates and local-fact checks.
- The live function for Mumbai 2027-01-15 must yield 42%, and 2027-10-29 must yield 1%.
- Do not merge on CI failure, do not hide or normalize misreported astronomy to satisfy text uniqueness thresholds.
- Confirm separately that Cloudflare production deployment finished and new HTML is visible.
