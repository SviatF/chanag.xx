# Wave 2C — targeted high-value truth audit

## Speed-first approach
Do not repeat generic prose. Add source-backed observations in a single PR, then
only one full production CI + festival matrix (both start automatically).

## 2027 source-backed annual register
All 19 maintained festival dates have been transcribed/checked against the 2027
Delhi Hindu calendar https://www.drikpanchang.com/calendars/hindu/hinducalendar.html?geoname-id=1273294&year=2027.
**Important:** 19 observations share ONE publisher and ONE location; do not imply
they are 19 independent astronomic witnesses. Publication gate still disallows 2027.
Date source is an audit fixture, not an automatic external scrape during builds.

## Selected 2026 cross-checks
Additional festival-specific sources for Chaitra Navratri, Akshaya Tritiya,
Ganesh Chaturthi, Vijayadashami and Diwali. Other 2026 festival dates remain
unverified by this fixture set and stay in audit backlog.

## Confirmed regional distinction
Source Kolkata Vijayadashami 2026 page:
https://www.drikpanchang.com/festivals/vijayadashami/vijayadashami-date-time.html?geoname-id=1275004&year=2026
General Vijayadashami: 2026-10-20.
**Bengal Vijayadashami in Kolkata: 2026-10-21.**
The Kolkata city route now exposes the separately observed regional date while
retaining the original primary festival entity and URL. Avoid applying this
specific-year rule to other years or unverified cities.

## Still unresolved
- Remaining 2026 source comparisons, other regions/traditions (including
  Janmashtami Smarta vs ISKCON) and ritual-specific eligibility (Bhadra,
  Nishita/Ashtami, Pradosh+Amavasya+Lagna) are NOT yet certified.
- Do not promote `festivalPujaReference` heuristic times to verified ritual Muhurat.
- Maintain 3350 sitemap URLs, no new index years/cities, no disclaimer boilerplate.
