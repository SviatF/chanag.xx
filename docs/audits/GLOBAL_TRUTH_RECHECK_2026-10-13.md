# PANCHVANI — Independent Data-Truth Audit, Wave 3D
**Date:** 2026-10-13  
**Reference main before this audit:** `b0a30a0dcbe4b779650ceb721765b1f1169a7d7c`  
**Scope:** all source-code families inspected; targeted external Panchang/Festival/Muhurat comparisons; census of all **338 precomputed city-month datasets × six events** with visibility into gaps.  
**Not a certification:** 3,350 indexed/rendered URLs cannot be independently verified using a handful of reference fixtures or full-site duplication tests.

## Severity and discrepancies

| URL / family | Problem | Expected / reviewed | Observed in source or public crawler | References | Priority / state |
|---|---|---|---|---|---|
| `/muhurat/wedding/2026/10/mumbai` | Public crawler shows **5 ceremonial candidate dates** including October 12, 100/100 | **0** for customary Marathi Vivah calendar during Chaturmas, with clear tradition caveat | GitHub main routes to correct Chaturmas closure component, but a web crawler response dated Oct 13 retained the old ranking page. Mismatch likely stale route cache/edge/static generation, **not yet conclusively attributed** to an infrastructure layer | [Marathi Vivah 2026](https://www.hindu-blog.com/2025/05/marathi-vivah-muhurat-in-2026-marriage.html); [Drik Panchang Maharashtra marriage calendar](https://www.drikpanchang.com/shubh-dates/shubh-marriage-dates-with-muhurat.html?lang=en&rd=0); [LivePanditJi](https://www.livepanditji.com/muhurat/marriage/october-2026/); conflicting [AstroSage](https://t.astrosage.com/2026/marriage-muhurat-2026.asp) | **P0** live recheck; don't claim propagation until clean |
| `/muhurat/wedding/2026/08/mumbai`, `/09/mumbai` | Former candidate rankings | 0 for reviewed customary Marathi convention | Both public-crawled routes now show zero and Chaturmas explanation | Same Marathi calendar + Maharashtra references | Passed public crawler (specific observations only) |
| `/muhurat/wedding/2026/10/pune` and other Maharashtra cities | No independent ceremony eligibility gate (while Mumbai has one) | Must follow **explicitly specified** customary/local tradition and astronomy | Generic Tithi/Nakshatra/daytime ranking; candidate dates in cited review period may be false ceremonial suggestions | Marriage methodology [Drik](https://www.drikpanchang.com/shubh-dates/shubh-marriage-dates-with-muhurat.html?lang=en&rd=0), Mumbai convention evidence; other cities not personally verified | **P0** evidence & city/tradition reconciliation, then scoped correction |
| Other `/muhurat/wedding/{year}/{month}/{city}` 2025–2028 | **Systemic absence** of region/tradition-specific month, Guru/Shukra Asta, Yoga/Karana, Lagna gating | Verified Panchang Shuddhi per source+ceremony | `lib/muhurat.ts` only checks sunrise Tithi+Nakshatra and local favorable periods; closure gate exists for Mumbai 2026 08–10 only | [Drik methodology](https://www.drikpanchang.com/shubh-dates/shubh-marriage-dates-with-muhurat.html?lang=en&rd=0) | **P0** unreviewed |
| `/muhurat/griha-pravesh/`, `/vehicle-purchase/` | Partial ceremonial eligibility; same scoring engine | Tradition/event-specific month, planetary and Yoga/Karana checks | Same generic lunar/time filter across event variants; score is an availability index, not a religious verdict | Source code; vendor ritual methods not reconciled | **P1** unreviewed |
| `/panchang/mumbai/2026-10-13` | External time-comparison variance | Tritiya, Vishakha, Priti, Taitila; sunrise 06:32; tithi until ~23:27; nakshatra until ~01:43 next date | PANCHVANI sunrise 06:32, Tritiya 23:29, Vishakha 01:45, Priti, Taitila: **1–2 min difference**, no categorical error | [Drik Mumbai daily](https://www.drikpanchang.com/marathi/panchang/marathi-day-panchang.html?geoname-id=1275339), [VedicSpace Mumbai](https://vedicspace.com/panchang/mumbai/2026-10-13/) | **P1** cross-source accepted only for this day |
| `/panchang/delhi/2026-10-13` | External time-comparison variance | Sunrise 06:20, Tithi ends 23:27, Nakshatra 01:43 next day, Rahu 15:00–16:27 | PANCHVANI sunrise 06:21, Tithi ends 23:29, Nakshatra 01:45, Rahu 15:01–16:27: **within ~2 min** | [Drik Delhi](https://www.drikpanchang.com/panchang/month-panchang.html?geoname-id=997719), [LivePanditJi Delhi](https://www.livepanditji.com/panchang-in/delhi/october-2026/13/) | **P1** covered by new regression |
| `/festivals/ganesh-chaturthi/2026/mumbai` | Source spot-check | 14 Sep 2026, Mumbai | `lib/festivals.ts` lists 14 Sep | [Drik Ganesh Mumbai](https://www.drikpanchang.com/festivals/ganesh-chaturthi/ganesh-chaturthi-date-time.html?geoname-id=1275339&year=2026) | Spot-check agreement; second festival-specific independent source pending |
| `/festivals/dussehra/2026/kolkata` | Distinguish India Vijayadashami from Bengal Vijayadashami | 20 Oct 2026 general, **21 Oct 2026 Bengal** | `lib/festival-regional-observances.ts` explicitly distinguishes both | [Drik Kolkata](https://www.drikpanchang.com/festivals/vijayadashami/vijayadashami-date-time.html?geoname-id=1275004&year=2026) | Spot-check agreement, further sources pending |
| `/calendar/{city}/{year}/{month}` and `/regional/` | Year/locality calendar convention differences | Amanta Maharashtra/Gujarat; Purnimanta North; Tamil/Malayalam solar | `calendar-conventions.ts` and `regional-calendar.ts` include distinct systems; not all 2025–2027 month boundaries externally checked | Drik regional conventions; source code | **P1** verify edge transitions, do not rewrite blindly |
| Search Console `noindex` group | User reports **716** excluded URLs, and **99.81%** visibility decline | Actual Google coverage state, traffic history, 200/canonical and page-quality triage | Unconfirmed: GSC Wizard access returned `payment_required` in earlier attempt. CI's 3,350 URL sitemap checks do not contain Google's 716 excluded list. | Verified GSC export still required | **P1**, no blanket robots/sitemap changes |

## Independent astro regression fixture
Added two dated, city-specific 2026-10-13 references to `tests/fixtures/panchang-reference.ts`: Mumbai and Delhi. Each record includes external source provenance, matching Tithi/Nakshatra/Yoga/Karana, sunrise/sunset, local Rahu/Yamaganda/Gulika, Abhijit, and lunar transition times. Comparator allows **≤2 minutes** for reference-method differences, not fabricated equality. Existing tests already check 2026-09-09 in Mumbai/Delhi/Bengaluru/Guwahati.

These tests verify a **sample**, not the correctness of every Panchang row. To obtain high confidence across all cities, scale reference fixture coverage to (city × solar season × Amanta/Purnimanta month shift × skipped/repeated Tithi × transition near sunrise × Yoga/Karana boundary).

## Source-methodology divergences — do not hardcode from headlines
- **Shukra Vakri (retrograde) is NOT Shukra Tara Asta (combustion).** Drik explicitly uses angular separation and location-dependent Asta conventions. Independent published dates for 2026 differ: Drik 2026 Asta may begin around Oct 5 and end around Oct 30 in a foreign-location result, while another provider quotes an Oct 19 start. Neither can safely be used as Mumbai's precise wedding rule without calendar method, city and source review.
- Chaturmas and customary marriage prohibitions are **community/tradition dependent**, not identical across all India. Exact 2025, 2026, 2027 eligibility release requires vetted dates and local method.
- There is external **disagreement** on October 2026 marriage dates (not universal zero according to all sources). The existing Mumbai closure is explicitly named customary Marathi, not a universal ban.
- Festival and Vrat registries may be internally consistent while some calendar observance choices are wrong by a civil date; 38 festival records with one source per record are **not 38 independently cross-verified records**.

## New quantified systematic Muhurat reporting
`scripts/muhurat-truth-audit.ts` now reports `ritualCoverage` separate from `screenedDates`, and records:
- all current custom-reviewed closure event-city-months;
- unreviewed event-city-months and number of unreviewed date candidates grouped by event;
- potential Maharashtra customary Chaturmas risk examples for other cities, without automatically editing them;
- underlying V3 window bounds and score consistency as before.

The **unreviewed** state is mandatory; do not interpret 0 internal test errors as full ceremonial verification.

## Live deployment integrity
`scripts/live-ritual-truth-audit.mjs` reads all six user-facing Mumbai wedding closure HTML routes (Aug/Sep/Oct × city/baseline) and records HTTP status, real body assertions, cache headers and worker version. A separate read-only GitHub workflow can run manually or daily and captures JSON evidence. This detects public HTML regressions **after** deployment rather than just checking locally built Next.js output. It does not alter production or index settings.

## Fix plan (no bulk unsourced changes)
1. **P0:** Diagnose October 2026 old public HTML via the live semantic audit from a clean GitHub runner plus regional curl/headers; separate outdated web-crawl cache from actual server output. If production returns stale HTML, address Worker/route ISR cache and redeploy only after reproducing issue.
2. **P0:** For 2025–2027 wedding calendars collect 2–3 independent and correctly located references per state/tradition/month; record disagreement; implement explicit eligibility evidence (allowed/blocked/unknown) rather than assuming unspecified = allowed.
3. **P1:** Regional solar/lunar marriage rules, Guru/Shukra Tara Asta, Adhika/Kshaya Maas, prohibited Yoga/Karana, Lagna and date-at-sunrise vs date-at-evening decisions. Distinguish ritual exclusions from generic clock sources.
4. **P1:** Compare independent exact local Panchang figures for sample days from each season × city group and edge dates; then modify algorithms only on proven differences.
5. **P1:** Festival ritual-date and Vrat ritual rules per city/tradition; sources ledger 2–3 independent per rule. Avoid invented exact puja windows.
6. **P1 SEO:** Import actual GSC Coverage/noindex export and historical Search Analytics, reconcile exclusion reasons and canonical before sitemap/index changes. No causal claim for 99.81% decline until evidence.
7. **P2:** Rewrite only verifiably wrong text, eliminate misleading 100/100 ceremonial certainty; retain useful zero-date explanation and explicit convention. Human review before mass SEO activation.

## Post-change acceptance
- New regression fixtures pass with correct actual ephemeris output and ≤2-minute tolerance.
- Muhurat Truth Audit emits non-zero unreviewed coverage rather than a misleading universal "all clear".
- Live semantic audit: 6/6 pages 200 + "0 customary Marathi wedding dates" and Chaturmas explanation; no generic old scores; worker/cache headers retained for diagnostics.
- Full 3,350 URL structural/similarity CI stays clean, but factual certification remains separate.
- Source citations are stored in test fixtures/documents, not customer-facing brand claims in lib or app code.


## Wave 3E: 2025–2027 traditional Marathi Chaturmas month-level source reconciliation (2026-10-13)

### Verified scope and conflicts
The independent 2025/2026/2027 reference ledger is in `tests/fixtures/muhurat-closure-2025-27-evidence.ts`. A conventional **Marathi marriage-calendar** closure is now source-supported for **August, September and October of all three years**, covering the supported **Maharashtra** city pages with an explicit community caveat. This is a **month-level calendrical rule**, not an equivalence between astronomical clock values across distant cities.

| Calendar year | State-specific source | Independently published cross-check | Full months excluded | Caution |
|---|---|---|---|---|
| 2025 | [Marathi 2025 (Hindu Blog)](https://www.hindu-blog.com/2024/09/marathi-vivah-muhurat-in-2025-marriage-wedding-dates-maharashtra.html) | [Drik 2025 Selu, Maharashtra](https://www.drikpanchang.com/shubh-dates/shubh-marriage-dates-with-muhurat.html?time-format=24hour&year=2025) | Aug, Sep, Oct | Selu is NOT all Maharashtra; result applied only to the **named customary tradition**, not all wedding calendars |
| 2026 | [Marathi 2026 (Hindu Blog)](https://www.hindu-blog.com/2025/05/marathi-vivah-muhurat-in-2026-marriage.html) | [Drik 2026 Chanda, Maharashtra](https://www.drikpanchang.com/shubh-dates/shubh-marriage-dates-with-muhurat.html?lang=en&rd=0); [Kalnirnay Online 2026](https://kalnirnayonline.com/) (under-verification note) | Aug, Sep, Oct | Reviewed approximately 25 Jul–20 Nov for 2026 only; 31 July and partial November NOT automatically excluded |
| 2027 | [Mahalakshmi Calendar 2027](https://mahalakshmicalendar.com/mahalakshmi-calendar-2027/) | [Drik New Delhi 2027](https://www.drikpanchang.com/shubh-dates/shubh-marriage-dates-with-muhurat.html?geoname-id=1261481&year=2027); [Hindu Blog North 2027](https://www.hindu-blog.com/2026/02/hindu-marriage-dates-in-2027-good-dates.html); [Marathi Calendar 2027](https://marathicalendar.com/kalnirnay-2027/) | Aug, Sep, Oct | Some sources are North-Indian not Maharashtra-local; accurate **partial** Chaturmas dates and combustion boundaries not encoded without city/tradition review |

### Correction and factual acceptance
- `getVerifiedMuhuratClosure()` identifies `wedding × state=Maharashtra × year in 2025–2027 × month in 08–10` for the **customary Marathi marriage convention** and suppresses generic sunrise-screened wedding candidate rows before ranking. It explicitly says some communities follow different rules.
- The closure component displays actual city, year and month, a zero **customary** calendar count, why this named tradition excludes the period, and a correct local Panchang link. It **does not invent** exact 2025 or 2027 Chaturmas start/end instants.
- No convention is imposed on Gujarat, Rajasthan, Delhi, Karnataka, Kerala, Tamil Nadu, Bengal or other event types; July/November partial intervals, Shukra/Guru Asta, Yoga/Karana/Adhika and Lagna remain separate open tasks.
- A release gate exercises year × months × six Maharashtra city pilots + October 2026 for five additional Maharashtra cities; a widened daily read-only production probe checks 28 URLs. These do not certify every unsupported tradition's wedding calculation.
- Existing index/noindex and sitemap rules are unchanged pending actual GSC evidence. Site quality CI still verifies structural and duplicate policy, NOT universal religious truth.

### Open release blockers for global certification
1. No source-confirmed **full year×city×tradition** wedding date matrix for all other years, partial months, North/Gujarat/South/Bengal calendars.
2. No external calibrated Shukra/Guru Asta / Adhika Maas + prohibited Yoga/Karana and Lagna eligibility algorithm (generic candidates therefore **unverified**).
3. No independent 2–3-source city/date audit of every Panchang, Festival or Vrat URL.
4. No GSC data for the 716 noindex URLs or historical performance causes; do not claim 99.81% recovery.
