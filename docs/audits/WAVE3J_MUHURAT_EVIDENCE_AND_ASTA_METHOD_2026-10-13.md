# PANCHVANI Wave 3J — Ceremony evidence status and incompatible Guru/Shukra Asta methods

**Date:** 2026-10-13 · **Change scope:** source-specific trust labels, comparison fixtures and regression protection. No invented ritual date or index/noindex expansion.

## Confirmed systemic data presentation issue
The monthly and annual Muhurat pages ranked algorithmic `Tithi + Nakshatra` candidates at up to 100/100 (grades such as "Excellent"). Those numeric scores are derived from **window availability and favorable clock labels**, **not** independent clearance of local Guru/Shukra Asta, Lagna, calendar prohibitions or a family's ritual practice. Although a lower-page caveat existed, a visitor could reasonably mistake the rank for an actual certified Muhurat.

**Fix:** for every non-closed city-month, Mumbai-baseline month and yearly listing show an early visible event- and locality-aware notice: **Astronomical candidates · NOT verified ceremony dates**, define the 100-point metric, list the missing ritual checks, and point to the detailed Panchang. For a reviewed customary Marathi closure, the already existing `VerifiedMuhuratClosurePage` remains authoritative for that convention. No score manipulation and no new exclusion. A closed Maharashtra month is **not** a nationwide prohibition.

## Verified Asta source-method conflict

| Planet | Year | Reference locality | Publisher | Precision | Reported start | Reported end | Selection method |
|---|---|---|---|---|---|---|---|
| Guru / Jupiter | 2027 | Mumbai | Drik Panchang | Minute | Aug 19, 19:34 IST | Sep 13, 05:46 IST | Observer/location-aware |
| Guru / Jupiter | 2027 | Kolkata | Drik Panchang | Minute | Aug 18, 18:39 IST | Sep 13, 04:42 IST | Observer/location-aware |
| Guru / Jupiter | 2027 | New Delhi | Birthastro | Date only | Aug 16 | Sep 15 | Not disclosed |
| Guru / Jupiter | 2027 | New Delhi | Swarn Siddhi | Date only | Aug 16 | Sep 15 | Declared fixed angular cutoff |
| Shukra / Venus | 2027 | Wardha, Maharashtra | Drik Panchang | Minute | Jul 22, 05:20 IST | Sep 5, 18:52 IST | Observer/location-aware |

Source URLs are stored with every record in `tests/fixtures/planetary-asta-2027-provenance.ts`. Publication snippets were checked October 13, 2026. **Caution:** Drik's dynamic pages may select the observer based on cookies or location; preserve publication-location metadata with each snapshot and do not assume a bare URL will reproduce the same city in another browser.

- [Drik Guru Asta 2027 Mumbai](https://www.drikpanchang.com/planet/asta/guru-asta-date-time.html?year=3206)
- [Drik Guru Asta 2027 Kolkata](https://www.drikpanchang.com/planet/asta/guru-asta-date-time.html?year=2216)
- [Birthastro Guru Asta 2027 Delhi](https://www.birthastro.com/planet/combustion/guru-asta-dates-2027)
- [Swarn Siddhi Griha Pravesh August 2027 / combustion report](https://swarnsiddhi.com/griha-pravesh-muhurat/2027/august)
- [Drik Shukra Asta Wardha 2027](https://www.drikpanchang.com/planet/asta/shukra-asta-date-time.html?lang=en&year=4898)

**Critical distinction:** two independently published **date-only** entries for Delhi are not equivalent to two **minute-precision** sources for Mumbai. Neither can validate an exact transition for another city. The previously implemented geocentric 11° Swiss Ephemeris threshold benchmark is **~3 days earlier than Drik's Mumbai start and ~2 days later at end**; its predictions remain `safeForCeremonyFiltering:false`.

## Strict automatic approval gate
The Wave 3J `assessAstaEvidenceForFiltering` fixture assessor will **never** report that an Asta method is ready for ceremonial filtering unless at least two independent, same-locality **minute-precision** sources are provided with compatible methodology. Even two such sources would only permit further *model comparison*, not immediately approve runtime ceremony dates. Current result: **no site location is ready**.

The evidence fixture is **test-only**. No imported production `GuruAsta` / `ShukraAsta` dates, no unexplained global day exclusions, and no changes to V3 Muhurat precomputed shards.

## SEO/GSC
GitHub SEO Quality CI and sitemap structural checks are not Search Console coverage data. The GSC Wizard connector returned `payment_required` on the 2026-10-13 audit; therefore 716 reported `noindex` URLs and a 99.81% visibility loss cannot be independently verified from the service today. The repo already contains `scripts/gsc-indexing-export-audit.mjs` to compare a user-provided GSC URL export with the live sitemap. Do not alter index/noindex at scale without the actual export and page performance history.

## What's needed to finish verified Asta
1. Establish for each city and 2025–2027 year two or more independent **same-city minute-precision** interval references for both Shukra and Guru, with observation convention defined. Current ledger is nowhere near full coverage.
2. Reconstruct an observational method (not merely geocentric ecliptic separation) and benchmark the *same city's* exact sunrise/dusk and visibility logic. Record independent residuals in minutes, including Venus direct/retrograde stations.
3. Test regional wedding and Griha Pravesh month restrictions, muhurta lagna and Yoga/Karana suitability, including community exceptions and cross-midnight cases.
4. Only after adequate verification, introduce an event/city/convention-specific `allowed | excluded | unknown` eligibility engine and add complete date-level sources. `unknown` MUST NOT be silently treated as `allowed`.

## Acceptance
- Regression tests require three visible early warnings, existing customary closures unchanged, and source-evidence validation explicitly refusing Delhi day-only sources for Mumbai minute-specific rules.
- Full CI/Vinext build and 3,326-URL SEO corpus audit stay clean; no robots/sitemap expansion.
- This wave fixes **misleading confidence claims** and improves source rigor. It does **not** certify all Muhurat dates, calibrate a working Asta filter, or explain GSC ranking changes.
