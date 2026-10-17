# Production data correction — UT vs ET in regional and lunar calendar conventions (2026-10-17)

## Actual incorrect calculation

Before this patch, `lib/panchang.ts` and `lib/vrat.ts` passed UT Julian days into `sweCalcUt` (the correct Swiss Ephemeris entry point), while `lib/calendar-conventions.ts` passed the same UT-valued Julian days into `sweCalc`, which **requires ET/TT**. See Swiss Ephemeris documentation: https://ephe.scryr.io/swisseph/doc/swisseph.htm and https://search.r-project.org/CRAN/refmans/swephR/help/swe_calc_ut.html. This causes a physical-time displacement by Delta-T. The impact is biggest at lunation/solar-ingress boundaries, not ordinary dates away from transitions.

## Actual code changed

- Use `sweCalcUt` for **all three** solar/lunar state queries in the shared calendar-conventions `stateFactory`. This corrects the time scale for Amanta/Purnimanta month state, Adhika checks, Chaitra/Gujarati Samvat year-search candidates, Bengali/Tamil/Malayalam solar Rashi and solar ingress timing.
- Remove the fabricated `baseJd + 0.25` sunrise and `baseJd + 0.75` sunset when Swiss Ephemeris fails. Share the same `requireSolarEvent` validator used by production Daily, including the exact India civil-date check. Do not generate false calendar values for an unknown solar clock.
- Require regional sunrise to be earlier than regional sunset and within the local civil solar day. No calendar values are defaulted from mock hours.
- Add a **physical regression** for Mumbai Tula Sankranti on 2026-10-17: independently solve the sunrise-independent, same-model **UT** solar longitude crossing, require the returned ingress minute to round to within 30.5 seconds. External check for approximate local timing: Drik Panchang Mumbai October 17 shows Kanya until 19:57 IST (https://www.drikpanchang.com/panchang/month-panchang.html?geoname-id=1275339), though method/ayanamsa differences must not be mistaken for exact clock equality.
- Block accidental reintroduction of `sweCalc` or fabricated 06:00/18:00 fallbacks.

## Scope and limitations

This is a **genuine time-scale correctness fix**, not a conversion to JPL DE440s. Public Daily `getPanchang` stays V5 and unchanged; V6 remains a versioned research source awaiting full sidereal/ritual reconciliation. Festival date ledgers, Vrat eligibility and precomputed V5 Muhurat shards are deliberately not rewritten. An exact city/day audit and production worker deployment are needed for a release claim. This fix does not certify all site content, all Hindu month rules or any Muhurat suitability.

**Acceptance criteria:** relevant regression, full 3,326-page rendered sitemap similarity/SEO/data checks, production build; no unsupported content or robots changes.
