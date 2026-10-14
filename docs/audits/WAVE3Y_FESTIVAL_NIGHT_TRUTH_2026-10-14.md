# PANCHVANI Wave 3Y — festival night truth labels and no false ritual certification
**Date:** 2026-10-14. **Scope:** narrow editorial and regression-safety correction, **not** a change to astronomical data or ritual date selection.

## What changed
1. The public city Janmashtami/Diwali page now uses **Calculated Tithi overlap**, rather than **Verified Tithi overlap**. A software-derived Ashtami/Nishita or Amavasya/Pradosh intersection cannot certify a traditional fasting day or a Puja Muhurat.
2. The typed `FestivalNightEvidence` result exposes four explicit `false` assertions: `observanceDateCertified`, `fastingDayCertified`, `pujaWindowCertified`, `paranaCertified`. Every outcome (`full`, `partial`, `none`, `unverified`) carries the same research-only limitations.
3. For **Janmashtami 2027**, when local computed Ashtami does not overlap calculated Nishita, the UI explicitly states that this is **not** proof the published festival date is wrong. A non-overlap is a mathematical observation, not a standalone Smarta or Vaishnava observance selector.
4. Regression tests enforce the above claims on real 2026/2027 Delhi cases and on unresolved data.

## External rule distinction
- Drik Panchang [Janmashtami 2027](https://www.drikpanchang.com/dashavatara/lord-krishna/krishna-janmashtami-date-time.html?geoname-id=1253079) explains that Smarta festival-day selection gives special consideration to Nishita and Rohini, while Vaishnava observance uses different preferences. It explicitly distinguishes the festival date and fasting-day conventions, and also gives separate Parana requirements.
- Drik Panchang [Ekadashi FAQ](https://www.drikpanchang.com/faq/ekadashi/about-ekadashi-timings.html) distinguishes Tithi begin/end clocks from the chosen fasting date and from next-day Parana. This reinforces that sunrise Tithi alone is insufficient as a ritual fast selector.
- These are **one publisher's explanations** of method; the project does not claim a second independent city-matched verification or reproduce this publisher's proprietary selection algorithm.

## Deliberately unchanged
- No production festival year/date `lib/festivals.ts` update.
- No `lib/panchang.ts`, `lib/vrat.ts`, city computations, or V5 Muhurat shards changed.
- No fast-day, Parana, Sthir Lagna, Rohini, or Smarta/Vaishnava rule algorithm added.
- No sitemap, robots, canonical, SEO policy, or 2027 city index-gate change.
- Existing Asta 0/300 observation gap and 31/38 primary-only festival date evidence remain unresolved.

## Gate
`npm test` includes `tests/festival-night-eligibility.test.ts`, asserting the 2026 partial / 2027 none Janmashtami distinction, Diwali full/partial cases, all four false certification fields, and the public page claim. Merge only after successful exact-head Panchang Quality + relevant build checks; CI correctness does **not** independently certify religious practice.
