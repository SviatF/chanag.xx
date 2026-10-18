# DATA-03 — Correct festival date cross-page propagation (17 October 2026)

## Confirmed production contradiction
DATA-02 already corrected the `govardhan-puja/2026/{city}` route to **9 Nov 2026** for Mumbai, Pune, Jaipur, Indore and Ahmedabad, using independently reviewed local Drik Panchang observations (see `tests/fixtures/govardhan-2026-local-date-sources.ts`). Delhi's general source date remains **10 Nov 2026**.

However `app/page.tsx`, `app/calendar/[city]/[year]/[month]/page.tsx` and `app/calendar/[city]/[year]/page.tsx` still read **the baseline 10 Nov festival record for EVERY city** from `festivalsForYear`, while the corrected festival city page used `getFestivalForCity`. This created direct contradictions for users browsing monthly/yearly calendars, local month tiles and the homepage's "upcoming" festival.

## Actual code repair
- `getCalendarFestivalsForCity(year,city)` is the single source for city-facing **homepage month grid, city-month and city-year calendars**. It applies only the five already reviewed Govardhan city/date overrides.
- `nextFestivalForCity(date,city)` finds the chronological next city-observance, using actual `Asia/Kolkata` date. This prevents a city homepage from showing 10 Nov while its own festival page correctly says 9 Nov.
- `nextValidatedFestival` also uses India local date rather than UTC midnight.
- **Two traditions are not one date:** Drik Panchang Kolkata <https://www.drikpanchang.com/festivals/vijayadashami/vijayadashami-date-time.html?geoname-id=1275004&year=2026> confirms general Vijayadashami/Dussehra **20 Oct** and *Bengal Vijayadashami* **21 Oct**. The official Bengal-rule page <https://www.drikpanchang.com/festivals/vijayadashami/bengal/vijayadashami-date-time.html?geoname-id=1275004&year=2026> confirms the latter separately. The previous Kolkata city page correctly described the variant, but city monthly/yearly calendars and homepage didn't show it. A **separate dated regional marker** is now present. Crucially, no national Dussehra value is rewritten to 21 Oct; the generic parent remains 20 Oct.
- Both dated event markers share the Dussehra source slug only as an existing navigation target and have unique dated React keys; their names and calendar facts are distinct.

## Specific before/after
| Surface | Mumbai/5 reviewed Govardhan before | After | Kolkata variant before | After |
|---|---|---|---|---|
| Festival city detail | 9 Nov (already corrected) | 9 Nov | General 20 Oct + regional notice 21 Oct | unchanged |
| City monthly calendar | **10 Nov (wrong)** | **9 Nov** | 20 Oct only | 20 Oct + Bengal 21 Oct |
| City yearly calendar | **10 Nov (wrong)** | **9 Nov** | 20 Oct only | 20 Oct + Bengal 21 Oct |
| City homepage month grid | **10 Nov (wrong)** | **9 Nov** | 20 Oct only | 20 Oct + Bengal 21 Oct |
| Next festival on selected city's homepage | **10 Nov (wrong for western cities on 9 Nov)** | **9 Nov** | Bengal 21 Oct invisible | Bengal 21 Oct shown after India local midnight |

## Scope and safety
No V5/JPL ephemeris changes, month selection inference outside reviewed cities, arbitrary new festivals, SEO index expansion, Tithi/Nakshatra manipulation, or Muhurat ritual certification. Run full existing tests, Festival Truth Audit and 3,326-page rendered quality gate before merging. Annual records not independently confirmed by a second publisher stay unverified. Source dates should not be conflated across tradition families.
