# PANCHVANI source-comparison audit: Parana, Smarta/Vaishnava and Asta — 2026-10-27

## Source-published, New Delhi 2026-11, Devutthana
Drik Panchang Delhi locality-pinned published calendar:
- Smarta fast Nov 20; **Parana Nov 21 13:11–15:18 IST**; Hari Vasara ends Nov 21 12:07.
- Gauna/Vaishnava fast Nov 21; **Parana Nov 22 06:49–08:56 IST**; source says Dwadashi over before sunrise.
URL: https://www.drikpanchang.com/ekadashis/prabodhini/prabodhini-ekadashi-date-time.html?geoname-id=1261481&year=2026

Separate publisher ISKCON Delhi Temple:
- Utthana fast Nov 21; **Parana Nov 22 06:49–10:21 IST**.
URL: https://www.iskcondelhi.com/events/utthana-ekadashi-2026/

**DO NOT merge** 08:56 and 10:21. They represent different published cutoff rules. Agreement about Nov 21 fast and Nov 22 Parana dates is independent publisher corroboration; the full method and end-time cutoff do not agree. The runtime example is intentionally a source-publication comparison, **NOT a validated PANCHVANI Parana calculator**. Do not automatically extend to other dates/cities.

Independent follow-up: run GCal/ISKCON rule implementation for the same city and coordinates; confirm Mahadvadashi subtype logic, sunrise definition, Hari Vasara, Dwadashi crossover, Pratahkal and timezone with separate audit fixtures. Until then `actualFastDayCertified=false` and `paranaWindowCertified=false` for generated calendars.

## Delhi 2027 Asta publisher evidence (single source)
Drik Venus observer-locality page: 2027-07-21 05:08 through 2027-09-09 19:00 IST.
https://www.drikpanchang.com/planet/asta/shukra-asta-date-time.html?geoname-id=1261481&year=2027

Drik Jupiter observer-locality page: 2027-08-17 19:32 through "Sep 12 29:22+", meaning **2027-09-13 05:22 IST**.
https://www.drikpanchang.com/planet/asta/guru-asta-date-time.html?geoname-id=1261481&year=2027

**Caution:** these are single-publisher snapshots of observer-dependent Asta/visibility, *not* independent verified immutable geographic URL binding or measured astronomical conjunction. Earlier Wave 3S noted city-locale inconsistencies. Do not place these intervals into global wedding/house-entry prohibition rules. Need two genuinely independent minute-precision same-city/same-method local observer reports and an independent implementation, not fixed-angle sources.

## Scope
- Regresion tests enforce date, locality, non-identical Vaishnava/ISKCON cutoffs and 24+ hour conversion.
- No mass SEO changes, ritual eligibility release, V6 production promotion or automatic date selector.
