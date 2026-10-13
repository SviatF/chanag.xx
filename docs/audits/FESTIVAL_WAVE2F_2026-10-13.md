# Wave 2F — Janmashtami and Diwali factual eligibility audit

Scope: 2 observances × 2 years × 25 active cities = **100 city-date cases**.

## Critical facts
- **Janmashtami 2026, Delhi:** Nishita 23:57–00:43 (Sept 4/5) but
  Ashtami ends near 00:13 Sept 5. Only a *partial* lunar/Nishita overlap.
- **Janmashtami 2027, Delhi:** Ashtami ends near 19:19 Aug 25,
  before Nishita ~00:01–00:45 Aug 26. No lunar/Nishita overlap.
  The festival date is still valid under local observance conventions.
  Do not invent a full Ashtami/Nishita Muhurat or change the festival date.
- **Diwali 2026, Delhi:** Amavasya begins ~11:27 Nov 8 and ends
  ~12:31 Nov 9, fully covering the evening Pradosh (~17:31–20:09).
- **Diwali 2027:** Amavasya ends ~19:05 Oct 29, during Pradosh;
  the remainder of evening is *not* Amavasya/Pradosh overlap.
- Pradosh is derived from local sunset and one-fifth of computed night
  rather than a city-independent 144-minute placeholder.
- For Diwali, the reported overlap is not **Sthir Lagna** or a
  certified Lakshmi Puja Muhurat because no ascendant calculation exists.
- Janmashtami Smarta/Vaishnava differences and Rohini/parana rules are
  not automatically reduced to one national date/time.

## Implementation
New `festivalNightEligibility` uses festival sunrise Panchang plus next
day sunrise to establish the first lunar transition and the following
Tithi interval. It crosses civil midnight with explicit IST dates.
If two-sunrise evidence does not establish the relevant lunar span,
the result is `unverified`, without manufacturing an overlap.

## External source records
- https://www.drikpanchang.com/dashavatara/lord-krishna/krishna-janmashtami-date-time.html?geoname-id=1261481&year=2026
- https://www.drikpanchang.com/dashavatara/lord-krishna/krishna-janmashtami-date-time.html?geoname-id=1261481&year=2027
- https://www.drikpanchang.com/festivals/lakshmipuja/festivals-lakshmipuja-timings.html?geoname-id=1261481&year=2026
- 2027 local 19:05 Amavasya end cross-checked on regional Lakshmi Puja calendar.

## Open follow-ups
Full Sthir Lagna, temple-specific Rohini/parana and personal horoscope
eligibility remain outside this patch. Those must not be presented as
fully certified ritual windows. No sitemap/city/indexing changes.
