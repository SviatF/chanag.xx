# PANCHVANI Wave 3V — synchronized UT-correct ephemeris migration (V4 → V5)

**Executed:** 2026-10-14. **GitHub source branch:** research/wave3v-ut-correct-full-shard-migration-20261014.

## 1. Why this changes real calendar data
Both lib/panchang.ts and lib/vrat.ts previously passed UT Julian Days returned by Swiss sweRiseTrans() into sweCalc(), an ET/TT-only function. Wave 3U independently measured a corrected-minus-legacy ~69 s lunar transition offset and a reproducible false Purnima-at-sunrise in Delhi 2026-06-30.

Wave 3V changes only those lunar ephemeris reads from sweCalc to sweCalcUt. The same UT input is now used consistently by **daily Panchang, annual Vrat, and the Muhurat snapshot producer**. Sunrise/sunset geometry, day-bound window math, observer locations and ritual conventions are otherwise unmodified. See [Swiss Ephemeris developer documentation](https://www.astro.com/swisseph-download/doc/swephprg.pdf) for UT-vs-ET API contracts.

## 2. Full migration, not mixed shards
Schema `MUHURAT_BUILD_DATA_VERSION=5` invalidates every old V4 precompute shard, independently of lunar event time rounding. Using the existing shard writer and signature hash from lib/panchang.ts+schema, a **one-time isolated GitHub runner** regenerated the 48 shards comprising 338 city-month datasets / 10,299 calendar-day observations, verified the exact complete set and committed the new data to the research branch.

GitHub migration run: https://github.com/SviatF/chanag.xx/actions/runs/38618308518 (success). Exact-date secondary diff run: https://github.com/SviatF/chanag.xx/actions/runs/38619191890 (success). The one-time workflow files are removed after execution and not included in production; no generated shard payload was uploaded as an Actions artifact. The archived artifact contains only audit metadata and sample diffs.

## 3. Exact differences (generated-data V4 vs V5)

| Metric | Count |
| --- | ---: |
| Shards checked | 48 |
| City-month targets | 338 |
| Calendar-day records | 10,299 |
| Rows with any changed lunar clock field | 10,299 |
| **Tithi-at-sunrise NAME changed** | **6** |
| Nakshatra-at-sunrise NAME changed | 13 |
| Karana-at-sunrise NAME changed | 16 |
| Tithi end civil-day changed | 8 |
| Nakshatra end civil-day changed | 35 |
| Solar geometry / Rahu / Yamaganda / Gulika / Abhijit / Choghadiya differences | **0** |

Every lunar-clock transition shift is **expected and limited to corrected ephemeris time input**; 10,299 rows changing does NOT mean that 10,299 ritual dates switched. Times were generally adjusted by about a minute; differences in HH:mm can vary due to rounding. No blanket 69 s date shift may be hardcoded.

### All six changed Tithi-at-sunrise labels (exact old → new)

| City | Gregorian day | Old label | Corrected UT label |
| --- | --- | --- | --- |
| Thane | 2026-08-25 | Dwadashi | **Trayodashi** |
| Kanpur | 2026-11-21 | Ekadashi | **Dwadashi** |
| Bhopal | 2026-12-24 | Purnima | **Pratipada** |
| Patna | 2027-01-31 | Navami | **Dashami** |
| Kolkata | 2027-08-05 | Tritiya | **Chaturthi** |
| Lucknow | 2027-09-17 | Pratipada | **Dwitiya** |

### Independent publisher calendar cross-check (not ritual certification)
- [BDA Thane calendar](https://www.bda.ai/panchang-calendar/thane/2026-08) displays **Trayodashi** for Aug 25, 2026.
- [Vaya Kanpur calendar](https://vaya.so/tools/panchang?d=2026-11-21&l=kanpur) displays Ekadashi ending 06:31 and sunrise 06:31:49 (a second-sensitive same-minute boundary), compatible with Dwadashi at exact sunrise under the publisher's clocks.
- [Dev Panchang Bhopal](https://devpanchang.in/en/panchang/bhopal/2026-12-24) displays **Pratipada** for Dec 24, 2026.
- [Dev Panchang Patna](https://devpanchang.in/en/panchang/patna/2027-01-31) displays Navami until 06:34 with sunrise 06:33, which **does not yet corroborate** PANCHVANI's corrected Dashami-at-sunrise. This is an explicit source/convention mismatch that requires minute-level independent review; no ceremonial conclusion follows.
- [Drik Panchang Kolkata month](https://www.drikpanchang.com/panchang/month-panchang.html?date=10%2F08%2F2027&lang=en) and [LivePanditji Kolkata](https://www.livepanditji.com/panchang-in/kolkata/august-2027/5/) display **Chaturthi** Aug 5, 2027.
- [Vaya Lucknow](https://vaya.so/tools/panchang?d=2027-09-17&l=lucknow) displays Pratipada ending 05:52 and sunrise 05:52:27, compatible with Dwitiya-at-exact-sunrise (but dependent on provider-specific rounding and sunrise definition).

These sources are **not verified as independently implemented ephemeris algorithms**. A city day-page labeling its whole civil day after sunrise or claiming "purnima on date" cannot be interpreted as unambiguous proof of *exact Tithi state at the UTC instant of sunrise*. This is particularly important for Patna, Kanpur and Lucknow, where the category boundary is within a minute.

## 4. Downstream consequence and release boundaries
- The mathematical Delhi 2026-06-30 Purnima-at-sunrise false-positive is no longer included by UT-correct annual Vrat calculations. This is NOT a certified Purnima fast day: ceremony/Parana selection requires separately sourced ritual rules.
- The local Vrat and month/day Panchang engines now agree on Sun/Moon time-scale semantics, and the stored Muhurat calendar shards have been wholly refreshed rather than mixed with outdated legacy snapshots.
- Muhurat planning scores and snapshots may change because end-of-Tithi, end-of-Nakshatra and Karana boundaries moved. A planning score of 100 is NOT 100% auspiciousness.
- **Guru/Shukra Asta 0/300 observer-method cases remain independently unverified**; Wave 3V does not modify these restrictions.
- **Janmashtami 2027** festival-date and Nishita/Ashtami disagreement remains a source/methodology distinction: neither a date flip nor a fast-day/Parana approval is justified.
- Existing Maharashtra month closures remain regional/traditional; not a universal India-wide wedding ban.
- No new SEO indexed routes, no automatic ritual eligibility, no sitemap/robots or canonical changes.

## 5. Release checklist
1. Commit all 48 updated UT-correct V5 shards plus new versioned loader-compatible schema; verify:muhurat-precompute must pass.
2. Pass the independent UT diagnostic and its exact Delhi counterexample test; pass all Panchang fixtures and Vrat tests.
3. Pass 48-shard full Muhurat truth, Festival truth, 89 reviewed Marathi ritual SSR, all sitemap SEO URL and Vinext/Workers compilation.
4. Independently investigate the boundary-sensitive city-date mismatches prior to representing any ceremony or fasting dates as verified. A mathematically fixed Tithi-at-sunrise is not an independently reviewed ritual calendar day.
5. Only merge to main after the *exact* PR head has successful GitHub Quality and Cloudflare Workers check runs.
