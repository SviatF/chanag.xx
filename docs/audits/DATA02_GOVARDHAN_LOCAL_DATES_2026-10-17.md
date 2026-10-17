# DATA-02 — Local Govardhan Puja dates, actual festival date correction

Date reviewed: 2026-10-17. Scope is **only** locally reviewed 2026 Govardhan Puja observations.

## Before → after

The maintained national/Delhi baseline record `govardhan-puja | 2026 | 2026-11-10` was universally applied to every city route and its `getPanchang()` call, even where the reviewed local observance was on November 9.

| City | Old city page | Reviewed local observance | Publication |
| --- | --- | --- | --- |
| Mumbai | 2026-11-10 | **2026-11-09** | Drik Panchang Mumbai, geoname 1275339 |
| Pune | 2026-11-10 | **2026-11-09** | Drik Panchang Pune, geoname 1259229 |
| Jaipur | 2026-11-10 | **2026-11-09** | Drik Panchang Jaipur, geoname 1269515 |
| Indore | 2026-11-10 | **2026-11-09** | Drik Panchang Indore, geoname 1269743 |
| Ahmedabad | 2026-11-10 | **2026-11-09** | Drik Panchang Gujarati Calendar Ahmedabad, geoname 1279233 |
| Delhi | 2026-11-10 | **2026-11-10** | Drik Panchang Delhi geoname 1273294; independently Prokerala Govardhan Puja for Ujjain (Nov 10, locality specific, not Delhi corroboration) |

Additional evidence of November 9 observance: the Indian Meteorological Department/PAC Kolkata's official Rashtriya Panchanga records national Govardhana Puja/Bali Puja on 2026-11-09, while its Kartika Sukladi is 2026-11-10. The reference rule in Drik differs by locality and ritual period. `Pratipada` starts 2026-11-09 ~12:31 IST and ends 2026-11-10 ~14:00 IST; a Nov 9 Mumbai festival page appropriately has **Amavasya at sunrise**, not an impossible assumed Pratipada.

## Exact implementation and bounds

`lib/festival-local-date.ts` stores city/year/date/source. `getFestivalForCity()` returns an immutable festival copy for city routes. Metadata and rendered SSR now compute *all* date-specific facts from it: local sunrise, sunset, Tithi, Nakshatra, festival lunar context, Rahu, local narratives, and existing self-canonical remains `/festivals/govardhan-puja/2026/<city>`.

The maintained Delhi baseline remains Nov 10. No edits to `lib/festivals.ts`, V5/DE440s calculation, rituals for other festivals, robots, sitemap, or other city dates. An **unreviewed** city remains on the default date but is not certified as locally correct. The source-reviewed local override prevents demonstrable false statements for 5 actual city pages; it is NOT a complete per-city festival rule engine.

## Regression and deployment

Run real-city astronomical regression and 3,326 sitemap-visible Next SSR quality scan. New tests require Mumbai 2026-11-09 sunrise `Krishna Amavasya` and Nov 10 `Shukla Pratipada`, and enforce local date propagation throughout city-route metadata/SSR. Existing independent Festival Truth Audit verifies maintained baseline dates, but **does not** certify all source-variant locality/ritual cases. Do not call every Festival date independently verified. Production HTML must be checked after merge.
