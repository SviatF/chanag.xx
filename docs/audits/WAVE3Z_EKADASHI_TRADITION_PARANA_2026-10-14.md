# PANCHVANI Wave 3Z — Ekadashi observance, Arunodaya, Vedha and Parana research
**Date:** 2026-10-14. **Release scope:** research-only calculation and mandatory CI evidence gate. No published fast/ceremony date approvals.

## Why Wave 3Z exists
The annual `lib/vrat.ts` output labels **Tithi present at exact city sunrise**, not the selected fast according to Smarta, Vaishnava or ISKCON practices. The corrected V5 UT/ET astronomical model is not itself a ritual observance algorithm. A printed publisher FAST date and a mathematically different sunrise Tithi are not necessarily contradictory (see Kanpur, Nov 21 2026). Daily Panchang remains a separate mathematical source of truth.

## Sources and exact distinctions
- [ISKCON Juhu Mumbai: How to Calculate Ekadasi Fasting Days](https://www.iskconmumbai.com/blog/hare-krishna-blogs-1/how-to-calculate-ekadasi-fasting-days-10) explicitly describes Arunodaya as roughly 96 minutes before sunrise and discusses Dashami overlap. This **method** explanation is not a publication of every target city's exact instant.
- [Pure Bhakti: Calendar Information](https://www.purebhakti.com/component/content/article?id=994) differentiates regular Ekadashi from Mahadwadashi and emphasizes location-specific calendar calculations and sunrise definitions. A separate [2026/27 calendar note](https://www.purebhakti.com/resources/ebooks-magazines/bhagavat-patrika/calendars/562-2026-27-vaisnava-calendar-english-vrindavan/file) distinguishes refraction-aware upper-limb sunrise from geometrical center sunrise. **Observer conventions can differ by minutes.**
- [Drik Panchang Delhi, Ekadashi 2027](https://www.drikpanchang.com/vrats/ekadashidates.html?geoname-id=1261481&year=2027) publishes Jan **18** (Pausha Putrada Smarta) and Jan **19** (Trisparsha Mahadwadashi / Gauna Vaishnava), and publishes Ekadashi starting Jan 18 10:26 IST and ending Jan 19 07:49 IST. The Jan 18 Smarta publication **cannot be inferred** from a naive sunrise-Ekadashi filter. It must be reviewed under the publisher's complete tradition method, not silently overwritten.
- [Drik Panchang ISKCON Kanpur](https://www.drikpanchang.com/iskcon/iskcon-ekadashi-list.html?geoname-id=1267995) selects Nov **21, 2026** fasting in a sunrise Tithi boundary case; V5 sunrise Tithi is Dwadashi. This is not evidence to revert the UT-correct ephemeris.
- [Drik Panchang ISKCON Putrada](https://www.drikpanchang.com/iskcon/ekadashi/putrada/putrada-ekadashi-date-parana-time.html?year=2027) describes GCal-based rules, distinct Mahadwadashi types and Hari Vasara/Parana handling.
- [GBC GCal software provenance](https://github.com/gopaladasa/GCAL-for-Windows) is an institutional method reference. We do **not** run GCAL or pretend its description provides independently compared city-local outputs.
- Existing Janmashtami 2027 source evidence remains a **publisher-date versus Ashtami/Nishita method gap**; Rohini-specific rule and tradition-specific fast date are not selected.

## What was implemented
- `lib/ekadashi-observance-research.ts`: independent Swiss `sweRiseTrans` UT sunrise, `sweCalcUt` Sun/Moon Tithi, exact Arunodaya **96 minutes before** upper-limb refraction-aware sunrise, sub-minute neighboring Tithi transitions, and the next local sunrise. Each sample distinguishes Dashami-at-Arunodaya vs Ekadashi-at-Arunodaya and whether Tithi repeats at successive sunrises.
- For a next sunrise with Dwadashi Tithi, calculate the precise Dwadashi start/end and **first quarter (Hari Vasara) ending**. The later of next sunrise and that quarter-end is **a mathematical lower bound only**, not an approved Parana window. The engine deliberately does not implement Pratahkal eligibility, Mahadwadashi subtypes, Nakshatra windows, second observer standards, missed Dwadashi exceptions, or personal ritual restrictions.
- `scripts/wave3z-ekadashi-observance-audit.ts`: fixed reproducible sample of **4 cities × 6 days (24 mathematical day records)**, plus **4 cities × 2 Janmashtami years (8 date-method observations)**. Compares daily Panchang against independent UT calculation, records exact dawn near-boundary status, and reports publisher evidence separately.
- `tests/fixtures/wave3z-source-observations.ts`: three reviewed published fast date observations across **a single source publisher domain** (Drik Panchang). No 2-publisher or independent algorithm corroboration is claimed.
- `tests/wave3z-ekadashi-observance.test.ts`: validates mathematical clocks, the Kanpur Dwadashi-vs-published-fast separation, Jan 18/19 different date evidence, no invented fast/Parana status, and ensures the research module never leaks into production date engines.
- `npm run audit:ekadashi-observance` mandatory in `.github/workflows/quality.yml`; stores `artifacts/wave3z-ekadashi-tradition-parana-evidence.json` in the GitHub artifact `wave3z-ekadashi-tradition`.

## Release safety
All case results return `chosenSmartaFastDate:null`, `chosenVaishnavaFastDate:null`, `chosenISKCONFastDate:null`, `independentlyCertifiedFast:false`, `paranaWindowCertified:false`, `safeForCeremonyFiltering:false`. Unresolved near-exact sunrise/Arunodaya boundaries are investigation flags, not statistically calibrated model errors. Tests and GitHub CI prove implementation reproducibility, **not** independent ritual correctness.

**Not touched:** `lib/panchang.ts`, `lib/vrat.ts`, `lib/festivals.ts`, `lib/muhurat.ts`, V5 precomputed shards, public fast dates, SEO routes, sitemap, canonicals, robots or 2027 index gating.

## Remaining source review before any public fast-day selector
1. Obtain **independently executed** city-pinned GCal/ISKCON and Smarta calendar outputs for Delhi, Kanpur, Mumbai and Chennai (2026/27); use repeatable geocoordinates, observers, sunset and UTC offsets.
2. Compare minute/second transitions at Arunodaya, sunrise, Dwadashi boundaries, and investigate Jan 18/19 Delhi and Nov 20/21 Kanpur under separate Smarta/Gaudiya interpretations. Do not retrofit thresholds to match date labels.
3. Implement and independently cross-check Kshaya/Vriddhi/8 Mahadwadashi classes, Suddha/viddha priorities, Hari Vasara, Parana Pratahkal and secondary Nakshatra cases, and Janmashtami Rohini/Nishita decision order.
4. Perform human review of disagreements. Only after matching methods and outcomes, separately propose scoped release gates for specific traditions/cities. Keep Issue #82 open until independently reviewed ceremony rules are in production.

No statistical claim about India's 50 cities or Google organic indexing follows from these targeted examples.
