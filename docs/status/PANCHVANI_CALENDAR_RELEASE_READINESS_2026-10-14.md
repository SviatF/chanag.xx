# PANCHVANI — Release readiness, not another audit count

**Updated:** 2026-10-14. **Purpose:** distinguish calculation correctness, external source agreement and ritual usability.

| Module / promise | Production state | Evidence that actually exists | Blocking condition |
| --- | --- | --- | --- |
| Panchang sunrise, Moon/Sun UT, Tithi, Nakshatra, Yoga, Karana | **V5 corrected computational engine** | UT/ET error fixed in runtime; 48 V5 shards rebuilt across 338 city-months / 10,299 observations. Existing regression and sample published source comparisons. | No comprehensive second-method/second-level independent proof for every city and day, especially Patna 2027-01-31 |
| Future annual Ekadashi / Purnima / Amavasya *sunrise references* | **Computed, not ritual approved** | V5 sweCalcUt plus new shared fatal sunrise/Tithi transition checks; selected 2026–28 city-year cross-family parity test. | Kshaya/Vriddhi and local fasting rule selection not completed |
| Smarta / Vaishnava / ISKCON fasting and Parana | **Uncertified** | Wave 3Z arunodaya research: 193 sunrise-Ekadashi records, 8 dawn-Dashami mathematical cases, one publisher domain. | Independently matched convention/city-specific calendars, Mahadwadashi, Hari Vasara, Parana, pre-sunrise skipped Tithi |
| 2026/27 maintained festival-date directory | **Curated publication, not local Puja approval** | 38 maintained dates, 7 second-publisher date-only corroborations, 31 with one publisher; regional examples reviewed. | Independent observer/method and relevant tradition verification of day and window, including Janmashtami Rohini/Nishita |
| Wedding / Griha Pravesh candidate ranking | **Timing-planning candidate only** | Local lunar and solar math with explicit source-reviewed Maharashtra custom closures. | Guru/Shukra Asta, Lagna, Chaturmas, community-specific Muhurat rules |
| Guru / Shukra Asta release eligibility | **Blocked** | Angular research and source locality cautions; 0/300 independent city/planet/year cases approved. | Sufficient independent same-city same-method threshold and published minute-precision |
| Search indexing | **Structural tests, not Search Console outcome** | Site routes, canonical, robots, sitemap, content structural/near-duplicate checks in CI. | Real GSC indexing reports, crawl data, server pages and validated valuable original content |

## Wave 3AA: production integrity milestone

- **Fail-closed annual Vrat**: use the same `requireSolarEvent()` contract as daily Panchang. A Swiss error / wrong-local-date / nonfinite returned sunrise must not be substituted with `baseJd+0.25`. Verify finite Sun/Moon longitudes.
- **Fail-closed Tithi boundary**: a missing boundary cannot silently become a `—` transition on a produced annual sunrise reference row.
- **Cross-family regression**: 2026, 2027, 2028; Delhi, Mumbai, Kolkata and Chennai; Ekadashi, Purnima, Amavasya. Each sampled sunrise reference must match the exact daily Panchang's date, Tithi, Paksha, sunrise, and transition instant (minute-displayed). This checks **internal consistency**, not independent religious truth.
- **Reader-visible status** on both yearly and city pages for Vrat and festival, including an explicit non-certification note. Reworded the city festival metadata and previously ambiguous “verified regional date” label.
- **Documented validation limits** on `/accuracy`.

### Rollout criteria
The PR can merge only when exact-head regression tests, Next.js rendering/content audit and Cloudflare/Vinext compile succeed. Post-merge main CI is checked separately. The fix **does not change source-reviewed festival dates, indexation, V5 shards, ceremony rankings, or claim ritual approval**.

## Next milestone, contingent on actual evidence
1. Obtain independent city-local second-precision confirmation for Patna 2027-01-31; do not override corrected astronomical engine based on rounded publisher text.
2. Obtain reproducible independent Smarta and ISKCON/GCal calendars for 8 mathematically flagged Dashami-at-Arunodaya examples, and document exact variant/observer settings.
3. Implement only the verified tradition rule subset, with date-by-date fail-closed fallback; test against independent examples, then let a separately reviewed rollout expose fasting/Parana days.
4. No bulk SEO city/year activation while ritual truth remains unproven.

**Interpretation:** a green CI is a condition for release of code, not certification of any unspecified religious rule. This table tracks *usable correctness*, not number of audits written.
